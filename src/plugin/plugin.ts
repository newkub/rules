/**
 * Vite plugin entry. The plugin wires the scanner into Vite's lifecycle so
 * that `vite build` / `vite dev` (when opted in) fail when rule violations
 * exceed `failOn`.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { findProjectRoot, resolveConfig, severityFails } from "../core/config.ts";
import { renderFindings } from "../core/formatter.ts";
import { scan } from "../core/scanner.ts";
import type { Finding, PluginConfig } from "../types.ts";
import { logger } from "../utils/logger.ts";

/** Minimal subset of the Vite plugin contract that we actually use. */
interface VitePluginContext {
	root: string;
	mode?: string;
	build?: { ssr?: boolean };
	command: "build" | "serve";
}

interface ViteLikePlugin {
	name: string;
	configResolved?: (config: VitePluginContext) => void | Promise<void>;
	buildStart?: () => void | Promise<void>;
	buildEnd?: (err?: Error) => void | Promise<void>;
	closeBundle?: () => void | Promise<void>;
}

function writeReport(path: string, findings: Finding[]): void {
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, JSON.stringify({ findings, generatedAt: new Date().toISOString() }, null, 2));
}

/**
 * The factory that Vite users call. Example:
 *
 * ```ts
 * import { rulesPlugin } from "rules";
 * export default defineConfig({ plugins: [rulesPlugin({ failOn: "warning" })] });
 * ```
 */
export function rulesPlugin(userConfig: PluginConfig = {}): ViteLikePlugin {
	let rootDir: string;
	let resolved: ReturnType<typeof resolveConfig>;
	let isDev: boolean;

	return {
		name: "rules",
		async configResolved(config: VitePluginContext) {
			rootDir = config.root;
			resolved = resolveConfig(userConfig, rootDir);
			isDev = config.command === "serve";

			if (!resolved.enabled) {
				logger.info("rules: disabled by config");
				return;
			}
			if (!existsSync(resolved.rulesDir)) {
				logger.warn(`rules: rulesDir not found: ${resolved.rulesDir}`);
				return;
			}

			const isSsr = config.build?.ssr === true;
			const shouldRun = !isDev || resolved.runOnDev;
			if (!shouldRun) return;

			logger.info(
				`rules: scanning (${isDev ? "dev" : isSsr ? "ssr build" : "build"}) from ${rootDir}`,
			);
			const result = await scan(resolved, rootDir);

			if (resolved.report) {
				const out = await renderFindings(result.findings, resolved.failOn, rootDir);
				if (out) console.log(out);
			}
			if (resolved.reportFile) {
				writeReport(resolved.reportFile, result.findings);
				logger.info(`rules: report written to ${resolved.reportFile}`);
			}

			const failing = result.findings.filter((f) => severityFails(f.severity, resolved.failOn));
			if (failing.length > 0) {
				const message = `rules: ${failing.length} finding(s) at or above '${resolved.failOn}'`;
				logger.error(message);
				throw new Error(message);
			} else {
				logger.success(
					`rules: ${result.filesScanned} file(s) clean against ${result.rulesEvaluated} rule(s) in ${result.durationMs}ms`,
				);
			}
		},
		async buildStart() {
			// Hook reserved for future incremental scans. Intentionally empty.
		},
	};
}

/** Re-export for Vite's `defineConfig({ plugins: [...] })` ergonomics. */
export default rulesPlugin;

/** Helper that finds the project root that contains this plugin's consumer. */
export function projectRootFromCwd(cwd: string = process.cwd()): string {
	return findProjectRoot(resolve(cwd));
}
