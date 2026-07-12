import XCTest
@testable import HappyShadows

final class ShadowTintTests: XCTestCase {
    private struct TintFixture: Decodable {
        struct RGB: Decodable { let r: Double; let g: Double; let b: Double }
        struct Expected: Decodable { let r: Double; let g: Double; let b: Double; let a: Double }
        let name: String
        let surface: RGB
        let expected: Expected
    }

    func testMatchesSharedFixture() throws {
        let url = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .appendingPathComponent("Fixtures/v2-layers.json")
        struct Root: Decodable { let tints: [TintFixture] }
        let fixtures = try JSONDecoder().decode(Root.self, from: Data(contentsOf: url)).tints
        XCTAssertFalse(fixtures.isEmpty)
        for fixture in fixtures {
            let out = HappyShadowTint.components(
                surfaceRed: fixture.surface.r,
                green: fixture.surface.g,
                blue: fixture.surface.b
            )
            XCTAssertEqual(out.r, fixture.expected.r, accuracy: 1e-6, fixture.name)
            XCTAssertEqual(out.g, fixture.expected.g, accuracy: 1e-6, fixture.name)
            XCTAssertEqual(out.b, fixture.expected.b, accuracy: 1e-6, fixture.name)
        }
    }

    func testGraySurfaceStaysGray() {
        let out = HappyShadowTint.components(surfaceRed: 0.5, green: 0.5, blue: 0.5)
        XCTAssertEqual(out.r, out.g, accuracy: 1e-9)
        XCTAssertEqual(out.g, out.b, accuracy: 1e-9)
        XCTAssertEqual(out.r, 0.125, accuracy: 1e-9)
    }
}
