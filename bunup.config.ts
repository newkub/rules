import { defineConfig } from "bunup";
import { copyFileSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function copyDir(src: string, dest: string) {
	mkdirSync(dest, { recursive: true });
	for (const entry of readdirSync(src)) {
		const s = join(src, entry);
		const d = join(dest, entry);
		if (statSync(s).isDirectory()) copyDir(s, d);
		else copyFileSync(s, d);
	}
}

export default defineConfig({
	entry: ["src/index.ts", "src/cli/cli.ts"],
	format: ["esm"],
	sourcemap: false,
	clean: true,
	target: "node",
	shims: false,
	banner: {
		js: "import { createRequire as __rulesCtor } from 'node:module'; const require = __rulesCtor(import.meta.url);",
	},
	onSuccess: () => {
		copyDir("rules", "dist/rules");
		copyDir("skills", "dist/skill");
	},
});
