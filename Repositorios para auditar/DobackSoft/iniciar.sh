#!/bin/bash
# Script único de inicio para DobackSoft V3
# Método oficial para iniciar todo el sistema (Linux/Mac)

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

echo ""
echo "========================================"
echo -e "${CYAN}  DOBACKSOFT V3 - INICIO COMPLETO${NC}"
echo "========================================"
echo ""

# Directorio raíz del proyecto
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# 🆕 LIMPIEZA DE PROCESOS ANTERIORES
echo -e "${YELLOW}[0] Limpiando procesos anteriores...${NC}"

# Limpiar procesos Node.js antiguos
NODE_PROCESSES=$(pgrep -f node 2>/dev/null | wc -l)
if [ "$NODE_PROCESSES" -gt 0 ]; then
    echo -e "${GRAY}   Encontrados $NODE_PROCESSES procesos Node.js${NC}"
    echo -e "${GRAY}   Cerrando procesos anteriores...${NC}"
    pkill -f node 2>/dev/null || true
    sleep 2
    echo -e "${GREEN}   [OK] Procesos Node.js limpiados${NC}"
else
    echo -e "${GREEN}   [OK] No hay procesos Node.js previos${NC}"
fi

# Liberar puertos si están en uso
BACKEND_PORT=9998
FRONTEND_PORT=5174

BACKEND_PID=$(lsof -ti:$BACKEND_PORT 2>/dev/null)
if [ ! -z "$BACKEND_PID" ]; then
    echo -e "${GRAY}   Liberando puerto $BACKEND_PORT...${NC}"
    kill -9 $BACKEND_PID 2>/dev/null || true
    sleep 1
    echo -e "${GREEN}   [OK] Puerto $BACKEND_PORT liberado${NC}"
fi

FRONTEND_PID=$(lsof -ti:$FRONTEND_PORT 2>/dev/null)
if [ ! -z "$FRONTEND_PID" ]; then
    echo -e "${GRAY}   Liberando puerto $FRONTEND_PORT...${NC}"
    kill -9 $FRONTEND_PID 2>/dev/null || true
    sleep 1
    echo -e "${GREEN}   [OK] Puerto $FRONTEND_PORT liberado${NC}"
fi

echo ""

# Verificar que los directorios existen
if [ ! -d "$BACKEND_DIR" ]; then
    echo -e "${RED}[ERROR] Directorio backend no encontrado: $BACKEND_DIR${NC}"
    exit 1
fi

if [ ! -d "$FRONTEND_DIR" ]; then
    echo -e "${RED}[ERROR] Directorio frontend no encontrado: $FRONTEND_DIR${NC}"
    exit 1
fi

echo -e "${YELLOW}[1] Verificando estructura del proyecto...${NC}"
echo -e "${GREEN}   [OK] Backend: $BACKEND_DIR${NC}"
echo -e "${GREEN}   [OK] Frontend: $FRONTEND_DIR${NC}"
echo ""

# Verificar Node.js
echo -e "${YELLOW}[2] Verificando Node.js...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}   [OK] Node.js $NODE_VERSION disponible${NC}"
else
    echo -e "${RED}   [ERROR] Node.js no está instalado${NC}"
    echo -e "${YELLOW}   Instala Node.js desde: https://nodejs.org/${NC}"
    exit 1
fi

# Verificar npm
echo -e "${YELLOW}[3] Verificando npm...${NC}"
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}   [OK] npm $NPM_VERSION disponible${NC}"
else
    echo -e "${RED}   [ERROR] npm no está instalado${NC}"
    exit 1
fi
echo ""

# Verificar puertos (ya deberían estar libres)
echo -e "${YELLOW}[4] Verificando puertos...${NC}"

BACKEND_CHECK=$(lsof -ti:$BACKEND_PORT 2>/dev/null)
if [ ! -z "$BACKEND_CHECK" ]; then
    echo -e "${RED}   [ERROR] Puerto $BACKEND_PORT AÚN en uso después de limpieza${NC}"
    echo -e "${GRAY}   PID: $BACKEND_CHECK${NC}"
    echo -e "${YELLOW}   Intentando liberar nuevamente...${NC}"
    kill -9 $BACKEND_CHECK 2>/dev/null || true
    sleep 2
else
    echo -e "${GREEN}   [OK] Puerto $BACKEND_PORT disponible${NC}"
fi

FRONTEND_CHECK=$(lsof -ti:$FRONTEND_PORT 2>/dev/null)
if [ ! -z "$FRONTEND_CHECK" ]; then
    echo -e "${RED}   [ERROR] Puerto $FRONTEND_PORT AÚN en uso después de limpieza${NC}"
    echo -e "${GRAY}   PID: $FRONTEND_CHECK${NC}"
    echo -e "${YELLOW}   Intentando liberar nuevamente...${NC}"
    kill -9 $FRONTEND_CHECK 2>/dev/null || true
    sleep 2
