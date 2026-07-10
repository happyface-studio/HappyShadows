# HappyShadows Demo / Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a one-page demo/landing site for HappyShadows (hero, how-it-works, benefits, embedded editor, macOS `.dmg` download, docs) by extending the existing Vite web app, plus a native `build-dmg.sh` packaging script.

**Architecture:** `packages/web` is a Vite + React 19 + TypeScript app that today renders only the shadow editor. We turn `App.tsx` into a scrolling one-page site composed of section components, re-parenting the existing editor untouched into an `EditorSection`. Motion is a tiny `useReveal` IntersectionObserver hook + CSS, no new dependency. A separate `Scripts/build-dmg.sh` builds a universal `ShadowDesigner.app`, wraps it in a `.dmg`, and drops it in `packages/web/public/` for the page to serve.

**Tech Stack:** Vite 6, React 19, TypeScript 5.7, `@happy-shadows/core` (workspace), Swift 5.9 / SwiftPM, `hdiutil` (native macOS).

## Global Constraints

- **No new npm/Swift dependencies.** nim is a *visual reference only* — do not add framer-motion, Tailwind, Next.js, a router, or a test framework.
- **Do not modify the editor internals** (`ShadowCanvas.tsx`, `Controls.tsx`, `CodePreview.tsx`, `hooks/useShadowState.ts`) or `@happy-shadows/core` or any Swift target. Only re-parent the editor.
- **Verification gate is `pnpm -C packages/web build`** (runs `tsc -b && vite build`). The web package has **no unit-test framework** and the spec forbids adding one; a green build (types + imports + JSX compile) is the passing test for every frontend task. This is intentional, not a missing test.
- **Canonical repo URL:** `https://github.com/happyface-studio/HappyShadows`
- **The `.dmg` is unsigned** (no Apple codesigning/notarization — out of scope). First-run requires right-click → Open; this must be stated on the page and in the README.
- **Keep the existing dark theme's CSS variable *names*** (`--bg --surface --surface-2 --border --text --text-dim --accent --accent-dim --radius`) so the editor keeps rendering; values may be tuned.
- Dark, minimal, generous-whitespace aesthetic; subtle scroll-reveal only.

---

### Task 1: Page shell & design system

Foundation every later section consumes: the CSS design system, shared constants, the reveal hook, Nav, Footer, and an `App` shell with an empty `<main>` where sections mount in order. After this task the page builds and renders a sticky nav + footer over an empty body.

**Files:**
- Rewrite: `packages/web/src/styles.css`
- Rewrite: `packages/web/src/App.tsx`
- Rewrite: `packages/web/index.html`
- Create: `packages/web/src/constants.ts`
- Create: `packages/web/src/hooks/useReveal.ts`
- Create: `packages/web/src/components/Nav.tsx`
- Create: `packages/web/src/components/Footer.tsx`

**Interfaces:**
- Consumes: nothing (first task).
- Produces:
  - `constants.ts`: `export const GITHUB_URL`, `export const DMG_URL` (`"/ShadowDesigner.dmg"`), `export const SPM_URL`.
  - `useReveal<T extends HTMLElement = HTMLElement>(): { ref: React.RefObject<T | null>; isVisible: boolean }` — attach `ref` to a section's root; toggle `is-visible` class when `isVisible`.
  - CSS classes later sections rely on: `.container`, `.section`, `.section-eyebrow`, `.section-title`, `.section-lead`, `.btn`, `.btn-primary`, `.reveal` / `.reveal.is-visible`, `.code`, `.nav-link`, `.nav-links`, `.grid-3`, `.spec-table`, `.bar`, `.bar-track`, `.bar-fill`, `.card`, `.copy-btn`.
  - `<Nav />`, `<Footer />`, and `App` rendering `<Nav/><main></main><Footer/>`. Sections mount as children of `<main>` in order: Hero, HowItWorks, Benefits, EditorSection, Download, Docs.

- [ ] **Step 1: Rewrite `packages/web/src/styles.css`**

