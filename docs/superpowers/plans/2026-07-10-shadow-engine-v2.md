# HappyShadows v2 Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the v1 5-divisor shadow engine with a unified contact/key/ambient layer model across TS and Swift, add tinted shadow color, a Swift `compositingGroup` perf fix, and an animatable-CSS codegen variant.

**Architecture:** `packages/shadow-core/src/layers.ts` is the source of truth for the 5-layer recipe; `Sources/HappyShadows/Core/Constants.swift` mirrors it verbatim, and a shared JSON fixture (`Tests/HappyShadowsTests/Fixtures/v2-layers.json`) is asserted by both test suites so the ports can't drift. Public APIs are unchanged; apps (web, Figma, Framer) pick up the new layers through the existing `computeBoxShadowLayers` names.

**Tech Stack:** TypeScript 5.7 (tsc only, ESM), `node --test` (no test deps), Swift 5.9 / SwiftUI, XCTest, pnpm workspace.

**Spec:** `docs/superpowers/specs/2026-07-10-shadow-engine-v2-design.md`

## Global Constraints

- Platform floors: iOS 17, macOS 14, tvOS 17, watchOS 10, visionOS 1 (from `Package.swift`).
- No new runtime dependencies anywhere. No new dev dependencies either — tests use `node --test` and XCTest.
- The v2 layer constants exist in exactly three places: `layers.ts` (`V2_LAYER_SPECS`), `Constants.swift` (`ShadowConstants.v2Layers`), and the fixture JSON. Any tuning change updates all three plus the table in the spec.
- Alpha weights must sum to 1.0 (0.35 + 0.25 + 0.15 + 0.10 + 0.15).
- Public API of `.happyShadow()` / `.happyGradientShadow()` and all currently-consumed shadow-core exports (`computeBoxShadowLayers`, `computeBoxShadowGradientLayers`, `generateCSS`, `generateGradientCSS`, `generateTailwind`, `generateGradientTailwind`, `generateSwiftUI`, `generateGradientSwiftUI`) must not change signature.
- Run TS tests with `pnpm -C packages/shadow-core test`; Swift tests with `swift test --filter <TestClass>` from the repo root.

---

### Task 1: v2 layer engine in shadow-core (with test infra + shared fixture)

**Files:**
- Create: `Tests/HappyShadowsTests/Fixtures/v2-layers.json`
- Create: `packages/shadow-core/test/layers.test.mjs`
- Modify: `packages/shadow-core/src/layers.ts` (full rewrite of layer math)
- Modify: `packages/shadow-core/src/index.ts` (drop dead exports)
- Modify: `packages/shadow-core/package.json` (add `test` script)

**Interfaces:**
- Consumes: nothing (first task).
- Produces: `V2_LAYER_SPECS: readonly LayerSpec[]` (exported), `computeLayers(params: ShadowParams): ShadowLayer[]`, `computeGradientLayers(params: GradientShadowParams): ShadowLayer[]`, plus aliases `computeBoxShadowLayers = computeLayers` and `computeBoxShadowGradientLayers = computeGradientLayers`. Types `RGBAColor`, `ShadowLayer`, `ShadowParams`, `GradientShadowParams` unchanged. Deletes `computeFigmaLayers`, `computeFigmaGradientLayers` (verified unused: only `computeBoxShadow*` names are imported by web/Figma/Framer).

- [ ] **Step 1: Create the shared fixture**

Create `Tests/HappyShadowsTests/Fixtures/v2-layers.json`. Values are hand-derived from the spec table for `radius 12, opacity 0.4, x 4, y 8` (e.g. contact blur = 12 × 0.25 + 1 = 4; contact alpha = 0.4 × 0.35 = 0.14). The `tint` block is exact: surface (0.2, 0.4, 0.8) → HSL (0.611̄, 0.6, 0.5) → tinted HSL (0.611̄, 0.72, 0.125) → RGB (0.035, 0.095, 0.215).

```json
{
  "params": { "radius": 12, "opacity": 0.4, "x": 4, "y": 8 },
  "layers": [
    { "offsetX": 0.48, "offsetY": 0.96, "blurRadius": 4.0,  "alpha": 0.14 },
    { "offsetX": 1.6,  "offsetY": 3.2,  "blurRadius": 7.2,  "alpha": 0.1  },
    { "offsetX": 2.8,  "offsetY": 5.6,  "blurRadius": 14.4, "alpha": 0.06 },
    { "offsetX": 4.0,  "offsetY": 8.0,  "blurRadius": 24.0, "alpha": 0.04 },
    { "offsetX": 0.0,  "offsetY": 1.2,  "blurRadius": 36.0, "alpha": 0.06 }
  ],
  "tint": {
    "surface": { "r": 0.2, "g": 0.4, "b": 0.8 },
    "shadowAlpha": 0.3,
    "expected": { "r": 0.035, "g": 0.095, "b": 0.215, "a": 0.3 }
  }
}
```

- [ ] **Step 2: Add the test script**

In `packages/shadow-core/package.json`, change `scripts` to:

```json
"scripts": {
  "build": "tsc",
  "dev": "tsc --watch",
  "test": "tsc && node --test test/"
}
```

- [ ] **Step 3: Write the failing tests**

Create `packages/shadow-core/test/layers.test.mjs` (plain JS importing the built dist — no type deps needed):

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  computeLayers,
  computeGradientLayers,
  computeBoxShadowLayers,
  V2_LAYER_SPECS,
} from "../dist/index.js";

const fixture = JSON.parse(
  readFileSync(
    new URL("../../../Tests/HappyShadowsTests/Fixtures/v2-layers.json", import.meta.url),
    "utf8"
  )
);

