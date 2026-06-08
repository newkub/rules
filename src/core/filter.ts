/**
 * Rule filtering. The user can enable / disable by:
 *  - category (`enabledCategories`, `disabledCategories`)
 *  - rule id (`enabledRules`, `disabledRules`)
 *
 * Semantics:
 *  - `enabledCategories` and `enabledRules` are *whitelists*. When either is
 *    non-empty, anything not listed is filtered out.
 *  - `disabledCategories` and `disabledRules` are *blacklists* applied after
 *    the whitelist, so a blacklisted id always wins.
 */
import type { PluginConfig, Rule } from "../types.ts";

export function filterRules(rules: Rule[], cfg: PluginConfig): Rule[] {
	const enabledCats = new Set(cfg.enabledCategories ?? []);
	const disabledCats = new Set(cfg.disabledCategories ?? []);
	const enabledIds = new Set(cfg.enabledRules ?? []);
	const disabledIds = new Set(cfg.disabledRules ?? []);

	const hasWhitelist = enabledCats.size > 0 || enabledIds.size > 0;

	return rules.filter((r) => {
		if (disabledIds.has(r.id)) return false;
		if (disabledCats.has(r.category)) return false;

		if (hasWhitelist) {
			const allowed = enabledIds.has(r.id) || enabledCats.has(r.category);
			if (!allowed) return false;
		}

		return true;
	});
}
