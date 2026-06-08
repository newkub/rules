/**
 * Rule loader. Walks a rules directory, parses every `*.yml` / `*.yaml`
 * file and converts it into a {@link Rule}.
 *
 * Each top-level sub-folder of `rulesDir` becomes a `category`. Files at the
 * top level are surfaced as the category `"(root)"`.
 */
import { dirname, relative } from "node:path";
import type { Rule } from "./types.ts";
import { categoryFromPath, existsSync, isDir, walkYaml } from "./utils/fs.ts";
import { normalizeLanguage, normalizeSeverity, readRuleYaml } from "./utils/yaml.ts";

/**
 * Load every rule under `rulesDir` and return them in a stable order.
 * Files that fail to parse are logged and skipped.
 */
export async function loadRules(rulesDir: string): Promise<Rule[]> {
	if (!existsSync(rulesDir)) {
		throw new Error(`rules: rules directory does not exist: ${rulesDir}`);
	}
	if (!isDir(rulesDir)) {
		throw new Error(`rules: rules path is not a directory: ${rulesDir}`);
	}

	const files: string[] = [];
	for await (const file of walkYaml(rulesDir)) {
		files.push(file);
	}

	const results = await Promise.all(
		files.map(async (file) => {
			try {
				const data = await readRuleYaml(file);
				if (!data.id) {
					return { ok: false as const, path: file, error: "missing required field `id`" };
				}
				if (!data.rule || typeof data.rule !== "object") {
					return {
						ok: false as const,
						path: file,
						error: "missing required field `rule`",
					};
				}
				const rule: Rule = {
					id: data.id,
					message: data.message ?? data.id,
					severity: normalizeSeverity(data.severity),
					language: normalizeLanguage(data.language),
					rule: data.rule,
					note: data.note,
					source: file,
					category: categoryFromPath(file, rulesDir) || "(root)",
				};
				return { ok: true as const, rule };
			} catch (err) {
				return {
					ok: false as const,
					path: file,
					error: err instanceof Error ? err.message : String(err),
				};
			}
		}),
	);

	const out: Rule[] = [];
	const errors: Array<{ path: string; error: string }> = [];
	for (const r of results) {
		if (r.ok) out.push(r.rule);
		else errors.push({ path: r.path, error: r.error });
	}

	if (errors.length > 0) {
		const { logger } = await import("./utils/logger.ts");
		for (const e of errors) {
			const rel = relative(rulesDir, e.path);
			logger.warn(`[loader] ${rel}: ${e.error}`);
		}
	}

	// Stable ordering: category asc, id asc.
	out.sort((a, b) =>
		a.category === b.category ? a.id.localeCompare(b.id) : a.category.localeCompare(b.category),
	);
	return out;
}

/** Group rules by category for CLI display. */
export function groupByCategory(rules: Rule[]): Map<string, Rule[]> {
	const groups = new Map<string, Rule[]>();
	for (const r of rules) {
		const list = groups.get(r.category) ?? [];
		list.push(r);
		groups.set(r.category, list);
	}
	return groups;
}

/** Categories present under `rulesDir`, sorted. */
export async function listCategories(rulesDir: string): Promise<string[]> {
	if (!isDir(rulesDir)) return [];
	const { readdir } = await import("node:fs/promises");
	const out: string[] = [];
	for (const entry of await readdir(rulesDir, { withFileTypes: true })) {
		if (entry.isDirectory()) out.push(entry.name);
	}
	return out.sort();
}

/** Pretty-print a rule for the CLI `list` command. */
export function formatRuleLine(rule: Rule): string {
	return `${rule.id}  [${rule.severity}]  (${rule.category})`;
}

/** Sanity check that there is at least one rule on disk. */
export function rulesRootReadable(rulesDir: string): boolean {
	return isDir(rulesDir) && existsSync(dirname(rulesDir));
}
