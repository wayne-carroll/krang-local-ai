#!/usr/bin/env bash
#
# build-mac.sh - build the KRANG macOS desktop app and DMG installer.
#
# Produces an unsigned, Apple-Silicon (arm64) .app and .dmg. Unsigned means
# first launch needs a one-time right-click then Open (see README).
#
#   ./scripts/build-mac.sh
#
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

# Make cargo available even when this runs in a non-login shell.
if ! command -v cargo >/dev/null 2>&1 && [ -f "$HOME/.cargo/env" ]; then
  . "$HOME/.cargo/env"
fi

if ! command -v cargo >/dev/null 2>&1; then
  echo "Rust is not installed. Install it with:" >&2
  echo "  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh" >&2
  exit 1
fi

if ! xcode-select -p >/dev/null 2>&1; then
  echo "Xcode Command Line Tools are required. Install with:" >&2
  echo "  xcode-select --install" >&2
  exit 1
fi

echo "==> Installing JS dependencies"
npm install

echo "==> Building macOS app + DMG (arm64, unsigned)"
npm run tauri:build -- --target aarch64-apple-darwin

echo
echo "==> Done. Artifacts:"
find src-tauri/target/aarch64-apple-darwin/release/bundle -name "*.dmg" -o -name "*.app" -maxdepth 2 2>/dev/null | sort
