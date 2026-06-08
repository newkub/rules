/**
 * Glob helper that returns absolute file paths.
 * Backed by `tinyglobby` which is fast, modern, and tree-shakable.
 */
import { glob } from "tinyglobby";

export async function expandGlobs(
	patterns: string[],
	cwd: string,
	ignore: string[] = [],
): Promise<string[]> {
	const matches = await glob(patterns, {
		cwd,
		absolute: true,
		ignore,
		onlyFiles: true,
		dot: false,
	});
	// De-dupe while preserving order.
	return Array.from(new Set(matches));
}
