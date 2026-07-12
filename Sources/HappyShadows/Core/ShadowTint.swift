//
//  ShadowTint.swift
//  HappyShadows
//

import SwiftUI

/// Tinted shadow color — real shadows pick up the environment's hue.
///
/// MIRROR of tintShadowColor() in packages/shadow-core/src/tint.ts:
/// keep the surface hue, boost saturation ×1.2 (clamped), drop lightness
/// to ×0.25. Keep in sync.
enum HappyShadowTint {
    static func components(
        surfaceRed r: Double, green g: Double, blue b: Double
    ) -> (r: Double, g: Double, b: Double) {
        let (h, s, l) = rgbToHsl(r, g, b)
        return hslToRgb(h, min(1, s * 1.2), l * 0.25)
    }

    private static func rgbToHsl(_ r: Double, _ g: Double, _ b: Double) -> (Double, Double, Double) {
        let maxC = max(r, g, b)
        let minC = min(r, g, b)
        let l = (maxC + minC) / 2
        if maxC == minC { return (0, 0, l) }
        let d = maxC - minC
        let s = l > 0.5 ? d / (2 - maxC - minC) : d / (maxC + minC)
        let h: Double
        if maxC == r { h = (g - b) / d + (g < b ? 6 : 0) }
        else if maxC == g { h = (b - r) / d + 2 }
        else { h = (r - g) / d + 4 }
        return (h / 6, s, l)
    }

    private static func hslToRgb(_ h: Double, _ s: Double, _ l: Double) -> (r: Double, g: Double, b: Double) {
        if s == 0 { return (l, l, l) }
        let q = l < 0.5 ? l * (1 + s) : l + s - l * s
        let p = 2 * l - q
        return (hue2rgb(p, q, h + 1 / 3), hue2rgb(p, q, h), hue2rgb(p, q, h - 1 / 3))
    }

    private static func hue2rgb(_ p: Double, _ q: Double, _ t: Double) -> Double {
        var t = t
        if t < 0 { t += 1 }
        if t > 1 { t -= 1 }
        if t < 1 / 6 { return p + (q - p) * 6 * t }
        if t < 1 / 2 { return q }
        if t < 2 / 3 { return p + (q - p) * (2 / 3 - t) * 6 }
        return p
    }
}

public extension Color {
    /// A realistic shadow color derived from the surface the shadow falls on:
    /// keeps the surface hue, boosts saturation, and darkens it, instead of
    /// using plain black at low opacity.
    ///
    /// ```swift
    /// view.happyShadow(color: .happyShadowTint(surfaceRed: 0.95, green: 0.93, blue: 0.9), radius: 12, opacity: 0.3)
    /// ```
    static func happyShadowTint(surfaceRed: Double, green: Double, blue: Double) -> Color {
        let c = HappyShadowTint.components(surfaceRed: surfaceRed, green: green, blue: blue)
        return Color(red: c.r, green: c.g, blue: c.b)
    }
}
