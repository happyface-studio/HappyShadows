![Cover Image](/Tests/HappyShadowsTests/Exports/cover.png)

HappyShadows is a SwiftUI package that provides more realistic, layered shadows that better mimic natural light behavior. It enhances the default SwiftUI shadow by using multiple shadow layers with varying intensities and spreads.

Includes **ShadowDesigner**, a companion macOS app for visually designing shadows and copying the code.

## Features

- Realistic shadow rendering with 5 layered shadows
- Simple SwiftUI modifier API (`.happyShadow()`, `.happyGradientShadow()`)
- Elevation-based shadow presets
- Fully customizable shadow color, radius, opacity, and offset
- Physically-motivated layer model: contact, key (with penumbra falloff), and ambient shadows
- Surface-tinted shadow colors via `Color.happyShadowTint(surfaceRed:green:blue:)`
- Support for gradient shadows (linear, angular, radial, elliptical)
- Works on iOS, macOS, tvOS, watchOS, and visionOS

## Installation

Add the following dependency to your project:

```swift
dependencies: [
    .package(url: "https://github.com/happyface-studio/HappyShadows.git", from: "0.1.0")
]
```

Then import HappyShadows in your SwiftUI files:

```swift
import HappyShadows
```

## Basic Shadows

Replace your existing shadows with realistic ones in one step. Just swap `.shadow()` with `.happyShadow()` — with no arguments you get a soft black shadow (radius 8, opacity 0.25).

![Comparison](/Tests/HappyShadowsTests/Exports/comparison.png)

```swift
view.happyShadow(
    color: .black,
    radius: 12,
    opacity: 0.25,
    x: 0,
    y: 6
)
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `color` | `Color` | `.black` | Shadow color |
| `radius` | `CGFloat` | `8` | Blur radius |
| `opacity` | `Double` | `0.25` | Shadow opacity (0.0 - 1.0) |
| `x` | `CGFloat` | `0` | Horizontal offset |
| `y` | `CGFloat` | `0` | Vertical offset |

## Elevation-based Shadows

Create consistent shadows across your app using elevation levels. Higher elevation means more prominent shadows: the blur radius equals the elevation and the shadow drops by half of it (light from above). Optional `x` / `y` are added on top.

![Elevation](/Tests/HappyShadowsTests/Exports/elevation.png)

```swift
view.happyShadow(elevation: 4)  // Subtle (buttons, cards)
view.happyShadow(elevation: 8)  // Medium (floating elements)
view.happyShadow(elevation: 16) // High (modals, popovers)
```

## Gradient Shadows

Add depth with gradient shadows. Works with any SwiftUI gradient type: `LinearGradient`, `AngularGradient`, `RadialGradient`, and `EllipticalGradient`.

![Gradients](/Tests/HappyShadowsTests/Exports/gradients.png)

```swift
view.happyGradientShadow(
    gradient: .linearGradient(
        colors: [.blue, .purple],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    ),
    radius: 16,
    opacity: 0.2,
    y: 8
)
```

## Example

```swift
struct ShadowCard: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Title")
                .font(.headline)
            Text("Description")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .padding(20)
        .background(.white, in: RoundedRectangle(cornerRadius: 16))
        .happyShadow(
            color: .black,
            radius: 12,
            opacity: 0.25,
            y: 6
        )
    }
}
```

## ShadowDesigner (macOS App)

A companion macOS app for visually designing shadows and copying the generated SwiftUI code.

**Features:**
- Drag a light source around a canvas to control shadow direction and spread
- Brightness knob to fine-tune shadow opacity
- Color picker to choose any shadow color
- Dark/light background preview toggle
- Live code preview with one-click copy

**Run from terminal:**

```bash
swift run ShadowDesigner
```

**Or open in Xcode:**

```bash
open ShadowDesigner/ShadowDesigner.xcodeproj
```

Select the ShadowDesigner scheme and press Cmd+R.

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

## How It Works

HappyShadows splits each shadow into 5 physically-motivated layers — a contact shadow, three key-light layers with penumbra falloff, and one ambient layer. Alpha weights sum to 1.0 so the combined intensity matches your `opacity` input:

| Layer   | Offset         | Blur      | Share of opacity |
|---------|----------------|-----------|------------------|
| Contact | 0.12 × (x, y)  | 0.25R + 1 | 35%              |
| Key 1   | 0.40 × (x, y)  | 0.60R     | 25%              |
| Key 2   | 0.70 × (x, y)  | 1.20R     | 15%              |
| Key 3   | 1.00 × (x, y)  | 2.00R     | 10%              |
| Ambient | (0, 0.15y)     | 3.00R     | 15%              |

## Development

```bash
swift build && swift test              # library, ShadowDesigner and tests
pnpm -C packages/shadow-core test      # TypeScript engine (shares the layer fixture with Swift)
```

The README images in `Tests/HappyShadowsTests/Exports/` are rendered by an opt-in test (macOS):

```bash
HAPPYSHADOWS_EXPORT_MARKETING=1 swift test --filter MarketingTests
```

## Platform Support

| Platform | Minimum Version |
|----------|----------------|
| iOS | 17.0 |
| macOS | 14.0 |
| tvOS | 17.0 |
| watchOS | 10.0 |
| visionOS | 1.0 |

## Tips for Best Results

1. **Background Contrast** - Shadows are more visible on lighter backgrounds. Adjust opacity based on your background color.

2. **Performance** - Use `compositingGroup()` for complex views. Avoid applying to many small elements simultaneously.

3. **Design** - Keep shadows subtle for most UI elements. Maintain consistent light source direction across your app.

## License

This package is available under the MIT license. See the LICENSE file for more info.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Made by HappyFace Studios
