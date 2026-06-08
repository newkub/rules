/**
 * YAML helpers. We use `js-yaml` because it is the only mature option that
 * ships ECMAScript modules and supports the subset of YAML 1.2 that ast-grep
 * rule files actually use.
 */
import { load as parseYaml } from "js-yaml";
import { readFile } from "./fs.ts";
import type { Language, Severity } from "../types.ts";

export interface RawRuleYaml {
	id?: string;
	language?: string;
	message?: string;
	severity?: string;
	rule?: Record<string, unknown>;
	note?: string;
}

const ALLOWED_LANGUAGES = new Set([
	"typescript",
	"tsx",
	"javascript",
	"jsx",
	"html",
	"css",
	"json",
	"yaml",
	"rust",
	"vue",
	"svelte",
]);

const ALLOWED_SEVERITIES = new Set<Severity>(["error", "warning", "hint", "info"]);

export function normalizeLanguage(lang: string | undefined): Language {
	if (!lang) return "typescript";
	const lower = lang.toLowerCase();
	return (ALLOWED_LANGUAGES.has(lower) ? lower : lower) as Language;
}

export function normalizeSeverity(sev: string | undefined, fallback: Severity = "warning"): Severity {
	if (!sev) return fallback;
	const lower = sev.toLowerCase() as Severity;
	return ALLOWED_SEVERITIES.has(lower) ? lower : fallback;
}

export async function readRuleYaml(path: string): Promise<RawRuleYaml> {
	const raw = await readFile(path, "utf8");
	return (parseYaml(raw) as RawRuleYaml) ?? {};
}
