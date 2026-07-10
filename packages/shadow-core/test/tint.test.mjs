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

test("matches every tint case in the shared fixture", () => {
  for (const { name, surface, shadowAlpha, expected } of fixture.tints) {
    const out = tintShadowColor({ r: 0, g: 0, b: 0, a: shadowAlpha }, { ...surface, a: 1 });
    close(out.r, expected.r, `${name} r`);
    close(out.g, expected.g, `${name} g`);
    close(out.b, expected.b, `${name} b`);
    close(out.a, expected.a, `${name} a`);
  }
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
