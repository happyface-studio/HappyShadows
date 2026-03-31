import { useState, useMemo } from "react";
import type { ShadowParams, GradientShadowParams, RGBAColor } from "@happy-shadows/core";
import {
  computeBoxShadowLayers,
  computeBoxShadowGradientLayers,
  generateCSS,
  generateGradientCSS,
  generateTailwind,
  generateGradientTailwind,
  generateSwiftUI,
  generateGradientSwiftUI,
} from "@happy-shadows/core";

export interface ShadowState {
  // Light source position (offset from center)
  lightX: number;
  lightY: number;
  // Knob angle (radians) → controls radius
  knobAngle: number;
  // Knob distance from sun → controls opacity
  knobDistance: number;
  // Colors
  colors: string[]; // hex strings
  isGradient: boolean;
  isDark: boolean;
}

const KNOB_MIN = 22;
const KNOB_MAX = 60;

function hexToRgba(hex: string): RGBAColor {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16) / 255,
    g: parseInt(h.slice(2, 4), 16) / 255,
    b: parseInt(h.slice(4, 6), 16) / 255,
    a: 1,
  };
}

function normalizeAngle(angle: number): number {
  let a = angle + Math.PI / 2;
  if (a < 0) a += 2 * Math.PI;
  return a / (2 * Math.PI);
}

export function useShadowState() {
  const [state, setState] = useState<ShadowState>({
    lightX: 30,
    lightY: -100,
    knobAngle: -Math.PI / 2,
    knobDistance: 35,
    colors: ["#000000", "#8B5CF6"],
    isGradient: false,
    isDark: true,
  });

  const shadowX = -state.lightX * 0.09;
  const shadowY = -state.lightY * 0.09;
  const shadowRadius = 2 + normalizeAngle(state.knobAngle) * 30;
  const shadowOpacity =
    0.05 + ((state.knobDistance - KNOB_MIN) / (KNOB_MAX - KNOB_MIN)) * 0.35;

  const rgbaColors = useMemo(
    () => state.colors.map(hexToRgba),
    [state.colors]
  );

  const solidParams: ShadowParams = {
    color: rgbaColors[0],
    radius: shadowRadius,
    opacity: shadowOpacity,
    x: shadowX,
    y: shadowY,
  };

  const gradientParams: GradientShadowParams = {
    colors: rgbaColors,
    radius: shadowRadius,
    opacity: shadowOpacity,
    x: shadowX,
    y: shadowY,
  };

  const layers = state.isGradient
    ? computeBoxShadowGradientLayers(gradientParams)
    : computeBoxShadowLayers(solidParams);

  const cssCode = state.isGradient
    ? generateGradientCSS(gradientParams)
    : generateCSS(solidParams);

  const tailwindCode = state.isGradient
    ? generateGradientTailwind(gradientParams)
    : generateTailwind(solidParams);

  const swiftCode = state.isGradient
    ? generateGradientSwiftUI(gradientParams)
    : generateSwiftUI(solidParams);

  // Convert layers to CSS box-shadow string for the live preview
  const previewBoxShadow = layers
    .map((l) => {
      const r = Math.round(l.color.r * 255);
      const g = Math.round(l.color.g * 255);
      const b = Math.round(l.color.b * 255);
      return `${l.offsetX.toFixed(1)}px ${l.offsetY.toFixed(1)}px ${l.blurRadius.toFixed(1)}px rgba(${r},${g},${b},${l.color.a.toFixed(2)})`;
    })
    .join(", ");

  return {
    state,
    setState,
    shadowX,
    shadowY,
    shadowRadius,
    shadowOpacity,
    previewBoxShadow,
    cssCode,
    tailwindCode,
    swiftCode,
    knobMin: KNOB_MIN,
    knobMax: KNOB_MAX,
  };
}
