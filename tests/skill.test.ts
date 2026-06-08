import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { bundledSkillDir, installSkill, listSkillFiles } from "../src/skill.ts";

describe("skill", () => {
	test("bundled skill dir contains a SKILL.md", () => {
		const dir = bundledSkillDir();
		expect(dir).toBeTruthy();
	});

	test("install copies files into the target dir", async () => {
		const cwd = mkdtempSync(join(tmpdir(), "agent-rules-test-"));
		try {
			const target = join(cwd, ".agents/skills");
			const dest = await installSkill({ targetDir: target });
			const files = await listSkillFiles(target);
			expect(files.length).toBeGreaterThan(0);
			expect(files.some((f) => f.endsWith("SKILL.md"))).toBe(true);
			expect(dest.endsWith("agent-rules")).toBe(true);
		} finally {
			rmSync(cwd, { recursive: true, force: true });
		}
	});

	test("install refuses to overwrite without --force", async () => {
		const cwd = mkdtempSync(join(tmpdir(), "agent-rules-test-"));
		try {
			const target = join(cwd, ".agents/skills");
			await installSkill({ targetDir: target });
			await expect(installSkill({ targetDir: target })).rejects.toThrow(/already installed/);
			const dest = await installSkill({ targetDir: target, force: true });
			expect(dest).toBeTruthy();
		} finally {
			rmSync(cwd, { recursive: true, force: true });
		}
	});
});
