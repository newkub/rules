import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { bundledRulesDir } from "../src/config.ts";
import { filterRules } from "../src/filter.ts";
import { groupByCategory, listCategories, loadRules } from "../src/loader.ts";

describe("loader", () => {
	test("loads every YAML rule in the bundled rules directory", async () => {
		const rules = await loadRules(bundledRulesDir());
		expect(rules.length).toBeGreaterThan(50);
		for (const r of rules) {
			expect(r.id).toBeTruthy();
			expect(["error", "warning", "hint", "info"]).toContain(r.severity);
			expect(r.category).toBeTruthy();
			expect(typeof r.rule).toBe("object");
		}
	});

	test("categories list is sorted and non-empty", async () => {
		const cats = await listCategories(bundledRulesDir());
		expect(cats.length).toBeGreaterThan(0);
		const sorted = [...cats].sort();
		expect(cats).toEqual(sorted);
	});

	test("rules are sorted by category then id", async () => {
		const rules = await loadRules(bundledRulesDir());
		for (let i = 1; i < rules.length; i++) {
			const prev = rules[i - 1]!;
			const cur = rules[i]!;
			if (prev.category === cur.category) {
				expect(prev.id <= cur.id).toBe(true);
			} else {
				expect(prev.category < cur.category).toBe(true);
			}
		}
	});

	test("groupByCategory groups correctly", async () => {
		const rules = await loadRules(bundledRulesDir());
		const groups = groupByCategory(rules);
		for (const [cat, list] of groups) {
			for (const r of list) expect(r.category).toBe(cat);
		}
	});

	test("missing rulesDir throws a helpful error", async () => {
		await expect(loadRules(join(import.meta.dir, "does-not-exist"))).rejects.toThrow(
			/rules directory does not exist/,
		);
	});
});

describe("filter", () => {
	test("disabledRules is honored even when category is enabled", async () => {
		const rules = await loadRules(bundledRulesDir());
		const filtered = filterRules(rules, {
			enabledCategories: ["general"],
			disabledRules: ["general-no-console-log"],
		});
		const ids = filtered.map((r) => r.id);
		expect(ids).not.toContain("general-no-console-log");
		expect(ids).toContain("general-no-eval");
	});

	test("whitelist filters out non-listed categories", async () => {
		const rules = await loadRules(bundledRulesDir());
		const filtered = filterRules(rules, { enabledCategories: ["svelte"] });
		for (const r of filtered) expect(r.category).toBe("svelte");
	});

	test("whitelist by rule id", async () => {
		const rules = await loadRules(bundledRulesDir());
		const filtered = filterRules(rules, { enabledRules: ["svelte-use-runes"] });
		expect(filtered.length).toBe(1);
		expect(filtered[0]?.id).toBe("svelte-use-runes");
	});

	test("empty filter is a no-op", async () => {
		const rules = await loadRules(bundledRulesDir());
		const filtered = filterRules(rules, {});
		expect(filtered.length).toBe(rules.length);
	});
});
