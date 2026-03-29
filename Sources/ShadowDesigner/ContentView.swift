import SwiftUI
import AppKit
import HappyShadows

struct ContentView: View {
    @State private var model = ShadowModel()
    @State private var showCopied = false
    @State private var knobDragStart: Double? = nil

    var body: some View {
        VStack(spacing: 16) {
            shadowCanvas
            themeToggle
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
                x: lightPos.x,
                y: lightPos.y - model.knobDistance
            )

            ZStack {
                // Canvas background
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(model.backgroundColor)
                    .animation(.easeInOut(duration: 0.25), value: model.isDarkBackground)

                // Preview card with live shadow
                RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .fill(model.cardColor)
                    .animation(.easeInOut(duration: 0.25), value: model.isDarkBackground)
                    .frame(width: 180, height: 220)
                    .compositingGroup()
                    .happyShadow(
                        color: model.shadowColor,
                        radius: model.shadowRadius,
                        opacity: model.shadowOpacity,
                        x: model.shadowX,
                        y: model.shadowY
                    )
                    .position(center)
                    .allowsHitTesting(false)

                // Rays + stem (visual only)
                LightSourceView(
                    brightness: Double(model.brightness) / 100,
                    knobDistance: model.knobDistance,
                    tint: model.shadowColor
                )
                .position(lightPos)

                // Canvas drag area — moves the light source
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

                // Brightness knob — drag vertically to adjust
                Circle()
                    .stroke(Color.blue.opacity(0.5 + model.brightnessValue * 0.5), lineWidth: 1.5)
                    .background(Circle().fill(Color.white.opacity(0.01)))
                    .frame(width: 12, height: 12)
                    .frame(width: 28, height: 28)
                    .contentShape(Circle())
                    .position(knobPos)
                    .gesture(
                        DragGesture(minimumDistance: 0)
                            .onChanged { value in
                                if knobDragStart == nil {
                                    knobDragStart = model.brightnessValue
                                }
                                let delta = Double(-value.translation.height) / 80
                                model.brightnessValue = min(max(
                                    (knobDragStart ?? 0.6) + delta, 0
                                ), 1)
                            }
                            .onEnded { _ in
                                knobDragStart = nil
                            }
                    )

                // Brightness badge
                if model.brightness > 0 {
                    let labelAbove = knobPos.y > 50
                    Text("Brightness \(model.brightness)%")
                        .font(.system(size: 11, weight: .medium, design: .rounded))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 4)
                        .background(Capsule().fill(Color.blue))
                        .position(
                            x: knobPos.x,
                            y: knobPos.y + (labelAbove ? -20 : 20)
                        )
                        .allowsHitTesting(false)
                }
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

    // MARK: - Theme Toggle

    private var themeToggle: some View {
        HStack {
            Spacer()
            HStack(spacing: 2) {
                backgroundDot(dark: false)
                backgroundDot(dark: true)
            }
            .padding(3)
            .background(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .fill(Color(white: 0.88))
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
                    .fill(Color(nsColor: .controlBackgroundColor))
            )
            .onTapGesture {
                model.copyCode()
                flashCopied()
            }
    }

    // MARK: - Bottom Bar

    private var bottomBar: some View {
        HStack(spacing: 12) {
            // Color picker
            ColorPicker("", selection: $model.shadowColor, supportsOpacity: false)
                .labelsHidden()

            Spacer()

            // Copy code button
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
                            .fill(Color(white: 0.88))
                    )
            }
            .buttonStyle(.plain)
            .keyboardShortcut("c", modifiers: .command)
        }
    }

    // MARK: - Helpers

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
