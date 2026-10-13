import { GITHUB_URL, SPM_URL } from "../constants";
import { useReveal } from "../hooks/useReveal";

const INSTALL = `dependencies: [
    .package(url: "${SPM_URL}", from: "0.1.0")
]`;

const BASIC = `view.happyShadow(
    color: .black,
    radius: 12,
    opacity: 0.25,
    y: 6
)`;

const ELEVATION = `view.happyShadow(elevation: 4)   // buttons, cards
view.happyShadow(elevation: 8)   // floating elements
view.happyShadow(elevation: 16)  // modals, popovers`;

const GRADIENT = `view.happyGradientShadow(
    gradient: .linearGradient(
        colors: [.blue, .purple],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    ),
    radius: 16, opacity: 0.2, y: 8
)`;

const TINT = `// Shadow borrows the surface's hue
view.happyShadow(
    color: .happyShadowTint(surfaceRed: 0.2, green: 0.4, blue: 0.8),
    radius: 12, opacity: 0.3, y: 6
)`;

const SNIPPETS: { title: string; code: string }[] = [
  { title: "Install (Swift Package Manager)", code: INSTALL },
  { title: "Basic shadow", code: BASIC },
  { title: "Elevation presets", code: ELEVATION },
  { title: "Gradient shadow", code: GRADIENT },
  { title: "Surface-tinted shadow", code: TINT },
];

export function Docs() {
  const { ref, isVisible } = useReveal();
  return (
    <section id="docs" ref={ref} className={`section reveal ${isVisible ? "is-visible" : ""}`}>
      <div className="container">
        <p className="section-eyebrow">Documentation</p>
        <h2 className="section-title">Quick start</h2>
        <p className="section-lead">
          Add the package, then swap any <code>.shadow()</code> for <code>.happyShadow()</code>. The full API
          reference lives in the README.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: 32 }}>
          {SNIPPETS.map((s) => (
            <div key={s.title}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>{s.title}</p>
              <pre className="code">{s.code}</pre>
            </div>
          ))}
        </div>

        <a className="btn" href={`${GITHUB_URL}#readme`} target="_blank" rel="noreferrer" style={{ marginTop: 28 }}>
          Full documentation on GitHub →
        </a>
      </div>
    </section>
  );
}
