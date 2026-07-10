import { useState } from "react";
import { DMG_URL, GITHUB_URL } from "../constants";
import { useReveal } from "../hooks/useReveal";

const RUN_CMD = "swift run ShadowDesigner";

export function Download() {
  const { ref, isVisible } = useReveal();
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(RUN_CMD);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <section id="download" ref={ref} className={`section reveal ${isVisible ? "is-visible" : ""}`}>
      <div className="container">
        <p className="section-eyebrow">macOS app</p>
        <h2 className="section-title">ShadowDesigner for Mac</h2>
        <p className="section-lead">
          A native design canvas: drag a light source, tune the shadow, and copy the generated SwiftUI, CSS, or
          Tailwind. Universal build for Apple Silicon and Intel.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
          <a className="btn btn-primary" href={DMG_URL} download>Download .dmg</a>
          <a className="btn" href={GITHUB_URL} target="_blank" rel="noreferrer">View source</a>
        </div>

        <p style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 16, maxWidth: "60ch" }}>
          The app is unsigned, so on first launch macOS Gatekeeper will warn you. Right-click the app and choose
          <strong style={{ color: "var(--text)" }}> Open</strong> to run it once; after that it opens normally.
        </p>

        <div style={{ marginTop: 28 }}>
          <p style={{ fontSize: 14, color: "var(--text-dim)", marginBottom: 8 }}>Prefer to run from source?</p>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <code className="code" style={{ padding: "10px 14px" }}>{RUN_CMD}</code>
            <button className="copy-btn" onClick={copy}>{copied ? "Copied!" : "Copy"}</button>
          </div>
        </div>
      </div>
    </section>
  );
}
