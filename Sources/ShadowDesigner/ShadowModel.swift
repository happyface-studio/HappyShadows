import SwiftUI
import AppKit

@Observable
final class ShadowModel {
    var lightOffset = CGSize(width: 30, height: -100)
    var brightnessValue: Double = 0.6
    var shadowColor: Color = .black
    var isDarkBackground = false

    // MARK: - Derived shadow properties

    var shadowX: CGFloat { -lightOffset.width * 0.09 }
    var shadowY: CGFloat { -lightOffset.height * 0.09 }

    var distance: CGFloat {
        sqrt(lightOffset.width * lightOffset.width + lightOffset.height * lightOffset.height)
    }

    var shadowRadius: CGFloat { 2 + min(distance / 250, 1.0) * 30 }

    var brightness: Int { max(0, min(100, Int(brightnessValue * 100))) }

    /// Opacity ranges from 0.01 (knob fully down) to 0.40 (knob fully up)
    var shadowOpacity: Double { 0.01 + brightnessValue * 0.39 }

    var knobDistance: CGFloat { 22 + CGFloat(brightnessValue) * 30 }

    var backgroundColor: Color {
        isDarkBackground ? Color(white: 0.15) : Color(white: 0.93)
    }

    var cardColor: Color {
        isDarkBackground ? Color(white: 0.22) : Color.white
    }

    // MARK: - Code generation

    var codeSnippet: String {
        """
        .happyShadow(
            color: \(colorCode),
            radius: \(fmt(shadowRadius)),
            opacity: \(fmtOp(shadowOpacity)),
            x: \(fmt(shadowX)),
            y: \(fmt(shadowY))
        )
        """
    }

    private var colorCode: String {
        guard let c = NSColor(shadowColor).usingColorSpace(.sRGB) else { return ".black" }
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
