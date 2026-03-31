import SwiftUI
import AppKit
import HappyShadows

struct ContentView: View {
    @State private var model = ShadowModel()
    @State private var showCopied = false

    var body: some View {
        VStack(spacing: 16) {
            shadowCanvas
            controlsRow
            codePreview
            bottomBar
        }
        .padding(20)
        .frame(width: 500, height: 700)
        .background(Color(nsColor: .windowBackgroundColor))
    }

    // MARK: - Canvas

    private var shadowCanvas: some View {
        GeometryReader { geo in
            let center = CGPoint(x: geo.size.width / 2, y: geo.size.height * 0.58)
            let lightPos = CGPoint(
                x: center.x + model.lightOffset.width,
                y: center.y + model.lightOffset.height
            )
            let knobPos = CGPoint(
                x: lightPos.x + cos(model.knobAngle) * model.knobDistance,
                y: lightPos.y + sin(model.knobAngle) * model.knobDistance
            )

            ZStack {
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(model.backgroundColor)
                    .animation(.easeInOut(duration: 0.25), value: model.isDarkBackground)

                previewCard
                    .position(center)
                    .allowsHitTesting(false)

                LightSourceView(
                    orbitalRadius: model.knobDistance,
                    tint: model.isGradient ? model.gradientColors.last! : model.shadowColor
                )
                .position(lightPos)

                Color.clear
                    .contentShape(Rectangle())
                    .gesture(
                        DragGesture(minimumDistance: 0)
                            .onChanged { value in
                                let x = min(max(value.location.x, 30), geo.size.width - 30)
                                let y = min(max(value.location.y, 30), geo.size.height - 30)
                                model.lightOffset = CGSize(
                                    width: x - center.x,
                                    height: y - center.y
                                )
                            }
                    )

                Circle()
                    .stroke(Color.blue.opacity(0.7), lineWidth: 1.5)
                    .background(Circle().fill(Color.white.opacity(0.01)))
                    .frame(width: 12, height: 12)
                    .frame(width: 28, height: 28)
                    .contentShape(Circle())
                    .position(knobPos)
                    .gesture(
                        DragGesture(minimumDistance: 0)
                            .onChanged { value in
                                let dx = value.location.x - lightPos.x
                                let dy = value.location.y - lightPos.y
                                model.knobAngle = atan2(dy, dx)
                                let dist = sqrt(dx * dx + dy * dy)
                                model.knobDistance = min(max(dist, model.knobMinDistance), model.knobMaxDistance)
                            }
                    )

                VStack(spacing: 2) {
                    Text(String(format: "Radius %.1f", model.shadowRadius))
                    Text("Opacity \(model.brightness)%")
                }
                .font(.system(size: 10, weight: .medium, design: .rounded))
                .foregroundStyle(.white)
                .padding(.horizontal, 10)
                .padding(.vertical, 4)
                .background(Capsule().fill(Color.blue))
                .position(
                    x: knobPos.x,
                    y: knobPos.y + (knobPos.y > 60 ? -26 : 26)
                )
                .allowsHitTesting(false)
            }
            .onHover { hovering in
                if hovering {
                    NSCursor.crosshair.push()
                } else {
                    NSCursor.pop()
                }
            }
        }
        .frame(maxHeight: .infinity)
    }

    // MARK: - Preview Card

    @ViewBuilder
    private var previewCard: some View {
        let card = RoundedRectangle(cornerRadius: 20, style: .continuous)
            .fill(model.cardColor)
            .animation(.easeInOut(duration: 0.25), value: model.isDarkBackground)
            .frame(width: 180, height: 220)
            .compositingGroup()

        if model.isGradient {
            card.happyGradientShadow(
                gradient: model.gradientForShadow,
                opacity: model.shadowOpacity,
                radius: model.shadowRadius,
                x: model.shadowX,
                y: model.shadowY
            )
        } else {
            card.happyShadow(
                color: model.shadowColor,
                radius: model.shadowRadius,
                opacity: model.shadowOpacity,
                x: model.shadowX,
                y: model.shadowY
            )
        }
    }