```css
*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  /* Base theme — variable names shared with the editor components */
  --bg: #121212;
  --surface: #1b1b1b;
  --surface-2: #262626;
  --border: #2f2f2f;
  --text: #e8e8e8;
  --text-dim: #8c8c8c;
  --text-bright: #ffffff;
  --accent: #4a90ff;
  --accent-dim: rgba(74, 144, 255, 0.3);
  --radius: 12px;

  /* Layout */
  --content: 760px;
  --gutter: 24px;

  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
  color: var(--text);
  -webkit-font-smoothing: antialiased;
}

html { scroll-behavior: smooth; }

body {
  background: var(--bg);
  min-height: 100vh;
  line-height: 1.6;
}

#root { width: 100%; }

.container {
  width: 100%;
  max-width: var(--content);
  margin: 0 auto;
  padding: 0 var(--gutter);
}

/* Sections */
.section { padding: 88px 0; border-top: 1px solid var(--border); }
.section-eyebrow {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-dim);
  margin-bottom: 12px;
}
.section-title {
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-bright);
  margin-bottom: 14px;
}
.section-lead {
  font-size: 17px;
  color: var(--text-dim);
  max-width: 60ch;
}

/* Buttons / links */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text);
  cursor: pointer;
  text-decoration: none;
  transition: background 150ms ease, border-color 150ms ease, transform 150ms ease;
}
.btn:hover { transform: translateY(-1px); border-color: #454545; }
.btn-primary { background: var(--accent); border-color: var(--accent); color: #fff; }
.btn-primary:hover { background: #3a7deb; border-color: #3a7deb; }

.nav-link { color: var(--text-dim); text-decoration: none; transition: color 150ms ease; }
.nav-link:hover { color: var(--text); }
.nav-links { display: flex; gap: 20px; align-items: center; font-size: 14px; }
@media (max-width: 640px) {
  .nav-links .nav-link { display: none; }
}

/* Reveal-on-scroll */
.reveal { opacity: 0; transform: translateY(16px); transition: opacity 600ms ease, transform 600ms ease; }
.reveal.is-visible { opacity: 1; transform: none; }
@media (prefers-reduced-motion: reduce) {
  .reveal { opacity: 1; transform: none; transition: none; }
}

/* Code blocks */
.code {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  font-size: 13px;
  line-height: 1.6;
  font-family: ui-monospace, "SF Mono", Menlo, monospace;
  color: var(--text);
  overflow-x: auto;
  white-space: pre;
}

/* Auto-responsive 3-up grid (no media query needed) */
.grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 22px;
}
.card h3 { font-size: 16px; font-weight: 700; color: var(--text-bright); margin-bottom: 12px; }
.card ul { list-style: none; display: flex; flex-direction: column; gap: 8px; }
.card li { font-size: 14px; color: var(--text-dim); padding-left: 18px; position: relative; }
.card li::before { content: "→"; position: absolute; left: 0; color: var(--accent); }

/* Layer spec table + bars (How it works) */
.spec-table { width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 8px; }
.spec-table th, .spec-table td { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--border); }
.spec-table th { color: var(--text-dim); font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; }
.spec-table td { color: var(--text); font-variant-numeric: tabular-nums; }

.bar { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.bar > span { width: 76px; font-size: 13px; color: var(--text-dim); }
.bar-track { flex: 1; height: 10px; background: var(--surface-2); border-radius: 6px; overflow: hidden; }
.bar-fill { height: 100%; background: var(--accent); border-radius: 6px; }

.copy-btn {
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface-2);
  color: var(--text-dim);
  cursor: pointer;
}
.copy-btn:hover { color: var(--text); }
```

- [ ] **Step 2: Create `packages/web/src/constants.ts`**

```ts
export const GITHUB_URL = "https://github.com/happyface-studio/HappyShadows";
export const SPM_URL = "https://github.com/happyface-studio/HappyShadows.git";
export const DMG_URL = "/ShadowDesigner.dmg";
```

- [ ] **Step 3: Create `packages/web/src/hooks/useReveal.ts`**

```ts
import { useEffect, useRef, useState } from "react";

/**
 * Reveal-on-scroll: attach `ref` to an element and flip `isVisible` true the
 * first time it enters the viewport. Fires once, then unobserves.
 */
export function useReveal<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}
```

- [ ] **Step 4: Create `packages/web/src/components/Nav.tsx`**

