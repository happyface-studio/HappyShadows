//
//  Constants.swift
//  HappyShadows
//

import Foundation

/// One layer of the v2 contact/key/ambient shadow model.
struct ShadowLayerSpec {
    let offsetScaleX: CGFloat
    let offsetScaleY: CGFloat
    let blurScale: CGFloat
    let blurFloor: CGFloat
    let alphaWeight: Double
}

/// Internal constants used by the shadow system.
///
/// MIRRORED from packages/shadow-core/src/layers.ts (V2_LAYER_SPECS) and
/// asserted against Tests/HappyShadowsTests/Fixtures/v2-layers.json.
/// A tuning change here must update both.
enum ShadowConstants {
    /// Contact / key 1–3 / ambient. Alpha weights sum to 1.0.
    static let v2Layers: [ShadowLayerSpec] = [
        .init(offsetScaleX: 0.12, offsetScaleY: 0.12, blurScale: 0.25, blurFloor: 1, alphaWeight: 0.35), // contact
        .init(offsetScaleX: 0.4,  offsetScaleY: 0.4,  blurScale: 0.6,  blurFloor: 0, alphaWeight: 0.25), // key 1
        .init(offsetScaleX: 0.7,  offsetScaleY: 0.7,  blurScale: 1.2,  blurFloor: 0, alphaWeight: 0.15), // key 2
        .init(offsetScaleX: 1.0,  offsetScaleY: 1.0,  blurScale: 2.0,  blurFloor: 0, alphaWeight: 0.1),  // key 3
        .init(offsetScaleX: 0,    offsetScaleY: 0.15, blurScale: 3.0,  blurFloor: 0, alphaWeight: 0.15), // ambient
    ]
}