const close = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-6, `${msg}: ${a} !== ${b}`);

test("alpha weights sum to 1.0", () => {
  const sum = V2_LAYER_SPECS.reduce((acc, s) => acc + s.alphaWeight, 0);
  close(sum, 1.0, "weight sum");
});

test("matches the shared fixture", () => {
  const { params, layers: expected } = fixture;
  const layers = computeLayers({ color: { r: 0, g: 0, b: 0, a: 1 }, ...params });
  assert.equal(layers.length, expected.length);
  layers.forEach((l, i) => {
    close(l.offsetX, expected[i].offsetX, `layer ${i} offsetX`);
    close(l.offsetY, expected[i].offsetY, `layer ${i} offsetY`);
    close(l.blurRadius, expected[i].blurRadius, `layer ${i} blur`);
    close(l.color.a, expected[i].alpha, `layer ${i} alpha`);
  });
});

test("blur strictly increases key1 → key2 → key3 → ambient; contact < key1 for radius ≥ 3", () => {
  for (const radius of [3, 12, 40]) {
    const [contact, k1, k2, k3, ambient] = computeLayers({
      color: { r: 0, g: 0, b: 0, a: 1 }, radius, opacity: 0.3, x: 0, y: 6,
    }).map((l) => l.blurRadius);
    assert.ok(k1 < k2 && k2 < k3 && k3 < ambient, `key/ambient order at radius ${radius}`);
    assert.ok(contact < k1, `contact < key1 at radius ${radius}`);
  }
});

test("offsets scale linearly with input", () => {
  const base = computeLayers({ color: { r: 0, g: 0, b: 0, a: 1 }, radius: 10, opacity: 0.3, x: 3, y: 5 });
  const doubled = computeLayers({ color: { r: 0, g: 0, b: 0, a: 1 }, radius: 10, opacity: 0.3, x: 6, y: 10 });
  base.forEach((l, i) => {
    close(doubled[i].offsetX, l.offsetX * 2, `layer ${i} offsetX linear`);
    close(doubled[i].offsetY, l.offsetY * 2, `layer ${i} offsetY linear`);
  });
});

test("gradient: N colors → 5N layers with per-color opacity", () => {
  const layers = computeGradientLayers({
    colors: [{ r: 1, g: 0, b: 0, a: 1 }, { r: 0, g: 0, b: 1, a: 1 }],
    radius: 10, opacity: 0.4, x: 2, y: 4,
  });
  assert.equal(layers.length, 10);
  close(layers[0].color.a, 0.2 * V2_LAYER_SPECS[0].alphaWeight, "first layer alpha halved");
});

test("computeBoxShadowLayers is an alias of computeLayers", () => {
  assert.equal(computeBoxShadowLayers, computeLayers);
});
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `pnpm -C packages/shadow-core test`
Expected: FAIL — `V2_LAYER_SPECS` is not exported (SyntaxError on import).

- [ ] **Step 5: Rewrite layers.ts with the v2 model**

Replace the entire contents of `packages/shadow-core/src/layers.ts` with:

```ts
/**
 * HappyShadows — v2 shadow engine
 *
 * One physically-motivated model for every target (CSS, Figma, Framer,
 * SwiftUI): a contact shadow, three key-light layers with eased penumbra
 * falloff, and one ambient layer. Alpha weights sum to 1.0 so the combined
 * intensity matches the input opacity.
 *
 * MIRRORED in Sources/HappyShadows/Core/Constants.swift (ShadowConstants.v2Layers)
 * and asserted against Tests/HappyShadowsTests/Fixtures/v2-layers.json.
 * A tuning change here must update both.
 */

export interface RGBAColor {
  r: number; // 0–1
  g: number;
  b: number;
  a: number;
}

export interface ShadowLayer {
  offsetX: number;
  offsetY: number;
  blurRadius: number;
  color: RGBAColor;
}

export interface ShadowParams {
  color: RGBAColor;
  radius: number;
  opacity: number;
  x: number;
  y: number;
}

export interface GradientShadowParams {
  colors: RGBAColor[];
  radius: number;
  opacity: number;
  x: number;
  y: number;
}

export interface LayerSpec {
  offsetScaleX: number;
  offsetScaleY: number;
  blurScale: number;
  blurFloor: number;
  alphaWeight: number;
}

/** Contact / key 1–3 / ambient. Alpha weights sum to 1.0. */
export const V2_LAYER_SPECS: readonly LayerSpec[] = [
  { offsetScaleX: 0.12, offsetScaleY: 0.12, blurScale: 0.25, blurFloor: 1, alphaWeight: 0.35 }, // contact
  { offsetScaleX: 0.4,  offsetScaleY: 0.4,  blurScale: 0.6,  blurFloor: 0, alphaWeight: 0.25 }, // key 1
  { offsetScaleX: 0.7,  offsetScaleY: 0.7,  blurScale: 1.2,  blurFloor: 0, alphaWeight: 0.15 }, // key 2
  { offsetScaleX: 1.0,  offsetScaleY: 1.0,  blurScale: 2.0,  blurFloor: 0, alphaWeight: 0.1  }, // key 3
  { offsetScaleX: 0,    offsetScaleY: 0.15, blurScale: 3.0,  blurFloor: 0, alphaWeight: 0.15 }, // ambient
];

/** Compute the 5 v2 layers for a solid-color shadow. */
export function computeLayers(params: ShadowParams): ShadowLayer[] {
  const { color, radius, opacity, x, y } = params;
  return V2_LAYER_SPECS.map((s) => ({
    offsetX: x * s.offsetScaleX,
    offsetY: y * s.offsetScaleY,
    blurRadius: radius * s.blurScale + s.blurFloor,
    color: { ...color, a: opacity * s.alphaWeight },
  }));
}

/**
 * Gradient shadows: 5 layers per color stop, opacity divided by the
 * number of colors (box-shadow/Figma only support solid layer colors).
 */
export function computeGradientLayers(params: GradientShadowParams): ShadowLayer[] {
  const { colors, radius, opacity, x, y } = params;
  if (colors.length === 0) return [];
  const perColorOpacity = opacity / colors.length;
  return colors.flatMap((color) =>
    computeLayers({ color, radius, opacity: perColorOpacity, x, y })
  );
}

// v2 uses one model for every target; the box-shadow names remain as
// aliases because the web/Figma/Framer apps import them.
export const computeBoxShadowLayers = computeLayers;
export const computeBoxShadowGradientLayers = computeGradientLayers;
```

