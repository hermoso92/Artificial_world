#!/bin/bash
# Despliega la aplicación completa en VPS vía SSH
# Uso: SSH_HOST=tu-ip ./scripts/deploy_vps.sh
# Requiere: Docker instalado en el VPS

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  source "$PROJECT_DIR/.env"
  set +a
fi

SSH_HOST="${SSH_HOST:-}"
SSH_USER="${SSH_USER:-root}"
REMOTE_PATH="${REMOTE_PATH:-/opt/artificial-world}"

if [ -z "$SSH_HOST" ]; then
  echo "Define SSH_HOST (IP o dominio del VPS)"
  echo "Ejemplo: SSH_HOST=1.2.3.4 ./scripts/deploy_vps.sh"
  exit 1
fi

echo "Desplegando a $SSH_USER@$SSH_HOST:$REMOTE_PATH"

# Crear directorio remoto y copiar proyecto
ssh_cmd() {
  if [ -n "$SSH_KEY_PATH" ]; then
    ssh -i "$SSH_KEY_PATH" "$SSH_USER@$SSH_HOST" "$@"
  else
    ssh "$SSH_USER@$SSH_HOST" "$@"
  fi
}

scp_cmd() {
  if [ -n "$SSH_KEY_PATH" ]; then
    scp -i "$SSH_KEY_PATH" -r "$@"
  else
    scp -r "$@"
  fi
}

ssh_cmd "mkdir -p $REMOTE_PATH"

# Excluir archivos innecesarios
rsync_opts="-avz --exclude '.git' --exclude '__pycache__' --exclude '*.pyc' --exclude '*.db' --exclude '*.log'"
if [ -n "$SSH_KEY_PATH" ]; then
  rsync $rsync_opts -e "ssh -i $SSH_KEY_PATH" "$PROJECT_DIR/" "$SSH_USER@$SSH_HOST:$REMOTE_PATH/"
else
  rsync $rsync_opts -e ssh "$PROJECT_DIR/" "$SSH_USER@$SSH_HOST:$REMOTE_PATH/"
fi

# Construir y levantar en el VPS
ssh_cmd "cd $REMOTE_PATH && docker compose -f docker-compose.vps.yml build --no-cache && docker compose -f docker-compose.vps.yml up -d"

echo ""
echo "Despliegue completado."
echo "Accede al juego en: http://$SSH_HOST:6080/vnc.html"
