---
name: rules-yaml-schema
description: Schema for the YAML rule files that live under `<rulesDir>/<category>/`. Use when an agent needs to author or validate a new ast-grep rule.
---

# Rule YAML schema

Each `*.yml` file under `<rulesDir>/<category>/` describes one ast-grep rule.

## Required fields

| Field      | Type     | Description                                       |
|------------|----------|---------------------------------------------------|
| `id`       | `string` | Globally unique. Convention: `<category>-<name>`  |
| `language` | `string` | `typescript` \| `tsx` \| `javascript` \| `html` \| `css` \| `json` \| `yaml` \| `rust` \| `vue` \| `svelte` |
| `message`  | `string` | One-line user-facing message                      |
| `rule`     | `object` | The ast-grep rule object (see docs.ast-grep.org)  |

## Optional fields

| Field      | Type     | Description                                |
|------------|----------|--------------------------------------------|
| `severity` | `string` | `error` \| `warning` \| `hint` \| `info`. Default: `warning` |
| `note`     | `string` | Multi-line developer note                  |

## Minimal example

```yaml
id: my-category-no-foo
language: TypeScript
message: Avoid using `foo()` in production
severity: warning
rule:
  pattern: "foo($ARG)"
note: |
  `foo()` is a debug helper. Replace with the structured logger
  in `src/lib/logger.ts`.
```

## Structural rule

```yaml
id: security-no-innerhtml
language: TypeScript
message: innerHTML / `{@html}` is an XSS vector
severity: error
rule:
  any:
    - pattern: "$X.innerHTML = $Y"
    - kind: call_expression
      has:
        field: function
        regex: "^innerHTML$"
```

## Tips

- Run `bunx ast-grep scan -r rules/<category>/your-rule.yml` to test
  interactively.
- Run `bunx ast-grep scan -c sgconfig.yml --inspect summary` to validate
  the whole tree.
- Keep `id` and the file name in sync: `svelte/no-deep-reactive.yml` →
  `id: svelte-no-deep-reactive`.