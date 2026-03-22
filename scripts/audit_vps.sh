#!/bin/bash
# Auditoría Chess en VPS de producción — ejecución independiente
# Uso en el VPS: bash audit_vps.sh
# Requiere: Docker, Docker Compose, git

set -e

REPO_DIR="${REPO_DIR:-/opt/artificial-word}"
OUTPUT_DIR="${REPO_DIR}/docker/chess-output"

echo "=== Auditoría Chess en VPS ==="
echo "Repo: $REPO_DIR"
echo ""

# Ir al repo (clonar si no existe)
if [ ! -d "$REPO_DIR" ]; then
  echo "Clonando repo..."
  git clone --depth 1 https://github.com/TU_USUARIO/artificial-word.git "$REPO_DIR" || true
fi

cd "$REPO_DIR"

# Pull si ya existe
if [ -d .git ]; then
  git pull --rebase 2>/dev/null || true
fi

# Crear directorio de salida
mkdir -p "$OUTPUT_DIR"

# Ejecutar auditoría con Docker Compose
echo "Ejecutando agentes de auditoría..."
docker compose -f docker/docker-compose.agents.yml --profile agents up coordinator 2>&1

echo ""
echo "=== Auditoría completada ==="
echo "Reporte: $OUTPUT_DIR/REPORTE_CHESS_1.md"
if [ -f "$OUTPUT_DIR/REPORTE_CHESS_1.md" ]; then
  echo ""
  head -30 "$OUTPUT_DIR/REPORTE_CHESS_1.md"
fi
