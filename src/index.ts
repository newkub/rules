/**
 * Public entry point. Importing `rules` gives you the Vite plugin
 * factory plus the loader / scanner / skill helpers exposed for programmatic
 * use. The CLI lives in `./cli/cli.ts`.
 */

export {
	bundledRulesDir,
	findProjectRoot,
	resolveConfig,
	severityFails,
} from "./core/config.ts";
export { filterRules } from "./core/filter.ts";
export {
	formatRuleLine,
	groupByCategory,
	listCategories,
	loadRules,
} from "./core/loader.ts";
export { pickFailure, renderFindings } from "./core/formatter.ts";
export { scan } from "./core/scanner.ts";
export {
	bundledSkillDir,
	installSkill,
	listSkillFiles,
	readBundledSkill,
} from "./core/skill.ts";
export { rulesPlugin, default as plugin, projectRootFromCwd } from "./plugin/plugin.ts";
export * from "./types.ts";
