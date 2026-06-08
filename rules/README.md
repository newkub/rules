# ast-grep Rules

AST-based code linting rules for the booking platform using [ast-grep](https://ast-grep.github.io/).

## Layout

Rules are grouped by **single responsibility** at the top level of `rules/`. Each folder contains YAML rules for one concern. The TypeScript / Svelte tree is split further when a folder would otherwise mix unrelated responsibilities (notably `security/` is split by attack surface). `rust/` is reserved for future Rust services and is not enabled by default.

```
rules/
├── a11y/                   # Web accessibility (WCAG 2.1)
├── api/                    # SvelteKit / Nitro route handlers
├── bun/                    # Bun runtime APIs
├── error-handling/         # TS / Promise error patterns
├── general/                # Cross-cutting, language-agnostic rules
├── html/                   # HTML semantics & safety
├── lib/                    # Library-specific rules
│   ├── drizzle/            #   Drizzle ORM
│   ├── stripe/             #   Stripe SDK + webhooks
│   └── zod/                #   Zod validation
├── nitro/                  # Nitro / H3 server primitives
├── package-json/           # package.json fields
├── performance/            # Bundle / loop / IO performance
├── security/               # Web + transport security (split by concern)
│   ├── data/               #   Secrets, PII, third-party keys
│   ├── transport/          #   Network, TLS, build-time env
│   ├── web/                #   Browser, cookie, CSRF, redirect, session
│   └── xss/                #   DOM injection, CSP
├── seo/                    # SEO meta + structured data
├── svelte/                 # Svelte 5 + SvelteKit
├── typescript/             # Plain TypeScript style + types
├── unocss/                 # UnoCSS utility classes & icon pipeline
├── vue/                    # Vue 3 SFCs (legacy / mixed codebases)
└── rust/                   # Rust idioms + safety (not scanned)
    ├── idiomatic/
    ├── security/
    ├── error-handling/
    ├── performance/
    ├── async/
    ├── memory/
    ├── api-style/
    ├── testing/
    └── general/
```

## Usage

```bash
# Run all rules
bun run scan

# JSON output for CI / GitHub Actions
bun run scan --json

# Single rule
bunx ast-grep scan -r rules/typescript/no-console.yml

# Specific category
bunx ast-grep scan -r rules/lib/stripe/

# Filter severity
bun run scan --error
bun run scan --warning
bun run scan --hint
```

## Categories

### typescript (10 rules)

| Rule | Severity | Description |
|------|----------|-------------|
| `no-any` | warning | Ban `any` type usage |
| `no-console` | warning | Remove `console.log` before production |
| `no-explicit-any-func` | warning | Avoid explicit `any` in function parameters |
| `prefer-async-await` | hint | Avoid `.then()` chains |
| `prefer-const-enum` | hint | Use `const enum` for performance |
| `prefer-nullish-coalescing` | hint | Use `??` over `\|\|` |
| `prefer-satisfies` | hint | Use `satisfies` instead of `as` |
| `use-const` | hint | Prefer `const` over `let` |
| `use-type-alias` | hint | Prefer `type` over `interface` |
| `use-type-guard` | hint | Use type guard functions |

> `no-todo-comments` lives in `general/` because it is language-agnostic.

### bun (4 rules)

| Rule | Severity | Description |
|------|----------|-------------|
| `prefer-bun-env` | hint | Use `Bun.env` over `process.env` |
| `prefer-bun-file` | hint | Use `Bun.file()` for file reading |
| `prefer-bun-write` | hint | Use `Bun.write()` for file output |
| `prefer-bun-crypto` | hint | Use `Bun.password.hash()` for credentials |

### general (13 rules) — **cross-cutting, language-agnostic**

Security basics, universal error handling, and the universal hygiene rules. They are written in TypeScript today, but the patterns translate 1:1 to any language.

| Rule | Severity | Description |
|------|----------|-------------|
| `no-console-log` | warning | Use a structured logger instead of `console.log` |
| `no-disable-csrf` | warning | Don't disable CSRF on state-changing endpoints |
| `no-disable-ssl` | error | Never disable TLS verification |
| `no-empty-catch` | error | Empty catch blocks silently swallow errors |
| `no-eval` | error | `eval()` is forbidden in any language |
| `no-floating-promise` | warning | Await, return, or `void()` every promise |
| `no-function-constructor` | error | `new Function()` is an indirect `eval` |
| `no-hardcoded-secrets` | error | Move API keys, tokens, passwords to env |
| `no-silent-failure` | warning | Catch blocks must log, rethrow, or return a Result |
| `no-throw-literal` | error | Throw `Error` subclasses, not raw strings |
| `no-todo-comments` | warning | Move TODOs to the issue tracker |
| `no-weak-hash` | error | Avoid `md5` / `sha1`, use SHA-256+ or `Bun.password` |
| `no-weak-random` | warning | `Math.random` is not a CSPRNG |

### error-handling (5 rules)

| Rule | Severity | Description |
|------|----------|-------------|
| `prefer-try-catch-async` | warning | Wrap async route handlers in `try/catch` |
| `no-uncaught-rejection` | warning | Add `.catch()` or `await` on every Promise |
| `require-error-class` | hint | Throw typed error classes, not plain `Error` |
| `no-error-in-promise-chain` | hint | Use `async/await` over `.then().then()` |
| `no-return-await-misuse` | hint | Use `return await` inside `try/catch` |

### performance (3 rules)

| Rule | Severity | Description |
|------|----------|-------------|
| `no-sync-io` | warning | Avoid `fs.readFileSync` etc. |
| `no-large-bundle-import` | warning | Avoid `import _ from 'lodash'` / `chart.js` |
| `no-await-in-loop` | warning | Use `Promise.all` for independent awaits |

> `no-deep-reactive` moved to `svelte/` (reactive-deep is framework-specific, not generic perf).

### a11y (13 rules)

| Rule | Severity | Description |
|------|----------|-------------|
| `require-button-type` | warning | `<button>` needs explicit `type` |
| `require-aria-label-icon-button` | warning | Icon-only buttons need `aria-label` |
| `no-positive-tabindex` | warning | Avoid `tabindex > 0` |
| `no-empty-link` | error | `<a>` needs text or `aria-label` |
| `no-empty-button` | error | `<button>` needs accessible name |
| `require-input-label` | warning | Form inputs need `<label>` or `aria-label` |
| `no-heading-skip` | warning | Heading levels must descend in order |
| `no-marquee-tag` | error | `<marquee>` is deprecated & inaccessible |
| `require-scope-on-table` | hint | `<th>` needs `scope` for screen readers |
| `no-redundant-alt` | hint | Don't say "image of" in `alt` |
| `require-lang-attribute` | warning | `<html>` needs `lang="..."` |
| `no-autoplay-audio` | warning | `autoplay` audio must be muted |
| `no-accesskey-conflict` | hint | Avoid `accesskey` collisions |

### api (8 rules)

| Rule | Severity | Description |
|------|----------|-------------|
| `require-input-validation` | error | Validate body with Zod before use |
| `require-rate-limit` | warning | Public writes need rate limiting |
| `require-status-code` | warning | Throw `error(status, msg)` not plain `Error` |
| `no-error-stack-leak` | error | Don't return `error.stack` to clients |
| `require-content-type` | hint | Check `Content-Type` header on writes |
| `require-auth-on-protected` | error | Protected endpoints must call `requireAuth` |
| `require-idempotency-key` | hint | Payment/booking POST needs Idempotency-Key |
| `no-mass-assignment` | error | Don't spread the request body into Drizzle |

### security/ (11 rules, split by attack surface)

The old monolithic `security/` folder mixed crypto, XSS, transport, browser, and secrets. They now live under their own concern.

#### security/xss (4)

| Rule | Severity | Description |
|------|----------|-------------|
| `no-innerhtml` | error | `innerHTML` / `{@html}` is an XSS vector |
| `no-document-write` | error | `document.write` can rewrite the page |
| `no-form-action-javascript` | error | No `action="javascript:..."` |
| `require-csp-meta` | hint | Production pages need CSP meta |

#### security/transport (2)

| Rule | Severity | Description |
|------|----------|-------------|
| `no-http-in-production` | warning | Use `https://` (except localhost) |
| `no-process-env-in-client` | error | Use `$env/static/public`, not `process.env` |

> TLS-related (`no-disable-ssl`) is in `general/` because it applies to any stack.

#### security/web (4)

| Rule | Severity | Description |
|------|----------|-------------|
| `no-cookie-without-secure` | warning | Set `secure: true`, `httpOnly: true` |
| `no-dangerous-redirect` | warning | Validate redirect targets (open-redirect) |
| `no-trust-user-id` | error | Read `userId` from session, not body |
| `no-target-blank-noopener` | warning | `target="_blank"` needs `rel="noopener"` |

> CSRF (`no-disable-csrf`) is in `general/` as a universal web rule.

#### security/data (1)

| Rule | Severity | Description |
|------|----------|-------------|
| `no-stripe-live-key-in-code` | error | No `sk_live_...` in source |

> `no-hardcoded-secrets` lives in `general/` because secret leakage is universal.

### seo (12 rules)

| Rule | Severity | Description |
|------|----------|-------------|
| `require-meta-description` | warning | Public pages need `<meta name="description">` |
| `require-canonical-url` | warning | Declare `<link rel="canonical">` |
| `require-og-tags` | warning | og:title, og:description, og:image required |
| `require-og-type` | hint | Set `og:type` (website/article/product) |
| `require-twitter-card` | hint | Add `twitter:card` for X / Twitter |
| `require-structured-data` | hint | Add JSON-LD (schema.org) blocks |
| `require-title-tag` | warning | Every public page needs `<title>` |
| `require-hreflang` | hint | Bilingual pages need `hreflang` |
| `require-sitemap-link` | hint | Link to `/sitemap.xml` |
| `no-duplicate-h1` | warning | One `<h1>` per page |
| `require-heading-hierarchy` | hint | Don't skip heading levels |
| `no-bare-urls` | hint | Wrap URLs in descriptive anchors |

### html (3 rules)

| Rule | Severity | Description |
|------|----------|-------------|
| `no-inline-event-handlers` | warning | Use `addEventListener`, not `onclick=` |
| `require-alt-attr` | warning | `<img>` needs `alt` (even `alt=""`) |
| `no-deprecated-tags` | error | No `<center>` / `<font>` / `<frame>` |

> `no-target-blank-without-rel` consolidated into `security/web/no-target-blank-noopener`.

### lib (17 rules)

| Folder | Rules | Focus |
|--------|------:|-------|
| `lib/drizzle` | 7 | Query builder, indexes, transactions, raw-SQL |
| `lib/stripe` | 6 | Webhook signature, integer amounts, idempotency |
| `lib/zod` | 4 | Coercion, error messages, `safeParse`, enums |

### svelte (6 rules)

| Rule | Severity | Description |
|------|----------|-------------|
| `use-runes` | hint | Prefer Svelte 5 runes |
| `prefer-svelte-5-runes` | warning | Migrate `writable()` → `$state` |
| `require-ondestroy-cleanup` | warning | Clean up `setInterval` in `onMount` |
| `no-reactive-store-leak` | hint | Use `$store` auto-subscription |
| `no-deep-reactive` | hint | `$state` should be shallow when possible |

> `no-svg-iconify` moved to `unocss/`; `no-inline-event-handler` consolidated with `html/`.

### vue (4 rules, legacy / mixed)

| Rule | Severity | Description |
|------|----------|-------------|
| `no-v-html-with-user-content` | error | Avoid `v-html` with user content |
| `use-script-setup` | hint | Prefer `<script setup>` |
| `prefer-script-setup` | hint | `<script setup>` is the recommended style |
| `no-mutate-prop` | error | Emit events, don't mutate props |
| `no-arrow-function-in-template` | warning | Define handlers in `<script setup>` |

### unocss (4 rules)

| Rule | Severity | Description |
|------|----------|-------------|
| `prefer-utility-classes` | hint | Use UnoCSS utilities, not inline styles |
| `no-arbitrary-values` | hint | Avoid `[42px]` arbitrary values |
| `no-inline-style-with-class` | hint | Don't mix `style=""` with `class=""` |
| `no-svg-iconify` | warning | Use UnoCSS icon classes from `@iconify-json/lucide` |

### nitro (3 rules)

| Rule | Severity | Description |
|------|----------|-------------|
| `prefer-event-strict-handling` | hint | Use `event.platform()` with types |
| `no-direct-res-json` | warning | Use `c.json()` over `res.json()` |
| `use-define-event-handler` | hint | Wrap handlers in `defineEventHandler` |
| `prefer-async-handlers` | hint | Use `async function GET/POST` |

### package-json (3 rules)

| Rule | Severity | Description |
|------|----------|-------------|
| `no-devDependencies-in-prod` | hint | `devDependencies` shouldn't ship |
| `require-license` | hint | `license` field is required |
| `no-postinstall-script` | warning | Avoid `postinstall` scripts (supply-chain risk) |

## Rust rules (60 files, not scanned by default)

Parallel to the TypeScript tree, with single-responsibility sub-folders:

| Folder | Count | Focus |
|--------|------:|-------|
| `rust/idiomatic` | 8 | `unwrap`, `if let`, iterators, `format!`, `From` |
| `rust/security` | 7 | `unsafe`, command injection, path traversal, weak hash |
| `rust/error-handling` | 7 | `panic!`, `?`, `thiserror`, error context |
| `rust/performance` | 7 | `Vec::with_capacity`, borrow vs clone, `Cow<str>` |
| `rust/async` | 6 | No blocking in `async fn`, `tokio::spawn`, `join_all` |
| `rust/memory` | 6 | `mem::forget`, `Box::leak`, raw pointers, `Rc`/`Arc` |
| `rust/api-style` | 7 | Newtypes, `thiserror`, doc comments, builder pattern |
| `rust/testing` | 6 | `assert_eq!`, `#[tokio::test]`, no `#[ignore]` |
| `rust/general` | 6 | `println!` in libs, glob imports, dead code |

To enable Rust scanning, add to `sgconfig.yml`:
```yaml
ruleDirs:
  - rules/rust
```

## SRP / separation of concerns rules

When a folder starts mixing concerns, split it. Concrete examples in this tree:

| Symptom | Fix |
|---------|-----|
| `security/` mixed crypto + xss + transport + web + data | Split into `security/{xss,transport,web,data}/` |
| Same rule existed in `general/` and `security/` | Keep the canonical copy in `general/`, delete the other |
| `svelte/no-svg-iconify` was about UnoCSS icons | Moved to `unocss/` |
| `performance/no-deep-reactive` was reactive-specific | Moved to `svelte/` |
| `html/no-target-blank-without-rel` duplicated `security/...noopener` | Consolidated into `security/web/` |
| `svelte/no-inline-event-handler` duplicated `html/no-inline-event-handlers` | Deleted the duplicate |

## Adding new rules

1. Pick the folder that best matches the concern (single responsibility!).
2. Copy an existing rule as a template.
3. Run `bunx ast-grep scan -r rules/<folder>/your-rule.yml` to test.
4. Run `bun run scan --inspect summary` to verify syntax across the whole tree.
5. Update this README with the new rule.

A rule template:

```yaml
id: <category>-<short-name>
language: TypeScript
message: One-line description of the problem
severity: hint | warning | error
rule:
  pattern: "$X.method($Y)"      # or `kind: <ast_node>` for structural match
note: |
  Multi-line explanation, fix suggestion, and link
  to internal docs / RFC.
```

## Migration notes

- The `bun-ts/` wrapper was removed; contents are split by concern.
- `lib/` collects rules tied to a specific third-party library.
- `general/` is the canonical home for cross-cutting rules. **Do not** duplicate
  the same pattern in a framework-specific folder; reference the general rule
  from the framework folder's note.
- `security/` was split by attack surface. If you need a new security concern
  that doesn't fit `xss | transport | web | data`, create a new sub-folder and
  list it in `sgconfig.yml`.
- `rust/` mirrors the SRP pattern for future Rust services.
- `sgconfig.yml` lists only the TypeScript-side folders so `bun run scan`
  stays fast.
