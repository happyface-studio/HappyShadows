//
//  View+Ext.swift
//  HappyShadows
//
//  Created by HappyFace Studios on 2025/02/18.
//

import SwiftUI

public extension View {
    /// Applies a realistic, multi-layered shadow effect that provides better depth perception than SwiftUI's native shadow.
    ///
    /// The soft shadow effect is created by combining multiple shadow layers with different intensities and offsets,
    /// resulting in a more natural-looking shadow that better simulates real-world lighting.
    ///
    /// ```swift
    /// Text("Hello World")
    ///     .happyShadow(
    ///         color: .black,
    ///         radius: 8,
    ///         opacity: 0.25,
    ///         x: 0,
    ///         y: 4
    ///     )
    /// ```
    ///
    /// - Parameters:
    ///   - color: The color of the shadow. Defaults to black.
    ///   - radius: The blur radius of the shadow. Larger values create softer shadows. Negative values are treated as 0. Defaults to 8.
    ///   - opacity: The opacity of the shadow, ranging from 0 to 1. Defaults to 0.25.
    ///   - x: The horizontal offset of the shadow. Positive values move right, negative left. Defaults to 0.
    ///   - y: The vertical offset of the shadow. Positive values move down, negative up. Defaults to 0.
    /// - Returns: A view with the soft shadow effect applied.
    func happyShadow(
        color: Color = .black,
        radius: CGFloat = 8,
        opacity: Double = 0.25,
        x: CGFloat = 0,
        y: CGFloat = 0
    ) -> some View {
        modifier(
            SoftShadow(
                color: color,
                radius: max(0, radius),
                opacity: opacity,
                xOffset: x,
                yOffset: y
            )
        )
    }

    /// Applies a soft shadow sized from an elevation value, for consistent shadow hierarchies.
    ///
    /// Higher elevations produce larger, softer shadows.
    ///
    /// ```swift
    /// VStack {
    ///     Text("Card 1").happyShadow(elevation: 2)
    ///     Text("Card 2").happyShadow(elevation: 8)
    /// }
    /// ```
    ///
    /// - Parameters:
    ///   - color: The shadow color. Defaults to black.
    ///   - elevation: The height of the surface in points. Higher values create larger shadows.
    ///   - opacity: The shadow opacity, ranging from 0 to 1. Defaults to 0.25.
    ///   - x: Additional horizontal offset. Defaults to 0.
    ///   - y: Additional vertical offset. Defaults to 0.
    /// - Returns: A view with elevation-based shadow applied.
    func happyShadow(
        color: Color = .black,
        elevation: CGFloat,
        opacity: Double = 0.25,
        x: CGFloat = 0,
        y: CGFloat = 0
    ) -> some View {
        modifier(
            SoftShadow(
                color: color,
                radius: elevation,
                opacity: opacity,
                xOffset: x == 0 ? 0 : x + (elevation / 2),
                yOffset: y == 0 ? 0 : y + (elevation / 2)
            )
        )
    }

    /// Applies a gradient shadow effect with customizable properties.
    ///
    /// This modifier creates a shadow effect using any SwiftUI gradient type, allowing for
    /// creative shadow effects that can enhance your UI's visual hierarchy.
    ///
    /// ```swift
    /// Text("Gradient Shadow")
    ///     .happyGradientShadow(
    ///         gradient: LinearGradient(
    ///             colors: [.blue, .purple],
    ///             startPoint: .topLeading,
    ///             endPoint: .bottomTrailing
    ///         ),
    ///         radius: 10,
    ///         opacity: 0.3
    ///     )
    /// ```
    ///
    /// - Parameters:
    ///   - gradient: The gradient to use for the shadow.
    ///   - radius: The blur radius of the shadow. Negative values are treated as 0. Defaults to 8.
    ///   - opacity: The opacity of the shadow (0.0-1.0). Defaults to 0.25.
    ///   - x: Horizontal offset of the shadow. Defaults to 0.
    ///   - y: Vertical offset of the shadow. Defaults to 0.
    /// - Returns: A view with the gradient shadow effect applied.
    func happyGradientShadow<G: GradientStyle>(
        gradient: G = LinearGradient(
            colors: [.red, .blue],
            startPoint: .top,
            endPoint: .bottom
        ),
        radius: CGFloat = 8,
        opacity: Double = 0.25,
        x: CGFloat = 0,
        y: CGFloat = 0
    ) -> some View {
        modifier(
            GradientShadow(
                gradient: gradient,
                radius: max(0, radius),
                opacity: opacity,
                xOffset: x,
                yOffset: y
            )
        )
    }

    /// Pre-0.2 argument order (`opacity` before `radius`).
    ///
    /// Kept so existing call sites keep compiling; prefer
    /// ``happyGradientShadow(gradient:radius:opacity:x:y:)``, which matches
    /// the argument order of ``happyShadow(color:radius:opacity:x:y:)``.
    @available(*, deprecated, message: "Pass radius before opacity, matching happyShadow(color:radius:opacity:x:y:).")
    func happyGradientShadow<G: GradientStyle>(
        gradient: G = LinearGradient(
            colors: [.red, .blue],
            startPoint: .top,
            endPoint: .bottom
        ),
        opacity: Double,
        radius: CGFloat,
        x: CGFloat = 0,
        y: CGFloat = 0
    ) -> some View {
        happyGradientShadow(gradient: gradient, radius: radius, opacity: opacity, x: x, y: y)
    }
}
