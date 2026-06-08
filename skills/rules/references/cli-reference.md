---
name: rules-cli
description: Reference for every flag and command exposed by `rules`. Use when an agent needs to drive the CLI on behalf of a user.
---

# CLI reference

## Global options

| Flag             | Description                                       |
|------------------|---------------------------------------------------|
| `--cwd <dir>`    | Run as if invoked from `<dir>`. Default: `.`      |
| `--config <path>`| Path to a config file. Overrides file discovery. |
| `--help` / `-h`  | Print help.                                       |
| `--version`      | Print version.                                    |

## `rules init`

Scaffold a project:

- `agent-rules.config.ts` — the typed plugin config
- `vite.config.ts` — adds `agentRules(...)` to `plugins` (only if missing)
- `.agents/skills/rules/` — the agent skill

| Flag        | Description                              |
|-------------|------------------------------------------|
| `--no-skill`| Skip installing the agent skill          |
| `--no-config`| Skip writing config files               |
| `--force`   | Overwrite existing files                 |

## `rules scan`

Run a scan.

| Flag                  | Description                              |
|-----------------------|------------------------------------------|
| `--rules-dir <dir>`   | Override the rules directory             |
| `--include <glob...>` | Glob patterns to include                 |
| `--exclude <glob...>` | Glob patterns to exclude                 |
| `--fail-on <sev>`     | `error` \| `warning` \| `hint` \| `info` |
| `--no-report`         | Suppress the human report                |
| `--report-file <p>`   | Write findings to `<p>` as JSON          |
| `--json`              | Emit JSON to stdout                      |

Exit code is `1` when any finding is at or above `--fail-on`.

## `rules list`

| Flag                  | Description                          |
|-----------------------|--------------------------------------|
| `--rules-dir <dir>`   | List rules from `<dir>`              |
| `--category <name>`   | Filter to one category               |
| `--json`              | Emit JSON instead of a table         |

## `rules enable` / `rules disable`

```
rules enable [...items] [--category] [--all] [--force]
rules disable [...items] [--category] [--all]
```

Patches the first existing `agent-rules.config.{ts,mts,js,mjs}` (or the
`agentRules` block in `package.json`) to add the listed rules or categories
to `enabledRules` / `enabledCategories` / `disabledRules` /
`disabledCategories`.

## `rules skill`

| Flag             | Description                              |
|------------------|------------------------------------------|
| `[install]`      | Default action — install the skill       |
| `uninstall`      | Remove the installed skill               |
| `--target <dir>` | Parent directory for the skill folder    |
| `--force`        | Overwrite an existing installation       |

Default target is `<cwd>/.agents/skills` and the skill is always placed at
`<target>/rules/`.