/**
 * Config loader shared by every CLI command.
 *
 * Looks for (in order):
 *   1. `--config <path>` argument
 *   2. `rules.config.ts` / `rules.config.js` in the project root
 *   3. `rules` key in the consumer's `package.json`
 *
 * Returns the resolved {@link PluginConfig} merged with the CLI overrides
 * for `rulesDir` / `include` / `exclude` / `failOn` / `enabled`.
 */
import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { PluginConfig, Severity } from "../../types.ts";

export interface LoadedConfig {
	config: PluginConfig;
	configPath?: string;
}

const CONFIG_FILENAMES = [
	"rules.config.ts",
	"rules.config.mts",
	"rules.config.js",
	"rules.config.mjs",
	"rules.config.cjs",
	"rules.config.json",
];

async function loadConfigFile(path: string): Promise<PluginConfig> {
	if (path.endsWith(".json")) {
		const raw = readFileSync(path, "utf8");
		return (JSON.parse(raw) as { rules?: PluginConfig }).rules ?? {};
	}
	// Dynamic import works for .ts, .js, .mjs, .cjs (when transpiled).
	const mod = (await import(pathToFileURL(resolve(path)).href)) as {
		default?: PluginConfig;
		rules?: PluginConfig;
	};
	return (mod.default ?? mod.rules ?? {}) as PluginConfig;
}

function readPackageJsonConfig(cwd: string): PluginConfig | null {
	const pkgPath = join(cwd, "package.json");
	if (!existsSync(pkgPath)) return null;
	try {
		const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as {
			rules?: PluginConfig;
		};
		return pkg.rules ?? null;
	} catch {
		return null;
	}
}

/**
 * Resolve the active config, applying CLI-level overrides.
 * `overrides` come from command-line flags (e.g. `--fail-on`).
 */
export async function loadConfig(
	cwd: string,
	overrides: Partial<PluginConfig> = {},
	configPath?: string,
): Promise<LoadedConfig> {
	let config: PluginConfig = {};
	let resolvedPath: string | undefined;

	if (configPath) {
		const abs = isAbsolute(configPath) ? configPath : resolve(cwd, configPath);
		if (!existsSync(abs)) {
			throw new Error(`rules: --config file does not exist: ${abs}`);
		}
		config = await loadConfigFile(abs);
		resolvedPath = abs;
	} else {
		for (const name of CONFIG_FILENAMES) {
			const p = join(cwd, name);
			if (existsSync(p)) {
				config = await loadConfigFile(p);
				resolvedPath = p;
				break;
			}
		}
		if (!resolvedPath) {
			const pkg = readPackageJsonConfig(cwd);
			if (pkg) config = pkg;
		}
	}

	// CLI overrides win over file config.
	for (const [k, v] of Object.entries(overrides)) {
		if (v === undefined) continue;
		(config as Record<string, unknown>)[k] = v;
	}

	return { config, configPath: resolvedPath };
}

export function severityFromString(s: string | undefined): Severity | undefined {
	if (!s) return undefined;
	const lower = s.toLowerCase();
	if (lower === "error" || lower === "warning" || lower === "hint" || lower === "info") {
		return lower;
	}
	return undefined;
}
