---
name: rules
description: Use the `rules` rule catalog to enforce SEO, a11y, Svelte 5, security, TypeScript, performance, and Bun-specific conventions. Triggers when a user asks about coding standards, lint rules, AST grep rules, or wants to add / toggle / disable a rule. Bundled with the package; installable via `rules skill install`.
version: 0.1.0
---

# rules

`rules` is a single dependency that ships 100+ AST-based rules for
Svelte / SvelteKit, TypeScript, SEO, a11y, security, performance, Bun, and
Drizzle / Stripe / Zod integrations. It can be used as a Vite plugin, a CLI,
or imported programmatically.

## When to use

- The user is about to **add new code** to a project that has `rules`
  installed. Before writing the code, check the active rule catalog
  (`rules list`) to make sure the new code does not violate a rule.
- The user wants to **enable / disable / customize** a rule. Suggest the
  matching CLI command instead of editing the config by hand.
- The user reports a **rule violation** in CI. Use `rules scan --json`
  to read the structured output and propose a fix.
- The user asks about the **agent skill installation** — guide them through
  `rules skill install` and explain what `.agents/skills/rules/`
  contains.

## Conventions enforced

| Category     | Concern                                                   |
|--------------|-----------------------------------------------------------|
| `svelte`     | Svelte 5 runes, `$state` shallow, no event modifier calls |
| `seo`        | `<title>`, `<meta>`, OG, Twitter card, JSON-LD, canonical |
| `a11y`       | WCAG 2.1 basics: labels, alt, headings, no autoplay      |
| `security`   | XSS, CSRF, TLS, secrets, cookies, redirects               |
| `general`    | Cross-cutting: no eval, no throw literal, no TODOs        |
| `typescript` | No `any`, prefer `satisfies`, `async/await`               |
| `bun`        | Use `Bun.env`, `Bun.file`, `Bun.password.hash`            |
| `performance`| No `await` in loop, no `lodash` full-import                |
| `error-handling` | Typed errors, `try/catch` around async routes         |
| `unocss`     | Prefer utility classes, no `[42px]` arbitrary values      |
| `html`       | Semantics: alt, button type, no deprecated tags           |
| `package-json` | `license`, no `postinstall` script                     |
| `nitro`      | `defineEventHandler`, async handlers                      |
| `lib/*`      | Drizzle / Stripe / Zod specifics                          |

For the full table of rules, see `references/rule-catalog.md`.

## Default CLI surface

```bash
rules init                       # scaffold vite.config + skill
rules scan                       # run a scan
rules scan --json                # machine-readable output
rules scan --fail-on warning     # raise the threshold
rules scan --rules-dir ./my-rules

rules list                       # list every rule
rules list --category svelte     # one category
rules list --json                # for scripts

rules enable svelte seo          # whitelist categories
rules enable --all               # enable every category
rules disable security/xss       # blacklist a category
rules disable svelte-use-runes   # blacklist a single rule

rules skill install              # install to ./.agents/skills
rules skill uninstall            # remove the skill
```

## Programmatic API

```ts
import {
  agentRules,        // Vite plugin factory
  loadRules,         // parse rules from a folder
  scan,              // run a full scan, returns { findings, filesScanned, ... }
  filterRules,       // apply whitelist/blacklist
  installSkill,      // install the agent skill into a folder
  resolveConfig,     // normalize a PluginConfig
} from "rules";
```

## Vite plugin usage

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { agentRules } from "rules";

export default defineConfig({
  plugins: [
    agentRules({
      rulesDir: "./rules",                       // or omit to use bundled rules
      include: ["src/**/*.{ts,svelte}"],
      exclude: ["**/dist/**"],
      failOn: "warning",
      enabledCategories: ["security", "svelte"],  // optional whitelist
      disabledRules: ["general-no-todo-comments"],
    }),
  ],
});
```

The plugin runs on `vite build`. Pass `runOnDev: true` to also run during
`vite dev`.

## Suppressing a single finding

`rules` follows the same comment convention as ESLint /
ast-grep CLI. Add a comment on the offending line:

```ts
// ast-grep-ignore: svelte-use-runes
export let count = writable(0);
```

(Or `// ast-grep-disable-next-line: <rule-id>` if the next line is the
violation.) The bundled CLI does not yet strip these comments automatically,
but the Vite plugin and `scan` honor them in a follow-up release.

## Adding a new rule

1. Drop a `*.yml` file into `<rulesDir>/<category>/<name>.yml`.
2. Re-run `rules list` to confirm the new id is picked up.
3. Add an entry to `references/rule-catalog.md` (keeps this skill in sync).

## References

- `references/rule-catalog.md` — every rule with severity and message
- `references/cli-reference.md` — full CLI flag reference
- `references/rule-yaml-schema.md` — what fields are required