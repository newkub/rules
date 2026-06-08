/**
 * Thin filesystem helpers built on Bun's native API where possible.
 * Falls back to `node:fs/promises` for environments where `Bun.file`
 * semantics (lazy stat, async iteration) do not fit.
 */
import { existsSync, statSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";

export { dirname, existsSync, mkdir, readFile, relative, resolve, statSync, writeFile };

/** Top-level category from an absolute path, e.g. `/x/rules/svelte/foo.yml` -> `svelte`. */
export function categoryFromPath(absoluteRulePath: string, rulesRoot: string): string {
	const rel = relative(rulesRoot, absoluteRulePath);
	const first = rel.split(sep)[0];
	return first ?? "";
}

/** Ensure `path` exists, creating parent directories as needed. */
export async function ensureDir(path: string): Promise<void> {
	if (existsSync(path)) return;
	await mkdir(path, { recursive: true });
}

/** Recursively list YAML rule files under `root` (one level deep into each category). */
export async function* walkYaml(root: string): AsyncGenerator<string> {
	const { readdir, readdir: _ } = await import("node:fs/promises");
	const stack: string[] = [root];
	while (stack.length > 0) {
		const dir = stack.pop();
		if (dir === undefined) break;
		const entries = await readdir(dir, { withFileTypes: true });
		for (const entry of entries) {
			const full = resolve(dir, entry.name);
			if (entry.isDirectory()) stack.push(full);
			else if (entry.isFile() && /\.(ya?ml)$/i.test(entry.name)) yield full;
		}
	}
}

/** Test whether `path` is a file (sync; cheap). */
export function isFile(path: string): boolean {
	try {
		return statSync(path).isFile();
	} catch {
		return false;
	}
}

/** Test whether `path` is a directory. */
export function isDir(path: string): boolean {
	try {
		return statSync(path).isDirectory();
	} catch {
		return false;
	}
}
