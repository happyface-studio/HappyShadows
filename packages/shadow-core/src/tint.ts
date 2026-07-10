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
