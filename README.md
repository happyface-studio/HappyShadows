![Cover Image](/Tests/HappyShadowsTests/Exports/cover.png)

HappyShadows is a SwiftUI package that provides more realistic, layered shadows that better mimic natural light behavior. It enhances the default SwiftUI shadow by using multiple shadow layers with varying intensities and spreads.

Includes **ShadowDesigner**, a companion macOS app for visually designing shadows and copying the code.

## Features

- Realistic shadow rendering with 5 layered shadows
- Simple SwiftUI modifier API (`.happyShadow()`, `.happyGradientShadow()`)
- Elevation-based shadow presets
- Fully customizable shadow color, radius, opacity, and offset
- Dynamic shadow adaptation based on offset
- Support for gradient shadows (linear, angular, radial, elliptical)
- Works on iOS, macOS, tvOS, watchOS, and visionOS

## Installation

Add the following dependency to your project:

```swift
dependencies: [
    .package(url: "https://github.com/HappyFaceStudios/HappyShadows.git", from: "0.1")
]
```

Then import HappyShadows in your SwiftUI files:

```swift
import HappyShadows
```

## Basic Shadows

Replace your existing shadows with realistic ones in one step. Just swap `.shadow()` with `.happyShadow()`.

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
| `radius` | `CGFloat` | `0` | Blur radius |
| `opacity` | `Double` | `0.25` | Shadow opacity (0.0 - 1.0) |
| `x` | `CGFloat` | `0` | Horizontal offset |
| `y` | `CGFloat` | `0` | Vertical offset |

## Elevation-based Shadows

Create consistent shadows across your app using elevation levels. Higher elevation means more prominent shadows.

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
                .foregroundColor(.secondary)
        }
        .padding(20)
        .background(Color.white)
        .cornerRadius(16)
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

## How It Works

HappyShadows creates a more natural shadow effect by combining five shadow layers with different intensities and spreads:

1. **Tight shadow** (1/16 of the base values)
2. **Medium shadow** (1/8 of the base values)
3. **Wide shadow** (1/4 of the base values)
4. **Broader shadow** (1/2 of the base values)
5. **Broadest shadow** (full base values)

This layered approach better mimics how shadows appear in the physical world, compared to SwiftUI's single-layer `.shadow()` modifier.

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
