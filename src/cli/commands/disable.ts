/**
 * `rules disable` — patch the project's config to disable rules or
 * categories. Operates on `rules.config.ts` or `package.json`.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Command } from "cac";
import { bundledRulesDir } from "../../core/config.ts";
import { listCategories } from "../../core/loader.ts";
import { logger } from "../../utils/logger.ts";

export interface DisableCommandOptions {
	cwd: string;
	category?: boolean;
	all?: boolean;
}

const CONFIG_NAMES = [
	"rules.config.ts",
	"rules.config.mts",
	"rules.config.js",
	"rules.config.mjs",
];

function locateConfig(cwd: string): string | undefined {
	for (const n of CONFIG_NAMES) {
		const p = join(cwd, n);
		if (existsSync(p)) return p;
	}
	return undefined;
}

function patchTsConfig(path: string, key: string, additions: string[]): void {
	const src = readFileSync(path, "utf8");
	const list = additions.map((a) => JSON.stringify(a)).join(", ");
	const insert = `  ${key}: [${list}],\n`;
	if (new RegExp(`^\\s*${key}\\s*:\\s*\\[[^\\]]*\\]`, "m").test(src)) {
		const next = src.replace(
			new RegExp(`(\\n\\s*${key}\\s*:\\s*\\[)([^\\]]*)(\\]\\s*,?)`),
			(_m, head: string, body: string, tail: string) => {
				const existing = body
					.split(",")
					.map((s) => s.trim())
					.filter((s) => s.length > 0)
					.map((s) => s.replace(/^['"]|['"]$/g, ""));
				const merged = Array.from(new Set([...existing, ...additions]));
				return `${head}${merged.map((a) => JSON.stringify(a)).join(", ")}${tail}`;
			},
		);
		writeFileSync(path, next);
		return;
	}
	const rewritten = src.replace(
		/(export\s+default\s*\{|=\s*\{)([\s\S]*?)(\n\}\s*;?)/,
		(m, head, body, tail) => `${head}\n${insert}${body}${tail}`,
	);
	writeFileSync(path, rewritten);
}

function patchPackageJson(cwd: string, key: string, additions: string[]): void {
	const p = join(cwd, "package.json");
	const json = JSON.parse(readFileSync(p, "utf8")) as Record<string, unknown>;
	const rulesConfig = (json.rules as Record<string, unknown> | undefined) ?? {};
	const existing = (rulesConfig[key] as unknown[] | undefined) ?? [];
	const merged = Array.from(new Set([...existing, ...additions]));
	rulesConfig[key] = merged;
	json.rules = rulesConfig;
	writeFileSync(p, JSON.stringify(json, null, 2) + "\n");
}

export function registerDisable(cli: Command): void {
	cli
		.command("disable [...items]", "Disable rules or categories")
		.option("--category", "treat each item as a category name")
		.option("--all", "disable every category")
		.action(async (items: string[], options: DisableCommandOptions) => {
			const cwd = options.cwd ?? process.cwd();

			let additions: string[] = [];
			if (options.all) {
				additions = await listCategories(bundledRulesDir());
			} else if (items.length > 0) {
				additions = items;
			} else {
				logger.error("usage: rules disable <rule-or-category> [...] or --all");
				process.exitCode = 1;
				return;
			}

			const key = options.category || options.all ? "disabledCategories" : "disabledRules";
			const configPath = locateConfig(cwd);

			if (configPath) {
				patchTsConfig(configPath, key, additions);
				logger.success(`added ${additions.length} item(s) to ${key} in ${configPath}`);
			} else {
				patchPackageJson(cwd, key, additions);
				logger.success(`added ${additions.length} item(s) to ${key} in package.json`);
			}
		});
}
