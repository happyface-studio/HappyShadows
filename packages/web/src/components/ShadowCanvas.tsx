import { useRef, useCallback } from "react";
import type { ShadowState } from "../hooks/useShadowState";

interface Props {
  state: ShadowState;
  setState: React.Dispatch<React.SetStateAction<ShadowState>>;
  previewBoxShadow: string;
  shadowRadius: number;
  shadowOpacity: number;
  knobMin: number;
  knobMax: number;
}

const CANVAS_H = 380;
const CARD_W = 160;
const CARD_H = 200;

export function ShadowCanvas({
  state,
  setState,
  previewBoxShadow,
  shadowRadius,
  shadowOpacity,
  knobMin,
  knobMax,
}: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<"light" | "knob" | null>(null);

  const getCenter = useCallback(() => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: rect.width / 2, y: CANVAS_H * 0.58 };
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, target: "light" | "knob") => {
      e.stopPropagation();
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dragging.current = target;
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const center = getCenter();

      if (dragging.current === "light") {
        const x = Math.min(Math.max(e.clientX - rect.left, 30), rect.width - 30);
        const y = Math.min(Math.max(e.clientY - rect.top, 30), CANVAS_H - 30);
        setState((s) => ({ ...s, lightX: x - center.x, lightY: y - center.y }));
      } else {
        // Knob — compute angle + distance from light source
        const lightPos = {
          x: center.x + state.lightX,
          y: center.y + state.lightY,
        };
        const dx = e.clientX - rect.left - lightPos.x;
        const dy = e.clientY - rect.top - lightPos.y;
        const angle = Math.atan2(dy, dx);
        const dist = Math.min(Math.max(Math.sqrt(dx * dx + dy * dy), knobMin), knobMax);
        setState((s) => ({ ...s, knobAngle: angle, knobDistance: dist }));
      }
    },
    [getCenter, setState, state.lightX, state.lightY, knobMin, knobMax]
  );

  const handlePointerUp = useCallback(() => {
    dragging.current = null;
  }, []);

  const center = getCenter();
  const lightPos = { x: center.x + state.lightX, y: center.y + state.lightY };
  const knobPos = {
    x: lightPos.x + Math.cos(state.knobAngle) * state.knobDistance,
    y: lightPos.y + Math.sin(state.knobAngle) * state.knobDistance,
  };

  const bg = state.isDark ? "#262626" : "#ededed";
  const cardBg = state.isDark ? "#383838" : "#ffffff";
  const brightness = Math.round((shadowOpacity / 0.4) * 100);

  return (
    <div
      ref={canvasRef}
      style={{
        position: "relative",
        height: CANVAS_H,
        borderRadius: "var(--radius)",
        background: bg,
        overflow: "hidden",
        cursor: "crosshair",
        touchAction: "none",
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerDown={(e) => handlePointerDown(e, "light")}
    >
      {/* Preview card */}
      <div
        style={{
          position: "absolute",
          left: center.x - CARD_W / 2,
          top: center.y - CARD_H / 2,
          width: CARD_W,
          height: CARD_H,
          borderRadius: 16,
          background: cardBg,
          boxShadow: previewBoxShadow,
          pointerEvents: "none",
        }}
      />

      {/* Sun glow */}
      <div
        style={{
          position: "absolute",
          left: lightPos.x - 12,
          top: lightPos.y - 12,
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 0 12px 4px rgba(255,255,255,0.5), 0 0 24px 8px rgba(255,200,50,0.25)",
          border: "1px solid rgba(150,150,150,0.35)",
          pointerEvents: "none",
        }}
      />

      {/* Orbit ring */}
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

      {/* Knob */}
      <div
        style={{
          position: "absolute",
          left: knobPos.x - 10,
          top: knobPos.y - 10,
          width: 20,
          height: 20,
          borderRadius: "50%",
          border: "1.5px solid rgba(74,144,255,0.7)",
          cursor: "grab",
          zIndex: 10,
        }}
        onPointerDown={(e) => handlePointerDown(e, "knob")}
      />

      {/* Badge */}
      <div
        style={{
          position: "absolute",
          left: knobPos.x,
          top: knobPos.y + (knobPos.y > 60 ? -32 : 28),
          transform: "translateX(-50%)",
          background: "var(--accent)",
          color: "#fff",
          fontSize: 10,
          fontWeight: 600,
          padding: "3px 10px",
          borderRadius: 20,
          whiteSpace: "nowrap",
          pointerEvents: "none",
          lineHeight: "16px",
          textAlign: "center",
        }}
      >
        Radius {shadowRadius.toFixed(1)}
        <br />
        Opacity {brightness}%
      </div>
    </div>
  );
}
