#!/usr/bin/env bash
# Artificial World — compila para simulador, instala, lanza la app y deja corriendo
# el stream de OSLog filtrado por subsystem (Ctrl+C para salir).
#
# Uso:
#   ./scripts/stream_logs_simulator.sh
#   ./scripts/stream_logs_simulator.sh "iPhone 17 Pro"
#
# Variables opcionales:
#   DERIVED_DATA_PATH   — ruta DerivedData (default /tmp/ArtificialWorld-SimBuild)
#   SKIP_BUILD=1        — no ejecuta xcodebuild (el .app ya debe existir y ser ejecutable)
#
# Requisitos: Xcode, simulador con el nombre indicado (por defecto iPhone 17).

set -euo pipefail

SIM_NAME="${1:-iPhone 17}"
SCHEME="ArtificialWorld"
CONFIG="Debug"
BUNDLE_ID="com.antoniohermoso.artificialworld"
SUBSYSTEM="$BUNDLE_ID"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AW_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT="$AW_DIR/ArtificialWorld.xcodeproj"
DERIVED="${DERIVED_DATA_PATH:-/tmp/ArtificialWorld-SimBuild}"
APP="$DERIVED/Build/Products/${CONFIG}-iphonesimulator/${SCHEME}.app"
APP_EXEC="$APP/$SCHEME"

if [[ ! -d "$PROJECT" ]]; then
  echo "No se encontró el proyecto: $PROJECT" >&2
  exit 1
fi

boot_simulator_if_needed() {
  if xcrun simctl list devices booted 2>/dev/null | grep -q "Booted"; then
    return 0
  fi
  echo "Arrancando simulador: $SIM_NAME …" >&2
  xcrun simctl boot "$SIM_NAME" 2>/dev/null || true
  open -a Simulator 2>/dev/null || true
  # Esperar a que el runtime esté listo
  local i=0
  while ! xcrun simctl list devices booted 2>/dev/null | grep -q "Booted"; do
    i=$((i + 1))
    if [[ $i -gt 60 ]]; then
      echo "Timeout esperando simulador booted." >&2
      exit 1
    fi
    sleep 1
  done
}

if [[ -n "${SKIP_BUILD:-}" ]] && [[ -x "$APP_EXEC" ]]; then
  echo "SKIP_BUILD=1 — usando bundle existente: $APP" >&2
else
  echo "Compilando ($CONFIG) → $DERIVED …" >&2
  xcodebuild \
    -scheme "$SCHEME" \
    -project "$PROJECT" \
    -destination "platform=iOS Simulator,name=$SIM_NAME" \
    -configuration "$CONFIG" \
    -derivedDataPath "$DERIVED" \
    build \
    -quiet
fi

if [[ ! -d "$APP" ]] || [[ ! -x "$APP_EXEC" ]]; then
  echo "No existe un bundle ejecutable: $APP_EXEC" >&2
  echo "Compilá antes en Xcode o ejecutá sin SKIP_BUILD." >&2
  exit 1
fi

boot_simulator_if_needed

echo "Instalando en simulador booted …" >&2
xcrun simctl install booted "$APP"

echo "" >&2
echo "Stream OSLog (subsystem == $SUBSYSTEM). Se lanzará la app en ~1 s. Ctrl+C para terminar." >&2
echo "" >&2

# El stream tiene que estar activo antes del launch para no perder el log de arranque.
# stdbuf (si existe) evita bloqueo por buffer al redirigir o hacer pipe.
if command -v stdbuf >/dev/null 2>&1; then
  STDBUF=(stdbuf -oL -eL)
else
  STDBUF=()
fi
"${STDBUF[@]}" xcrun simctl spawn booted log stream \
  --level debug \
  --style compact \
  --predicate "subsystem == \"$SUBSYSTEM\"" &
LOG_PID=$!

cleanup() {
  kill "$LOG_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

sleep 1
echo "Lanzando $BUNDLE_ID …" >&2
xcrun simctl launch booted "$BUNDLE_ID" >/dev/null

wait "$LOG_PID"
