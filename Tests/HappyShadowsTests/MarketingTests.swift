import XCTest
@testable import HappyShadows

/// Regenerates the README images in `Tests/HappyShadowsTests/Exports/`.
///
/// Opt-in so that a plain `swift test` (locally or in CI) never rewrites
/// tracked files. Run it with:
///
///     HAPPYSHADOWS_EXPORT_MARKETING=1 swift test --filter MarketingTests
@MainActor
final class MarketingTests: XCTestCase {
    func testGenerateMarketingAssets() throws {
        #if os(macOS)
        try XCTSkipUnless(
            ProcessInfo.processInfo.environment["HAPPYSHADOWS_EXPORT_MARKETING"] == "1",
            "Set HAPPYSHADOWS_EXPORT_MARKETING=1 to regenerate the README images."
        )
        MarketingAssets.generateAssets()
        #else
        throw XCTSkip("Marketing assets are rendered on macOS only.")
        #endif
    }
}
