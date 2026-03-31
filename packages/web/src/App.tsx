import { useShadowState } from "./hooks/useShadowState";
import { ShadowCanvas } from "./components/ShadowCanvas";
import { Controls } from "./components/Controls";
import { CodePreview } from "./components/CodePreview";

export function App() {
  const {
    state,
    setState,
    shadowRadius,
    shadowOpacity,
    previewBoxShadow,
    cssCode,
    tailwindCode,
    swiftCode,
    knobMin,
    knobMax,
  } = useShadowState();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h1
        style={{
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: "-0.02em",
        }}
      >
        HappyShadows Designer
      </h1>

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
        tailwindCode={tailwindCode}
        swiftCode={swiftCode}
      />
    </div>
  );
}
