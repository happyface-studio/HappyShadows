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
  assert.ok(css.includes("isolation: isolate;"), "creates its own stacking context");
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
