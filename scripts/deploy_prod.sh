#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Constructor de Mundos — Deploy completo en VPS
# Un solo script que instala TODO y deja la app corriendo
# ═══════════════════════════════════════════════════════════════
set -e

REPO="https://github.com/hermoso92/Artificial_world.git"
APP_DIR="/opt/constructor-de-mundos"
DOMAIN="${1:-}"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   Constructor de Mundos — Deploy VPS         ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ── 1. Update system ──
echo "[1/7] Actualizando sistema..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq

# ── 2. Install Docker ──
echo "[2/7] Instalando Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
else
    echo "  Docker ya instalado: $(docker --version)"
fi

if ! docker compose version &> /dev/null; then
    apt-get install -y -qq docker-compose-plugin
fi

# ── 3. Install Nginx + Certbot ──
echo "[3/7] Instalando Nginx y Certbot..."
apt-get install -y -qq nginx certbot python3-certbot-nginx git

systemctl enable nginx
systemctl start nginx

# ── 4. Clone or update repo ──
echo "[4/7] Descargando código..."
if [ -d "$APP_DIR" ]; then
    cd "$APP_DIR"
    git fetch --all
    git reset --hard origin/main 2>/dev/null || git reset --hard origin/master
else
    git clone "$REPO" "$APP_DIR"
    cd "$APP_DIR"
fi

# ── 5. Build and start with Docker ──
echo "[5/7] Construyendo imagen de producción..."
docker compose -f docker-compose.prod.yml build --no-cache

echo "[6/7] Iniciando servicios..."
docker compose -f docker-compose.prod.yml down 2>/dev/null || true
docker compose -f docker-compose.prod.yml up -d

sleep 3

if docker ps | grep constructor-de-mundos > /dev/null; then
    echo "  ✓ Contenedor corriendo"
else
    echo "  ✗ ERROR: Contenedor no arrancó. Logs:"
    docker compose -f docker-compose.prod.yml logs --tail=30
    exit 1
fi

# ── 7. Configure Nginx ──
echo "[7/7] Configurando Nginx..."

NGINX_CONF="/etc/nginx/sites-available/constructor"

cat > "$NGINX_CONF" << 'NGINX_EOF'
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_read_timeout 86400;
    }

    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;
    add_header Referrer-Policy strict-origin-when-cross-origin;
}
NGINX_EOF

rm -f /etc/nginx/sites-enabled/default
ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/constructor

if nginx -t 2>/dev/null; then
    systemctl reload nginx
    echo "  ✓ Nginx configurado"
else
    echo "  ✗ Error en config Nginx"
    nginx -t
    exit 1
fi

# ── Done ──
VPS_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║         ✓ DEPLOY COMPLETADO                  ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "  Tu app está en: http://$VPS_IP"
echo "  Health check:   http://$VPS_IP/health"
echo ""

if [ -n "$DOMAIN" ]; then
    echo "  Para SSL con tu dominio $DOMAIN:"
    echo "  1. Apunta el DNS A record de $DOMAIN → $VPS_IP"
    echo "  2. Ejecuta: sudo certbot --nginx -d $DOMAIN"
    echo ""
fi

echo "  Comandos útiles:"
echo "    Ver logs:     cd $APP_DIR && docker compose -f docker-compose.prod.yml logs -f"
echo "    Reiniciar:    cd $APP_DIR && docker compose -f docker-compose.prod.yml restart"
echo "    Actualizar:   cd $APP_DIR && git pull && docker compose -f docker-compose.prod.yml up -d --build"
echo ""
