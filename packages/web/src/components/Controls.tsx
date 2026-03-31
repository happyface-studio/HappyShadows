import type { ShadowState } from "../hooks/useShadowState";

interface Props {
  state: ShadowState;
  setState: React.Dispatch<React.SetStateAction<ShadowState>>;
}

export function Controls({ state, setState }: Props) {
  const setColor = (index: number, hex: string) => {
    setState((s) => {
      const colors = [...s.colors];
      colors[index] = hex;
      return { ...s, colors };
    });
  };

  const addColor = () =>
    setState((s) => ({ ...s, colors: [...s.colors, "#3B82F6"] }));

  const removeColor = () =>
    setState((s) => ({
      ...s,
      colors: s.colors.length > 2 ? s.colors.slice(0, -1) : s.colors,
    }));

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      {/* Solid / Gradient toggle */}
      <div
        style={{
          display: "flex",
          borderRadius: 8,
          overflow: "hidden",
          border: "1px solid var(--border)",
        }}
      >
        {(["Solid", "Gradient"] as const).map((label) => {
          const active =
            (label === "Solid" && !state.isGradient) ||
            (label === "Gradient" && state.isGradient);
          return (
            <button
              key={label}
              onClick={() =>
                setState((s) => ({ ...s, isGradient: label === "Gradient" }))
              }
              style={{
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                background: active ? "var(--accent)" : "var(--surface)",
                color: active ? "#fff" : "var(--text-dim)",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Color swatches */}
      {(state.isGradient ? state.colors : [state.colors[0]]).map((c, i) => (
        <label key={i} style={{ position: "relative", cursor: "pointer" }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: c,
              border: "2px solid rgba(255,255,255,0.2)",
            }}
          />
          <input
            type="color"
            value={c}
            onChange={(e) => setColor(i, e.target.value)}
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
          <button onClick={addColor} style={circleBtn}>
            +
          </button>
          {state.colors.length > 2 && (
            <button onClick={removeColor} style={circleBtn}>
              −
            </button>
          )}
        </>
      )}

      <div style={{ flex: 1 }} />

      {/* Theme toggle */}
      <div style={{ display: "flex", gap: 2, padding: 3, borderRadius: 14, background: "var(--surface-2)" }}>
        {[false, true].map((dark) => (
          <div
            key={String(dark)}
            onClick={() => setState((s) => ({ ...s, isDark: dark }))}
            style={{
              width: 22,
              height: 22,
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
  );
}

const circleBtn: React.CSSProperties = {
  width: 26,
  height: 26,
  borderRadius: "50%",
  border: "1.5px dashed rgba(128,128,128,0.4)",
  background: "transparent",
  color: "var(--text-dim)",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
};
