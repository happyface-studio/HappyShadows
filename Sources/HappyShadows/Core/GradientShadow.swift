//
//  GradientShadow.swift
//  HappyShadows
//
//  Created by HappyFace Studios on 2025-02-17.
//

import SwiftUI

///  A view modifier that creates a multi-layered gradient shadow effect.
///
///  `GradientShadow` uses multiple layers of gradient-based shadows to create a rich,
///  depth-enhancing effect that can use any SwiftUI gradient type.
///
///  Example usage:
///  ```swift
///  Text("Hello")
///      .padding()
///      .background(Color.white)
///      .happyGradientShadow(
///          gradient: LinearGradient(colors: [.blue, .purple], 
///                                 startPoint: .topLeading,
///                                 endPoint: .bottomTrailing),
///          radius: 10,
///          opacity: 0.3
///      )
///  ```
public struct GradientShadow<G: GradientStyle>: ViewModifier {
    private let gradient: G
    private let radius: CGFloat
    private let opacity: Double
    private let xOffset: CGFloat
    private let yOffset: CGFloat

    /// Creates a new gradient shadow modifier.
    /// - Parameters:
    ///   - gradient: The gradient to use for the shadow effect.
    ///   - radius: The blur radius of the shadow.
    ///   - opacity: The opacity of the shadow (0.0-1.0).
    ///   - xOffset: Horizontal offset of the shadow.
    ///   - yOffset: Vertical offset of the shadow.
    public init(
        gradient: G,
        radius: CGFloat,
        opacity: Double,
        xOffset: CGFloat,
        yOffset: CGFloat
    ) {
        self.gradient = gradient
        self.radius = radius
        self.opacity = opacity
        self.xOffset = xOffset
        self.yOffset = yOffset
    }

    public func body(content: Content) -> some View {
        let layers = ShadowLayerModel.computeLayers(
            radius: radius, opacity: opacity, x: xOffset, y: yOffset
        )
        // Every layer is masked by the original content, side by side in one
        // background. (Chaining one `.background` per layer made each layer's
        // mask include all earlier layers: the content was rendered 2^5 = 32
        // times and outer layers grew from blurred shadows, not the silhouette.)
        // Reversed so the contact layer sits closest to the content.
        return content
            .background {
                ZStack {
                    ForEach(Array(layers.indices.reversed()), id: \.self) { index in
                        let layer = layers[index]
                        Rectangle()
                            .fill(gradient)
                            .opacity(layer.alpha)
                            .mask {
                                content
                            }
                            .offset(x: layer.offsetX, y: layer.offsetY)
                            .blur(radius: layer.blurRadius)
                    }
                }
            }
    }
}
