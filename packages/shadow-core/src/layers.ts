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