Note what is deleted: `ADDITIONAL_BLUR`, `DIVISORS`, `dynamicRadius`, `calculatedYOffset`, `computeFigmaLayers`, `computeFigmaGradientLayers`, and the old SwiftUI-flavored `computeLayers` behavior (Y-push). No app imports the deleted names.

- [ ] **Step 6: Update index.ts exports**

Replace the layer-export block in `packages/shadow-core/src/index.ts` with:

```ts
export type {
  RGBAColor,
  ShadowLayer,
  ShadowParams,
  GradientShadowParams,
  LayerSpec,
} from "./layers.js";

export {
  V2_LAYER_SPECS,
  computeLayers,
  computeGradientLayers,
  computeBoxShadowLayers,
  computeBoxShadowGradientLayers,
} from "./layers.js";

export {
  generateCSS,
  generateGradientCSS,
  generateTailwind,
  generateGradientTailwind,
  generateSwiftUI,
  generateGradientSwiftUI,
} from "./codegen.js";
```

`codegen.ts` already imports `computeBoxShadowLayers` / `computeBoxShadowGradientLayers` from `./layers.js` — those names still exist, so codegen compiles unchanged.

- [ ] **Step 7: Run tests to verify they pass**

Run: `pnpm -C packages/shadow-core test`
Expected: PASS (6 tests).

- [ ] **Step 8: Commit**

```bash
git add packages/shadow-core Tests/HappyShadowsTests/Fixtures/v2-layers.json
git commit -m "feat(core): v2 contact/key/ambient layer engine with shared fixture"
```

---

### Task 2: tintShadowColor in shadow-core

**Files:**
- Create: `packages/shadow-core/src/tint.ts`
- Create: `packages/shadow-core/test/tint.test.mjs`
- Modify: `packages/shadow-core/src/index.ts`

**Interfaces:**
- Consumes: `RGBAColor` from Task 1; the `tint` block of the shared fixture.
- Produces: `tintShadowColor(shadow: RGBAColor, surface: RGBAColor): RGBAColor` exported from the package root.

- [ ] **Step 1: Write the failing tests**

Create `packages/shadow-core/test/tint.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { tintShadowColor } from "../dist/index.js";

const fixture = JSON.parse(
  readFileSync(
    new URL("../../../Tests/HappyShadowsTests/Fixtures/v2-layers.json", import.meta.url),
    "utf8"
  )
);

const close = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-6, `${msg}: ${a} !== ${b}`);

test("matches the shared fixture", () => {
  const { surface, shadowAlpha, expected } = fixture.tint;
  const out = tintShadowColor({ r: 0, g: 0, b: 0, a: shadowAlpha }, { ...surface, a: 1 });
  close(out.r, expected.r, "r");
  close(out.g, expected.g, "g");
  close(out.b, expected.b, "b");
  close(out.a, expected.a, "a");
});

test("preserves the shadow's alpha, not the surface's", () => {
  const out = tintShadowColor({ r: 0, g: 0, b: 0, a: 0.42 }, { r: 1, g: 0, b: 0, a: 1 });
  close(out.a, 0.42, "alpha");
});

test("gray surface stays gray (saturation 0 is unchanged by the boost)", () => {
  const out = tintShadowColor({ r: 0, g: 0, b: 0, a: 0.3 }, { r: 0.5, g: 0.5, b: 0.5, a: 1 });
  close(out.r, out.g, "r == g");
  close(out.g, out.b, "g == b");
  close(out.r, 0.125, "lightness 0.5 × 0.25");
});

test("saturation boost clamps at 1", () => {
  // Pure red: s = 1 → 1.2 clamps to 1; l 0.5 → 0.125. Expect (0.25, 0, 0).
  const out = tintShadowColor({ r: 0, g: 0, b: 0, a: 0.3 }, { r: 1, g: 0, b: 0, a: 1 });
  close(out.r, 0.25, "r");
  close(out.g, 0, "g");
  close(out.b, 0, "b");
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm -C packages/shadow-core test`
Expected: FAIL — `tintShadowColor` is not exported.

- [ ] **Step 3: Implement tint.ts**

Create `packages/shadow-core/src/tint.ts`:

```ts
/**
 * Tinted shadow color — real shadows pick up the environment's hue.
 *
 * Keep the surface hue, boost saturation ×1.2 (clamped), drop lightness
 * to ×0.25, keep the shadow's alpha. Codegen bakes the result into the
 * output, so this costs nothing at runtime.
 *
 * MIRRORED in Sources/HappyShadows/Core/ShadowTint.swift — keep in sync.
 */

import type { RGBAColor } from "./layers.js";

export function tintShadowColor(shadow: RGBAColor, surface: RGBAColor): RGBAColor {
  const [h, s, l] = rgbToHsl(surface.r, surface.g, surface.b);
  const [r, g, b] = hslToRgb(h, Math.min(1, s * 1.2), l * 0.25);
  return { r, g, b, a: shadow.a };
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h / 6, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) return [l, l, l];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [hue2rgb(p, q, h + 1 / 3), hue2rgb(p, q, h), hue2rgb(p, q, h - 1 / 3)];
}

function hue2rgb(p: number, q: number, t: number): number {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}
```

