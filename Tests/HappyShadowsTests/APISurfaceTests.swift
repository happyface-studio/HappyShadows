import SwiftUI
import XCTest
@testable import HappyShadows

/// Compile-time guards for the call forms shown in the README and on the
/// demo site. If this file stops compiling, the documented examples are
/// broken for users too.
@MainActor
final class APISurfaceTests: XCTestCase {
    func testDocumentedCallFormsCompile() {
        let card = RoundedRectangle(cornerRadius: 16).fill(.white)

        // "Swap .shadow() for .happyShadow()"
        _ = card.happyShadow()
        _ = card.happyShadow(opacity: 0.3)

        // Basic
        _ = card.happyShadow(color: .black, radius: 12, opacity: 0.25, x: 0, y: 6)

        // Elevation presets
        _ = card.happyShadow(elevation: 4)
        _ = card.happyShadow(color: .black, elevation: 16, opacity: 0.2)

        // Gradient — same argument order as happyShadow
        _ = card.happyGradientShadow(
            gradient: .linearGradient(
                colors: [.blue, .purple],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            ),
            radius: 16,
            opacity: 0.2,
            y: 8
        )
        _ = card.happyGradientShadow(gradient: .radialGradient(colors: [.pink, .orange], center: .center, startRadius: 0, endRadius: 80), y: 4)

        // Surface tint
        _ = card.happyShadow(
            color: .happyShadowTint(surfaceRed: 0.2, green: 0.4, blue: 0.8),
            radius: 12,
            opacity: 0.3,
            y: 6
        )
    }
}
