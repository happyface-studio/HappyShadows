#!/usr/bin/env swift
// Generates a 1024x1024 app icon for ShadowDesigner

import Cocoa

let size = 1024
let image = NSImage(size: NSSize(width: size, height: size))

image.lockFocus()

let ctx = NSGraphicsContext.current!.cgContext

// Background: rounded square with gradient
let bgRect = CGRect(x: 0, y: 0, width: size, height: size)
let bgPath = CGPath(roundedRect: bgRect, cornerWidth: 220, cornerHeight: 220, transform: nil)

// Dark gradient background
let colorSpace = CGColorSpaceCreateDeviceRGB()
let gradient = CGGradient(
    colorsSpace: colorSpace,
    colors: [
        CGColor(red: 0.12, green: 0.12, blue: 0.15, alpha: 1.0),
        CGColor(red: 0.08, green: 0.08, blue: 0.10, alpha: 1.0)
    ] as CFArray,
    locations: [0.0, 1.0]
)!

ctx.addPath(bgPath)
ctx.clip()
ctx.drawLinearGradient(gradient, start: CGPoint(x: 0, y: size), end: CGPoint(x: size, y: 0), options: [])
ctx.resetClip()

// White card with shadow layers
let cardW: CGFloat = 420
let cardH: CGFloat = 480
let cardX = (CGFloat(size) - cardW) / 2
let cardY = (CGFloat(size) - cardH) / 2 - 30
let cardRect = CGRect(x: cardX, y: cardY, width: cardW, height: cardH)
let cardPath = CGPath(roundedRect: cardRect, cornerWidth: 40, cornerHeight: 40, transform: nil)

// Shadow layers (mimicking the multi-layer shadow effect)
let shadowLayers: [(opacity: CGFloat, radius: CGFloat, dy: CGFloat)] = [
    (0.08, 4, 2),
    (0.08, 8, 4),
    (0.08, 16, 8),
    (0.06, 32, 16),
    (0.05, 48, 24),
]

for layer in shadowLayers {
    ctx.saveGState()
    ctx.setShadow(
        offset: CGSize(width: 0, height: -layer.dy),
        blur: layer.radius,
        color: CGColor(red: 0, green: 0, blue: 0, alpha: layer.opacity)
    )
    ctx.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 1))
    ctx.addPath(cardPath)
    ctx.fillPath()
    ctx.restoreGState()
}

// Card fill (on top of shadows)
ctx.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 1))
ctx.addPath(cardPath)
ctx.fillPath()

// Sun glow
let sunX = CGFloat(size) / 2 + 10
let sunY = CGFloat(size) / 2 + 180
let glowRadius: CGFloat = 60

// Outer glow
let glowGradient = CGGradient(
    colorsSpace: colorSpace,
    colors: [
        CGColor(red: 1.0, green: 0.95, blue: 0.7, alpha: 0.5),
        CGColor(red: 1.0, green: 0.95, blue: 0.7, alpha: 0.0)
    ] as CFArray,
    locations: [0.0, 1.0]
)!
ctx.drawRadialGradient(
    glowGradient,
    startCenter: CGPoint(x: sunX, y: sunY), startRadius: 0,
    endCenter: CGPoint(x: sunX, y: sunY), endRadius: glowRadius * 2,
    options: []
)

// Sun circle
ctx.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 1))
let sunRect = CGRect(x: sunX - 22, y: sunY - 22, width: 44, height: 44)
ctx.fillEllipse(in: sunRect)
ctx.setStrokeColor(CGColor(red: 0.7, green: 0.7, blue: 0.7, alpha: 0.5))
ctx.setLineWidth(2)
ctx.strokeEllipse(in: sunRect)

// Ray dashes around sun
let rayCount = 8
let innerR: CGFloat = 32
let outerR: CGFloat = 52
ctx.setStrokeColor(CGColor(red: 0.75, green: 0.75, blue: 0.75, alpha: 0.6))
ctx.setLineWidth(3)
ctx.setLineDash(phase: 0, lengths: [6, 5])

for i in 0..<rayCount {
    let angle = Double(i) * .pi * 2 / Double(rayCount)
    let startPt = CGPoint(x: sunX + cos(angle) * innerR, y: sunY + sin(angle) * innerR)
    let endPt = CGPoint(x: sunX + cos(angle) * outerR, y: sunY + sin(angle) * outerR)
    ctx.move(to: startPt)
    ctx.addLine(to: endPt)
}
ctx.strokePath()

image.unlockFocus()

// Save as PNG
guard let tiff = image.tiffRepresentation,
      let bitmap = NSBitmapImageRep(data: tiff),
      let png = bitmap.representation(using: .png, properties: [:]) else {
    print("Failed to render icon")
    exit(1)
}

let outputPath = CommandLine.arguments.count > 1
    ? CommandLine.arguments[1]
    : "AppIcon.png"

try! png.write(to: URL(fileURLWithPath: outputPath))
print("Saved icon to \(outputPath)")
