import { describe, expect, test } from "bun:test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { scan, pickFailure, renderFindings } from "../src/scanner.ts";
import { severityFails } from "../src/config.ts";

const ROOT = join(import.meta.dir, "_fixture");
const RULES_DIR = join(ROOT, "rules");
const SRC_DIR = join(ROOT, "src");

function writeRule(id: string, severity: "error" | "warning" | "hint", body: string): void {
	mkdirSync(RULES_DIR, { recursive: true });
	writeFileSync(
		join(RULES_DIR, `${id}.yml`),
		`id: ${id}\nlanguage: TypeScript\nmessage: ${id}\nseverity: ${severity}\nrule:\n  ${body}\n`,
	);
}

function writeFile(name: string, body: string): void {
	mkdirSync(SRC_DIR, { recursive: true });
	writeFileSync(join(SRC_DIR, name), body);
}

describe("severity helpers", () => {
	test("severityFails honors rank", () => {
		expect(severityFails("error", "error")).toBe(true);
		expect(severityFails("warning", "error")).toBe(false);
		expect(severityFails("error", "warning")).toBe(true);
		expect(severityFails("hint", "info")).toBe(true);
	});
});

describe("scanner", () => {
	test("returns empty for empty rules dir", async () => {
		writeFile("dummy.ts", "const x = 1;\n");
		const result = await scan({ rulesDir: RULES_DIR }, ROOT);
		expect(result.findings).toHaveLength(0);
		expect(result.filesScanned).toBeGreaterThan(0);
	});

	test("flags `eval` calls in a TS file", async () => {
		writeFile("sample.ts", "eval('1+1');\n");
		writeRule("no-eval", "error", "pattern: eval($ARG)");
		const result = await scan(
			{ rulesDir: RULES_DIR, include: ["src/**/*.ts"], exclude: [] },
			ROOT,
		);
		expect(result.findings.length).toBeGreaterThan(0);
		expect(result.findings[0]?.ruleId).toBe("no-eval");
	});

	test("pickFailure filters by severity", async () => {
		writeFile("a.ts", "eval('1');\n");
		writeFile("b.ts", "console.log('hi');\n");
		writeRule("no-eval", "error", "pattern: eval($ARG)");
		writeRule("warn-console", "warning", "pattern: console.log($ARG)");
		const result = await scan(
			{ rulesDir: RULES_DIR, include: ["src/**/*.ts"], exclude: [] },
			ROOT,
		);
		const errors = pickFailure(result.findings, "error");
		expect(errors.every((f) => f.severity === "error")).toBe(true);
		const warnings = pickFailure(result.findings, "warning");
		expect(warnings.length).toBeGreaterThanOrEqual(errors.length);
	});

	test("filter via enabledRules narrows the set", async () => {
		writeFile("a.ts", "eval('1');\nconsole.log('hi');\n");
		writeRule("no-eval", "error", "pattern: eval($ARG)");
		writeRule("warn-console", "warning", "pattern: console.log($ARG)");
		const result = await scan(
			{
				rulesDir: RULES_DIR,
				include: ["src/**/*.ts"],
				exclude: [],
				enabledRules: ["no-eval"],
			},
			ROOT,
		);
		for (const f of result.findings) expect(f.ruleId).toBe("no-eval");
	});

	test("renderFindings produces a non-empty table for findings", async () => {
		writeFile("c.ts", "eval('1');\n");
		writeRule("no-eval", "error", "pattern: eval($ARG)");
		const result = await scan(
			{ rulesDir: RULES_DIR, include: ["src/**/*.ts"], exclude: [] },
			ROOT,
		);
		const rendered = await renderFindings(result.findings, "error", ROOT);
		expect(rendered).toContain("no-eval");
		expect(rendered.length).toBeGreaterThan(0);
	});
});
