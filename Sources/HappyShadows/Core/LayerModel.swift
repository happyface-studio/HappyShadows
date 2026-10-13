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

/// Maps an elevation preset to shadow parameters.
///
/// Light comes from above: the blur radius equals the elevation and the
/// shadow drops by half of it. `x` / `y` are added on top, so callers can
/// still nudge the direction without flipping it.
enum ElevationModel {
    static func parameters(
        elevation: CGFloat,
        x: CGFloat,
        y: CGFloat
    ) -> (radius: CGFloat, x: CGFloat, y: CGFloat) {
        let elevation = max(0, elevation)
        return (radius: elevation, x: x, y: y + elevation / 2)
    }
}
