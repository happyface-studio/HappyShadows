import XCTest
@testable import HappyShadows

final class LayerModelTests: XCTestCase {
    private struct Fixture: Decodable {
        struct Params: Decodable { let radius: Double; let opacity: Double; let x: Double; let y: Double }
        struct Layer: Decodable { let offsetX: Double; let offsetY: Double; let blurRadius: Double; let alpha: Double }
        let params: Params
        let layers: [Layer]
    }

    private func loadFixture() throws -> Fixture {
        let url = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .appendingPathComponent("Fixtures/v2-layers.json")
        return try JSONDecoder().decode(Fixture.self, from: Data(contentsOf: url))
    }

    func testAlphaWeightsSumToOne() {
        let sum = ShadowConstants.v2Layers.reduce(0.0) { $0 + $1.alphaWeight }
        XCTAssertEqual(sum, 1.0, accuracy: 1e-9)
    }

    func testMatchesSharedFixture() throws {
        let fixture = try loadFixture()
        let layers = ShadowLayerModel.computeLayers(
            radius: fixture.params.radius,
            opacity: fixture.params.opacity,
            x: fixture.params.x,
            y: fixture.params.y
        )
        XCTAssertEqual(layers.count, fixture.layers.count)
        for (got, want) in zip(layers, fixture.layers) {
            XCTAssertEqual(Double(got.offsetX), want.offsetX, accuracy: 1e-6)
            XCTAssertEqual(Double(got.offsetY), want.offsetY, accuracy: 1e-6)
            XCTAssertEqual(Double(got.blurRadius), want.blurRadius, accuracy: 1e-6)
            XCTAssertEqual(got.alpha, want.alpha, accuracy: 1e-6)
        }
    }

    func testElevationDropsShadowByDefault() {
        let p = ElevationModel.parameters(elevation: 16, x: 0, y: 0)
        XCTAssertEqual(p.radius, 16)
        XCTAssertEqual(p.x, 0)
        XCTAssertEqual(p.y, 8, "elevation presets must cast downward without explicit offsets")
    }

    func testElevationOffsetsAreAdditive() {
        let p = ElevationModel.parameters(elevation: 8, x: 3, y: -2)
        XCTAssertEqual(p.x, 3, "x is an additional offset, not scaled by elevation")
        XCTAssertEqual(p.y, 2)
    }

    func testNegativeElevationIsClamped() {
        let p = ElevationModel.parameters(elevation: -4, x: 0, y: 0)
        XCTAssertEqual(p.radius, 0)
        XCTAssertEqual(p.y, 0)
    }
}
