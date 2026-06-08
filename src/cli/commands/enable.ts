/**
 * `agent-rules enable` — patch the project's `agent-rules.config.ts` (or
 * `package.json#agentRules`) to enable specific rules or categories.
 */
import type { Command } from "cac";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { logger } from "../../utils/logger.ts";
import { listCategories } from "../../loader.ts";
import { bundledRulesDir } from "../../config.ts";

export interface EnableCommandOptions {
	cwd: string;
	category?: boolean;
	all?: boolean;
	force?: boolean;
}

const CONFIG_NAMES = [
	"agent-rules.config.ts",
	"agent-rules.config.mts",
	"agent-rules.config.js",
	"agent-rules.config.mjs",
];

/** Find the first existing config file in the cwd. */
function locateConfig(cwd: string): string | undefined {
	for (const n of CONFIG_NAMES) {
		const p = join(cwd, n);
		if (existsSync(p)) return p;
	}
	return undefined;
}

/** Insert a key into a TS config file by rewriting the default export. */
function patchTsConfig(path: string, key: string, additions: string[]): void {
	const src = readFileSync(path, "utf8");
	const list = additions.map((a) => JSON.stringify(a)).join(", ");
	const insert = `  ${key}: [${list}],\n`;
	if (new RegExp(`^\\s*${key}\\s*:\\s*\\[[^\\]]*\\]`, "m").test(src)) {
		throw new Error(`${path} already has a '${key}' list — edit it manually to add: ${additions.join(", ")}`);
	}
	const next = src.replace(/(export\s+default\s*\{|=\s*\{)([\s\S]*?)(\n\}\s*;?)/, (m, head, body, tail) => {
		return `${head}\n${insert}${body}${tail}`;
	});
	writeFileSync(path, next);
}

/** Patch a `package.json#agentRules` block to add a key. */
function patchPackageJson(cwd: string, key: string, additions: string[]): void {
	const p = join(cwd, "package.json");
	const json = JSON.parse(readFileSync(p, "utf8")) as Record<string, unknown>;
	const ar = (json.agentRules as Record<string, unknown> | undefined) ?? {};
	const existing = (ar[key] as unknown[] | undefined) ?? [];
	const merged = Array.from(new Set([...existing, ...additions]));
	ar[key] = merged;
	json.agentRules = ar;
	writeFileSync(p, JSON.stringify(json, null, 2) + "\n");
}

export function registerEnable(cli: Command): void {
	cli
		.command("enable [...items]", "Enable rules or categories")
		.option("--category", "treat each item as a category name")
		.option("--all", "enable every category (resets existing whitelists)")
		.option("--force", "overwrite an existing whitelist")
		.action(async (items: string[], options: EnableCommandOptions) => {
			const cwd = options.cwd ?? process.cwd();

			let additions: string[] = [];
			if (options.all) {
				additions = await listCategories(bundledRulesDir());
			} else if (items.length > 0) {
				additions = items;
			} else {
				logger.error("usage: agent-rules enable <rule-or-category> [...] or --all");
				process.exitCode = 1;
				return;
			}

			const key = options.category || options.all ? "enabledCategories" : "enabledRules";
			const configPath = locateConfig(cwd);

			if (configPath) {
				try {
					patchTsConfig(configPath, key, additions);
					logger.success(`added ${additions.length} item(s) to ${key} in ${configPath}`);
				} catch (err) {
					logger.error(err instanceof Error ? err.message : String(err));
					process.exitCode = 1;
				}
			} else {
				patchPackageJson(cwd, key, additions);
				logger.success(`added ${additions.length} item(s) to ${key} in package.json`);
			}
		});
}
