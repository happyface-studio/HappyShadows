import { useReveal } from "../hooks/useReveal";

export function Benefits() {
  const { ref, isVisible } = useReveal();
  return (
    <section id="benefits" ref={ref} className={`section reveal ${isVisible ? "is-visible" : ""}`}>
      <div className="container">
        <p className="section-eyebrow">Why HappyShadows</p>
        <h2 className="section-title">Realistic depth, without the cost</h2>

        <div className="grid-3" style={{ marginTop: 32 }}>
          <div className="card">
            <h3>SwiftUI</h3>
            <ul>
              <li>Swap <code>.shadow()</code> for <code>.happyShadow()</code> — one line</li>
              <li>Five layers flattened via <code>.compositingGroup()</code> — one texture, not five re-renders</li>
              <li>Elevation presets: <code>.happyShadow(elevation:)</code></li>
              <li>Gradient shadows (linear, angular, radial, elliptical)</li>
              <li>Surface tinting via <code>Color.happyShadowTint</code></li>
              <li>iOS, macOS, tvOS, watchOS, visionOS</li>
            </ul>
          </div>

          <div className="card">
            <h3>CSS</h3>
            <ul>
              <li>One <code>box-shadow</code> with five tuned layers</li>
              <li>Animatable variant crossfades a pre-rendered elevation — the blur never re-renders mid-transition</li>
              <li>Tailwind arbitrary-value output</li>
              <li>Copy-paste from the live editor below</li>
            </ul>
          </div>

          <div className="card">
            <h3>What makes it special</h3>
            <ul>
              <li>One engine drives Swift and CSS — identical output, verified by a shared parity fixture</li>
              <li>Physically-motivated contact / key / ambient model, not a stack of guesses</li>
              <li>Shadows can borrow the hue of the surface they fall on</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
