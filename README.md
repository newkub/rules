# rules

> AST-based rule catalog for Svelte / TypeScript / SEO / a11y / security /
> performance / Bun — usable as a Vite plugin, a CLI, or a programmatic API.

`rules` packages the `rules/` catalog from
[booking-platform](https://github.com/) into a single dependency that
**ships 100+ YAML rules + an installable agent skill** with your project.

| Surface           | What it does                                              |
|-------------------|-----------------------------------------------------------|
| **Vite plugin**   | Fails the build when findings exceed `failOn`             |
| **CLI** (`rules`) | Scan, list, enable/disable, install skill, init           |
| **Programmatic**  | `loadRules`, `scan`, `filterRules`, `installSkill`         |
| **Agent skill**   | Auto-installable to `.agents/skills/rules/`               |

## Quick start

### Install

```bash
bun add -d rules
# or
npm install -D rules
```

### Wire it into Vite

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { rulesPlugin } from "rules";

export default defineConfig({
  plugins: [
    rulesPlugin({
      // Optional: point at your own rules. Defaults to the bundled rules.
      // rulesDir: "./rules",
      include: ["src/**/*.{ts,tsx,js,jsx,svelte,vue,html}"],
      exclude: ["**/node_modules/**", "**/dist/**"],
      failOn: "warning",
    }),
  ],
});
```

Run `bun run build` — the plugin scans, reports, and exits non-zero if
findings exceed the threshold.

### Use the CLI

```bash
# Scaffold a project
bunx rules init

# Run a scan
bunx rules scan
bunx rules scan --json              # machine-readable
bunx rules scan --fail-on warning   # raise the threshold

# List every rule
bunx rules list
bunx rules list --category svelte

# Toggle rules / categories
bunx rules enable  svelte seo
bunx rules enable  --all
bunx rules disable security/xss
bunx rules disable svelte-use-runes

# Manage the agent skill
bunx rules skill install
bunx rules skill uninstall
```

## Configuration

You can keep config in `rules.config.ts` (recommended) or in the
`rules` key of `package.json`. The CLI / Vite plugin will pick it up
automatically.

```ts
// rules.config.ts
import type { PluginConfig } from "rules";

const config: PluginConfig = {
  rulesDir: "./rules",                  // or omit for bundled rules
  include: ["src/**/*.{ts,svelte}"],
  exclude: ["**/dist/**"],
  failOn: "warning",
  runOnDev: false,                      // run on `vite dev` too?
  enabledCategories: ["svelte", "security", "seo"],
  disabledRules: ["general-no-todo-comments"],
};

export default config;
```

### All options

| Option               | Type            | Default                 | Description                                |
|----------------------|-----------------|-------------------------|--------------------------------------------|
| `rulesDir`           | `string`        | bundled rules           | Folder containing rule sub-folders         |
| `include`            | `string[]`      | sensible source globs   | Files to scan                              |
| `exclude`            | `string[]`      | `node_modules`, `dist`… | Files to ignore                            |
| `enabled`            | `boolean`       | `true`                  | Master switch                              |
| `enabledCategories`  | `string[]`      | `[]`                    | Whitelist categories (others are skipped) |
| `disabledCategories` | `string[]`      | `[]`                    | Blacklist categories                       |
| `enabledRules`       | `string[]`      | `[]`                    | Whitelist rule ids                         |
| `disabledRules`      | `string[]`      | `[]`                    | Blacklist rule ids                         |
| `failOn`             | `Severity`      | `error`                 | `error` \| `warning` \| `hint` \| `info`   |
| `runOnDev`           | `boolean`       | `false`                 | Also run on `vite dev`                     |
| `report`             | `boolean`       | `true`                  | Print human-readable findings              |
| `reportFile`         | `string`        | —                       | Path to write a JSON report                |

## Bundled rules

`rules` ships with these categories (see
`rules list` for the live catalog):

| Category              | Count | Concern                                       |
|-----------------------|------:|-----------------------------------------------|
| `general`             | 13    | Cross-cutting, language-agnostic              |
| `svelte`              |  6    | Svelte 5 + SvelteKit                          |
| `seo`                 | 12    | SEO meta, OG, Twitter, JSON-LD                |
| `a11y`                | 13    | WCAG 2.1                                      |
| `security/xss`        |  4    | DOM injection, CSP                            |
| `security/transport`  |  2    | TLS, build-time env                           |
| `security/web`        |  4    | Cookies, CSRF, redirects, target=_blank       |
| `security/data`       |  1    | Stripe live keys, secrets in code             |
| `error-handling`       |  5    | Async error patterns                          |
| `performance`         |  3    | Bundle, loops, sync IO                        |
| `typescript`          | 10    | Style + types                                 |
| `bun`                 |  4    | Bun native APIs                               |
| `unocss`              |  4    | UnoCSS utilities                              |
| `html`                |  3    | HTML semantics                                |
| `api`                 |  8    | SvelteKit / Nitro route handlers              |
| `nitro`               |  3    | Nitro / H3                                    |
| `package-json`        |  3    | package.json fields                           |
| `lib/drizzle`         |  7    | Drizzle ORM                                   |
| `lib/stripe`          |  6    | Stripe SDK + webhooks                         |
| `lib/zod`             |  4    | Zod validation                                |
| `vue`                 |  4    | Vue 3 SFCs (legacy)                           |

## Agent skill

When you run `rules init` or `rules skill install`, the
package copies `SKILL.md` and three reference docs into
`<cwd>/.agents/skills/rules/`. AI agents (Zed, Claude Code, etc.)
will pick this up and know the rule catalog, the CLI surface, and the
YAML schema for authoring new rules.

## Programmatic API

```ts
import {
  rulesPlugin,     // Vite plugin factory
  loadRules,        // parse rules from a folder
  scan,             // run a full scan
  filterRules,       // apply whitelist/blacklist
  renderFindings,    // format findings for a terminal
  installSkill,      // install the agent skill
  resolveConfig,     // normalize a PluginConfig
} from "rules";
```

## Publishing

```bash
# 1. Run the full verify suite
bun run verify

# 2. Bump the version
bunx taze rules -w    # or edit package.json

# 3. Publish (Bun will respect the npm registry in ~/.npmrc)
bun publish --access public
```

The package is published with the prebuilt `dist/` directory, the bundled
`rules/`, and the `skill/` folder.

## License

MIT