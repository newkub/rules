import { copyFileSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { defineConfig } from "tsdown";

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
	entry: ["src/index.ts", "src/cli.ts"],
	format: ["esm"],
	dts: true,
	sourcemap: true,
	clean: true,
	target: "node20",
	platform: "node",
	shims: false,
	banner: (ctx) => {
		if (ctx.format === "esm") {
			return { js: "import { createRequire as __agentRulesCtor } from 'node:module'; const require = __agentRulesCtor(import.meta.url);" };
		}
		return undefined;
	},
	hooks: {
		"build:done": async (ctx) => {
			// Ship rules and skill files alongside the JS bundle
			copyDir("rules", "dist/rules");
			copyDir("skills", "dist/skill");
		},
	},
});
