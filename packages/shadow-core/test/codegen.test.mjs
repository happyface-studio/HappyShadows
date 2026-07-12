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
  const layerLines = (output) =>
    output
      .split("\n")
      .slice(1) // drop the "box-shadow:" line
      .map((line) => line.trim().replace(/[,;]$/, ""));

  for (const [variant, p] of [
    ["base", params],
    ["elevated", { ...params, radius: 24, x: 8, y: 16 }],
  ]) {
    const layers = layerLines(generateCSS(p));
    assert.equal(layers.length, 5, `${variant} has 5 layers`);
    layers.forEach((layer, i) =>
      assert.ok(css.includes(layer), `${variant} layer ${i} present`)
    );
  }
});
