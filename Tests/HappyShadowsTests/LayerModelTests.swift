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
}
