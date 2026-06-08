/**
 * Public type surface for `rules`.
 *
 * Every file in the package should import its types from here so consumers
 * (and our own CLI / plugin) can rely on a single source of truth.
 */

export type Severity = "error" | "warning" | "hint" | "info";

/** ast-grep language identifier. We normalize to lower-case internally. */
export type Language =
	| "typescript"
	| "tsx"
	| "javascript"
	| "jsx"
	| "html"
	| "css"
	| "json"
	| "yaml"
	| "rust"
	| "vue"
	| "svelte"
	| (string & {});

/** A single parsed rule loaded from disk. */
export interface Rule {
	/** Stable id from the YAML file, e.g. `svelte-use-runes`. */
	id: string;
	/** Display message shown to the user. */
	message: string;
	/** ast-grep severity. */
	severity: Severity;
	/** Language the rule applies to. */
	language: Language;
	/** Raw ast-grep rule object (passed through to the scanner). */
	rule: Record<string, unknown>;
	/** Optional multi-line developer note. */
	note?: string;
	/** Absolute path to the YAML file this rule was loaded from. */
	source: string;
	/** Top-level category (folder name under the rules root). */
	category: string;
}

/** User-facing plugin/CLI configuration. */
export interface PluginConfig {
	/** Folder containing rule sub-folders. Defaults to the bundled rules. */
	rulesDir?: string;
	/** Glob patterns to scan. Defaults to project sources. */
	include?: string[];
	/** Glob patterns to exclude. */
	exclude?: string[];
	/** Master switch. `false` makes the plugin a no-op. */
	enabled?: boolean;
	/** Only run rules whose category is in this list. */
	enabledCategories?: string[];
	/** Skip rules whose category is in this list. */
	disabledCategories?: string[];
	/** Only run rules whose id is in this list. */
	enabledRules?: string[];
	/** Skip rules whose id is in this list. */
	disabledRules?: string[];
	/** Minimum severity that should fail the build. */
	failOn?: Severity;
	/** Run a scan in dev mode. Defaults to `false` (build-only). */
	runOnDev?: boolean;
	/** Print findings to the console. Defaults to `true`. */
	report?: boolean;
	/** Path to write a JSON report. */
	reportFile?: string;
}

export interface Finding {
	ruleId: string;
	severity: Severity;
	category: string;
	file: string;
	range: {
		start: { line: number; column: number };
		end: { line: number; column: number };
	};
	message: string;
	preview?: string;
}

export interface ScanResult {
	findings: Finding[];
	durationMs: number;
	filesScanned: number;
	rulesEvaluated: number;
}

export interface ScanOptions {
	rulesDir: string;
	include: string[];
	exclude: string[];
	failOn: Severity;
	rootDir: string;
}

export interface CliRunOptions {
	cwd?: string;
	configPath?: string;
}
