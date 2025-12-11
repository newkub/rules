# tsdown Rules

กฏสำหรับการใช้งาน tsdown - TypeScript bundler

## ภาพรวม

tsdown เป็น fast TypeScript bundler ที่สร้างขึ้นสำหรับ library authoring โดยเฉพาะ

## Rules

### 1. tsdown-in-devdeps.yml
**Severity**: Error

ตรวจสอบว่า tsdown ติดตั้งใน devDependencies

**ถูกต้อง:**
```json
{
  "devDependencies": {
    "tsdown": "^0.15.11"
  }
}
```

**ติดตั้ง:**
```bash
bun add -d tsdown
```

---

### 2. tsdown-build-script.yml
**Severity**: Error

ตรวจสอบว่า build script ใช้ tsdown

**ถูกต้อง:**
```json
{
  "scripts": {
    "build": "tsdown --exports --dts"
  }
}
```

---

### 3. tsdown-recommended-flags.yml
**Severity**: Warning

แนะนำให้ใช้ flags ที่เหมาะสม

**Recommended flags:**
- `--exports` - auto-generate exports field
- `--dts` - generate .d.ts files
- `--watch` - watch mode (optional)

**ตัวอย่างที่แนะนำ:**
```json
{
  "scripts": {
    "build": "tsdown --exports --dts",
    "build:watch": "tsdown --watch --exports --dts"
  }
}
```

## การใช้งาน tsdown

### Basic Setup

1. **ติดตั้ง:**
```bash
bun add -d tsdown
```

2. **เพิ่ม build script:**
```json
{
  "scripts": {
    "build": "tsdown --exports --dts"
  }
}
```

3. **Build:**
```bash
bun run build
```

### Recommended Configuration

```json
{
  "name": "my-package",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": "./dist/index.js",
    "./package.json": "./package.json"
  },
  "scripts": {
    "build": "tsdown --exports --dts",
    "build:watch": "tsdown --watch --exports --dts",
    "dev": "tsdown --watch"
  },
  "devDependencies": {
    "tsdown": "^0.15.11"
  }
}
```

### tsdown Flags

| Flag | Description |
|------|-------------|
| `--exports` | Auto-generate exports field in package.json |
| `--dts` | Generate TypeScript declaration files |
| `--watch` | Watch mode for development |
| `--minify` | Minify output |
| `--sourcemap` | Generate sourcemaps |
| `--platform` | Target platform (node, browser, neutral) |
| `--target` | ECMAScript target version |

### ประโยชน์ของ tsdown

1. **Fast** - เร็วกว่า tsc และ rollup
2. **Zero Config** - ใช้งานได้ทันทีไม่ต้อง config
3. **ESM/CJS** - รองรับทั้ง ESM และ CJS
4. **DTS Generation** - สร้าง .d.ts โดยอัตโนมัติ
5. **Modern** - รองรับ TypeScript features ล่าสุด

### เปรียบเทียบกับเครื่องมืออื่น

| Feature | tsdown | tsc | rollup + plugins |
|---------|--------|-----|------------------|
| Speed | ⚡⚡⚡ | ⚡ | ⚡⚡ |
| Config | Zero | tsconfig.json | Complex |
| DTS | ✅ | ✅ | Plugin required |
| Bundle | ✅ | ❌ | ✅ |
| Watch | ✅ | ✅ | ✅ |

## ตัวอย่างการใช้งาน

### Library Package

```typescript
// src/index.ts
export const greet = (name: string) => `Hello, ${name}!`
export const add = (a: number, b: number) => a + b
```

```bash
# Build
bun run build

# Output:
# dist/index.js
# dist/index.d.ts
```

### Monorepo Workspace

```json
{
  "name": "@myorg/utils",
  "scripts": {
    "build": "tsdown --exports --dts",
    "dev": "tsdown --watch"
  }
}
```

## วิธีตรวจสอบ

```bash
# ตรวจสอบ rules ทั้งหมด
sg scan -r rules/tsdown

# ตรวจสอบเฉพาะ devDependencies
sg scan -r rules/tsdown/tsdown-in-devdeps.yml

# ตรวจสอบเฉพาะ build script
sg scan -r rules/tsdown/tsdown-build-script.yml
```

## เอกสารอ้างอิง

- tsdown GitHub: https://github.com/egoist/tsdown
- tsdown Documentation: https://tsdown.js.org

## Best Practices

1. ✅ ใช้ `--exports --dts` สำหรับ libraries
2. ✅ ใช้ `--watch` สำหรับ development
3. ✅ กำหนด `main`, `module`, `types` ใน package.json
4. ✅ ใช้ `type: "module"` สำหรับ ESM
5. ✅ Test build output ก่อน publish

## Troubleshooting

### ปัญหา: .d.ts files ไม่ถูกสร้าง
**วิธีแก้:** เพิ่ม `--dts` flag
```bash
tsdown --dts
```

### ปัญหา: exports field ไม่ถูก generate
**วิธีแก้:** เพิ่ม `--exports` flag
```bash
tsdown --exports
```

### ปัญหา: Build ช้า
**วิธีแก้:** ใช้ watch mode แทนการ build ซ้ำๆ
```bash
tsdown --watch
```
