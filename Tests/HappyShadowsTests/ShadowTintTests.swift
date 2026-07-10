import XCTest
@testable import HappyShadows

final class ShadowTintTests: XCTestCase {
    private struct TintFixture: Decodable {
        struct RGB: Decodable { let r: Double; let g: Double; let b: Double }
        struct Expected: Decodable { let r: Double; let g: Double; let b: Double; let a: Double }
        let surface: RGB
        let expected: Expected
    }

    func testMatchesSharedFixture() throws {
        let url = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .appendingPathComponent("Fixtures/v2-layers.json")
        struct Root: Decodable { let tint: TintFixture }
        let fixture = try JSONDecoder().decode(Root.self, from: Data(contentsOf: url)).tint
        let out = HappyShadowTint.components(
            surfaceRed: fixture.surface.r,
            green: fixture.surface.g,
            blue: fixture.surface.b
        )
        XCTAssertEqual(out.r, fixture.expected.r, accuracy: 1e-6)
        XCTAssertEqual(out.g, fixture.expected.g, accuracy: 1e-6)
        XCTAssertEqual(out.b, fixture.expected.b, accuracy: 1e-6)
    }

    func testGraySurfaceStaysGray() {
        let out = HappyShadowTint.components(surfaceRed: 0.5, green: 0.5, blue: 0.5)
        XCTAssertEqual(out.r, out.g, accuracy: 1e-9)
        XCTAssertEqual(out.g, out.b, accuracy: 1e-9)
        XCTAssertEqual(out.r, 0.125, accuracy: 1e-9)
    }
}
