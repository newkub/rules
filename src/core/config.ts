/**
 * Resolves the user-provided plugin config into a normalized form and
 * provides defaults that work for the bundled rule set.
 */
import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { PluginConfig, Severity } from "../types.ts";

/** Default severity that fails a build / scan. */
export const DEFAULT_FAIL_ON: Severity = "error";

/** Default globs when the consumer does not specify `include`. */
export const DEFAULT_INCLUDE = [
	"src/**/*.{ts,tsx,js,jsx,svelte,vue,html,css,json}",
	"tests/**/*.{ts,tsx,js,jsx}",
	"scripts/**/*.{ts,tsx,js,jsx}",
	"packages/**/src/**/*.{ts,tsx,js,jsx,svelte,vue}",
];

/** Default globs that should never be scanned. */
export const DEFAULT_EXCLUDE = [
	"**/node_modules/**",
	"**/dist/**",
	"**/build/**",
	"**/.svelte-kit/**",
	"**/.wrangler/**",
	"**/coverage/**",
	"**/.next/**",
	"**/.nuxt/**",
];

/** Walk up from `start` to find the first directory that contains a `package.json`. */
export function findProjectRoot(start: string): string {
	let dir = resolve(start);
	while (dir !== resolve(dir, "..")) {
		if (existsSync(resolve(dir, "package.json"))) return dir;
		dir = resolve(dir, "..");
	}
	return resolve(start);
}

/**
 * Resolve the path to the bundled `rules/` directory that ships with this
 * package. Works from dev (`src/`), built (`dist/`), and test layouts.
 */
export function bundledRulesDir(): string {
	const here = fileURLToPath(import.meta.url);
	// Find package root by walking up to find package.json
	const pkgRoot = findProjectRoot(here);
	const candidates = [
		resolve(pkgRoot, "dist", "rules"),
		resolve(pkgRoot, "rules"),
	];
	for (const candidate of candidates) {
		if (existsSync(candidate) && statSync(candidate).isDirectory()) {
			return candidate;
		}
	}
	throw new Error(
			`rules: could not locate the bundled \`rules/\` directory. ` +
				`import.meta.url=${import.meta.url}. pkgRoot=${pkgRoot}. ` +
				`Pass \`rulesDir\` explicitly or reinstall the package.`,
		);
}

const SEVERITY_RANK: Record<Severity, number> = {
	info: 0,
	hint: 1,
	warning: 2,
	error: 3,
};

/** Numeric comparison: a fails when a's rank >= the fail threshold. */
export function severityFails(actual: Severity, threshold: Severity): boolean {
	return SEVERITY_RANK[actual] >= SEVERITY_RANK[threshold];
}

/** Normalize a config provided by the user (or CLI) into a fully resolved form. */
export function resolveConfig(
	input: PluginConfig | undefined,
	cwd: string,
): Required<Omit<PluginConfig, "reportFile">> & { reportFile?: string } {
	const cfg = input ?? {};
	const rulesDir = cfg.rulesDir ? resolve(cwd, cfg.rulesDir) : bundledRulesDir();

	return {
		rulesDir,
		include: cfg.include?.length ? cfg.include : DEFAULT_INCLUDE,
		exclude: cfg.exclude?.length ? cfg.exclude : DEFAULT_EXCLUDE,
		enabled: cfg.enabled ?? true,
		enabledCategories: cfg.enabledCategories ?? [],
		disabledCategories: cfg.disabledCategories ?? [],
		enabledRules: cfg.enabledRules ?? [],
		disabledRules: cfg.disabledRules ?? [],
		failOn: cfg.failOn ?? DEFAULT_FAIL_ON,
		runOnDev: cfg.runOnDev ?? false,
		report: cfg.report ?? true,
		reportFile: cfg.reportFile ? resolve(cwd, cfg.reportFile) : undefined,
	};
}