else
    echo -e "${GREEN}   [OK] Puerto $FRONTEND_PORT disponible${NC}"
fi
echo ""

# Verificar .env en backend
echo -e "${YELLOW}[5] Verificando configuración del backend...${NC}"
BACKEND_ENV="$BACKEND_DIR/.env"
if [ ! -f "$BACKEND_ENV" ]; then
    echo -e "${YELLOW}   [WARNING] Archivo .env no encontrado en backend${NC}"
    echo -e "${GRAY}   Algunas variables de entorno pueden faltar${NC}"
else
    echo -e "${GREEN}   [OK] Archivo .env encontrado${NC}"
    
    # Verificar variables críticas
    if ! grep -q "JWT_SECRET" "$BACKEND_ENV"; then
        echo -e "${YELLOW}   [WARNING] JWT_SECRET no encontrado en .env${NC}"
    fi
    if ! grep -q "JWT_REFRESH_SECRET" "$BACKEND_ENV"; then
        echo -e "${YELLOW}   [WARNING] JWT_REFRESH_SECRET no encontrado en .env${NC}"
    fi
    if ! grep -q "DATABASE_URL" "$BACKEND_ENV"; then
        echo -e "${YELLOW}   [WARNING] DATABASE_URL no encontrado en .env${NC}"
    fi
fi
echo ""

# Verificar node_modules
echo -e "${YELLOW}[6] Verificando dependencias...${NC}"
BACKEND_NODE_MODULES="$BACKEND_DIR/node_modules"
FRONTEND_NODE_MODULES="$FRONTEND_DIR/node_modules"

if [ ! -d "$BACKEND_NODE_MODULES" ]; then
    echo -e "${YELLOW}   [WARNING] node_modules del backend no encontrado${NC}"
    echo -e "${GRAY}   Instalando dependencias del backend...${NC}"
    cd "$BACKEND_DIR"
    npm install
    cd "$PROJECT_ROOT"
else
    echo -e "${GREEN}   [OK] Dependencias del backend instaladas${NC}"
fi

if [ ! -d "$FRONTEND_NODE_MODULES" ]; then
    echo -e "${YELLOW}   [WARNING] node_modules del frontend no encontrado${NC}"
    echo -e "${GRAY}   Instalando dependencias del frontend...${NC}"
    cd "$FRONTEND_DIR"
    npm install --legacy-peer-deps
    cd "$PROJECT_ROOT"
else
    echo -e "${GREEN}   [OK] Dependencias del frontend instaladas${NC}"
fi
echo ""

# Preparar logs
echo -e "${YELLOW}[7] Preparando directorio de logs...${NC}"
LOGS_DIR="$PROJECT_ROOT/logs"
mkdir -p "$LOGS_DIR"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKEND_LOG_FILE="$LOGS_DIR/backend_$TIMESTAMP.log"
FRONTEND_LOG_FILE="$LOGS_DIR/frontend_$TIMESTAMP.log"
echo -e "${GREEN}   [OK] Directorio de logs preparado: $LOGS_DIR${NC}"
echo ""

# Función para detectar el sistema operativo
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    else
        echo "unknown"
    fi
}

OS=$(detect_os)

# Función para abrir URL en navegador
open_browser() {
    if [[ "$OS" == "linux" ]]; then
        xdg-open "$1" 2>/dev/null || sensible-browser "$1" 2>/dev/null || echo "Abre manualmente: $1"
    elif [[ "$OS" == "macos" ]]; then
        open "$1" 2>/dev/null || echo "Abre manualmente: $1"
    else
        echo "Abre manualmente: $1"
    fi
}

# Iniciar Backend
echo -e "${YELLOW}[8] Iniciando Backend...${NC}"
echo -e "${GRAY}   Puerto: $BACKEND_PORT${NC}"
echo -e "${GRAY}   Directorio: $BACKEND_DIR${NC}"

# Crear script temporal para backend
BACKEND_SCRIPT=$(mktemp /tmp/dobacksoft_backend_XXXXXX.sh)
cat > "$BACKEND_SCRIPT" << EOF
#!/bin/bash
cd "$BACKEND_DIR"
echo "========================================"
echo -e "${CYAN}  DOBACKSOFT BACKEND - LOGS${NC}"
echo "========================================"
echo ""
echo -e "${YELLOW}Puerto: http://localhost:$BACKEND_PORT${NC}"
echo -e "${GRAY}Log guardado en: $BACKEND_LOG_FILE${NC}"
echo ""
echo -e "${GRAY}Presiona Ctrl+C para detener${NC}"
echo ""
npm run dev 2>&1 | tee "$BACKEND_LOG_FILE"
EOF

chmod +x "$BACKEND_SCRIPT"

