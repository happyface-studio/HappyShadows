// The Swift Programming Language
// https://docs.swift.org/swift-book

import SwiftUI

/// A view modifier that creates realistic shadows by combining multiple layers with varying intensities.
///
/// `SoftShadow` improves upon SwiftUI's native shadow by using a multi-layered approach that better
/// simulates real-world lighting conditions. Each shadow layer has different properties that combine
/// to create a more natural-looking shadow effect.
///
/// Example usage:
/// ```swift
/// Text("Hello")
///     .padding()
///     .background(Color.white)
///     .happyShadow(
///         color: .black,
///         radius: 8,
///         opacity: 0.25,
///         x: 0,
///         y: 4
///     )
/// ```
public struct SoftShadow: ViewModifier {
    private let color: Color
    private let radius: CGFloat
    private let opacity: Double
    private let xOffset: CGFloat
    private let yOffset: CGFloat

    /// Creates a new soft shadow modifier.
    /// - Parameters:
    ///   - color: The color of the shadow.
    ///   - radius: The blur radius of the shadow.
    ///   - opacity: The opacity of the shadow (0.0-1.0).
    ///   - xOffset: Horizontal offset of the shadow.
    ///   - yOffset: Vertical offset of the shadow.
    public init(
        color: Color = .black,
        radius: CGFloat = 8,
        opacity: Double = 0.25,
        xOffset: CGFloat = 0,
        yOffset: CGFloat = 0
    ) {
        self.color = color
        self.radius = radius
        self.opacity = opacity
        self.xOffset = xOffset
        self.yOffset = yOffset
    }

    public func body(content: Content) -> some View {
        let layers = ShadowLayerModel.computeLayers(
            radius: radius, opacity: opacity, x: xOffset, y: yOffset
        )
        // compositingGroup flattens the content to one texture first, so the
        // five blur passes run on a rasterized silhouette instead of
        // re-rendering the view hierarchy five times.
        // Trade-off (deliberate): chained .shadow modifiers compound — each
        // layer also shadows the earlier ones — so the result is a little
        // darker near the edge than the CSS box-shadow list of the same
        // layers. Drawing layers independently would match CSS but render
        // the content 6x; see README "How It Works".
        return content
            .compositingGroup()
            .shadow(color: color.opacity(layers[0].alpha), radius: layers[0].blurRadius, x: layers[0].offsetX, y: layers[0].offsetY)
            .shadow(color: color.opacity(layers[1].alpha), radius: layers[1].blurRadius, x: layers[1].offsetX, y: layers[1].offsetY)
            .shadow(color: color.opacity(layers[2].alpha), radius: layers[2].blurRadius, x: layers[2].offsetX, y: layers[2].offsetY)
            .shadow(color: color.opacity(layers[3].alpha), radius: layers[3].blurRadius, x: layers[3].offsetX, y: layers[3].offsetY)
            .shadow(color: color.opacity(layers[4].alpha), radius: layers[4].blurRadius, x: layers[4].offsetX, y: layers[4].offsetY)
    }
}
