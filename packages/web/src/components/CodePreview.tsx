import { useState } from "react";

type Tab = "CSS" | "Tailwind" | "SwiftUI";

interface Props {
  cssCode: string;
  tailwindCode: string;
  swiftCode: string;
}

export function CodePreview({ cssCode, tailwindCode, swiftCode }: Props) {
  const [tab, setTab] = useState<Tab>("CSS");
  const [copied, setCopied] = useState(false);

  const code = tab === "CSS" ? cssCode : tab === "Tailwind" ? tailwindCode : swiftCode;

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, marginBottom: 8 }}>
        {(["CSS", "Tailwind", "SwiftUI"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "5px 12px",
              fontSize: 11,
              fontWeight: 600,
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              background: tab === t ? "var(--accent)" : "var(--surface-2)",
              color: tab === t ? "#fff" : "var(--text-dim)",
            }}
          >
            {t}
          </button>
        ))}

        <div style={{ flex: 1 }} />

        <button onClick={copy} style={copyBtn}>
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      {/* Code block */}
      <pre
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: 14,
          fontSize: 12,
          lineHeight: 1.6,
          overflowX: "auto",
          fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
          color: "var(--text)",
          whiteSpace: "pre-wrap",
          cursor: "pointer",
        }}
        onClick={copy}
      >
        {code}
      </pre>
    </div>
  );
}

const copyBtn: React.CSSProperties = {
  padding: "5px 14px",
  fontSize: 11,
  fontWeight: 600,
  border: "1px solid var(--border)",
  borderRadius: 6,
  cursor: "pointer",
  background: "var(--surface-2)",
  color: "var(--text-dim)",
};