```tsx
import { GITHUB_URL } from "../constants";

export function Nav() {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        backdropFilter: "blur(12px)",
        background: "rgba(18,18,18,0.72)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div
        className="container"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}
      >
        <a href="#top" style={{ fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-bright)", textDecoration: "none" }}>
          HappyShadows
        </a>
        <nav className="nav-links">
          <a className="nav-link" href="#how">How it works</a>
          <a className="nav-link" href="#editor">Editor</a>
          <a className="nav-link" href="#download">Download</a>
          <a className="nav-link" href="#docs">Docs</a>
          <a className="btn" href={GITHUB_URL} target="_blank" rel="noreferrer">GitHub</a>
        </nav>
      </div>
    </header>
  );
}
```

- [ ] **Step 5: Create `packages/web/src/components/Footer.tsx`**

```tsx
import { GITHUB_URL } from "../constants";

export function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--border)", padding: "40px 0" }}>
      <div
        className="container"
        style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", alignItems: "center", fontSize: 14, color: "var(--text-dim)" }}
      >
        <span>Made by HappyFace Studios · MIT License</span>
        <a className="nav-link" href={GITHUB_URL} target="_blank" rel="noreferrer">github.com/happyface-studio/HappyShadows</a>
      </div>
    </footer>
  );
}
```

- [ ] **Step 6: Rewrite `packages/web/src/App.tsx` as the shell**

```tsx
import { Nav } from "./components/Nav";
import { Footer } from "./components/Footer";

export function App() {
  return (
    <>
      <Nav />
      <main id="top">
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 7: Rewrite `packages/web/index.html` head**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>HappyShadows — realistic layered shadows for SwiftUI & CSS</title>
    <meta
      name="description"
      content="HappyShadows renders realistic, layered shadows for SwiftUI and CSS from one physically-motivated engine — with a live editor and a macOS design app."
    />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 8: Build to verify**

Run: `pnpm -C packages/web build`
Expected: PASS — `tsc -b` reports no errors and `vite build` writes `dist/`.

- [ ] **Step 9: Commit**

```bash
git add packages/web/src/styles.css packages/web/src/constants.ts packages/web/src/hooks/useReveal.ts packages/web/src/components/Nav.tsx packages/web/src/components/Footer.tsx packages/web/src/App.tsx packages/web/index.html
git commit -m "feat(web): page shell, design system, nav/footer, reveal hook"
```

---

### Task 2: Hero section

Above-the-fold: pitch, CTAs, and a live demo card whose shadow is computed by the real engine (`computeBoxShadowLayers`).

**Files:**
- Create: `packages/web/src/sections/Hero.tsx`
- Modify: `packages/web/src/App.tsx` (mount `<Hero />` first in `<main>`)

**Interfaces:**
- Consumes: `computeBoxShadowLayers` from `@happy-shadows/core`; `DMG_URL`, `GITHUB_URL` from `../constants`.
- Produces: `<Hero />`.

- [ ] **Step 1: Create `packages/web/src/sections/Hero.tsx`**

```tsx
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
```

- [ ] **Step 2: Mount `<Hero />` in `App.tsx`**

Add `import { Hero } from "./sections/Hero";` beneath the `Footer` import, and place `<Hero />` as the first child of `<main>`:

```tsx
import { Nav } from "./components/Nav";
import { Footer } from "./components/Footer";
import { Hero } from "./sections/Hero";