Append to `packages/shadow-core/src/index.ts`:

```ts
export { tintShadowColor } from "./tint.js";
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm -C packages/shadow-core test`
Expected: PASS (all tests, including Task 1's).

- [ ] **Step 5: Commit**

```bash
git add packages/shadow-core
git commit -m "feat(core): tintShadowColor — derive shadow color from surface hue"
```

---

### Task 3: generateAnimatedCSS codegen

**Files:**
- Create: `packages/shadow-core/test/codegen.test.mjs`
- Modify: `packages/shadow-core/src/codegen.ts`
- Modify: `packages/shadow-core/src/index.ts`

**Interfaces:**
- Consumes: `computeLayers` (renamed usage inside codegen is optional; `computeBoxShadowLayers` alias also works), `ShadowParams`.
- Produces: `generateAnimatedCSS(params: ShadowParams): string` exported from the package root. Solid shadows only — the web UI hides this output in gradient mode.

- [ ] **Step 1: Write the failing tests**

Create `packages/shadow-core/test/codegen.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { generateAnimatedCSS, generateCSS } from "../dist/index.js";

const params = {
  color: { r: 0, g: 0, b: 0, a: 1 },
  radius: 12,
  opacity: 0.4,
  x: 4,
  y: 8,
};

test("emits the pseudo-element opacity-crossfade pattern", () => {
  const css = generateAnimatedCSS(params);
  assert.ok(css.includes(".happy-shadow {"), "base class");
  assert.ok(css.includes(".happy-shadow::after {"), "::after block");
  assert.ok(css.includes(".happy-shadow:hover::after {"), "hover trigger");
  assert.ok(css.includes("transition: opacity"), "opacity transition");
  assert.ok(css.includes("opacity: 0;"), "hidden at rest");
  assert.ok(!css.includes("transition: box-shadow"), "never animates box-shadow");
});

test("base shadow matches generateCSS layers; ::after holds the 2× elevated variant", () => {
  const css = generateAnimatedCSS(params);
  // Base: contact layer of radius 12 → blur 4px. Elevated: radius 24 → blur 7px.
  const plain = generateCSS(params);
  const firstLayer = plain.split("\n")[1].trim().replace(/,$/, "");
  assert.ok(css.includes(firstLayer), "base first layer present");
  const elevated = generateCSS({ ...params, radius: 24, x: 8, y: 16 });
  const elevatedFirst = elevated.split("\n")[1].trim().replace(/,$/, "");
  assert.ok(css.includes(elevatedFirst), "elevated first layer present");
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm -C packages/shadow-core test`
Expected: FAIL — `generateAnimatedCSS` is not exported.

- [ ] **Step 3: Implement generateAnimatedCSS**

Append to `packages/shadow-core/src/codegen.ts`:

```ts
/**
 * Animatable elevation: animating box-shadow re-runs the Gaussian blur
 * every frame. Instead, pre-render the elevated shadow (2× radius/offset)
 * on ::after and crossfade its opacity — the blur is computed once.
 */
export function generateAnimatedCSS(params: ShadowParams): string {
  const base = layersToBoxShadow(computeBoxShadowLayers(params));
  const elevated = layersToBoxShadow(
    computeBoxShadowLayers({ ...params, radius: params.radius * 2, x: params.x * 2, y: params.y * 2 })
  );
  return `/* Crossfades a pre-rendered elevated shadow instead of animating
   box-shadow, so the blur never re-renders during the transition. */
.happy-shadow {
  position: relative;
  box-shadow:
    ${base};
}
.happy-shadow::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  z-index: -1;
  pointer-events: none;
  box-shadow:
    ${elevated};
  opacity: 0;
  transition: opacity 200ms ease;
}
.happy-shadow:hover::after {
  opacity: 1;
}`;
}
```

Append to `packages/shadow-core/src/index.ts`'s codegen export block: `generateAnimatedCSS`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm -C packages/shadow-core test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/shadow-core
git commit -m "feat(core): generateAnimatedCSS — pseudo-element opacity crossfade"
```

---

### Task 4: Swift layer model mirror + parity test

**Files:**
- Create: `Sources/HappyShadows/Core/LayerModel.swift`
- Create: `Tests/HappyShadowsTests/LayerModelTests.swift`
- Modify: `Sources/HappyShadows/Core/Constants.swift`

**Interfaces:**
- Consumes: `Tests/HappyShadowsTests/Fixtures/v2-layers.json` from Task 1.
- Produces (internal, used by Task 5):
  - `ShadowConstants.v2Layers: [ShadowLayerSpec]`
  - `ResolvedShadowLayer { offsetX, offsetY, blurRadius: CGFloat; alpha: Double }`
  - `ShadowLayerModel.computeLayers(radius: CGFloat, opacity: Double, x: CGFloat, y: CGFloat) -> [ResolvedShadowLayer]`

- [ ] **Step 1: Write the failing test**

Create `Tests/HappyShadowsTests/LayerModelTests.swift`:

```swift
import XCTest
@testable import HappyShadows

final class LayerModelTests: XCTestCase {
    private struct Fixture: Decodable {
        struct Params: Decodable { let radius: Double; let opacity: Double; let x: Double; let y: Double }
        struct Layer: Decodable { let offsetX: Double; let offsetY: Double; let blurRadius: Double; let alpha: Double }
        let params: Params
        let layers: [Layer]
    }

