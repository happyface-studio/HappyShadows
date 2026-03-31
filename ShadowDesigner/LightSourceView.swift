import SwiftUI

/// Sun icon with a glowing white thumb, dashed rays, and an orbit ring for the radius knob.
struct LightSourceView: View {
    let orbitalRadius: CGFloat
    let tint: Color

    private let sunRadius: CGFloat = 12
    private let rayCount = 8
    private let viewSize: CGFloat = 140

    var body: some View {
        ZStack {
            // Rays + orbit ring drawn in Canvas
            Canvas { context, size in
                let center = CGPoint(x: size.width / 2, y: size.height / 2)
                let color = tint.opacity(0.6)

                // Orbit ring
                let orbitRect = CGRect(
                    x: center.x - orbitalRadius,
                    y: center.y - orbitalRadius,
                    width: orbitalRadius * 2,
                    height: orbitalRadius * 2
                )
                context.stroke(
                    Path(ellipseIn: orbitRect),
                    with: .color(Color.blue.opacity(0.25)),
                    style: StrokeStyle(lineWidth: 1, dash: [4, 3])
                )

                // Rays
                for i in 0..<rayCount {
                    let angle = Double(i) * .pi * 2 / Double(rayCount)
                    let startR = sunRadius + 6
                    let endR = startR + 12

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
                .shadow(color: .white.opacity(0.7), radius: 10)
                .shadow(color: .yellow.opacity(0.3), radius: 18)
                .overlay(
                    Circle()
                        .stroke(Color.gray.opacity(0.35), lineWidth: 1)
                )
        }
        .frame(width: viewSize, height: viewSize)
        .allowsHitTesting(false)
    }
}
