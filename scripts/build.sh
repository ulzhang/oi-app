#!/bin/bash
set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IOS_DIR="$PROJECT_ROOT/ios"
WORKSPACE="$IOS_DIR/Oi.xcworkspace"
DEVICE_ID="${1:-0303EF54-FE47-5DA6-BBBB-403A257F1440}"
DERIVED_DATA="$HOME/Library/Developer/Xcode/DerivedData/Oi-dqgiuxkbqlovtweayuzyhlnmlekq"
APP_PATH="$DERIVED_DATA/Build/Products/Release-iphoneos/Oi.app"

echo "=== Oi Build & Deploy ==="
echo ""

# Step 1: Bundle JS
echo "[1/3] Bundling JS..."
cd "$PROJECT_ROOT"
npx expo export:embed \
  --platform ios \
  --entry-file node_modules/expo-router/entry.js \
  --bundle-output ios/main.jsbundle \
  --assets-dest ios \
  2>&1 | tail -1
echo "  ✓ JS bundled"

# Step 2: Build Release
echo "[2/3] Building Release..."
xcodebuild \
  -workspace "$WORKSPACE" \
  -scheme Oi \
  -configuration Release \
  -destination "id=00008130-000404EA14B8001C" \
  -allowProvisioningUpdates \
  build \
  2>&1 | grep -E "(BUILD SUCCEEDED|BUILD FAILED|error:)" | head -5

if [ ${PIPESTATUS[0]} -ne 0 ]; then
  echo "  ✗ Build failed"
  exit 1
fi
echo "  ✓ Build succeeded"

# Step 3: Install on device
echo "[3/3] Installing on device..."
devicectl device install app \
  --device "$DEVICE_ID" \
  "$APP_PATH" \
  2>&1 | grep -E "(App installed|error)" | head -3
echo "  ✓ Installed"

echo ""
echo "=== Done. Force-quit Oi and reopen. ==="
