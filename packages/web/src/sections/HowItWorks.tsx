import { useReveal } from "../hooks/useReveal";

const LAYERS = [
  { name: "Contact", offset: "0.12 × (x, y)", blur: "0.25R + 1", share: 35 },
  { name: "Key 1", offset: "0.40 × (x, y)", blur: "0.60R", share: 25 },
  { name: "Key 2", offset: "0.70 × (x, y)", blur: "1.20R", share: 15 },
  { name: "Key 3", offset: "1.00 × (x, y)", blur: "2.00R", share: 10 },
  { name: "Ambient", offset: "(0, 0.15y)", blur: "3.00R", share: 15 },
];

export function HowItWorks() {
  const { ref, isVisible } = useReveal();
  return (
    <section id="how" ref={ref} className={`section reveal ${isVisible ? "is-visible" : ""}`}>
      <div className="container">
        <p className="section-eyebrow">How it works</p>
        <h2 className="section-title">Five layers, one physically-motivated model</h2>
        <p className="section-lead">
          A real shadow isn't a single blur. HappyShadows composites a crisp contact shadow, three key-light
          layers with penumbra falloff, and a soft ambient layer. The alpha weights sum to 1.0, so the combined
          intensity matches the <code>opacity</code> you pass in.
        </p>

        <div style={{ marginTop: 32, maxWidth: 520 }}>
          {LAYERS.map((l) => (
            <div className="bar" key={l.name}>
              <span>{l.name}</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${l.share / 0.35}%` }} />
              </div>
              <span style={{ width: 40, textAlign: "right" }}>{l.share}%</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 32, overflowX: "auto" }}>
          <table className="spec-table">
            <thead>
              <tr>
                <th>Layer</th>
                <th>Offset</th>
                <th>Blur</th>
                <th>Share of opacity</th>
              </tr>
            </thead>
            <tbody>
              {LAYERS.map((l) => (
                <tr key={l.name}>
                  <td>{l.name}</td>
                  <td>{l.offset}</td>
                  <td>{l.blur}</td>
                  <td>{l.share}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
