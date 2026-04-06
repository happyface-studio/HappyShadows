import { framer } from "framer-plugin";
import { useState, useEffect, useRef, useCallback } from "react";
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
import type {
  RGBAColor,
  ShadowParams,
  GradientShadowParams,
  ShadowLayer,
} from "@happy-shadows/core";

void framer.showUI({
  position: "top right",
  width: 420,
  height: 620,
  minWidth: 360,
  minHeight: 500,
  resizable: true,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function layersToBoxShadowCSS(layers: ShadowLayer[]): string {
  return layers
    .map((l) => {
      const r = Math.round(l.color.r * 255);
      const g = Math.round(l.color.g * 255);
      const b = Math.round(l.color.b * 255);
      return `${l.offsetX.toFixed(1)}px ${l.offsetY.toFixed(1)}px ${l.blurRadius.toFixed(1)}px rgba(${r},${g},${b},${l.color.a.toFixed(2)})`;
    })
    .join(", ");
}

type Tab = "CSS" | "Tailwind" | "SwiftUI";

const SWIFT_PACKAGE_NOTE = `// Add to your Swift Package dependencies:
// .package(url: "https://github.com/happyface-studion/HappyShadows.git", from: "0.1")
// import HappyShadows

`;

// ---------------------------------------------------------------------------
// Override code generator
// ---------------------------------------------------------------------------

function generateOverrideCode(boxShadow: string): string {
  return `import type { ComponentType } from "react"
import { forwardRef } from "react"

export function withHappyShadow(Component: ComponentType<any>): ComponentType {
    return forwardRef((props: any, ref) => {
        return (
            <Component
                ref={ref}
                {...props}
                style={{
                    ...props.style,
                    boxShadow: "${boxShadow.replace(/"/g, '\\"')}",
                }}
            />
        )
    })
}
`;
}

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

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export function App() {
  const [state, setState] = useState<State>({
    lightX: 30,
    lightY: -100,
    knobAngle: -0.733,
    knobDistance: 26,
    colors: ["#000000", "#8B5CF6"],
    isGradient: false,
    isDark: false,
  });
  const [selectionCount, setSelectionCount] = useState(0);
  const [tab, setTab] = useState<Tab>("CSS");
  const [copied, setCopied] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const [dragging, setDragging] = useState(false);

  // Subscribe to Framer selection
  useEffect(() => {
    return framer.subscribeToSelection((selection) => {
      setSelectionCount(selection.length);
    });
  }, []);

  // Derived shadow values
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

  const previewLayers: ShadowLayer[] = state.isGradient
    ? computeBoxShadowGradientLayers(gradientParams)
    : computeBoxShadowLayers(solidParams);

  const previewBoxShadow = layersToBoxShadowCSS(previewLayers);

  const cssCode = state.isGradient
    ? generateGradientCSS(gradientParams)
    : generateCSS(solidParams);
  const tailwindCode = state.isGradient
    ? generateGradientTailwind(gradientParams)
    : generateTailwind(solidParams);
  const swiftCode = state.isGradient
    ? generateGradientSwiftUI(gradientParams)
    : generateSwiftUI(solidParams);
  const displayCode =
    tab === "SwiftUI"
      ? SWIFT_PACKAGE_NOTE + swiftCode
      : tab === "CSS"
        ? cssCode
        : tailwindCode;
  const copyableCode =
    tab === "CSS" ? cssCode : tab === "Tailwind" ? tailwindCode : swiftCode;

  // Canvas dimensions
  const CANVAS_H = 340;
  const centerX = 210;
  const centerY = CANVAS_H * 0.5;
  const lightPos = { x: centerX + state.lightX, y: centerY + state.lightY };
  const knobPos = {
    x: lightPos.x + Math.cos(state.knobAngle) * state.knobDistance,
    y: lightPos.y + Math.sin(state.knobAngle) * state.knobDistance,
  };

  const dragRef = useRef<"light" | "knob" | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const onPointerDown = useCallback(
    (e: React.PointerEvent, t: "light" | "knob") => {
      e.stopPropagation();
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dragRef.current = t;
      setDragging(true);
    },
    []
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    if (dragRef.current === "light") {
      const x = Math.min(
        Math.max(e.clientX - rect.left, 20),
        rect.width - 20
      );
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
          knobDistance: Math.min(
            Math.max(Math.sqrt(dx * dx + dy * dy), KNOB_MIN),
            KNOB_MAX
          ),
        };
      });
    }
  }, []);

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
    setDragging(false);
  }, []);

  // Apply: create a Framer code override with the shadow
  const apply = useCallback(async () => {
    const overrideCode = generateOverrideCode(previewBoxShadow);
    try {
      await framer.createCodeFile("HappyShadow.tsx", overrideCode);
      framer.notify("Created HappyShadow override — apply it to any layer!");
    } catch {
      framer.notify("Could not create override file", { variant: "error" });
    }
  }, [previewBoxShadow]);

  const copy = useCallback(() => {
    void navigator.clipboard.writeText(copyableCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [copyableCode]);

  const canvasBg = state.isDark ? "#262626" : "#ededed";
  const cardBg = state.isDark ? "#383838" : "#fff";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Canvas */}
      <div
        ref={canvasRef}
        style={{
          position: "relative",
          height: CANVAS_H,
          background: canvasBg,
          overflow: "hidden",
          cursor: "crosshair",
          touchAction: "none",
          borderBottom: "1px solid var(--framer-color-divider)",
        }}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onPointerDown={(e) => onPointerDown(e, "light")}
      >
        {/* Preview card */}
        <div
          style={{
            position: "absolute",
            left: centerX - 55,
            top: centerY - 65,
            width: 110,
            height: 130,
            borderRadius: 12,
            background: cardBg,
            boxShadow: previewBoxShadow,
            pointerEvents: "none",
          }}
        />
        {/* Sun rays */}
        <svg
          style={{
            position: "absolute",
            left: lightPos.x - 35,
            top: lightPos.y - 35,
            width: 70,
            height: 70,
            pointerEvents: "none",
            zIndex: 4,
          }}
          viewBox="0 0 70 70"
        >
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i * Math.PI * 2) / 8;
            const innerR = 16;
            const outerR = 16 + 4 + (brightness / 100) * 14;
            return (
              <line
                key={i}
                x1={35 + Math.cos(angle) * innerR}
                y1={35 + Math.sin(angle) * innerR}
                x2={35 + Math.cos(angle) * outerR}
                y2={35 + Math.sin(angle) * outerR}
                stroke="#4a90ff"
                strokeWidth="2"
                strokeLinecap="round"
                opacity={0.3 + (brightness / 100) * 0.5}
              />
            );
          })}
          <circle
            cx="35"
            cy="35"
            r="12"
            fill="none"
            stroke="#4a90ff"
            strokeWidth="1.5"
            opacity="0.5"
          />
        </svg>
        {/* Sun fill — draggable */}
        <div
          style={{
            position: "absolute",
            left: lightPos.x - 10,
            top: lightPos.y - 10,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "#fff",
            boxShadow: `0 0 ${6 + (brightness / 100) * 10}px ${2 + (brightness / 100) * 4}px rgba(255,255,255,0.5), 0 0 ${12 + (brightness / 100) * 16}px ${4 + (brightness / 100) * 8}px rgba(255,200,50,${0.1 + (brightness / 100) * 0.3})`,
            border: "1px solid rgba(150,150,150,0.35)",
            cursor: dragging ? "grabbing" : "grab",
            zIndex: 5,
          }}
          onPointerDown={(e) => onPointerDown(e, "light")}
        />
        {/* Knob on orbit */}
        <div
          style={{
            position: "absolute",
            left: knobPos.x - 7,
            top: knobPos.y - 7,
            width: 14,
            height: 14,
            borderRadius: "50%",
            border: "1.5px solid #4a90ff",
            background: "rgba(74,144,255,0.08)",
            cursor: dragging ? "grabbing" : "grab",
            zIndex: 10,
          }}
          onPointerDown={(e) => onPointerDown(e, "knob")}
        />
        {/* Badge */}
        <div
          style={{
            position: "absolute",
            right: 10,
            bottom: 10,
            background: "rgba(0,0,0,0.5)",
            color: "#fff",
            fontSize: 9,
            fontWeight: 600,
            padding: "3px 8px",
            borderRadius: 6,
            whiteSpace: "nowrap",
            pointerEvents: "none",
            lineHeight: "14px",
          }}
        >
          {`R ${shadowRadius.toFixed(1)} \u00b7 ${brightness}%`}
        </div>
      </div>

      {/* Bottom section */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          padding: "10px 12px",
          flex: 1,
        }}
      >
        {/* Controls */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          {/* Solid / Gradient toggle */}
          <div
            style={{
              display: "flex",
              borderRadius: 6,
              overflow: "hidden",
              border: "1px solid var(--framer-color-divider)",
            }}
          >
            {(["Solid", "Gradient"] as const).map((label) => {
              const active =
                label === "Solid" ? !state.isGradient : state.isGradient;
              return (
                <button
                  key={label}
                  onClick={() =>
                    setState((s) => ({
                      ...s,
                      isGradient: label === "Gradient",
                    }))
                  }
                  style={{
                    padding: "4px 10px",
                    fontSize: 11,
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer",
                    background: active
                      ? "#4a90ff"
                      : "var(--framer-color-bg-tertiary)",
                    color: active
                      ? "#fff"
                      : "var(--framer-color-text-secondary)",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
          {/* Color pickers */}
          {(state.isGradient ? state.colors : [state.colors[0]]).map((c, i) => (
            <label key={i} style={{ position: "relative", cursor: "pointer" }}>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: c,
                  border: "2px solid var(--framer-color-divider)",
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
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: 0,
                  width: "100%",
                  height: "100%",
                  cursor: "pointer",
                }}
              />
            </label>
          ))}
          {state.isGradient && (
            <>
              <button
                onClick={() =>
                  setState((s) => ({
                    ...s,
                    colors: [...s.colors, "#3B82F6"],
                  }))
                }
                style={circleBtn}
              >
                +
              </button>
              {state.colors.length > 2 && (
                <button
                  onClick={() =>
                    setState((s) => ({
                      ...s,
                      colors: s.colors.slice(0, -1),
                    }))
                  }
                  style={circleBtn}
                >
                  −
                </button>
              )}
            </>
          )}
          <div style={{ flex: 1 }} />
          {/* Light/dark toggle */}
          <div
            style={{
              display: "flex",
              gap: 2,
              padding: 2,
              borderRadius: 12,
              background: "var(--framer-color-bg-tertiary)",
            }}
          >
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

        {/* Shadow code accordion */}
        <div>
          <button
            onClick={() => setCodeOpen((o) => !o)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px 0",
              fontSize: 11,
              fontWeight: 600,
              color: "var(--framer-color-text-secondary)",
              width: "100%",
            }}
          >
            <span
              style={{
                fontSize: 9,
                transform: codeOpen ? "rotate(90deg)" : "rotate(0deg)",
                transition: "transform 0.15s",
                display: "inline-block",
              }}
            >
              &#9654;
            </span>
            Shadow code
          </button>

          {codeOpen && (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  marginTop: 6,
                  marginBottom: 6,
                }}
              >
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
                      background:
                        tab === t
                          ? "#4a90ff"
                          : "var(--framer-color-bg-tertiary)",
                      color:
                        tab === t
                          ? "#fff"
                          : "var(--framer-color-text-secondary)",
                    }}
                  >
                    {t}
                  </button>
                ))}
                <div style={{ flex: 1 }} />
                <button
                  onClick={copy}
                  title="Copy code"
                  style={{
                    height: 26,
                    padding: "0 10px",
                    border: "1px solid var(--framer-color-divider)",
                    borderRadius: 5,
                    cursor: "pointer",
                    background: copied
                      ? "#4a90ff"
                      : "var(--framer-color-bg-tertiary)",
                    color: copied
                      ? "#fff"
                      : "var(--framer-color-text)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                >
                  {copied ? (
                    <>
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                      >
                        <path
                          d="M2 6.5L4.5 9L10 3"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Copied
                    </>
                  ) : (
                    "Copy"
                  )}
                </button>
              </div>

              <pre
                style={{
                  background: "var(--framer-color-bg-tertiary)",
                  border: "1px solid var(--framer-color-divider)",
                  borderRadius: 8,
                  padding: 10,
                  fontSize: 10,
                  lineHeight: 1.5,
                  overflowX: "auto",
                  fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
                  color: "var(--framer-color-text)",
                  whiteSpace: "pre-wrap",
                  height: 140,
                  overflowY: "auto",
                  cursor: "pointer",
                }}
                onClick={copy}
              >
                {displayCode}
              </pre>
            </>
          )}
        </div>

        <div style={{ flex: 1 }} />
        <div
          style={{
            paddingTop: 4,
            paddingBottom: 4,
            display: "flex",
            gap: 8,
          }}
        >
          <button onClick={copy} style={secondaryBtn}>
            Copy CSS
          </button>
          <button onClick={apply} style={actionBtn}>
            Apply as Override
            {selectionCount > 0 ? ` (${selectionCount})` : ""}
          </button>
        </div>
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
  color: "var(--framer-color-text-secondary)",
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

const secondaryBtn: React.CSSProperties = {
  flex: 1,
  padding: "8px 0",
  fontSize: 12,
  fontWeight: 600,
  border: "1px solid var(--framer-color-divider)",
  borderRadius: 8,
  cursor: "pointer",
  background: "var(--framer-color-bg-tertiary)",
  color: "var(--framer-color-text)",
};