    private func loadFixture() throws -> Fixture {
        let url = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .appendingPathComponent("Fixtures/v2-layers.json")
        return try JSONDecoder().decode(Fixture.self, from: Data(contentsOf: url))
    }

    func testAlphaWeightsSumToOne() {
        let sum = ShadowConstants.v2Layers.reduce(0.0) { $0 + $1.alphaWeight }
        XCTAssertEqual(sum, 1.0, accuracy: 1e-9)
    }

    func testMatchesSharedFixture() throws {
        let fixture = try loadFixture()
        let layers = ShadowLayerModel.computeLayers(
            radius: fixture.params.radius,
            opacity: fixture.params.opacity,
            x: fixture.params.x,
            y: fixture.params.y
        )
        XCTAssertEqual(layers.count, fixture.layers.count)
        for (got, want) in zip(layers, fixture.layers) {
            XCTAssertEqual(Double(got.offsetX), want.offsetX, accuracy: 1e-6)
            XCTAssertEqual(Double(got.offsetY), want.offsetY, accuracy: 1e-6)
            XCTAssertEqual(Double(got.blurRadius), want.blurRadius, accuracy: 1e-6)
            XCTAssertEqual(got.alpha, want.alpha, accuracy: 1e-6)
        }
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `swift test --filter LayerModelTests`
Expected: FAIL to compile — `ShadowLayerSpec`, `v2Layers`, `ShadowLayerModel` don't exist.

- [ ] **Step 3: Replace Constants.swift**

Replace the contents of `Sources/HappyShadows/Core/Constants.swift` with:

```swift
//
//  Constants.swift
//  HappyShadows
//

import Foundation

/// One layer of the v2 contact/key/ambient shadow model.
struct ShadowLayerSpec {
    let offsetScaleX: CGFloat
    let offsetScaleY: CGFloat
    let blurScale: CGFloat
    let blurFloor: CGFloat
    let alphaWeight: Double
}

/// Internal constants used by the shadow system.
///
/// MIRRORED from packages/shadow-core/src/layers.ts (V2_LAYER_SPECS) and
/// asserted against Tests/HappyShadowsTests/Fixtures/v2-layers.json.
/// A tuning change here must update both.
enum ShadowConstants {
    /// Contact / key 1–3 / ambient. Alpha weights sum to 1.0.
    static let v2Layers: [ShadowLayerSpec] = [
        .init(offsetScaleX: 0.12, offsetScaleY: 0.12, blurScale: 0.25, blurFloor: 1, alphaWeight: 0.35), // contact
        .init(offsetScaleX: 0.4,  offsetScaleY: 0.4,  blurScale: 0.6,  blurFloor: 0, alphaWeight: 0.25), // key 1
        .init(offsetScaleX: 0.7,  offsetScaleY: 0.7,  blurScale: 1.2,  blurFloor: 0, alphaWeight: 0.15), // key 2
        .init(offsetScaleX: 1.0,  offsetScaleY: 1.0,  blurScale: 2.0,  blurFloor: 0, alphaWeight: 0.1),  // key 3
        .init(offsetScaleX: 0,    offsetScaleY: 0.15, blurScale: 3.0,  blurFloor: 0, alphaWeight: 0.15), // ambient
    ]
}
```

Note: this deletes `ShadowConstants.additionalBlur`. `SoftShadow.swift` and `GradientShadow.swift` still reference it, so the package will not compile until Task 5. Tasks 4 and 5 therefore commit together at the end of Task 5 — OR do Step 4 of this task only after Task 5's rewrite. To keep the build green per-commit, implement Steps 3–4 of this task, then immediately proceed to Task 5 before committing. (The test run in Step 4 happens after Task 5's Step 2.)

- [ ] **Step 4: Create LayerModel.swift**

Create `Sources/HappyShadows/Core/LayerModel.swift`:

```swift
//
//  LayerModel.swift
//  HappyShadows
//

import Foundation

/// A fully-resolved shadow layer: what actually gets drawn.
struct ResolvedShadowLayer: Equatable {
    let offsetX: CGFloat
    let offsetY: CGFloat
    let blurRadius: CGFloat
    let alpha: Double
}

/// Resolves the v2 layer specs against concrete shadow parameters.
/// Mirrors computeLayers() in packages/shadow-core/src/layers.ts.
enum ShadowLayerModel {
    static func computeLayers(
        radius: CGFloat,
        opacity: Double,
        x: CGFloat,
        y: CGFloat
    ) -> [ResolvedShadowLayer] {
        ShadowConstants.v2Layers.map { spec in
            ResolvedShadowLayer(
                offsetX: x * spec.offsetScaleX,
                offsetY: y * spec.offsetScaleY,
                blurRadius: radius * spec.blurScale + spec.blurFloor,
                alpha: opacity * spec.alphaWeight
            )
        }
    }
}
```

Do not commit yet — continue directly into Task 5 (the package doesn't compile until SoftShadow/GradientShadow stop referencing `additionalBlur`).

---

### Task 5: SoftShadow + GradientShadow v2 rewrite with compositingGroup

**Files:**
- Modify: `Sources/HappyShadows/Core/SoftShadow.swift` (replace `body` and delete `dynamicRadius` + `InnerShadowLayer`)
- Modify: `Sources/HappyShadows/Core/GradientShadow.swift` (same treatment)

**Interfaces:**
- Consumes: `ShadowLayerModel.computeLayers(radius:opacity:x:y:)` and `ResolvedShadowLayer` from Task 4.
- Produces: unchanged public API — `SoftShadow(color:radius:opacity:xOffset:yOffset:)`, `GradientShadow(gradient:radius:opacity:xOffset:yOffset:)`.

- [ ] **Step 1: Rewrite SoftShadow.swift**

Keep the struct declaration, stored properties, doc comment, and `init` exactly as they are. Delete `dynamicRadius(_:)` and the whole `InnerShadowLayer` struct. Replace `body(content:)` with:

```swift
    public func body(content: Content) -> some View {
        let layers = ShadowLayerModel.computeLayers(
            radius: radius, opacity: opacity, x: xOffset, y: yOffset
        )
        // compositingGroup flattens the content to one texture first, so the
        // five blur passes run on a rasterized silhouette instead of
        // re-rendering the view hierarchy five times.
        return content
            .compositingGroup()
            .shadow(color: color.opacity(layers[0].alpha), radius: layers[0].blurRadius, x: layers[0].offsetX, y: layers[0].offsetY)
            .shadow(color: color.opacity(layers[1].alpha), radius: layers[1].blurRadius, x: layers[1].offsetX, y: layers[1].offsetY)
            .shadow(color: color.opacity(layers[2].alpha), radius: layers[2].blurRadius, x: layers[2].offsetX, y: layers[2].offsetY)
            .shadow(color: color.opacity(layers[3].alpha), radius: layers[3].blurRadius, x: layers[3].offsetX, y: layers[3].offsetY)
            .shadow(color: color.opacity(layers[4].alpha), radius: layers[4].blurRadius, x: layers[4].offsetX, y: layers[4].offsetY)
    }
```

- [ ] **Step 2: Rewrite GradientShadow.swift**

Keep the struct declaration, stored properties, doc comment, and `init`. Delete `dynamicRadius(_:)`. Replace `body(content:)` and `InnerShadowLayer` with:

```swift
    public func body(content: Content) -> some View {
        let layers = ShadowLayerModel.computeLayers(
            radius: radius, opacity: opacity, x: xOffset, y: yOffset
        )
        return content
            .compositingGroup()
            .modifier(GradientLayer(gradient: gradient, layer: layers[0]))
            .modifier(GradientLayer(gradient: gradient, layer: layers[1]))
            .modifier(GradientLayer(gradient: gradient, layer: layers[2]))
            .modifier(GradientLayer(gradient: gradient, layer: layers[3]))
            .modifier(GradientLayer(gradient: gradient, layer: layers[4]))
    }

    /// A single layer of the gradient shadow effect.
    private struct GradientLayer: ViewModifier {
        let gradient: G
        let layer: ResolvedShadowLayer

        func body(content: Content) -> some View {
            content
                .background {
                    Rectangle()
                        .fill(gradient)
                        .opacity(layer.alpha)
                        .mask {
                            content
                        }
                        .offset(x: layer.offsetX, y: layer.offsetY)
                        .blur(radius: layer.blurRadius)
                }
        }
    }
```

- [ ] **Step 3: Build and run the Swift tests (verifies Task 4's test too)**

Run: `swift build && swift test --filter LayerModelTests`
Expected: build succeeds; both `LayerModelTests` tests PASS.

- [ ] **Step 4: Verify no dangling references**

Run: `grep -rn "additionalBlur\|dynamicRadius\|InnerShadowLayer" Sources/ ShadowDesigner/`
Expected: no matches. If ShadowDesigner references any, update it with the same pattern.

- [ ] **Step 5: Commit (Tasks 4+5 together)**

```bash
git add Sources/HappyShadows Tests/HappyShadowsTests/LayerModelTests.swift
git commit -m "feat(swift): v2 layer engine + compositingGroup perf fix, parity-tested against shared fixture"
```

---

### Task 6: Swift tint twin

**Files:**
- Create: `Sources/HappyShadows/Core/ShadowTint.swift`
- Create: `Tests/HappyShadowsTests/ShadowTintTests.swift`

**Interfaces:**
- Consumes: the `tint` block of the shared fixture.
- Produces:
  - `HappyShadowTint.components(surfaceRed:green:blue:) -> (r: Double, g: Double, b: Double)` (internal, testable)
  - `public extension Color { static func happyShadowTint(surfaceRed: Double, green: Double, blue: Double) -> Color }`

- [ ] **Step 1: Write the failing test**

Create `Tests/HappyShadowsTests/ShadowTintTests.swift`:

```swift
import XCTest
@testable import HappyShadows

final class ShadowTintTests: XCTestCase {
    private struct TintFixture: Decodable {
        struct RGB: Decodable { let r: Double; let g: Double; let b: Double }
        struct Expected: Decodable { let r: Double; let g: Double; let b: Double; let a: Double }
        let surface: RGB
        let expected: Expected
    }

    func testMatchesSharedFixture() throws {
        let url = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .appendingPathComponent("Fixtures/v2-layers.json")
        struct Root: Decodable { let tint: TintFixture }
        let fixture = try JSONDecoder().decode(Root.self, from: Data(contentsOf: url)).tint
        let out = HappyShadowTint.components(
            surfaceRed: fixture.surface.r,
            green: fixture.surface.g,
            blue: fixture.surface.b
        )
        XCTAssertEqual(out.r, fixture.expected.r, accuracy: 1e-6)
        XCTAssertEqual(out.g, fixture.expected.g, accuracy: 1e-6)
        XCTAssertEqual(out.b, fixture.expected.b, accuracy: 1e-6)
    }

    func testGraySurfaceStaysGray() {
        let out = HappyShadowTint.components(surfaceRed: 0.5, green: 0.5, blue: 0.5)
        XCTAssertEqual(out.r, out.g, accuracy: 1e-9)
        XCTAssertEqual(out.g, out.b, accuracy: 1e-9)
        XCTAssertEqual(out.r, 0.125, accuracy: 1e-9)
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `swift test --filter ShadowTintTests`
Expected: FAIL to compile — `HappyShadowTint` doesn't exist.

- [ ] **Step 3: Implement ShadowTint.swift**

Create `Sources/HappyShadows/Core/ShadowTint.swift`:

```swift
//
//  ShadowTint.swift
//  HappyShadows
//

import SwiftUI

/// Tinted shadow color — real shadows pick up the environment's hue.
///
/// MIRROR of tintShadowColor() in packages/shadow-core/src/tint.ts:
/// keep the surface hue, boost saturation ×1.2 (clamped), drop lightness
/// to ×0.25. Keep in sync.
enum HappyShadowTint {
    static func components(
        surfaceRed r: Double, green g: Double, blue b: Double
    ) -> (r: Double, g: Double, b: Double) {
        let (h, s, l) = rgbToHsl(r, g, b)
        return hslToRgb(h, min(1, s * 1.2), l * 0.25)
    }

    private static func rgbToHsl(_ r: Double, _ g: Double, _ b: Double) -> (Double, Double, Double) {
        let maxC = max(r, g, b)
        let minC = min(r, g, b)
        let l = (maxC + minC) / 2
        if maxC == minC { return (0, 0, l) }
        let d = maxC - minC
        let s = l > 0.5 ? d / (2 - maxC - minC) : d / (maxC + minC)
        let h: Double
        if maxC == r { h = (g - b) / d + (g < b ? 6 : 0) }
        else if maxC == g { h = (b - r) / d + 2 }
        else { h = (r - g) / d + 4 }
        return (h / 6, s, l)
    }

    private static func hslToRgb(_ h: Double, _ s: Double, _ l: Double) -> (r: Double, g: Double, b: Double) {
        if s == 0 { return (l, l, l) }
        let q = l < 0.5 ? l * (1 + s) : l + s - l * s
        let p = 2 * l - q
        return (hue2rgb(p, q, h + 1 / 3), hue2rgb(p, q, h), hue2rgb(p, q, h - 1 / 3))
    }

    private static func hue2rgb(_ p: Double, _ q: Double, _ t: Double) -> Double {
        var t = t
        if t < 0 { t += 1 }
        if t > 1 { t -= 1 }
        if t < 1 / 6 { return p + (q - p) * 6 * t }
        if t < 1 / 2 { return q }
        if t < 2 / 3 { return p + (q - p) * (2 / 3 - t) * 6 }
        return p
    }
}

public extension Color {
    /// A realistic shadow color derived from the surface the shadow falls on:
    /// keeps the surface hue, boosts saturation, and darkens it, instead of
    /// using plain black at low opacity.
    ///
    /// ```swift
    /// view.happyShadow(color: .happyShadowTint(surfaceRed: 0.95, green: 0.93, blue: 0.9), radius: 12, opacity: 0.3)
    /// ```
    static func happyShadowTint(surfaceRed: Double, green: Double, blue: Double) -> Color {
        let c = HappyShadowTint.components(surfaceRed: surfaceRed, green: green, blue: blue)
        return Color(red: c.r, green: c.g, blue: c.b)
    }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `swift test --filter ShadowTintTests`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add Sources/HappyShadows/Core/ShadowTint.swift Tests/HappyShadowsTests/ShadowTintTests.swift
git commit -m "feat(swift): happyShadowTint — surface-derived shadow color"
```

---

### Task 7: Web app — tinted toggle + animatable CSS tab

**Files:**
- Modify: `packages/web/src/hooks/useShadowState.ts`
- Modify: `packages/web/src/components/Controls.tsx`
- Modify: `packages/web/src/components/CodePreview.tsx`
- Modify: `packages/web/src/App.tsx`

**Interfaces:**
- Consumes: `tintShadowColor`, `generateAnimatedCSS` from `@happy-shadows/core` (Tasks 2–3). Run `pnpm -C packages/shadow-core build` first so `dist/` is current.
- Produces: `useShadowState()` additionally returns `animatedCssCode: string | null` (null in gradient mode); `ShadowState` gains `isTinted: boolean` and `surfaceColor: string` (hex).

- [ ] **Step 1: Update useShadowState.ts**

Add to the imports from `@happy-shadows/core`: `tintShadowColor`, `generateAnimatedCSS`.

Add to the `ShadowState` interface (after `isDark`):

```ts
  // Tinted shadow: derive shadow color from the surface it falls on
  isTinted: boolean;
  surfaceColor: string; // hex
```

Add to the initial state object: `isTinted: false, surfaceColor: "#e8e4dc",`

Replace the `solidParams` declaration with:

```ts
  const solidColor = state.isTinted
    ? tintShadowColor(rgbaColors[0], hexToRgba(state.surfaceColor))
    : rgbaColors[0];

  const solidParams: ShadowParams = {
    color: solidColor,
    radius: shadowRadius,
    opacity: shadowOpacity,
    x: shadowX,
    y: shadowY,
  };
```

After the `swiftCode` declaration add:

```ts
  // Solid-only: gradient shadows have no single-color animatable form
  const animatedCssCode = state.isGradient ? null : generateAnimatedCSS(solidParams);
```

Add `animatedCssCode,` to the returned object.

(The live preview picks up the tint automatically — `previewBoxShadow` is derived from `solidParams`.)

- [ ] **Step 2: Update Controls.tsx**

After the color-swatch block (after the `{state.isGradient && (...)}` fragment, before `<div style={{ flex: 1 }} />`), add:

```tsx
      {/* Tinted shadow: derive color from surface (solid mode only) */}
      {!state.isGradient && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            onClick={() => setState((s) => ({ ...s, isTinted: !s.isTinted }))}
            style={{
              padding: "6px 14px",
              fontSize: 12,
              fontWeight: 600,
              border: "1px solid var(--border)",
              borderRadius: 8,
              cursor: "pointer",
              background: state.isTinted ? "var(--accent)" : "var(--surface)",
              color: state.isTinted ? "#fff" : "var(--text-dim)",
            }}
          >
            Tinted
          </button>
          {state.isTinted && (
            <label style={{ position: "relative", cursor: "pointer" }} title="Surface color">
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 8,
                  background: state.surfaceColor,
                  border: "2px solid rgba(255,255,255,0.2)",
                }}
              />
              <input
                type="color"
                value={state.surfaceColor}
                onChange={(e) => setState((s) => ({ ...s, surfaceColor: e.target.value }))}
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: 0,
                  width: "100%",
                  height: "100%",
                  cursor: "pointer",
                }}
              />
            </label>
          )}
        </div>
      )}
