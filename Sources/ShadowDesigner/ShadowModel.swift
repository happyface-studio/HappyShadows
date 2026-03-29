import SwiftUI
import AppKit

@Observable
final class ShadowModel {
    var lightOffset = CGSize(width: 30, height: -100)
    var knobAngle: Double = -.pi / 2
    var knobDistance: CGFloat = 35
    var gradientColors: [Color] = [.black, .purple]
    var isGradient = false
    var isDarkBackground = false

    let knobMinDistance: CGFloat = 22
    let knobMaxDistance: CGFloat = 60

    /// First color is always the "main" shadow color
    var shadowColor: Color {
        get { gradientColors[0] }
        set { gradientColors[0] = newValue }
    }

    // MARK: - Derived shadow properties

    var shadowX: CGFloat { -lightOffset.width * 0.09 }
    var shadowY: CGFloat { -lightOffset.height * 0.09 }

    var shadowRadius: CGFloat {
        2 + CGFloat(normalizedAngle) * 30
    }

    var shadowOpacity: Double {
        let range = Double(knobMaxDistance - knobMinDistance)
        let normalized = Double(knobDistance - knobMinDistance) / range
        return 0.05 + normalized * 0.35
    }

    var brightness: Int {
        Int((shadowOpacity / 0.40) * 100)
    }

    private var normalizedAngle: Double {
        var a = knobAngle + .pi / 2
        if a < 0 { a += 2 * .pi }
        return a / (2 * .pi)
    }

    var backgroundColor: Color {
        isDarkBackground ? Color(white: 0.15) : Color(white: 0.93)
    }

    var cardColor: Color {
        isDarkBackground ? Color(white: 0.22) : Color.white
    }

    var codeBgColor: Color {
        isDarkBackground ? Color(white: 0.12) : Color(white: 0.93)
    }

    var buttonBgColor: Color {
        isDarkBackground ? Color(white: 0.22) : Color(white: 0.88)
    }

    // MARK: - Gradient

    var gradientForShadow: LinearGradient {
        LinearGradient(
            colors: gradientColors,
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    func addColor() {
        gradientColors.append(.blue)
    }

    func removeLastColor() {
        guard gradientColors.count > 2 else { return }
        gradientColors.removeLast()
    }

    // MARK: - Code generation

    var codeSnippet: String {
        if isGradient {
            let colorsList = gradientColors.map { codeForColor($0) }.joined(separator: ", ")
            return """
            .happyGradientShadow(
                gradient: LinearGradient(
                    colors: [\(colorsList)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                ),
                opacity: \(fmtOp(shadowOpacity)),
                radius: \(fmt(shadowRadius)),
                x: \(fmt(shadowX)),
                y: \(fmt(shadowY))
            )
            """
        } else {
            return """
            .happyShadow(
                color: \(codeForColor(shadowColor)),
                radius: \(fmt(shadowRadius)),
                opacity: \(fmtOp(shadowOpacity)),
                x: \(fmt(shadowX)),
                y: \(fmt(shadowY))
            )
            """
        }
    }

    var colorName: String {
        nameForColor(shadowColor)
    }

    private func nameForColor(_ color: Color) -> String {
        guard let c = NSColor(color).usingColorSpace(.sRGB) else { return "Black" }
        let r = Double(c.redComponent)
        let g = Double(c.greenComponent)
        let b = Double(c.blueComponent)
        if r < 0.01 && g < 0.01 && b < 0.01 { return "Black" }
        if r > 0.99 && g > 0.99 && b > 0.99 { return "White" }
        if r > 0.9 && g < 0.1 && b < 0.1 { return "Red" }
        if r < 0.1 && g > 0.9 && b < 0.1 { return "Green" }
        if r < 0.1 && g < 0.1 && b > 0.9 { return "Blue" }
        if r > 0.9 && g > 0.5 && b < 0.1 { return "Orange" }
        if r > 0.9 && g > 0.9 && b < 0.1 { return "Yellow" }
        if r > 0.5 && g < 0.2 && b > 0.5 { return "Purple" }
        if r > 0.9 && g < 0.5 && b > 0.5 { return "Pink" }
        return String(format: "#%02X%02X%02X", Int(r * 255), Int(g * 255), Int(b * 255))
    }

    func codeForColor(_ color: Color) -> String {
        guard let c = NSColor(color).usingColorSpace(.sRGB) else { return ".black" }
        let r = Double(c.redComponent)
        let g = Double(c.greenComponent)
        let b = Double(c.blueComponent)
        if r < 0.01 && g < 0.01 && b < 0.01 { return ".black" }
        if r > 0.99 && g > 0.99 && b > 0.99 { return ".white" }
        return "Color(red: \(fmtC(r)), green: \(fmtC(g)), blue: \(fmtC(b)))"
    }

    func copyCode() {
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(codeSnippet, forType: .string)
    }

    // MARK: - Formatting

    private func fmt(_ v: CGFloat) -> String {
        let r = (v * 10).rounded() / 10
        if r == 0 { return "0" }
        return r == r.rounded() ? String(format: "%.0f", r) : String(format: "%.1f", r)
    }

    private func fmtOp(_ v: Double) -> String {
        String(format: "%.2f", (v * 100).rounded() / 100)
    }

    private func fmtC(_ v: Double) -> String {
        String(format: "%.2f", (v * 100).rounded() / 100)
    }
}
