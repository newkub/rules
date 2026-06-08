/**
 * Minimal, dependency-free logger. Uses `picocolors` for terminal colors so
 * the CLI output stays small and tree-shakeable.
 */
import pc from "picocolors";

export type LogLevel = "info" | "warn" | "error" | "success" | "debug";

const isTty = process.stdout.isTTY && !process.env.NO_COLOR;

function dim(s: string): string {
	return isTty ? pc.gray(s) : s;
}

function format(level: LogLevel, msg: string): string {
	const tag: Record<LogLevel, string> = {
		info: pc.cyan("info"),
		warn: pc.yellow("warn"),
		error: pc.red("error"),
		success: pc.green("done "),
		debug: dim("debug"),
	};
	return `${tag[level]}  ${msg}`;
}

export const logger = {
	info: (msg: string) => console.log(format("info", msg)),
	warn: (msg: string) => console.warn(format("warn", msg)),
	error: (msg: string) => console.error(format("error", msg)),
	success: (msg: string) => console.log(format("success", msg)),
	debug: (msg: string) => {
		if (process.env.DEBUG) console.log(format("debug", msg));
	},
	/** Print a one-line banner. */
	banner: (text: string) => {
		const line = "─".repeat(Math.max(0, text.length + 4));
		console.log(dim(line));
		console.log(`  ${pc.bold(text)}`);
		console.log(dim(line));
	},
};