    // MARK: - Controls Row

    private var controlsRow: some View {
        HStack(spacing: 8) {
            // Shadow type toggle
            Picker("", selection: $model.isGradient) {
                Text("Solid").tag(false)
                Text("Gradient").tag(true)
            }
            .pickerStyle(.segmented)
            .frame(width: 130)

            // Color swatches
            if model.isGradient {
                ForEach(model.gradientColors.indices, id: \.self) { i in
                    roundColorPicker(color: $model.gradientColors[i])
                }

                // Add color
                Button { model.addColor() } label: {
                    Circle()
                        .strokeBorder(Color.secondary.opacity(0.4), style: StrokeStyle(lineWidth: 1.5, dash: [3, 2]))
                        .frame(width: 24, height: 24)
                        .overlay(
                            Image(systemName: "plus")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundStyle(.secondary)
                        )
                }
                .buttonStyle(.plain)

                // Remove last color (only if > 2)
                if model.gradientColors.count > 2 {
                    Button { model.removeLastColor() } label: {
                        Circle()
                            .strokeBorder(Color.secondary.opacity(0.4), style: StrokeStyle(lineWidth: 1.5, dash: [3, 2]))
                            .frame(width: 24, height: 24)
                            .overlay(
                                Image(systemName: "minus")
                                    .font(.system(size: 10, weight: .bold))
                                    .foregroundStyle(.secondary)
                            )
                    }
                    .buttonStyle(.plain)
                }
            } else {
                roundColorPicker(color: $model.gradientColors[0])
                Text(model.colorName)
                    .font(.system(size: 13, weight: .medium, design: .rounded))
                    .foregroundStyle(.secondary)
            }

            Spacer()

            // Theme toggle
            HStack(spacing: 2) {
                backgroundDot(dark: false)
                backgroundDot(dark: true)
            }
            .padding(3)
            .background(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .fill(model.buttonBgColor)
            )
        }
    }

    // MARK: - Code Preview

    private var codePreview: some View {
        Text(model.codeSnippet)
            .font(.system(size: 12, design: .monospaced))
            .foregroundStyle(.primary.opacity(0.8))
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(12)
            .background(
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .fill(model.codeBgColor)
            )
            .animation(.easeInOut(duration: 0.25), value: model.isDarkBackground)
            .onTapGesture {
                model.copyCode()
                flashCopied()
            }
    }

    // MARK: - Bottom Bar

    private var bottomBar: some View {
        HStack(spacing: 12) {
            Spacer()

            Button {
                model.copyCode()
                flashCopied()
            } label: {
                Text(showCopied ? "Copied!" : "Copy Code")
                    .font(.system(size: 13, weight: .medium, design: .rounded))
                    .padding(.horizontal, 20)
                    .padding(.vertical, 8)
                    .background(
                        RoundedRectangle(cornerRadius: 10, style: .continuous)
                            .fill(model.buttonBgColor)
                    )
            }
            .buttonStyle(.plain)
            .keyboardShortcut("c", modifiers: .command)
        }
    }

    // MARK: - Helpers

    private func roundColorPicker(color: Binding<Color>) -> some View {
        ZStack {
            Circle()
                .fill(color.wrappedValue)
                .frame(width: 24, height: 24)
                .overlay(Circle().stroke(Color.white.opacity(0.3), lineWidth: 1.5))

            ColorPicker("", selection: color, supportsOpacity: false)
                .labelsHidden()
                .opacity(0.015)
        }
        .frame(width: 24, height: 24)
    }

    private func backgroundDot(dark: Bool) -> some View {
        Circle()
            .fill(dark ? Color.black : Color.white)
            .overlay(Circle().stroke(Color.gray.opacity(0.3), lineWidth: 1))
            .frame(width: 22, height: 22)
            .opacity(model.isDarkBackground == dark ? 1 : 0.35)
            .onTapGesture { model.isDarkBackground = dark }
    }

    private func flashCopied() {
        showCopied = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            showCopied = false
        }
    }
}
