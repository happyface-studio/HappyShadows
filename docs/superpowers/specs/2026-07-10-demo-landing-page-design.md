# HappyShadows Demo / Landing Page — Design Spec

**Date:** 2026-07-10
**Status:** Approved (design)

## Goal

Ship a single-page demo/landing site for HappyShadows that explains how the
library works, its Swift and CSS benefits, and what makes it special —
embedding the existing shadow editor, offering a macOS app download, and
linking to documentation. Built by extending the existing Vite web app, using
[nim](https://github.com/ibelick/nim) as a *visual reference only*.

## Decisions (locked)

1. **Stack:** Extend the existing `packages/web` Vite + React 19 + TypeScript
   app. No new framework. nim informs aesthetic (minimal, dark, generous
   whitespace, subtle scroll-reveal motion), not code.
2. **macOS download:** Build a real, distributable `.dmg` the page serves
   directly from `/ShadowDesigner.dmg`.
3. **Docs:** Condensed quick-start snippets on the page + link to the GitHub
   README (which is the canonical docs). No separate MDX docs site.
4. **Motion:** A small `useReveal` IntersectionObserver hook + CSS transitions.
   No framer-motion dependency.

## Architecture

Today `packages/web/src/App.tsx` renders only the editor
(`ShadowCanvas` + `Controls` + `CodePreview`, driven by `useShadowState`)
inside a centered 560px column defined in `styles.css`.

Change: `App.tsx` becomes a scrolling one-page site composed of ordered
`<section>` components. The editor's internals stay **untouched** and are
re-parented into a new `EditorSection` wrapper. `styles.css` is reworked from
a single centered column into a normal scrolling page with a max-width content
container, a typography scale, section spacing, button styles, and reveal
animation classes. The dark CSS-variable theme is retained and extended.

### Page sections (top → bottom)

1. **Nav** (`components/Nav.tsx`) — wordmark, anchor links (How it works ·
   Editor · Download · Docs), GitHub link. Sticky, minimal.
2. **Hero** (`sections/Hero.tsx`) — product name, one-line pitch, CTA buttons
   (Try editor ↓, Download for macOS, GitHub), and a live demo card that
   actually renders a happy-shadow via the core engine.
3. **How it works** (`sections/HowItWorks.tsx`) — the 5-layer physically-
   motivated model (contact / key×3 with penumbra falloff / ambient), a visual
   layer diagram, and the alpha-weight table (values from README "How It
   Works").
4. **Benefits** (`sections/Benefits.tsx`) — three columns:
   - **Swift:** one-line `.happyShadow()` swap, `.compositingGroup()` perf
     (5 layers flattened to one texture), elevation presets, gradient shadows,
     surface tinting, cross-platform.
   - **CSS:** single `box-shadow` with 5 layers, animatable pseudo-element
     variant (opacity crossfade, no per-frame blur recompute), Tailwind output.
   - **What makes it special:** identical output across Swift & CSS from one
     shared engine (verified by the shared parity fixture) + surface-tinted
     shadows.
5. **Editor** (`sections/EditorSection.tsx`) — the existing designer embedded
   live (existing components, unchanged).
6. **Download** (`sections/Download.tsx`) — `Download .dmg` button linking to
   `/ShadowDesigner.dmg`, a first-run note (unsigned app → right-click → Open
   to pass Gatekeeper), and `swift run ShadowDesigner` as a fallback with
   copy-to-clipboard.
7. **Docs** (`sections/Docs.tsx`) — condensed quick-start snippets (install,
   basic `.happyShadow`, elevation, gradient, tint) + "Full documentation on
   GitHub" link.
8. **Footer** (`components/Footer.tsx`) — "Made by HappyFace Studios", MIT
   license, GitHub link.

### Reveal motion

`hooks/useReveal.ts` exposes a hook returning a `ref` and an `isVisible` flag
via a single `IntersectionObserver` (fires once, unobserves after reveal).
Sections apply a CSS class that transitions opacity + translateY when visible.
No dependency added.

## The .dmg pipeline

`Scripts/build-dmg.sh` — native macOS tooling only, no external deps:

1. `swift build -c release --arch arm64 --arch x86_64` → universal executable.
2. Assemble `ShadowDesigner.app/Contents/{MacOS,Resources}` with a minimal
   `Info.plist` (bundle name/identifier, `CFBundleExecutable`, GUI app so no
   `LSUIElement`). Copy the universal binary into `Contents/MacOS/`.
3. `hdiutil create` a compressed `.dmg` from a staging folder containing the
   `.app` → output to `packages/web/public/ShadowDesigner.dmg`.
4. Self-check: fail (nonzero exit) if the `.dmg` was not produced; verify it
   mounts via `hdiutil attach` and detaches cleanly via `hdiutil detach`.

Vite serves `packages/web/public/` at the site root, so the Download button's
`/ShadowDesigner.dmg` resolves once the script has run. The `.dmg`, the staged
`.app`, and build temp dirs are gitignored (generated artifacts). The script is
run manually before `pnpm -C packages/web build`; wiring it into release CI is
out of scope here.

Note: the app is **unsigned** (no Apple Developer codesigning / notarization),
so first launch requires right-click → Open. This is documented on the page and
in the README. Signing/notarization is out of scope.

## Files

**New — `packages/web/src/`:**
- `sections/Hero.tsx`, `sections/HowItWorks.tsx`, `sections/Benefits.tsx`,
  `sections/EditorSection.tsx`, `sections/Download.tsx`, `sections/Docs.tsx`
- `components/Nav.tsx`, `components/Footer.tsx`
- `hooks/useReveal.ts`

**Rewrite:**
- `packages/web/src/App.tsx` (page composition)
- `packages/web/src/styles.css` (scrolling page + design system)
- `packages/web/index.html` (title, meta description)

**New — repo root:**
- `Scripts/build-dmg.sh`
- `.gitignore` additions (`packages/web/public/ShadowDesigner.dmg`, staged
  `.app`, dmg build temp)

**Modified:**
- `README.md` — short note on the demo page + how to build the `.dmg`.

**Unchanged:**
- Editor internals: `ShadowCanvas.tsx`, `Controls.tsx`, `CodePreview.tsx`,
  `hooks/useShadowState.ts`
- `@happy-shadows/core` and all Swift targets.

## Testing

- **`build-dmg.sh`:** built-in self-check — nonzero exit if the `.dmg` is
  missing; `hdiutil attach`/`detach` round-trip confirms it mounts.
- **Web build:** `pnpm -C packages/web build` (tsc + vite) passes.
- **Visual:** manual pass in the dev server (this matches how the web package
  is verified today — it has no unit-test framework).

## Out of scope

- Apple codesigning / notarization of the macOS app.
- A separate MDX documentation site or blog.
- Release CI automation for producing/uploading the `.dmg`.
- Any change to the shadow engine, editor behavior, or Swift targets.
- framer-motion or other animation dependencies.
