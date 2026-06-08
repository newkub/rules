/**
 * Agent-skill installer. Copies the bundled `skills/rules/` folder to
 * the consumer's `.agents/skills/rules/` (Zed-compatible layout) so an
 * AI agent working on the project can read the rule catalog and know how to
 * suppress / extend rules.
 */
import { existsSync, readFileSync } from "node:fs";
import { copyFile, mkdir, readdir, stat } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ensureDir, existsSync as pathExists } from "../utils/fs.ts";

export interface SkillInstallOptions {
	/** Where the consumer wants the skill folder to live. */
	targetDir: string;
	/** If `true`, overwrite an existing installation. */
	force?: boolean;
}

/** Find the package root by walking up to find package.json. */
function findProjectRoot(start: string): string {
	const { existsSync } = require("node:fs");
	let dir = resolve(start);
	while (dir !== resolve(dir, "..")) {
		if (existsSync(resolve(dir, "package.json"))) return dir;
		dir = resolve(dir, "..");
	}
	return resolve(start);
}

/**
 * Resolve the path to the bundled `skills/` directory.
 *
 * Returns the `skills/` folder itself (e.g. `pkgRoot/skills/`), NOT the
 * `skills/rules/` sub-folder — that sub-folder is added by
 * `installSkill` so the install path stays consistent.
 */
export function bundledSkillDir(): string {
	const here = fileURLToPath(import.meta.url);
	// Find package root by walking up to find package.json
	const pkgRoot = findProjectRoot(here);
	const candidates = [
		resolve(pkgRoot, "dist", "skill"),
		resolve(pkgRoot, "skills"),
	];
	for (const candidate of candidates) {
		if (existsSync(candidate) && existsSync(join(candidate, "rules", "SKILL.md"))) {
			return candidate;
		}
	}
	throw new Error(
			`rules: bundled skill folder not found. import.meta.url=${import.meta.url}. ` +
				`pkgRoot=${pkgRoot}. Reinstall the package.`,
		);
}

/** Recursive copy that works for both files and directories. */
async function copyRecursive(src: string, dest: string): Promise<void> {
	const statResult = await stat(src);
	if (statResult.isDirectory()) {
		await mkdir(dest, { recursive: true });
		for (const entry of await readdir(src)) {
			await copyRecursive(join(src, entry), join(dest, entry));
		}
	} else {
		await mkdir(dirname(dest), { recursive: true });
		await copyFile(src, dest);
	}
}

/**
 * Install the agent skill into `targetDir` (which should be the parent folder
 * — the skill is placed at `<targetDir>/rules/`).
 */
export async function installSkill(options: SkillInstallOptions): Promise<string> {
	// bundledSkillDir() returns the `skills/` parent; we need the `rules/`
	// sub-folder inside it.
	const src = resolve(bundledSkillDir(), "rules");
	const dest = resolve(options.targetDir, "rules");
	await ensureDir(options.targetDir);
	if (existsSync(dest) && !options.force) {
		throw new Error(
			`Skill already installed at ${dest}. Pass { force: true } to overwrite.`,
		);
	}
	await copyRecursive(src, dest);
	return dest;
}

/** Read the bundled SKILL.md (useful for tests / docs preview). */
export function readBundledSkill(): string {
	const dir = bundledSkillDir();
	return readFileSync(join(dir, "SKILL.md"), "utf8");
}

/** Path of every file installed by {@link installSkill}, relative to the target. */
export async function listSkillFiles(targetDir: string): Promise<string[]> {
	const root = resolve(targetDir, "rules");
	if (!existsSync(root)) return [];
	const out: string[] = [];
	const stack: string[] = [root];
	while (stack.length > 0) {
		const dir = stack.pop();
		if (dir === undefined) break;
		for (const entry of await readdir(dir)) {
			const full = join(dir, entry);
			const s = await stat(full);
			if (s.isDirectory()) stack.push(full);
			else out.push(relative(root, full));
		}
	}
	return out.sort();
}

export { pathExists };
