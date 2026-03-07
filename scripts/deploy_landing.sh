#!/bin/bash
# Despliega la landing a Hostinger VPS
# Uso: ./scripts/deploy_landing.sh
# Requiere: SSH_HOST, SSH_USER, SSH_KEY_PATH en .env o variables de entorno

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LANDING_SRC="$PROJECT_DIR/docs/index.html"

if [ ! -f "$LANDING_SRC" ]; then
  echo "Error: No existe $LANDING_SRC"
  exit 1
fi

# Cargar .env si existe
if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  source "$PROJECT_DIR/.env"
  set +a
fi

SSH_HOST="${SSH_HOST:-}"
SSH_USER="${SSH_USER:-root}"
REMOTE_PATH="${REMOTE_PATH:-/var/www/html/artificialword}"

if [ -z "$SSH_HOST" ]; then
  echo "Define SSH_HOST en .env o como variable de entorno"
  echo "Ejemplo: SSH_HOST=tu-ip.o.dominio.com ./scripts/deploy_landing.sh"
  exit 1
fi

echo "Desplegando a $SSH_USER@$SSH_HOST:$REMOTE_PATH"
mkdir -p "$PROJECT_DIR/build/landing"
cp "$LANDING_SRC" "$PROJECT_DIR/build/landing/index.html"

if [ -n "$SSH_KEY_PATH" ]; then
  scp -i "$SSH_KEY_PATH" -r "$PROJECT_DIR/build/landing/"* "$SSH_USER@$SSH_HOST:$REMOTE_PATH/"
else
  scp -r "$PROJECT_DIR/build/landing/"* "$SSH_USER@$SSH_HOST:$REMOTE_PATH/"
fi

echo "Landing desplegada correctamente"
