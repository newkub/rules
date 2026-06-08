/**
 * Scanner: turns a list of {@link Rule} and a list of files into findings.
 *
 * We use `@ast-grep/napi` because it is the JS-native entry point to ast-grep
 * and avoids the cost of spawning a subprocess on every file.
 */
import { parseAsync } from "@ast-grep/napi";
import { severityFails } from "./config.ts";
import { filterRules } from "./filter.ts";
import { loadRules } from "./loader.ts";
import type { Finding, Language, PluginConfig, Rule, ScanResult, Severity } from "./types.ts";
import { existsSync, readFile } from "./utils/fs.ts";
import { expandGlobs } from "./utils/glob.ts";
import { logger } from "./utils/logger.ts";

const EXT_TO_LANG: Record<string, Language> = {
	ts: "typescript",
	tsx: "tsx",
	cts: "typescript",
	mts: "typescript",
	js: "javascript",
	jsx: "javascript",
	mjs: "javascript",
	cjs: "javascript",
	html: "html",
	htm: "html",
	vue: "vue",
	svelte: "svelte",
	css: "css",
	json: "json",
	yml: "yaml",
	yaml: "yaml",
	rs: "rust",
};

function langForFile(path: string): Language | null {
	const idx = path.lastIndexOf(".");
	if (idx === -1) return null;
	const ext = path.slice(idx + 1).toLowerCase();
	return EXT_TO_LANG[ext] ?? null;
}

function fileMatchesRule(fileLang: Language, rule: Rule): boolean {
	if (rule.language === fileLang) return true;
	// Allow tsx rules to also match ts and vice-versa; same for vue/svelte.
	if ((fileLang === "ts" || fileLang === "tsx") && rule.language === "typescript") return true;
	if (fileLang === "typescript" && rule.language === "tsx") return true;
	return false;
}

function severityToNumber(sev: Severity): number {
	return { error: 3, warning: 2, hint: 1, info: 0 }[sev];
}

function previewFor(content: string, startLine: number): string {
	const lines = content.split(/\r?\n/);
	const idx = Math.max(0, startLine - 1);
	return lines[idx]?.trim() ?? "";
}

/**
 * Run a full scan and return findings. The function is pure with respect to
 * its inputs — it does not log unless `cfg.report !== false`.
 */
export async function scan(
	options: PluginConfig,
	rootDir: string,
): Promise<ScanResult> {
	const started = performance.now();

	const rules = await loadRules(options.rulesDir ?? "");
	const active = filterRules(rules, options);
	const files = await expandGlobs(
		options.include ?? [],
		rootDir,
		options.exclude ?? [],
	);

	if (active.length === 0) {
		logger.warn("no rules to evaluate after filtering");
		return {
			findings: [],
			durationMs: Math.round(performance.now() - started),
			filesScanned: files.length,
			rulesEvaluated: 0,
		};
	}

	// Group rules by language so we only parse each file once per language.
	const rulesByLang = new Map<Language, Rule[]>();
	for (const r of active) {
		const lang = r.language as Language;
		const list = rulesByLang.get(lang) ?? [];
		list.push(r);
		rulesByLang.set(lang, list);
	}

	const findings: Finding[] = [];

	for (const file of files) {
		const fileLang = langForFile(file);
		if (!fileLang) continue;
		const langRules = rulesByLang.get(fileLang);
		if (!langRules || langRules.length === 0) continue;

		let source: string;
		try {
			source = await readFile(file, "utf8");
		} catch (err) {
			logger.warn(`skip ${file}: ${err instanceof Error ? err.message : String(err)}`);
			continue;
		}
		if (!source.trim()) continue;

		let tree;
		try {
			tree = await parseAsync(fileLang, source);
		} catch (err) {
			// Some files may fail to parse (e.g. JSX in a .js file). Skip them.
			logger.debug(`parse failed: ${file}: ${err instanceof Error ? err.message : String(err)}`);
			continue;
		}
		const root = tree.root();

		for (const rule of langRules) {
			if (!fileMatchesRule(fileLang, rule)) continue;
			try {
				const matches = root.findAll(rule.rule as Parameters<typeof root.findAll>[0]);
				for (const m of matches) {
					const range = m.range();
					findings.push({
						ruleId: rule.id,
						severity: rule.severity,
						category: rule.category,
						file,
						range: {
							start: { line: range.start.line + 1, column: range.start.column + 1 },
							end: { line: range.end.line + 1, column: range.end.column + 1 },
						},
						message: rule.message,
						preview: previewFor(source, range.start.line + 1),
					});
				}
			} catch (err) {
				logger.debug(
					`rule ${rule.id} threw on ${file}: ${err instanceof Error ? err.message : String(err)}`,
				);
			}
		}
	}

	// Stable order: file, then line, then column, then severity (desc).
	findings.sort((a, b) => {
		if (a.file !== b.file) return a.file.localeCompare(b.file);
		if (a.range.start.line !== b.range.start.line) {
			return a.range.start.line - b.range.start.line;
		}
		if (a.range.start.column !== b.range.start.column) {
			return a.range.start.column - b.range.start.column;
		}
		return severityToNumber(b.severity) - severityToNumber(a.severity);
	});

	return {
		findings,
		durationMs: Math.round(performance.now() - started),
		filesScanned: files.length,
		rulesEvaluated: active.length,
	};
}

/** Returns the highest severity that should fail a build, or `null` if none. */
export function pickFailure(findings: Finding[], failOn: Severity): Finding[] {
	return findings.filter((f) => severityFails(f.severity, failOn));
}

/** Render findings to a colored terminal table. */
export async function renderFindings(
	findings: Finding[],
	failOn: Severity,
	rootDir: string,
): Promise<string> {
	if (findings.length === 0) return "";
	const { relative } = await import("node:path");
	const pc = (await import("picocolors")).default;
	const lines: string[] = [];

	const counts = { error: 0, warning: 0, hint: 0, info: 0 } as Record<Severity, number>;
	for (const f of findings) counts[f.severity]++;

	lines.push("");
	lines.push(
		`  ${pc.bold("agent-rules")}  ${findings.length} finding${
			findings.length === 1 ? "" : "s"
		} — ${pc.red(`${counts.error} error`)} · ${pc.yellow(`${counts.warning} warning`)} · ${pc.cyan(`${counts.hint} hint`)} · ${pc.gray(`${counts.info} info`)}`,
	);
	lines.push("");

	for (const f of findings) {
		const tag = f.severity.toUpperCase().padEnd(7);
		const coloredTag =
			f.severity === "error"
				? pc.red(tag)
				: f.severity === "warning"
					? pc.yellow(tag)
					: f.severity === "hint"
						? pc.cyan(tag)
						: pc.gray(tag);
		const rel = relative(rootDir, f.file);
		const location = `${rel}:${f.range.start.line}:${f.range.start.column}`;
		lines.push(`  ${coloredTag} ${pc.bold(f.ruleId)}  ${pc.gray(location)}`);
		lines.push(`           ${f.message}`);
		if (f.preview) lines.push(`           ${pc.gray("› " + f.preview)}`);
	}

	lines.push("");
	const failing = pickFailure(findings, failOn);
	if (failing.length > 0) {
		lines.push(
			`  ${pc.red(pc.bold(`✖ ${failing.length} finding(s) at or above '${failOn}'`))}`,
		);
	} else {
		lines.push(`  ${pc.green(pc.bold("✓ no findings at or above '") + failOn + "'")}`);
	}
	lines.push("");
	return lines.join("\n");
}

export { existsSync };
