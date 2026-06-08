/**
 * `agent-rules list` — list bundled rules and categories.
 */
import type { Command } from "cac";
import { bundledRulesDir } from "../../config.ts";
import { formatRuleLine, groupByCategory, listCategories, loadRules } from "../../loader.ts";
import { logger } from "../../utils/logger.ts";

export interface ListCommandOptions {
	cwd: string;
	config?: string;
	rulesDir?: string;
	category?: string;
	json?: boolean;
}

export function registerList(cli: Command): void {
	cli
		.command("list", "List bundled rules and categories")
		.option("--rules-dir <dir>", "rules directory to inspect")
		.option("--category <name>", "filter to a single category")
		.option("--json", "emit JSON instead of a table")
		.action(async (options: ListCommandOptions) => {
			const cwd = options.cwd ?? process.cwd();
			const rulesDir = options.rulesDir
				? options.rulesDir
				: await resolveBundled(cwd, options.config);

			const categories = await listCategories(rulesDir);
			const rules = await loadRules(rulesDir);
			const filtered = options.category
				? rules.filter((r) => r.category === options.category)
				: rules;

			if (options.json) {
				process.stdout.write(
					JSON.stringify(
						{
							rulesDir,
							categories,
							rules: filtered.map((r) => ({
								id: r.id,
								severity: r.severity,
								category: r.category,
								message: r.message,
							})),
						},
						null,
						2,
					) + "\n",
				);
				return;
			}

			logger.banner(`agent-rules · ${filtered.length} rules · ${categories.length} categories`);
			if (options.category) {
				for (const r of filtered) console.log(`  ${formatRuleLine(r)}`);
				return;
			}

			for (const [cat, list] of groupByCategory(filtered)) {
				console.log(`\n  ${cat}/ (${list.length})`);
				for (const r of list) console.log(`    ${formatRuleLine(r)}`);
			}
			console.log();
		});
}

async function resolveBundled(cwd: string, _config?: string): Promise<string> {
	return bundledRulesDir();
}
