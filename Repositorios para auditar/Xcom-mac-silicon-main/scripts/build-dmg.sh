#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TAURI_CONFIG="$ROOT_DIR/src-tauri/tauri.conf.json"
BUNDLE_ROOT="$ROOT_DIR/src-tauri/target/release/bundle"
MACOS_BUNDLE_DIR="$BUNDLE_ROOT/macos"
DMG_OUTPUT_DIR="$BUNDLE_ROOT/dmg"
STAGING_DIR="$BUNDLE_ROOT/dmg-staging"

product_name="$(plutil -extract productName raw -o - "$TAURI_CONFIG")"
version="$(plutil -extract version raw -o - "$TAURI_CONFIG")"

case "$(uname -m)" in
  arm64) arch_suffix="aarch64" ;;
  x86_64) arch_suffix="x64" ;;
  *) arch_suffix="$(uname -m)" ;;
esac

app_bundle="$MACOS_BUNDLE_DIR/${product_name}.app"
output_dmg="$DMG_OUTPUT_DIR/${product_name}_${version}_${arch_suffix}.dmg"

cd "$ROOT_DIR"
npm run build:app

if [[ ! -d "$app_bundle" ]]; then
  echo "No se encontro el bundle esperado: $app_bundle" >&2
  exit 1
fi

mkdir -p "$DMG_OUTPUT_DIR"
rm -rf "$STAGING_DIR"
mkdir -p "$STAGING_DIR"

find "$MACOS_BUNDLE_DIR" -maxdepth 1 -type f -name 'rw.*.dmg' -delete

cp -R "$app_bundle" "$STAGING_DIR/"
ln -s /Applications "$STAGING_DIR/Applications"

rm -f "$output_dmg"
hdiutil create \
  -volname "$product_name" \
  -srcfolder "$STAGING_DIR" \
  -fs HFS+ \
  -format UDZO \
  -ov \
  "$output_dmg"

rm -rf "$STAGING_DIR"

echo "DMG generado en: $output_dmg"
