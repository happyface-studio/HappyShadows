//
//  LayerModel.swift
//  HappyShadows
//

import Foundation

/// A fully-resolved shadow layer: what actually gets drawn.
struct ResolvedShadowLayer: Equatable {
    let offsetX: CGFloat
    let offsetY: CGFloat
    let blurRadius: CGFloat
    let alpha: Double
}

/// Resolves the v2 layer specs against concrete shadow parameters.
/// Mirrors computeLayers() in packages/shadow-core/src/layers.ts.
enum ShadowLayerModel {
    static func computeLayers(
        radius: CGFloat,
        opacity: Double,
        x: CGFloat,
        y: CGFloat
    ) -> [ResolvedShadowLayer] {
        ShadowConstants.v2Layers.map { spec in
            ResolvedShadowLayer(
                offsetX: x * spec.offsetScaleX,
                offsetY: y * spec.offsetScaleY,
                blurRadius: radius * spec.blurScale + spec.blurFloor,
                alpha: opacity * spec.alphaWeight
            )
        }
    }
}