```

- [ ] **Step 3: Update CodePreview.tsx**

Replace the `Tab` type, `Props`, and `code` selection with:

```tsx
type Tab = "CSS" | "CSS (animatable)" | "Tailwind" | "SwiftUI";

interface Props {
  cssCode: string;
  animatedCssCode: string | null;
  tailwindCode: string;
  swiftCode: string;
}

export function CodePreview({ cssCode, animatedCssCode, tailwindCode, swiftCode }: Props) {
  const [tab, setTab] = useState<Tab>("CSS");
  const [copied, setCopied] = useState(false);

  const tabs: Tab[] = animatedCssCode
    ? ["CSS", "CSS (animatable)", "Tailwind", "SwiftUI"]
    : ["CSS", "Tailwind", "SwiftUI"];

  const code =
    tab === "CSS (animatable)" && animatedCssCode
      ? animatedCssCode
      : tab === "Tailwind"
        ? tailwindCode
        : tab === "SwiftUI"
          ? swiftCode
          : cssCode;
```

And change the tab-render line from `{(["CSS", "Tailwind", "SwiftUI"] as Tab[]).map((t) => (` to `{tabs.map((t) => (`. (If the user switches to gradient mode while on the animatable tab, `code` falls back to `cssCode` — acceptable.)

- [ ] **Step 4: Update App.tsx**

Add `animatedCssCode,` to the destructuring of `useShadowState()` and pass `animatedCssCode={animatedCssCode}` to `<CodePreview>`.

- [ ] **Step 5: Build to verify**

Run: `pnpm -C packages/shadow-core build && pnpm -C packages/web build`
Expected: both succeed with no TypeScript errors.

- [ ] **Step 6: Manual smoke check**

Run: `pnpm -C packages/web dev`, open the printed localhost URL. Verify: Tinted toggle appears in solid mode only; enabling it + picking a warm surface color visibly warms the preview shadow; the "CSS (animatable)" tab shows the `::after` pattern and disappears in gradient mode.

- [ ] **Step 7: Commit**

```bash
git add packages/web
git commit -m "feat(web): tinted shadow toggle + animatable CSS tab"
```

---

### Task 8: Snapshot regeneration, README, workspace build check

**Files:**
- Modify: `Tests/HappyShadowsTests/Exports/*` (regenerated images)
- Modify: `README.md`

**Interfaces:**
- Consumes: everything above.
- Produces: updated marketing/comparison images and docs.

- [ ] **Step 1: Regenerate snapshot exports**

Run from the repo root: `swift test --filter MarketingTests`
Expected: PASS; files under `Tests/HappyShadowsTests/Exports/` change (`git status` shows modified images). These become the new README cover/comparison images.

- [ ] **Step 2: Update README**

In `README.md`: the "Realistic shadow rendering with 5 layered shadows" bullet still holds; update the feature list — replace the "Dynamic shadow adaptation based on offset" bullet (that mechanism was removed) with two bullets:

```markdown
- Physically-motivated layer model: contact, key (with penumbra falloff), and ambient shadows
- Surface-tinted shadow colors via `Color.happyShadowTint(surfaceRed:green:blue:)`
```

- [ ] **Step 3: Full verification sweep**

Run:
```bash
pnpm -C packages/shadow-core test
pnpm -C packages/web build
pnpm -C packages/figma-plugin build
pnpm -C packages/framer-plugin build
swift test
```
Expected: all pass. (Plugin builds confirm the deleted exports weren't referenced.)

- [ ] **Step 4: Commit**

```bash
git add Tests/HappyShadowsTests/Exports README.md
git commit -m "chore: regenerate snapshots and update README for v2 engine"
```

- [ ] **Step 5: HUMAN CHECKPOINT — visual tuning pass**

Stop and ask the user to eyeball the result: `pnpm -C packages/web dev` for CSS and `swift run ShadowDesigner` for SwiftUI, comparing the same parameters. If SwiftUI reads sharper or softer than CSS (the two renderers interpret blur radius differently), or any constant feels off, adjust the values — in `layers.ts`, `Constants.swift`, the fixture JSON, and the spec table together — then re-run `pnpm -C packages/shadow-core test && swift test` and re-do Task 8 Steps 1–4.

---

## Out of Scope (follow-up plan)

Tinted-toggle UI parity in the Figma plugin, Framer plugin, and ShadowDesigner mac app. The engine change itself reaches all of them automatically through shadow-core / the Swift package; only the surface-color picker UI is deferred. Also out of scope per the spec: light-source elevation parameter, multiple light sources, inset shadows, runtime backdrop sampling.
