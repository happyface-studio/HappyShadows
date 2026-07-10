import { computeBoxShadowLayers } from "@happy-shadows/core";
import { DMG_URL, GITHUB_URL } from "../constants";

// Computed once at module load — pure/deterministic.
const demoShadow = computeBoxShadowLayers({
  color: { r: 0, g: 0, b: 0, a: 1 },
  radius: 26,
  opacity: 0.34,
  x: 0,
  y: 14,
})
  .map((l) => {
    const r = Math.round(l.color.r * 255);
    const g = Math.round(l.color.g * 255);
    const b = Math.round(l.color.b * 255);
    return `${l.offsetX.toFixed(1)}px ${l.offsetY.toFixed(1)}px ${l.blurRadius.toFixed(1)}px rgba(${r},${g},${b},${l.color.a.toFixed(3)})`;
  })
  .join(", ");

export function Hero() {
  return (
    <section className="section" style={{ paddingTop: 72, borderTop: "none", textAlign: "center" }}>
      <div className="container">
        <p className="section-eyebrow">SwiftUI + CSS shadow engine</p>
        <h1
          style={{
            fontSize: 48,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
            color: "var(--text-bright)",
            maxWidth: "16ch",
            margin: "0 auto 20px",
          }}
        >
          Shadows that look like real light
        </h1>
        <p style={{ fontSize: 19, color: "var(--text-dim)", maxWidth: "56ch", margin: "0 auto 32px" }}>
          HappyShadows splits every shadow into five physically-motivated layers — contact, key, and ambient —
          for depth the default one-layer shadow can't reach. One engine, identical output in SwiftUI and CSS,
          at native performance.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a className="btn btn-primary" href="#editor">Try the editor</a>
          <a className="btn" href={DMG_URL}>Download for macOS</a>
          <a className="btn" href={GITHUB_URL} target="_blank" rel="noreferrer">GitHub</a>
        </div>
        <div style={{ marginTop: 76, display: "flex", justifyContent: "center" }}>
          <div
            style={{
              width: 240,
              height: 156,
              borderRadius: 22,
              background: "linear-gradient(145deg, #fbfbfd, #e8e8ef)",
              boxShadow: demoShadow,
            }}
          />
        </div>
      </div>
    </section>
  );
}