export function App() {
  return (
    <>
      <Nav />
      <main id="top">
        <Hero />
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 3: Build to verify**

Run: `pnpm -C packages/web build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/web/src/sections/Hero.tsx packages/web/src/App.tsx
git commit -m "feat(web): hero section with live engine-rendered demo card"
```

---

### Task 3: How It Works section

Explains the 5-layer model with a share-of-opacity bar visual and the full spec table (values verbatim from the README "How It Works" table).

**Files:**
- Create: `packages/web/src/sections/HowItWorks.tsx`
- Modify: `packages/web/src/App.tsx` (mount `<HowItWorks />` after `<Hero />`)

**Interfaces:**
- Consumes: `useReveal` from `../hooks/useReveal`.
- Produces: `<HowItWorks />` (renders `<section id="how">`).

- [ ] **Step 1: Create `packages/web/src/sections/HowItWorks.tsx`**

```tsx
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
```

Note: bar width `l.share / 0.35` normalizes the largest share (35%) to 100% track width.

- [ ] **Step 2: Mount `<HowItWorks />` in `App.tsx`**

Add `import { HowItWorks } from "./sections/HowItWorks";` with the other section imports, and place `<HowItWorks />` immediately after `<Hero />` inside `<main>`.

- [ ] **Step 3: Build to verify**

Run: `pnpm -C packages/web build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/web/src/sections/HowItWorks.tsx packages/web/src/App.tsx
git commit -m "feat(web): how-it-works section with layer bars and spec table"
```

---

### Task 4: Benefits section

Three cards: Swift, CSS, and what makes it special.

**Files:**
- Create: `packages/web/src/sections/Benefits.tsx`
- Modify: `packages/web/src/App.tsx` (mount `<Benefits />` after `<HowItWorks />`)

**Interfaces:**
- Consumes: `useReveal` from `../hooks/useReveal`.
- Produces: `<Benefits />` (renders `<section id="benefits">`).

- [ ] **Step 1: Create `packages/web/src/sections/Benefits.tsx`**

```tsx
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
```

- [ ] **Step 2: Mount `<Benefits />` in `App.tsx`**

Add `import { Benefits } from "./sections/Benefits";` and place `<Benefits />` after `<HowItWorks />` inside `<main>`.

- [ ] **Step 3: Build to verify**

Run: `pnpm -C packages/web build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/web/src/sections/Benefits.tsx packages/web/src/App.tsx
git commit -m "feat(web): benefits section (swift / css / what makes it special)"
```

---

### Task 5: Editor section (re-parent existing editor)

Wrap the existing editor — unchanged components and hook — in a titled section. This is the same wiring the old `App.tsx` had, moved into `EditorSection`.

**Files:**
- Create: `packages/web/src/sections/EditorSection.tsx`
- Modify: `packages/web/src/App.tsx` (mount `<EditorSection />` after `<Benefits />`)

**Interfaces:**
- Consumes: `useShadowState` (`../hooks/useShadowState`), `ShadowCanvas`/`Controls`/`CodePreview` (`../components/*`), `useReveal`. All existing, unmodified. The `useShadowState()` return shape and each component's props are exactly as used in the pre-existing `App.tsx` (do not change them).
- Produces: `<EditorSection />` (renders `<section id="editor">`).

- [ ] **Step 1: Create `packages/web/src/sections/EditorSection.tsx`**

```tsx
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
```

- [ ] **Step 2: Mount `<EditorSection />` in `App.tsx`**

Add `import { EditorSection } from "./sections/EditorSection";` and place `<EditorSection />` after `<Benefits />` inside `<main>`.

- [ ] **Step 3: Build to verify**

Run: `pnpm -C packages/web build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/web/src/sections/EditorSection.tsx packages/web/src/App.tsx
git commit -m "feat(web): embed the shadow editor as a page section"
```

---

### Task 6: Download section

`.dmg` download button, the unsigned first-run note, and a `swift run` fallback with copy-to-clipboard.

**Files:**
- Create: `packages/web/src/sections/Download.tsx`
- Modify: `packages/web/src/App.tsx` (mount `<Download />` after `<EditorSection />`)

**Interfaces:**
- Consumes: `DMG_URL`, `GITHUB_URL` from `../constants`; `useReveal`.
- Produces: `<Download />` (renders `<section id="download">`).

- [ ] **Step 1: Create `packages/web/src/sections/Download.tsx`**

```tsx
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
```

- [ ] **Step 2: Mount `<Download />` in `App.tsx`**

Add `import { Download } from "./sections/Download";` and place `<Download />` after `<EditorSection />` inside `<main>`.

- [ ] **Step 3: Build to verify**

Run: `pnpm -C packages/web build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/web/src/sections/Download.tsx packages/web/src/App.tsx
git commit -m "feat(web): macOS download section with dmg link and run-from-source fallback"
```

---

### Task 7: Docs section

Condensed quick-start snippets + link to the full README on GitHub. This is the last section mounted, so after this task `<main>` holds all six sections in order.

**Files:**
- Create: `packages/web/src/sections/Docs.tsx`
- Modify: `packages/web/src/App.tsx` (mount `<Docs />` last)

**Interfaces:**
- Consumes: `SPM_URL`, `GITHUB_URL` from `../constants`; `useReveal`.
- Produces: `<Docs />` (renders `<section id="docs">`).

- [ ] **Step 1: Create `packages/web/src/sections/Docs.tsx`**

```tsx
import { GITHUB_URL, SPM_URL } from "../constants";
import { useReveal } from "../hooks/useReveal";

const INSTALL = `dependencies: [
    .package(url: "${SPM_URL}", from: "0.1")
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
```

- [ ] **Step 2: Mount `<Docs />` in `App.tsx` (final composition)**

Add `import { Docs } from "./sections/Docs";` and place `<Docs />` last inside `<main>`. The finished `App.tsx` must read:

```tsx
import { Nav } from "./components/Nav";
import { Footer } from "./components/Footer";
import { Hero } from "./sections/Hero";
import { HowItWorks } from "./sections/HowItWorks";
import { Benefits } from "./sections/Benefits";
import { EditorSection } from "./sections/EditorSection";
import { Download } from "./sections/Download";
import { Docs } from "./sections/Docs";

export function App() {
  return (
    <>
      <Nav />
      <main id="top">
        <Hero />
        <HowItWorks />
        <Benefits />
        <EditorSection />
        <Download />
        <Docs />
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 3: Build to verify**

Run: `pnpm -C packages/web build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/web/src/sections/Docs.tsx packages/web/src/App.tsx
git commit -m "feat(web): docs quick-start section; final page composition"
```

---

### Task 8: `.dmg` build script, gitignore, README

Native packaging script producing `packages/web/public/ShadowDesigner.dmg`, gitignore for the generated artifact, and README updates covering the demo page + how to build the download.

**Files:**
- Create: `Scripts/build-dmg.sh`
- Modify: `.gitignore`
- Modify: `README.md`

**Interfaces:**
- Consumes: SwiftPM executable target `ShadowDesigner` (`@main` in `ShadowDesigner/ShadowDesignerApp.swift`). Universal binary directory from `swift build -c release --arch arm64 --arch x86_64 --show-bin-path`.
- Produces: `packages/web/public/ShadowDesigner.dmg` served by Vite at `/ShadowDesigner.dmg`.

- [ ] **Step 1: Create `Scripts/build-dmg.sh`**

```bash
#!/usr/bin/env bash
# Build a universal (arm64 + x86_64) ShadowDesigner.app and package it into a
# .dmg the web app serves at /ShadowDesigner.dmg.
#
# The app is UNSIGNED — first launch needs right-click -> Open (Gatekeeper).
# Codesigning/notarization is intentionally out of scope.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

APP_NAME="ShadowDesigner"
DMG_OUT="$ROOT/packages/web/public/${APP_NAME}.dmg"
STAGING="$(mktemp -d)"
trap 'rm -rf "$STAGING"' EXIT

echo "==> Building universal release binary..."
swift build -c release --arch arm64 --arch x86_64 --product "$APP_NAME"
BIN_DIR="$(swift build -c release --arch arm64 --arch x86_64 --product "$APP_NAME" --show-bin-path)"
BIN="$BIN_DIR/$APP_NAME"
test -f "$BIN" || { echo "ERROR: binary not found at $BIN"; exit 1; }

echo "==> Assembling ${APP_NAME}.app bundle..."
APP="$STAGING/${APP_NAME}.app"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
cp "$BIN" "$APP/Contents/MacOS/$APP_NAME"

cat > "$APP/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key><string>${APP_NAME}</string>
  <key>CFBundleDisplayName</key><string>HappyShadows Designer</string>
  <key>CFBundleIdentifier</key><string>studio.happyface.shadowdesigner</string>
  <key>CFBundleExecutable</key><string>${APP_NAME}</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>0.1.0</string>
  <key>CFBundleVersion</key><string>1</string>
  <key>CFBundleInfoDictionaryVersion</key><string>6.0</string>
  <key>LSMinimumSystemVersion</key><string>14.0</string>
  <key>NSHighResolutionCapable</key><true/>
</dict>
</plist>
PLIST

echo "==> Creating .dmg..."
mkdir -p "$(dirname "$DMG_OUT")"
rm -f "$DMG_OUT"
hdiutil create -volname "$APP_NAME" -srcfolder "$STAGING" -ov -format UDZO "$DMG_OUT" >/dev/null

# ponytail: no app icon (.icns) — generic icon is fine for an unsigned dev build.

echo "==> Self-check: mount + detach..."
test -f "$DMG_OUT" || { echo "ERROR: dmg not produced"; exit 1; }
MOUNT_DIR="$(mktemp -d)"
hdiutil attach "$DMG_OUT" -nobrowse -mountpoint "$MOUNT_DIR" >/dev/null
test -d "$MOUNT_DIR/${APP_NAME}.app" || { echo "ERROR: .app missing inside dmg"; hdiutil detach "$MOUNT_DIR" >/dev/null; exit 1; }
hdiutil detach "$MOUNT_DIR" >/dev/null
rmdir "$MOUNT_DIR"

echo "==> Done: $DMG_OUT"
```

- [ ] **Step 2: Make it executable and run it (this is the test)**

```bash
chmod +x Scripts/build-dmg.sh
./Scripts/build-dmg.sh
```

Expected: ends with `==> Done: .../packages/web/public/ShadowDesigner.dmg`, exit code 0. The self-check mounts the dmg, confirms `ShadowDesigner.app` is inside, and detaches. If the binary or dmg is missing, the script exits nonzero.

- [ ] **Step 3: Add the generated artifact to `.gitignore`**

Append to `.gitignore`:

```gitignore

# Generated macOS download (built by Scripts/build-dmg.sh)
packages/web/public/ShadowDesigner.dmg
```

- [ ] **Step 4: Update `README.md`**

Under the `## ShadowDesigner (macOS App)` section, add the demo page + dmg build info. Insert after the existing "Or open in Xcode" block (before `## How It Works`):

```markdown
### Demo page

A one-page demo/landing site lives in `packages/web` (Vite + React). It explains
the layer model, shows the benefits for Swift and CSS, embeds the live editor,
and offers the macOS app download.

```bash
pnpm -C packages/web dev     # local dev server
pnpm -C packages/web build   # production build to packages/web/dist
```

### Building the downloadable .dmg

The demo page's "Download for macOS" button serves `packages/web/public/ShadowDesigner.dmg`.
Build it (universal arm64 + x86_64) with:

```bash
./Scripts/build-dmg.sh
```

The app is **unsigned** — on first launch, right-click it and choose **Open** to
pass Gatekeeper. Run `build-dmg.sh` before `pnpm -C packages/web build` so the
download is included.
```

- [ ] **Step 5: Commit** (the `.dmg` itself is gitignored and not staged)

```bash
git add Scripts/build-dmg.sh .gitignore README.md
git commit -m "feat: build-dmg.sh packaging script; document demo page and download"
```

---

## Self-Review

**Spec coverage:**
- One-page site extending Vite app → Tasks 1–7. ✓
- nim aesthetic, no framework → Task 1 (CSS/design system), Global Constraints. ✓
- Sections Nav/Hero/HowItWorks/Benefits/Editor/Download/Docs/Footer → Tasks 1–7. ✓
- Editor re-parented unchanged → Task 5. ✓
- Reveal motion via IntersectionObserver, no dep → Task 1 (`useReveal`). ✓
- `.dmg` pipeline (universal, Info.plist, hdiutil, self-check, into public/) → Task 8. ✓
- Unsigned first-run note on page + README → Tasks 6 & 8. ✓
- Docs = quick-start + GitHub link → Task 7. ✓
- gitignore the dmg → Task 8. ✓
- Testing = build + script self-check → each frontend task Step "Build to verify", Task 8 Step 2. ✓

**Placeholder scan:** No TBD/TODO; every code step has complete code. ✓

**Type consistency:** `useReveal` returns `{ ref, isVisible }` — consumed identically in Tasks 3–7. `constants.ts` exports `GITHUB_URL`/`SPM_URL`/`DMG_URL` — consumed as named imports throughout. `computeBoxShadowLayers` params `{color,radius,opacity,x,y}` and layer fields `{offsetX,offsetY,blurRadius,color:{r,g,b,a}}` match the core (`packages/shadow-core/src/codegen.ts`). Editor component props in Task 5 match the pre-existing `App.tsx`. ✓
