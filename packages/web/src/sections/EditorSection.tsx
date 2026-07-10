import { useShadowState } from "../hooks/useShadowState";
import { ShadowCanvas } from "../components/ShadowCanvas";
import { Controls } from "../components/Controls";
import { CodePreview } from "../components/CodePreview";
import { useReveal } from "../hooks/useReveal";

export function EditorSection() {
  const {
    state,
    setState,
    shadowRadius,
    shadowOpacity,
    previewBoxShadow,
    cssCode,
    animatedCssCode,
    tailwindCode,
    swiftCode,
    knobMin,
    knobMax,
  } = useShadowState();
  const { ref, isVisible } = useReveal();

  return (
    <section id="editor" ref={ref} className={`section reveal ${isVisible ? "is-visible" : ""}`}>
      <div className="container">
        <p className="section-eyebrow">Live editor</p>
        <h2 className="section-title">Design a shadow, copy the code</h2>
        <p className="section-lead">
          Drag the light to set direction and spread, tune radius and opacity, switch between solid and gradient,
          then copy the CSS, Tailwind, or SwiftUI.
        </p>

        <div style={{ maxWidth: 560, margin: "32px auto 0", display: "flex", flexDirection: "column", gap: 16 }}>
          <ShadowCanvas
            state={state}
            setState={setState}
            previewBoxShadow={previewBoxShadow}
            shadowRadius={shadowRadius}
            shadowOpacity={shadowOpacity}
            knobMin={knobMin}
            knobMax={knobMax}
          />
          <Controls state={state} setState={setState} />
          <CodePreview
            cssCode={cssCode}
            animatedCssCode={animatedCssCode}
            tailwindCode={tailwindCode}
            swiftCode={swiftCode}
          />
        </div>
      </div>
    </section>
  );
}
