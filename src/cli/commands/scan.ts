/**
 * `agent-rules scan` — runs a scan and exits non-zero when findings exceed
 * the configured `failOn` threshold.
 */
import type { Command } from "cac";
import { resolveConfig, severityFails } from "../../config.ts";
import { renderFindings, scan } from "../../scanner.ts";
import { loadConfig, severityFromString } from "../config-loader.ts";
import { logger } from "../../utils/logger.ts";
import { writeFileSync } from "node:fs";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export interface ScanCommandOptions {
	cwd: string;
	config?: string;
	rulesDir?: string;
	include?: string[];
	exclude?: string[];
	failOn?: string;
	report?: boolean;
	reportFile?: string;
	json?: boolean;
}

export function registerScan(cli: Command): void {
	cli
		.command("scan", "Run a scan and report findings")
		.option("--rules-dir <dir>", "rules directory (overrides config)")
		.option("--include <patterns...>", "glob patterns to include")
		.option("--exclude <patterns...>", "glob patterns to exclude")
		.option("--fail-on <severity>", "minimum severity that fails the scan (error|warning|hint|info)")
		.option("--no-report", "suppress human-readable output")
		.option("--report-file <path>", "write findings to a JSON file")
		.option("--json", "emit only JSON on stdout (machine-readable)")
		.action(async (options: ScanCommandOptions) => {
			const cwd = options.cwd ?? process.cwd();
			const { config, configPath } = await loadConfig(
				cwd,
				{
					rulesDir: options.rulesDir,
					include: options.include,
					exclude: options.exclude,
					failOn: severityFromString(options.failOn),
					report: options.report,
					reportFile: options.reportFile,
				},
				options.config,
			);

			const resolved = resolveConfig(config, cwd);
			if (configPath) logger.info(`config: ${configPath}`);
			logger.info(
				`scanning ${cwd} (rulesDir=${resolved.rulesDir}, failOn=${resolved.failOn})`,
			);

			const result = await scan(resolved, cwd);

			if (options.json) {
				process.stdout.write(JSON.stringify(result, null, 2) + "\n");
			} else if (resolved.report) {
				const out = await renderFindings(result.findings, resolved.failOn, cwd);
				if (out) console.log(out);
			}

			if (resolved.reportFile) {
				mkdirSync(dirname(resolved.reportFile), { recursive: true });
				writeFileSync(
					resolved.reportFile,
					JSON.stringify({ ...result, generatedAt: new Date().toISOString() }, null, 2),
				);
				logger.info(`report written to ${resolved.reportFile}`);
			}

			const failing = result.findings.filter((f) => severityFails(f.severity, resolved.failOn));
			if (failing.length > 0) {
				logger.error(`${failing.length} finding(s) at or above '${resolved.failOn}'`);
				process.exitCode = 1;
			} else {
				logger.success(
					`${result.filesScanned} file(s) clean — ${result.rulesEvaluated} rule(s), ${result.durationMs}ms`,
				);
			}
		});
}