# Iniciar en nueva terminal (dependiendo del OS)
if [[ "$OS" == "linux" ]]; then
    gnome-terminal -- bash -c "$BACKEND_SCRIPT; exec bash" 2>/dev/null || \
    xterm -e "bash $BACKEND_SCRIPT; exec bash" 2>/dev/null || \
    x-terminal-emulator -e "bash $BACKEND_SCRIPT; exec bash" 2>/dev/null || \
    bash "$BACKEND_SCRIPT" &
elif [[ "$OS" == "macos" ]]; then
    osascript -e "tell app \"Terminal\" to do script \"bash $BACKEND_SCRIPT\"" 2>/dev/null || \
    bash "$BACKEND_SCRIPT" &
else
    bash "$BACKEND_SCRIPT" &
fi

sleep 3
echo -e "${GREEN}   [OK] Backend iniciado${NC}"
echo ""

# Iniciar Frontend
echo -e "${YELLOW}[9] Iniciando Frontend...${NC}"
echo -e "${GRAY}   Puerto: $FRONTEND_PORT${NC}"
echo -e "${GRAY}   Directorio: $FRONTEND_DIR${NC}"

# Crear script temporal para frontend
FRONTEND_SCRIPT=$(mktemp /tmp/dobacksoft_frontend_XXXXXX.sh)
cat > "$FRONTEND_SCRIPT" << EOF
#!/bin/bash
cd "$FRONTEND_DIR"
echo "========================================"
echo -e "${CYAN}  DOBACKSOFT FRONTEND - LOGS${NC}"
echo "========================================"
echo ""
echo -e "${YELLOW}Puerto: http://localhost:$FRONTEND_PORT${NC}"
echo -e "${GRAY}Log guardado en: $FRONTEND_LOG_FILE${NC}"
echo ""
echo -e "${GRAY}Presiona Ctrl+C para detener${NC}"
echo ""
npm run dev 2>&1 | tee "$FRONTEND_LOG_FILE"
EOF

chmod +x "$FRONTEND_SCRIPT"

# Iniciar en nueva terminal (dependiendo del OS)
if [[ "$OS" == "linux" ]]; then
    gnome-terminal -- bash -c "$FRONTEND_SCRIPT; exec bash" 2>/dev/null || \
    xterm -e "bash $FRONTEND_SCRIPT; exec bash" 2>/dev/null || \
    x-terminal-emulator -e "bash $FRONTEND_SCRIPT; exec bash" 2>/dev/null || \
    bash "$FRONTEND_SCRIPT" &
elif [[ "$OS" == "macos" ]]; then
    osascript -e "tell app \"Terminal\" to do script \"bash $FRONTEND_SCRIPT\"" 2>/dev/null || \
    bash "$FRONTEND_SCRIPT" &
else
    bash "$FRONTEND_SCRIPT" &
fi

sleep 3
echo -e "${GREEN}   [OK] Frontend iniciado${NC}"
echo ""

# Esperar y verificar
echo -e "${YELLOW}[10] Esperando a que los servicios inicien...${NC}"
sleep 8

echo -e "${YELLOW}[11] Verificando conectividad...${NC}"
if curl -s -f "http://localhost:$BACKEND_PORT/health" > /dev/null 2>&1; then
    echo -e "${GREEN}   [OK] Backend respondiendo${NC}"
else
    echo -e "${YELLOW}   [WARNING] Backend aún iniciando...${NC}"
fi

if curl -s -f "http://localhost:$FRONTEND_PORT" > /dev/null 2>&1; then
    echo -e "${GREEN}   [OK] Frontend respondiendo${NC}"
else
    echo -e "${YELLOW}   [WARNING] Frontend aún iniciando...${NC}"
fi
echo ""

# Abrir navegador
echo -e "${YELLOW}[12] Abriendo navegador...${NC}"
sleep 2
open_browser "http://localhost:$FRONTEND_PORT"
echo -e "${GREEN}   [OK] Navegador abierto${NC}"
echo ""

# Resumen
echo ""
echo "========================================"
echo -e "${GREEN}  SISTEMA INICIADO EXITOSAMENTE${NC}"
echo "========================================"
echo ""
echo -e "${YELLOW}URLs disponibles:${NC}"
echo -e "${WHITE}  Frontend: http://localhost:$FRONTEND_PORT${NC}"
echo -e "${WHITE}  Backend API: http://localhost:$BACKEND_PORT${NC}"
echo ""
echo -e "${YELLOW}Logs guardados en:${NC}"
echo -e "${GRAY}  Backend: $BACKEND_LOG_FILE${NC}"
echo -e "${GRAY}  Frontend: $FRONTEND_LOG_FILE${NC}"
echo ""
echo -e "${YELLOW}COMANDOS UTILES:${NC}"
echo -e "${GRAY}  Detener servicios: pkill -f 'npm run dev'${NC}"
echo -e "${GRAY}  Ver logs: tail -f $LOGS_DIR/*.log${NC}"
echo ""
echo -e "${GREEN}Listo para usar!${NC}"
echo ""
