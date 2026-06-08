import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { bundledRulesDir, findProjectRoot, resolveConfig, severityFails } from "../src/core/config.ts";

describe("config", () => {
	test("resolveConfig fills sensible defaults", () => {
		const cfg = resolveConfig({}, process.cwd());
		expect(cfg.include.length).toBeGreaterThan(0);
		expect(cfg.exclude.length).toBeGreaterThan(0);
		expect(cfg.failOn).toBe("error");
		expect(cfg.runOnDev).toBe(false);
	});

	test("resolveConfig honors a relative rulesDir", () => {
		const cwd = process.cwd();
		const cfg = resolveConfig({ rulesDir: "./rules" }, cwd);
		expect(cfg.rulesDir).toBe(join(cwd, "rules"));
	});

	test("bundledRulesDir points to a real directory", () => {
		const dir = bundledRulesDir();
		expect(dir).toContain("rules");
	});

	test("findProjectRoot walks up to the package.json", () => {
		const root = findProjectRoot(import.meta.dir);
		expect(root).toContain("rules");
	});

	test("severityFails matrix", () => {
		expect(severityFails("error", "warning")).toBe(true);
		expect(severityFails("hint", "warning")).toBe(false);
		expect(severityFails("info", "info")).toBe(true);
	});
});
