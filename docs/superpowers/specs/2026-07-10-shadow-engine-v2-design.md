# HappyShadows v2 Engine — Design

**Date:** 2026-07-10
**Status:** Approved

## Goal

More physically plausible shadows from the unchanged public API
(`color, radius, opacity, x, y`), at the same or better runtime cost,
rendering consistently across SwiftUI, CSS, Figma, and Framer.

## Background

The v1 engine splits one shadow into 5 layers at fixed divisors
(1/16, 1/8, 1/4, 1/2, 1) of radius/offset, all at the **same opacity**.
Three realism limits:

1. Flat alpha across layers — a real penumbra fades non-linearly.
2. Single-component light model — no separation of directional key light,
   omnidirectional ambient light, and contact occlusion. (The Figma code
   path already has this 3-component split; Swift and CSS do not.)
3. Gray shadows — real shadows pick up the environment's hue.

Performance: static multi-layer `box-shadow` is cheap in CSS; the cost is
*animating* it. In SwiftUI, 5 stacked `.shadow()` modifiers re-render the
view hierarchy 5× per frame.

## 1. Unified layer model

One model everywhere: **contact / key / ambient**, with penumbra easing
inside the key component. 5 layers total — same count as v1.

Given `radius R`, `opacity O`, offset `(x, y)`:

| Layer   | Offset         | Blur      | Alpha weight |
|---------|----------------|-----------|--------------|
| Contact | 0.12 × (x, y)  | 0.25R + 1 | 0.35         |
| Key 1   | 0.40 × (x, y)  | 0.60R     | 0.25         |
| Key 2   | 0.70 × (x, y)  | 1.20R     | 0.15         |
| Key 3   | 1.00 × (x, y)  | 2.00R     | 0.10         |
| Ambient | (0, 0.15y)     | 3.00R     | 0.15         |

- Alpha weights sum to 1.0 × `O`: dense near contact, fading through the
  key layers (penumbra falloff), soft non-directional ambient.
- Constants are defined once in `packages/shadow-core/src/layers.ts`
  (source of truth) and mirrored verbatim in
  `Sources/HappyShadows/Core/SoftShadow.swift`.
- The constants above are initial tuning values; final values are tuned
  visually in ShadowDesigner and updated in both places + this spec.
- **Replaces** the v1 5-divisor engine outright. No API change, no legacy
  mode (package is v0.1). Visual output changes; snapshot exports and the
  README comparison images are regenerated.
- `computeFigmaLayers` collapses into this model (it was the prototype).
- Gradient shadows keep the existing strategy: per-color layer sets with
  opacity divided by color count, now using the v2 layers.

## 2. Tinted shadow color

New helper in shadow-core, with a Swift twin:

```ts
tintShadowColor(shadow: RGBAColor, surface: RGBAColor): RGBAColor
```

Convert `surface` to HSL; keep hue, saturation × 1.2 (clamped to 1),
lightness × 0.25; return with `shadow`'s alpha.

- Opt-in: "Tinted" toggle + surface color picker in the designer UIs.
  Shipped in the web app in this plan; the Figma plugin, Framer plugin,
  and ShadowDesigner pickers are deferred to a follow-up plan (the engine
  itself reaches all targets through shared code).
- Codegen bakes the resulting color into output — zero runtime cost.

## 3. Performance

- **Swift:** insert `.compositingGroup()` before the shadow layer stack in
  `SoftShadow` and `GradientShadow`. Content flattens to one texture, so
  the 5 blur passes operate on a rasterized silhouette instead of
  re-rendering the hierarchy 5×. Also fixes stacked per-subview shadows on
  views with internal transparency (silhouette shadow instead).
- **CSS:** static output unchanged. New `generateAnimatedCSS()` in
  `codegen.ts` emitting the pseudo-element opacity-crossfade pattern
  (base shadow on the element, target shadow on `::after` with
  `opacity: 0` + `transition: opacity`), surfaced as a "CSS (animatable)"
  tab in the web app. Avoids re-blurring every frame when transitioning
  elevation.

## 4. Testing

- shadow-core unit tests: alpha weights sum to 1.0; blur strictly
  increases key 1 → key 2 → key 3 → ambient for all radii, and
  contact < key 1 for radius ≥ 3 (the `+1` floor dominates below that);
  offsets scale linearly with input.
- Swift: regenerate snapshot exports in `Tests/HappyShadowsTests/Exports`.
- Cross-target parity: one shared fixture (`params → expected 5 layers`)
  asserted in both the TS tests and the Swift tests so ports can't drift.

## Scope

Touches: `packages/shadow-core/src/layers.ts`, `codegen.ts`,
`Sources/HappyShadows/Core/SoftShadow.swift`, `GradientShadow.swift`,
`Constants.swift`, designer UIs (tinted toggle + animatable CSS tab),
tests. Nothing else.

Out of scope: light-source elevation parameter, multiple light sources,
inset/inner shadows, runtime backdrop sampling for tint.
