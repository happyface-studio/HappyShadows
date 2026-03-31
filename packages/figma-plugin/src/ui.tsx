import { StrictMode, useState, useEffect, useRef, useCallback } from "react";
import { createRoot } from "react-dom/client";
import {
  computeBoxShadowLayers,
  computeBoxShadowGradientLayers,
  computeFigmaLayers,
  computeFigmaGradientLayers,
  generateCSS,
  generateGradientCSS,
  generateTailwind,
  generateGradientTailwind,
  generateSwiftUI,
  generateGradientSwiftUI,
} from "@happy-shadows/core";
import type { RGBAColor, ShadowParams, GradientShadowParams, ShadowLayer } from "@happy-shadows/core";
import type { UIMessage, ApplyMessage } from "./messages";

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

interface State {
  lightX: number;
  lightY: number;
  knobAngle: number;
  knobDistance: number;
  colors: string[];
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

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

type Tab = "CSS" | "Tailwind" | "SwiftUI";

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

function App() {
  const [state, setState] = useState<State>({
    lightX: 30,
    lightY: -100,
    knobAngle: -Math.PI / 2,
    knobDistance: 35,
    colors: ["#000000", "#8B5CF6"],
    isGradient: false,
    isDark: true,
  });
  const [selectionCount, setSelectionCount] = useState(0);
  const [tab, setTab] = useState<Tab>("CSS");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const msg = e.data.pluginMessage as UIMessage | undefined;
      if (msg?.type === "selection") setSelectionCount(msg.count);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // Derived
  const shadowX = -state.lightX * 0.09;
  const shadowY = -state.lightY * 0.09;
  const shadowRadius = 2 + normalizeAngle(state.knobAngle) * 30;
  const shadowOpacity =
    0.05 + ((state.knobDistance - KNOB_MIN) / (KNOB_MAX - KNOB_MIN)) * 0.35;
  const brightness = Math.round((shadowOpacity / 0.4) * 100);

  const rgbaColors = state.colors.map(hexToRgba);
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

  // CSS box-shadow layers for the preview
  const previewLayers: ShadowLayer[] = state.isGradient
    ? computeBoxShadowGradientLayers(gradientParams)
    : computeBoxShadowLayers(solidParams);

  // 1:1 — same layers for Figma as the CSS preview
  const figmaLayers = previewLayers;

  const previewBoxShadow = previewLayers
    .map((l) => {
      const r = Math.round(l.color.r * 255);
      const g = Math.round(l.color.g * 255);
      const b = Math.round(l.color.b * 255);
      return `${l.offsetX.toFixed(1)}px ${l.offsetY.toFixed(1)}px ${l.blurRadius.toFixed(1)}px rgba(${r},${g},${b},${l.color.a.toFixed(2)})`;
    })
    .join(", ");

  const cssCode = state.isGradient ? generateGradientCSS(gradientParams) : generateCSS(solidParams);
  const tailwindCode = state.isGradient ? generateGradientTailwind(gradientParams) : generateTailwind(solidParams);
  const swiftCode = state.isGradient ? generateGradientSwiftUI(gradientParams) : generateSwiftUI(solidParams);
  const code = tab === "CSS" ? cssCode : tab === "Tailwind" ? tailwindCode : swiftCode;

  // Canvas interaction
  const CANVAS_H = 340;
  const centerX = 210;
  const centerY = CANVAS_H * 0.58;
  const lightPos = { x: centerX + state.lightX, y: centerY + state.lightY };
  const knobPos = {
    x: lightPos.x + Math.cos(state.knobAngle) * state.knobDistance,
    y: lightPos.y + Math.sin(state.knobAngle) * state.knobDistance,
  };

  const dragRef = useRef<"light" | "knob" | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const onPointerDown = useCallback((e: React.PointerEvent, t: "light" | "knob") => {
    e.stopPropagation();
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = t;
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    if (dragRef.current === "light") {
      const x = Math.min(Math.max(e.clientX - rect.left, 20), rect.width - 20);
      const y = Math.min(Math.max(e.clientY - rect.top, 20), CANVAS_H - 20);
      setState((s) => ({ ...s, lightX: x - centerX, lightY: y - centerY }));
    } else {
      setState((s) => {
        const lx = centerX + s.lightX;
        const ly = centerY + s.lightY;
        const dx = e.clientX - rect.left - lx;
        const dy = e.clientY - rect.top - ly;
        return {
          ...s,
          knobAngle: Math.atan2(dy, dx),
          knobDistance: Math.min(Math.max(Math.sqrt(dx * dx + dy * dy), KNOB_MIN), KNOB_MAX),
        };
      });
    }
  }, []);

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const apply = () => {
    const msg: ApplyMessage = { type: "apply", layers: figmaLayers };
    parent.postMessage({ pluginMessage: msg }, "*");
  };

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const bg = state.isDark ? "#262626" : "#ededed";
  const cardBg = state.isDark ? "#383838" : "#fff";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, minHeight: "calc(100vh - 24px)" }}>
      {/* Canvas */}
      <div
        ref={canvasRef}
        style={{
          position: "relative",
          height: CANVAS_H,
          borderRadius: 10,
          background: bg,
          overflow: "hidden",
          cursor: "crosshair",
          touchAction: "none",
        }}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onPointerDown={(e) => onPointerDown(e, "light")}
      >
        <div
          style={{
            position: "absolute",
            left: centerX - 70,
            top: centerY - 85,
            width: 140,
            height: 170,
            borderRadius: 14,
            background: cardBg,
            boxShadow: previewBoxShadow,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: lightPos.x - 10,
            top: lightPos.y - 10,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "#fff",
            boxShadow: "0 0 10px 3px rgba(255,255,255,0.5), 0 0 20px 6px rgba(255,200,50,0.2)",
            border: "1px solid rgba(150,150,150,0.35)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: lightPos.x - state.knobDistance,
            top: lightPos.y - state.knobDistance,
            width: state.knobDistance * 2,
            height: state.knobDistance * 2,
            borderRadius: "50%",
            border: "1px dashed rgba(74,144,255,0.25)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: knobPos.x - 8,
            top: knobPos.y - 8,
            width: 16,
            height: 16,
            borderRadius: "50%",
            border: "1.5px solid rgba(74,144,255,0.7)",
            cursor: "grab",
            zIndex: 10,
          }}
          onPointerDown={(e) => onPointerDown(e, "knob")}
        />
        <div
          style={{
            position: "absolute",
            left: knobPos.x,
            top: knobPos.y + (knobPos.y > 50 ? -26 : 22),
            transform: "translateX(-50%)",
            background: "#4a90ff",
            color: "#fff",
            fontSize: 9,
            fontWeight: 600,
            padding: "2px 8px",
            borderRadius: 16,
            whiteSpace: "nowrap",
            pointerEvents: "none",
            textAlign: "center",
            lineHeight: "14px",
          }}
        >
          R {shadowRadius.toFixed(1)} &middot; {brightness}%
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", border: "1px solid var(--border)" }}>
          {(["Solid", "Gradient"] as const).map((label) => {
            const active = label === "Solid" ? !state.isGradient : state.isGradient;
            return (
              <button
                key={label}
                onClick={() => setState((s) => ({ ...s, isGradient: label === "Gradient" }))}
                style={{
                  padding: "4px 10px",
                  fontSize: 11,
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  background: active ? "#4a90ff" : "var(--surface)",
                  color: active ? "#fff" : "var(--text-dim)",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {(state.isGradient ? state.colors : [state.colors[0]]).map((c, i) => (
          <label key={i} style={{ position: "relative", cursor: "pointer" }}>
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: c,
                border: "2px solid rgba(255,255,255,0.2)",
              }}
            />
            <input
              type="color"
              value={c}
              onChange={(e) =>
                setState((s) => {
                  const colors = [...s.colors];
                  colors[i] = e.target.value;
                  return { ...s, colors };
                })
              }
              style={{ position: "absolute", inset: 0, opacity: 0, width: "100%", height: "100%", cursor: "pointer" }}
            />
          </label>
        ))}

        {state.isGradient && (
          <>
            <button
              onClick={() => setState((s) => ({ ...s, colors: [...s.colors, "#3B82F6"] }))}
              style={circleBtn}
            >
              +
            </button>
            {state.colors.length > 2 && (
              <button
                onClick={() => setState((s) => ({ ...s, colors: s.colors.slice(0, -1) }))}
                style={circleBtn}
              >
                −
              </button>
            )}
          </>
        )}

        <div style={{ flex: 1 }} />

        <div style={{ display: "flex", gap: 2, padding: 2, borderRadius: 12, background: "var(--surface-2)" }}>
          {[false, true].map((dark) => (
            <div
              key={String(dark)}
              onClick={() => setState((s) => ({ ...s, isDark: dark }))}
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: dark ? "#000" : "#fff",
                border: "1px solid rgba(128,128,128,0.3)",
                opacity: state.isDark === dark ? 1 : 0.35,
                cursor: "pointer",
              }}
            />
          ))}
        </div>
      </div>

      {/* Code tabs */}
      <div style={{ display: "flex", gap: 2 }}>
        {(["CSS", "Tailwind", "SwiftUI"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "4px 10px",
              fontSize: 10,
              fontWeight: 600,
              border: "none",
              borderRadius: 5,
              cursor: "pointer",
              background: tab === t ? "#4a90ff" : "var(--surface-2)",
              color: tab === t ? "#fff" : "var(--text-dim)",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <pre
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: 10,
          fontSize: 10,
          lineHeight: 1.5,
          overflowX: "auto",
          fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
          color: "var(--text)",
          whiteSpace: "pre-wrap",
          maxHeight: 120,
          cursor: "pointer",
        }}
        onClick={copy}
      >
        {code}
      </pre>

      {/* Spacer + Actions */}
      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={apply} style={actionBtn}>
          Apply to Selection{selectionCount > 0 ? ` (${selectionCount})` : ""}
        </button>
        <button onClick={copy} style={{ ...actionBtn, background: "var(--surface-2)", color: "var(--text)" }}>
          {copied ? "Copied!" : "Copy Code"}
        </button>
      </div>
    </div>
  );
}

const circleBtn: React.CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: "50%",
  border: "1.5px dashed rgba(128,128,128,0.4)",
  background: "transparent",
  color: "var(--text-dim)",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
};

const actionBtn: React.CSSProperties = {
  flex: 1,
  padding: "8px 0",
  fontSize: 12,
  fontWeight: 600,
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  background: "#4a90ff",
  color: "#fff",
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
