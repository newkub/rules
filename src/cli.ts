#!/usr/bin/env node
/**
 * CLI bootstrap. Uses `cac` to expose the following sub-commands:
 *
 *   rules scan      Run a scan and report findings.
 *   rules list      List all bundled rules (optionally per category).
 *   rules init      Scaffold a project config (vite / sgconfig).
 *   rules enable    Enable rules / categories.
 *   rules disable   Disable rules / categories.
 *   rules skill     Install / uninstall the agent skill.
 *   rules help      Show help.
 */
import { cac } from "cac";
import { registerDisable } from "./cli/commands/disable.ts";
import { registerEnable } from "./cli/commands/enable.ts";
import { registerInit } from "./cli/commands/init.ts";
import { registerList } from "./cli/commands/list.ts";
import { registerScan } from "./cli/commands/scan.ts";
import { registerSkill } from "./cli/commands/skill.ts";
import { logger } from "./utils/logger.ts";

async function main(): Promise<number> {
	const cli = cac("rules");

	cli
		.version(VERSION)
		.help()
		.option("--cwd <dir>", "project directory", { default: process.cwd() })
		.option("--config <path>", "path to a config file (js / json / ts)");

	registerInit(cli);
	registerScan(cli);
	registerList(cli);
	registerEnable(cli);
	registerDisable(cli);
	registerSkill(cli);

	try {
		const parsed = await cli.parseAsync();
		return 0;
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		logger.error(message);
		if (process.env.DEBUG) console.error(err);
		return 1;
	}
}

// VERSION is injected at build time by tsdown; fallback for dev.
const VERSION =
	(typeof globalThis !== "undefined" && (globalThis as { __VERSION?: string }).__VERSION__) ||
	process.env.AGENT_RULES_VERSION ||
	"0.1.0";

const code = await main();
process.exit(code);
