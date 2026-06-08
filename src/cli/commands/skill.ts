/**
 * `rules skill` — install or uninstall the agent-skill folder.
 */
import type { Command } from "cac";
import { rmSync } from "node:fs";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { installSkill, listSkillFiles } from "../../core/skill.ts";
import { logger } from "../../utils/logger.ts";

export interface SkillCommandOptions {
	cwd: string;
	target?: string;
	force?: boolean;
}

export function registerSkill(cli: Command): void {
	cli
		.command("skill [action]", "Install or uninstall the rules skill")
		.option("--target <dir>", "parent directory for the skill (default: <cwd>/.agents/skills)")
		.option("--force", "overwrite an existing installation")
		.action(async (action: string | undefined, options: SkillCommandOptions) => {
			const cwd = options.cwd ?? process.cwd();
			const target = options.target
				? resolve(cwd, options.target)
				: resolve(cwd, ".agents/skills");

			if (!action || action === "install") {
				const installed = await installSkill({ targetDir: target, force: options.force });
				const files = await listSkillFiles(target);
				logger.success(`installed ${files.length} file(s) to ${installed}`);
				for (const f of files) console.log(`    ${f}`);
				return;
			}

			if (action === "uninstall") {
				const dest = resolve(target, "rules");
				if (!existsSync(dest)) {
					logger.warn(`no skill found at ${dest}`);
					return;
				}
				rmSync(dest, { recursive: true, force: true });
				logger.success(`removed ${dest}`);
				return;
			}

			logger.error(`unknown action '${action}'. Use 'install' or 'uninstall'.`);
			process.exitCode = 1;
		});
}
