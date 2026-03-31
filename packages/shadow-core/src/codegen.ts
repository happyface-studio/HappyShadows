/**
 * Code generators — produce CSS, Tailwind, and SwiftUI snippets
 * from the computed shadow layers or raw parameters.
 */

import type { ShadowLayer, ShadowParams, GradientShadowParams, RGBAColor } from "./layers.js";
import { computeBoxShadowLayers, computeBoxShadowGradientLayers } from "./layers.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rgba(c: RGBAColor): string {
  const r = Math.round(c.r * 255);
  const g = Math.round(c.g * 255);
  const b = Math.round(c.b * 255);
  return `rgba(${r}, ${g}, ${b}, ${fmtN(c.a)})`;
}

function fmtN(v: number): string {
  return parseFloat(v.toFixed(2)).toString();
}

function fmtPx(v: number): string {
  const rounded = Math.round(v * 10) / 10;
  if (rounded === 0) return "0";
  return `${rounded}px`;
}

function swiftColor(c: RGBAColor): string {
  if (c.r < 0.01 && c.g < 0.01 && c.b < 0.01) return ".black";
  if (c.r > 0.99 && c.g > 0.99 && c.b > 0.99) return ".white";
  return `Color(red: ${fmtN(c.r)}, green: ${fmtN(c.g)}, blue: ${fmtN(c.b)})`;
}

function fmtSw(v: number): string {
  const r = Math.round(v * 10) / 10;
  if (r === 0) return "0";
  return r === Math.round(r) ? r.toFixed(0) : r.toFixed(1);
}

// ---------------------------------------------------------------------------
// CSS
// ---------------------------------------------------------------------------

function layersToBoxShadow(layers: ShadowLayer[]): string {
  return layers
    .map((l) => `${fmtPx(l.offsetX)} ${fmtPx(l.offsetY)} ${fmtPx(l.blurRadius)} ${rgba(l.color)}`)
    .join(",\n    ");
}

export function generateCSS(params: ShadowParams): string {
  const layers = computeBoxShadowLayers(params);
  return `box-shadow:\n    ${layersToBoxShadow(layers)};`;
}

export function generateGradientCSS(params: GradientShadowParams): string {
  const layers = computeBoxShadowGradientLayers(params);
  return `/* Gradient shadow (${params.colors.length} colors, ${layers.length} layers) */\nbox-shadow:\n    ${layersToBoxShadow(layers)};`;
}

// ---------------------------------------------------------------------------
// Tailwind
// ---------------------------------------------------------------------------

function layersToTailwindValue(layers: ShadowLayer[]): string {
  return layers
    .map((l) => `${fmtPx(l.offsetX)}_${fmtPx(l.offsetY)}_${fmtPx(l.blurRadius)}_${rgba(l.color).replace(/ /g, "")}`)
    .join(",");
}

export function generateTailwind(params: ShadowParams): string {
  const layers = computeBoxShadowLayers(params);
  const inline = `shadow-[${layersToTailwindValue(layers)}]`;

  const config = `// tailwind.config — theme.extend.boxShadow\nhappyShadow: '${layers
    .map((l) => `${fmtPx(l.offsetX)} ${fmtPx(l.offsetY)} ${fmtPx(l.blurRadius)} ${rgba(l.color)}`)
    .join(", ")}'`;

  return `/* Arbitrary value class */\n${inline}\n\n${config}`;
}

export function generateGradientTailwind(params: GradientShadowParams): string {
  const layers = computeBoxShadowGradientLayers(params);
  return `/* Gradient — arbitrary value */\nshadow-[${layersToTailwindValue(layers)}]`;
}

// ---------------------------------------------------------------------------
// SwiftUI
// ---------------------------------------------------------------------------

export function generateSwiftUI(params: ShadowParams): string {
  const { color, radius, opacity, x, y } = params;
  return `.happyShadow(
    color: ${swiftColor(color)},
    radius: ${fmtSw(radius)},
    opacity: ${fmtN(opacity)},
    x: ${fmtSw(x)},
    y: ${fmtSw(y)}
)`;
}

export function generateGradientSwiftUI(params: GradientShadowParams): string {
  const { colors, radius, opacity, x, y } = params;
  const colorList = colors.map(swiftColor).join(", ");
  return `.happyGradientShadow(
    gradient: LinearGradient(
        colors: [${colorList}],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    ),
    opacity: ${fmtN(opacity)},
    radius: ${fmtSw(radius)},
    x: ${fmtSw(x)},
    y: ${fmtSw(y)}
)`;
}
