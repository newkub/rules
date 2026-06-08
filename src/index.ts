/**
 * Public entry point. Importing `rules` gives you the Vite plugin
 * factory plus the loader / scanner / skill helpers exposed for programmatic
 * use. The CLI lives in `./cli.ts`.
 */

export {
	bundledRulesDir,
	findProjectRoot,
	resolveConfig,
	severityFails,
} from "./config.ts";
export { filterRules } from "./filter.ts";
export {
	formatRuleLine,
	groupByCategory,
	listCategories,
	loadRules,
} from "./loader.ts";
export { agentRules, default, default as plugin } from "./plugin.ts";
export { pickFailure, renderFindings, scan } from "./scanner.ts";
export {
	bundledSkillDir,
	installSkill,
	listSkillFiles,
	readBundledSkill,
} from "./skill.ts";
export * from "./types.ts";
