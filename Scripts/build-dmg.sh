#!/usr/bin/env bash
# Build a universal (arm64 + x86_64) ShadowDesigner.app and package it into a
# .dmg the web app serves at /ShadowDesigner.dmg.
#
# The app is UNSIGNED — first launch needs right-click -> Open (Gatekeeper).
# Codesigning/notarization is intentionally out of scope.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

APP_NAME="ShadowDesigner"
DMG_OUT="$ROOT/packages/web/public/${APP_NAME}.dmg"
STAGING="$(mktemp -d)"
trap 'rm -rf "$STAGING"' EXIT

echo "==> Building universal release binary..."
swift build -c release --arch arm64 --arch x86_64 --product "$APP_NAME"
BIN_DIR="$(swift build -c release --arch arm64 --arch x86_64 --product "$APP_NAME" --show-bin-path)"
BIN="$BIN_DIR/$APP_NAME"
test -f "$BIN" || { echo "ERROR: binary not found at $BIN"; exit 1; }

echo "==> Assembling ${APP_NAME}.app bundle..."
APP="$STAGING/${APP_NAME}.app"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
cp "$BIN" "$APP/Contents/MacOS/$APP_NAME"

cat > "$APP/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key><string>${APP_NAME}</string>
  <key>CFBundleDisplayName</key><string>HappyShadows Designer</string>
  <key>CFBundleIdentifier</key><string>studio.happyface.shadowdesigner</string>
  <key>CFBundleExecutable</key><string>${APP_NAME}</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>0.1.0</string>
  <key>CFBundleVersion</key><string>1</string>
  <key>CFBundleInfoDictionaryVersion</key><string>6.0</string>
  <key>LSMinimumSystemVersion</key><string>14.0</string>
  <key>NSHighResolutionCapable</key><true/>
</dict>
</plist>
PLIST

echo "==> Creating .dmg..."
mkdir -p "$(dirname "$DMG_OUT")"
rm -f "$DMG_OUT"
hdiutil create -volname "$APP_NAME" -srcfolder "$STAGING" -ov -format UDZO "$DMG_OUT" >/dev/null

# ponytail: no app icon (.icns) — generic icon is fine for an unsigned dev build.

echo "==> Self-check: mount + detach..."
test -f "$DMG_OUT" || { echo "ERROR: dmg not produced"; exit 1; }
MOUNT_DIR="$(mktemp -d)"
hdiutil attach "$DMG_OUT" -nobrowse -mountpoint "$MOUNT_DIR" >/dev/null
test -d "$MOUNT_DIR/${APP_NAME}.app" || { echo "ERROR: .app missing inside dmg"; hdiutil detach "$MOUNT_DIR" >/dev/null; exit 1; }
hdiutil detach "$MOUNT_DIR" >/dev/null
rmdir "$MOUNT_DIR"

echo "==> Done: $DMG_OUT"
