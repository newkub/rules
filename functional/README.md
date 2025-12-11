# Functional TypeScript Rules

กฏสำหรับ Functional Programming with TypeScript และ Effect-TS

## Architecture

```
types/ (Effect Schema)
  ↓
constant/ + config/ (c12)
  ↓
components/ (Pure) + services/ (Effect) + lib/ (Wrappers)
  ↓
utils/ (Remeda)
  ↓
app.ts (Compose) + index.ts (Entry)
```

## Data Flow

```
Schema → Config → Pure → Effect → App
Validate  Bridge  Render I/O     Run
```

## Rules

### 1. no-side-effects-in-utils.yml
- utils/ ต้องเป็น pure functions เท่านั้น
- ห้าม console, process, Effect
- ห้าม mutate input

### 2. components-import-config-only.yml
- components/ import จาก config/ เท่านั้น
- ห้าม import types/ ตรง
- Data Flow: types → config → components

### 3. constant-must-be-frozen.yml
- constant/ ใช้ Object.freeze + as const
- ตั้งชื่อ UPPER_SNAKE_CASE
- immutable values

### 4. config-must-be-frozen.yml
- config/ ใช้ Object.freeze
- ใช้ as const + satisfies
- bridge types → components

### 5. services-use-effect.yml
- services/ ใช้ Effect-TS
- ห้าม run Effect ตรง
- ใช้ Layer สำหรับ DI

### 6. types-use-effect-schema.yml
- types/ ใช้ @effect/schema
- runtime validation
- derive types จาก Schema

### 7. lib-no-side-effects.yml
- lib/ wrap third-party เท่านั้น
- ห้าม side effects
- type-safe wrappers

### 8. no-any-type.yml
- ห้ามใช้ any type
- ใช้ unknown, generics แทน

### 9. naming-conventions.yml
- Files: PascalCase (components), kebab-case (อื่นๆ)
- Variables: UPPER_SNAKE_CASE (constants), camelCase (functions)
- Types/Classes: PascalCase

## Import Rules

```
components  ← config ← types + constant
services    ← config + types (Effect-TS)
utils       ← (No dependencies - pure)
lib         ← (No dependencies - wrappers)
```

## Core Principles

1. **Pure Functions**: utils/ และ components/ ไม่มี side effects
2. **Single Entry Point**: ใช้ config/ เป็นทางเข้าเดียวสำหรับ types
3. **Effect-TS**: services/ จัดการ side effects
4. **Immutability**: constant/ และ config/ ใช้ freeze + as const
5. **Type Safety**: Effect Schema + TypeScript

## Testing Strategy

- **Pure**: unit tests (fast, no mocks)
- **Effect**: mock layers
- **Integration**: E2E with real services

## วิธีใช้

```bash
# ตรวจสอบ rules
bun sg scan -r rules/functional

# แก้ไขอัตโนมัติ
bun sg scan -r rules/functional --update-all
```

## Dependencies

```json
{
  "dependencies": {
    "effect": "latest",
    "@effect/schema": "latest",
    "c12": "latest",
    "remeda": "latest"
  }
}
```

## เอกสารอ้างอิง

- Effect-TS: https://effect.website
- Effect Schema: https://effect.website/docs/schema
- Remeda: https://remedajs.com
- c12: https://github.com/unjs/c12
