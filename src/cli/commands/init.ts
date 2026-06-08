/**
 * `rules init` — scaffold a project config and (optionally) install
 * the agent skill and an example Vite plugin registration.
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import type { Command } from "cac";
import { installSkill } from "../../core/skill.ts";
import { logger } from "../../utils/logger.ts";

export interface InitCommandOptions {
	cwd: string;
	noSkill?: boolean;
	noConfig?: boolean;
	force?: boolean;
}

const CONFIG_TEMPLATE = `import { defineConfig } from "vite";
import { rulesPlugin } from "rules";

export default defineConfig({
	plugins: [
		rulesPlugin({
			// Folder with rule sub-folders. Defaults to the bundled rules.
			rulesDir: "./rules",
			// Glob patterns to include / exclude
			include: ["src/**/*.{ts,tsx,js,jsx,svelte,vue,html}"],
			exclude: ["**/node_modules/**", "**/dist/**"],
			// Minimum severity that fails the build
			failOn: "warning",
			// Run in dev mode too (default: build-only)
			runOnDev: false,
			// Enable only specific categories (whitelist)
			enabledCategories: ["security", "svelte", "seo"],
			// Or disable specific rules
			disabledRules: ["general-no-todo-comments"],
		}),
	],
});
`;

const RULES_CONFIG_TEMPLATE = `import type { PluginConfig } from "rules";

const config: PluginConfig = {
	rulesDir: "./rules",
	include: ["src/**/*.{ts,tsx,js,jsx,svelte,vue,html}"],
	exclude: ["**/node_modules/**", "**/dist/**"],
	failOn: "warning",
};

export default config;
`;

function writeIfMissing(path: string, body: string, force: boolean): boolean {
	if (existsSync(path) && !force) {
		logger.warn(`skip: ${path} (already exists — pass --force to overwrite)`);
		return false;
	}
	mkdirSync(resolve(path, ".."), { recursive: true });
	writeFileSync(path, body, "utf8");
	logger.success(`wrote ${path}`);
	return true;
}

export function registerInit(cli: Command): void {
	cli
		.command("init", "Scaffold a rules project setup")
		.option("--no-skill", "do not install the agent skill")
		.option("--no-config", "do not write a config file")
		.option("--force", "overwrite existing files")
		.action(async (options: InitCommandOptions) => {
			const cwd = options.cwd ?? process.cwd();

			if (!options.noConfig) {
				writeIfMissing(
					join(cwd, "rules.config.ts"),
					RULES_CONFIG_TEMPLATE,
					options.force ?? false,
				);
				writeIfMissing(join(cwd, "vite.config.ts"), CONFIG_TEMPLATE, options.force ?? false);
			}

			if (!options.noSkill) {
				const target = join(cwd, ".agents/skills");
				const dest = await installSkill({ targetDir: target, force: options.force });
				logger.success(`agent skill installed at ${dest}`);
			}

			logger.success("done — run `rules scan` to try it out");
		});
}
