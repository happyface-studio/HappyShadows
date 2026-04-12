import { useRef, useCallback, useState } from "react";
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
  const dragRef = useRef<"light" | "knob" | null>(null);
  const [dragging, setDragging] = useState(false);

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
      dragRef.current = target;
      setDragging(true);
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const center = getCenter();

      if (dragRef.current === "light") {
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
    dragRef.current = null;
    setDragging(false);
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
  const b = brightness / 100;
  const cursor = dragging ? "grabbing" : "grab";

  // Sun halo — both layers scale with brightness so the user gets
  // instant feedback as they drag the knob.
  const sunShadow = `0 0 ${6 + b * 10}px ${2 + b * 4}px rgba(255,255,255,0.5), 0 0 ${12 + b * 16}px ${4 + b * 8}px rgba(255,200,50,${0.1 + b * 0.3})`;

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

      {/* Sun rays — length + opacity scale with brightness */}
      <svg
        style={{
          position: "absolute",
          left: lightPos.x - 44,
          top: lightPos.y - 44,
          width: 88,
          height: 88,
          pointerEvents: "none",
          zIndex: 4,
        }}
        viewBox="0 0 88 88"
      >
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i * Math.PI * 2) / 8;
          const innerR = 20;
          const outerR = 20 + 5 + b * 18;
          return (
            <line
              key={i}
              x1={44 + Math.cos(angle) * innerR}
              y1={44 + Math.sin(angle) * innerR}
              x2={44 + Math.cos(angle) * outerR}
              y2={44 + Math.sin(angle) * outerR}
              stroke="#4a90ff"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity={0.3 + b * 0.5}
            />
          );
        })}
        {/* Sun circle outline */}
        <circle cx="44" cy="44" r="15" fill="none" stroke="#4a90ff" strokeWidth="1.5" opacity="0.5" />
      </svg>

      {/* Sun fill — draggable, glow scales with brightness */}
      <div
        style={{
          position: "absolute",
          left: lightPos.x - 12,
          top: lightPos.y - 12,
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: "#fff",
          boxShadow: sunShadow,
          border: "1px solid rgba(150,150,150,0.35)",
          cursor,
          zIndex: 5,
        }}
        onPointerDown={(e) => handlePointerDown(e, "light")}
      />

      {/* Knob — small, subtle fill, no orbit ring */}
      <div
        style={{
          position: "absolute",
          left: knobPos.x - 9,
          top: knobPos.y - 9,
          width: 18,
          height: 18,
          borderRadius: "50%",
          border: "1.5px solid #4a90ff",
          background: "rgba(74,144,255,0.08)",
          cursor,
          zIndex: 10,
        }}
        onPointerDown={(e) => handlePointerDown(e, "knob")}
      />

      {/* Badge — fixed in bottom-right corner */}
      <div
        style={{
          position: "absolute",
          right: 12,
          bottom: 12,
          background: "rgba(0,0,0,0.5)",
          color: "#fff",
          fontSize: 11,
          fontWeight: 600,
          padding: "4px 10px",
          borderRadius: 8,
          whiteSpace: "nowrap",
          pointerEvents: "none",
          lineHeight: "16px",
          letterSpacing: "0.01em",
        }}
      >
        {`R ${shadowRadius.toFixed(1)} \u00b7 ${brightness}%`}
      </div>
    </div>
  );
}
