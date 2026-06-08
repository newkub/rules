/**
 * Terminal formatter for scan findings.
 * Separated from scanner.ts to follow SRP — this module only handles
 * rendering findings into human-readable output.
 */
import type { Finding, Severity } from "../types.ts";
import { severityFails } from "./config.ts";

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
		`  ${pc.bold("rules")}  ${findings.length} finding${
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
