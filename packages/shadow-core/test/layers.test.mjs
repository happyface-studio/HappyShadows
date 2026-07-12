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
