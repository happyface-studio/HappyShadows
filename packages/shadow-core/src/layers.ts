/**
 * HappyShadows — 5-layer shadow engine
 *
 * Exact port of SoftShadow.swift and GradientShadow.swift.
 * Each shadow is split into 5 layers at 1/16, 1/8, 1/4, 1/2, and 1x
 * of the base values, with a dynamic radius multiplier and additional blur.
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

/** Matches ShadowConstants.additionalBlur in Swift */
const ADDITIONAL_BLUR = 2;

/** The 5 divisors that create the layered effect */
const DIVISORS = [16, 8, 4, 2, 1] as const;

/**
 * Matches `dynamicRadius(_:)` in SoftShadow.swift / GradientShadow.swift.
 * Increases the blur when the shadow is offset far from center.
 */
function dynamicRadius(baseRadius: number, xOffset: number, yOffset: number): number {
  const offsetMagnitude = Math.sqrt(xOffset ** 2 + yOffset ** 2);
  const multiplier = Math.max(1.0, 1.0 + (offsetMagnitude / 32) * 0.5);
  return baseRadius * multiplier;
}

/**
 * Matches `calculatedYOffset` in SoftShadow.InnerShadowLayer.
 * Pushes the shadow further in the offset direction by the blur radius.
 */
function calculatedYOffset(layerY: number, layerRadius: number): number {
  return layerY + ((layerY >= 0 ? 1 : -1) * layerRadius) + ADDITIONAL_BLUR;
}

/**
 * Compute the 5 shadow layers for a solid-color shadow.
 * Output matches SoftShadow.swift exactly.
 */
export function computeLayers(params: ShadowParams): ShadowLayer[] {
  const { color, radius, opacity, x, y } = params;

  return DIVISORS.map((d) => {
    const r = dynamicRadius(radius / d, x, y);
    const layerY = y / d;
    const finalBlur = r + ADDITIONAL_BLUR;
    const finalY = calculatedYOffset(layerY, r);

    return {
      offsetX: x / d,
      offsetY: finalY,
      blurRadius: finalBlur,
      color: { ...color, a: opacity },
    };
  });
}

/**
 * Compute shadow layers for a gradient shadow.
 *
 * Since CSS box-shadow and Figma drop-shadows only support solid colors,
 * we interleave 5 layers per color stop. For a 2-color gradient this
 * produces 10 drop-shadow layers, which approximates the visual effect.
 */
export function computeGradientLayers(params: GradientShadowParams): ShadowLayer[] {
  const { colors, radius, opacity, x, y } = params;
  if (colors.length === 0) return [];

  // Each color gets 5 layers, opacity divided by number of colors
  const perColorOpacity = opacity / colors.length;

  return colors.flatMap((color) =>
    computeLayers({ color, radius, opacity: perColorOpacity, x, y })
  );
}

// ---------------------------------------------------------------------------
// Box-shadow / Figma variants
// ---------------------------------------------------------------------------
// SwiftUI's .shadow() modifier pushes each layer's Y offset by the blur
// radius (calculatedYOffset). CSS box-shadow and Figma drop-shadows don't
// need that — they use plain offsets with larger blur radii instead.

/**
 * Compute 5 layers tuned for CSS box-shadow and Figma drop-shadow.
 * Same layered approach but without the SwiftUI Y-offset push,
 * and with larger blur radii for a softer result.
 */
export function computeBoxShadowLayers(params: ShadowParams): ShadowLayer[] {
  const { color, radius, opacity, x, y } = params;

  return DIVISORS.map((d) => {
    const r = dynamicRadius(radius / d, x, y);
    return {
      offsetX: x / d,
      offsetY: y / d,
      blurRadius: r + ADDITIONAL_BLUR,
      color: { ...color, a: opacity },
    };
  });
}

export function computeBoxShadowGradientLayers(params: GradientShadowParams): ShadowLayer[] {
  const { colors, radius, opacity, x, y } = params;
  if (colors.length === 0) return [];
  const perColorOpacity = opacity / colors.length;
  return colors.flatMap((color) =>
    computeBoxShadowLayers({ color, radius, opacity: perColorOpacity, x, y })
  );
}

// ---------------------------------------------------------------------------
// Figma-specific variants
// ---------------------------------------------------------------------------
// Figma's DROP_SHADOW renders blur differently from CSS box-shadow.
// Instead of using the same formula with a multiplier hack, we define
// 5 purpose-built layers tuned for Figma's Gaussian blur rendering.

/**
 * Compute 3 layers for Figma's DROP_SHADOW effect.
 *
 * Figma renders each DROP_SHADOW independently (unlike CSS box-shadow
 * which composites them seamlessly). Using 5 similar-blur layers creates
 * visible displaced copies. Instead, use 3 distinct layers:
 *   1. Contact — tight offset, moderate blur, strongest opacity
 *   2. Key — medium offset, medium blur, directional
 *   3. Ambient — full offset, large blur, subtle
 *
 * Opacity weights sum to 1.0 so the combined intensity matches the input.
 */
export function computeFigmaLayers(params: ShadowParams): ShadowLayer[] {
  const { color, radius, opacity, x, y } = params;

  return [
    {
      offsetX: x * 0.15,
      offsetY: y * 0.15,
      blurRadius: radius * 0.4 + 2,
      color: { ...color, a: opacity * 0.45 },
    },
    {
      offsetX: x * 0.5,
      offsetY: y * 0.5,
      blurRadius: radius * 1.2 + 3,
      color: { ...color, a: opacity * 0.3 },
    },
    {
      offsetX: x,
      offsetY: y,
      blurRadius: radius * 2.5 + 4,
      color: { ...color, a: opacity * 0.25 },
    },
  ];
}

export function computeFigmaGradientLayers(params: GradientShadowParams): ShadowLayer[] {
  const { colors, radius, opacity, x, y } = params;
  if (colors.length === 0) return [];
  const perColorOpacity = opacity / colors.length;
  return colors.flatMap((color) =>
    computeFigmaLayers({ color, radius, opacity: perColorOpacity, x, y })
  );
}
