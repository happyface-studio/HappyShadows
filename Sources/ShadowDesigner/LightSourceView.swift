import SwiftUI

/// Sun icon with a glowing white thumb, dashed rays, and a stem to the brightness knob.
struct LightSourceView: View {
    let brightness: Double
    let knobDistance: CGFloat
    let tint: Color

    private let sunRadius: CGFloat = 12
    private let rayCount = 8
    private let viewSize: CGFloat = 140

    var body: some View {
        ZStack {
            // Rays + stem drawn in Canvas
            Canvas { context, size in
                let center = CGPoint(x: size.width / 2, y: size.height / 2)
                let alpha = 0.4 + brightness * 0.5
                let color = tint.opacity(alpha)

                // Stem line from sun edge up to knob
                var stem = Path()
                stem.move(to: CGPoint(x: center.x, y: center.y - sunRadius - 4))
                stem.addLine(to: CGPoint(x: center.x, y: center.y - knobDistance))
                context.stroke(stem, with: .color(Color.blue.opacity(alpha)),
                    style: StrokeStyle(lineWidth: 1, dash: [3, 3]))

                // Rays
                for i in 0..<rayCount {
                    let angle = Double(i) * .pi * 2 / Double(rayCount)
                    let startR = sunRadius + 6
                    let endR = startR + 5 + CGFloat(brightness) * 12

                    var path = Path()
                    path.move(to: CGPoint(
                        x: center.x + cos(angle) * startR,
                        y: center.y + sin(angle) * startR
                    ))
                    path.addLine(to: CGPoint(
                        x: center.x + cos(angle) * endR,
                        y: center.y + sin(angle) * endR
                    ))
                    context.stroke(path, with: .color(color),
                        style: StrokeStyle(lineWidth: 1.5, dash: [3, 2.5]))
                }
            }
            .frame(width: viewSize, height: viewSize)

            // Glowing sun thumb
            Circle()
                .fill(.white)
                .frame(width: sunRadius * 2, height: sunRadius * 2)
                .shadow(color: .white.opacity(0.5 + brightness * 0.5), radius: 6 + CGFloat(brightness) * 8)
                .shadow(color: .yellow.opacity(0.15 + brightness * 0.25), radius: 10 + CGFloat(brightness) * 14)
                .overlay(
                    Circle()
                        .stroke(Color.gray.opacity(0.35), lineWidth: 1)
                )
        }
        .frame(width: viewSize, height: viewSize)
        .allowsHitTesting(false)
    }
}
