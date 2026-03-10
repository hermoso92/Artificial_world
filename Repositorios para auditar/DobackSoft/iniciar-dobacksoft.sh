#!/bin/bash
# Script para iniciar DobackSoft en producción
# Ubicación: /home/doback/Desktop/iniciar-dobacksoft.sh

echo "========================================"
echo "  DOBACKSOFT - INICIO EN PRODUCCIÓN"
echo "========================================"
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar que estamos como root o con sudo
if [ "$EUID" -ne 0 ]; then 
    echo -e "${YELLOW}⚠️ Necesitas permisos de root. Ejecutando con sudo...${NC}"
    exec sudo bash "$0" "$@"
    exit $?
fi

# Directorio del proyecto
PROJECT_DIR="/root/dobacksoft"
BACKEND_DIR="$PROJECT_DIR/backend"

echo "1. Verificando directorio del proyecto..."
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}❌ Error: No se encontró el directorio $PROJECT_DIR${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Directorio encontrado${NC}"
echo ""

# 2. Actualizar código automáticamente (sin preguntar)
echo "2. Actualizando código desde GitHub..."
cd "$PROJECT_DIR"
if git pull origin main > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Código actualizado${NC}"
else
    echo "   ⚠️ No se pudo actualizar (puede ser normal si no hay cambios)"
fi
echo ""

# 3. Detener servicios existentes (reinicio completo)
echo "3. Deteniendo servicios existentes..."
cd "$BACKEND_DIR"

# Verificar si PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}❌ PM2 no está instalado${NC}"
    exit 1
fi

# Detener TODAS las instancias de dobacksoft-backend (puede haber múltiples)
echo "   Limpiando instancias anteriores de PM2..."
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true
sleep 2

# Limpiar el dump de PM2 para evitar auto-restaurar procesos
if [ -f /root/.pm2/dump.pm2 ]; then
    echo "   Limpiando dump de PM2 para evitar auto-restaurar..."
    rm -f /root/.pm2/dump.pm2
fi

# Reiniciar PM2 daemon limpio
pm2 kill 2>/dev/null || true
sleep 1

# Verificar si quedan instancias
REMAINING=$(pm2 list 2>/dev/null | grep dobacksoft-backend | wc -l || echo "0")
if [ "$REMAINING" -gt 0 ]; then
    echo -e "${YELLOW}⚠️ Eliminando $REMAINING instancias restantes...${NC}"
    pm2 delete dobacksoft-backend 2>/dev/null || true
    pm2 kill 2>/dev/null || true
    sleep 2
fi

echo -e "${GREEN}✅ Servicios detenidos y limpiados${NC}"
echo ""

# 4. Verificar configuración de ingesta automática
echo "4. Verificando configuración de ingesta automática..."

# Verificar archivo .env del backend
BACKEND_ENV="$BACKEND_DIR/.env"
if [ -f "$BACKEND_ENV" ]; then
    echo "   Archivo .env encontrado"
    
    # Verificar si INGESTION_DATA_FOLDER está configurado en .env
    if grep -q "INGESTION_DATA_FOLDER" "$BACKEND_ENV" 2>/dev/null; then
        ENV_INGESTION_DIR=$(grep "INGESTION_DATA_FOLDER" "$BACKEND_ENV" | cut -d '=' -f2 | tr -d ' "' | head -1)
        if [ -n "$ENV_INGESTION_DIR" ]; then
            INGESTION_DIR="$ENV_INGESTION_DIR"
            echo "   INGESTION_DATA_FOLDER en .env: $INGESTION_DIR"
        fi
    else
        echo "   ⚠️ INGESTION_DATA_FOLDER no encontrado en .env"
    fi
else
    echo "   ⚠️ Archivo .env no encontrado en $BACKEND_ENV"
fi

# Si no se encontró en .env, usar variable de entorno o ruta por defecto
if [ -z "$INGESTION_DIR" ]; then
    if [ -n "$INGESTION_DATA_FOLDER" ]; then
        INGESTION_DIR="$INGESTION_DATA_FOLDER"
        echo "   Variable INGESTION_DATA_FOLDER configurada: $INGESTION_DIR"
    else
        # Usar ruta por defecto (datosDoback sin CMadrid)
        INGESTION_DIR="/home/doback/datosDoback"
        if [ ! -d "$INGESTION_DIR" ]; then
            # Intentar otra ubicación común
            INGESTION_DIR="$PROJECT_DIR/backend/data/datosDoback"
        fi
        echo "   Usando ruta por defecto: $INGESTION_DIR"
    fi
fi

# Verificar que el directorio existe
if [ -d "$INGESTION_DIR" ]; then
    echo -e "${GREEN}✅ Directorio de ingesta encontrado: $INGESTION_DIR${NC}"
    
    # Verificar permisos de lectura
    if [ -r "$INGESTION_DIR" ]; then
        echo -e "${GREEN}✅ Permisos de lectura OK${NC}"
    else
        echo -e "${YELLOW}⚠️ Problemas de permisos en $INGESTION_DIR${NC}"
    fi
    
    # Contar organizaciones encontradas
    ORG_COUNT=$(find "$INGESTION_DIR" -maxdepth 1 -type d ! -path "$INGESTION_DIR" | wc -l)
    echo "   Organizaciones encontradas: $ORG_COUNT"
else
    echo -e "${YELLOW}⚠️ Directorio de ingesta no encontrado: $INGESTION_DIR${NC}"
    echo "   La ingesta automática puede no funcionar correctamente"
    echo "   Configura INGESTION_DATA_FOLDER en el .env del backend"
fi
echo ""

# 5. Iniciar backend con PM2
echo "5. Iniciando backend (PM2)..."
cd "$BACKEND_DIR"

# Verificar que existe el archivo de inicio
if [ ! -f "$BACKEND_DIR/src/index.ts" ]; then
    echo -e "${RED}❌ Error: No se encontró src/index.ts${NC}"
    exit 1
fi

# Iniciar backend con PM2
pm2 start ts-node --name dobacksoft-backend -- --transpile-only src/index.ts
pm2 save

echo -e "${GREEN}✅ Backend iniciado${NC}"
echo "   Esperando a que el backend arranque completamente..."
sleep 5

# Verificar que el backend está corriendo
if pm2 list | grep -q "dobacksoft-backend.*online"; then
    echo -e "${GREEN}✅ Backend está corriendo en PM2${NC}"
else
    echo -e "${RED}❌ Backend NO está corriendo correctamente${NC}"
    echo "   Revisando logs..."
    pm2 logs dobacksoft-backend --lines 20 --nostream
fi

# Esperar un poco más para que los cron jobs se inicialicen
echo "   Esperando inicialización de cron jobs..."
sleep 3

# Verificar en los logs que los cron jobs se inicializaron
echo "   Verificando inicialización de cron jobs..."
CRON_INIT_CHECK=$(pm2 logs dobacksoft-backend --lines 100 --nostream 2>/dev/null | grep -iE "cron jobs inicializados|Todos los cron jobs|ingesta automática configurado|initializeCronJobs" | wc -l)
if [ "$CRON_INIT_CHECK" -gt 0 ]; then
    echo -e "${GREEN}✅ Cron jobs inicializados correctamente${NC}"
else
    echo -e "${YELLOW}⚠️ No se detectó inicialización de cron jobs en los logs${NC}"
    echo "   Esto puede ser normal si el backend acaba de iniciar"
    echo "   Mostrando últimas líneas de logs para diagnóstico:"
    pm2 logs dobacksoft-backend --lines 50 --nostream | tail -15
fi
echo ""

# 6. Reiniciar Apache2
echo "6. Reiniciando Apache2..."
if systemctl is-active --quiet apache2; then
    echo "   Apache2 está corriendo. Reiniciando..."
    systemctl restart apache2
else
    echo "   Apache2 no está corriendo. Iniciando..."
    systemctl start apache2
fi

sleep 2
if systemctl is-active --quiet apache2; then
    echo -e "${GREEN}✅ Apache2 reiniciado${NC}"
else
    echo -e "${RED}❌ Error al reiniciar Apache2${NC}"
    systemctl status apache2 --no-pager | head -10
fi
echo ""

# 7. Verificar frontend
echo "7. Verificando frontend..."
if [ -f "/var/www/html/index.html" ]; then
    echo -e "${GREEN}✅ Frontend encontrado en /var/www/html${NC}"
else
    echo -e "${YELLOW}⚠️ Frontend no encontrado. Copiando desde dist/...${NC}"
    if [ -d "$PROJECT_DIR/frontend/dist" ]; then
        sudo cp -r "$PROJECT_DIR/frontend/dist"/* /var/www/html/
        echo -e "${GREEN}✅ Frontend copiado${NC}"
    else
        echo -e "${RED}❌ Error: No se encontró frontend/dist${NC}"
    fi
fi
echo ""

# 8. Verificar health checks y cron jobs
echo "8. Verificando servicios y cron jobs..."
sleep 2

# Backend health check
if curl -s http://localhost:9998/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend responde en localhost:9998${NC}"
else
    echo -e "${RED}❌ Backend NO responde${NC}"
    echo "   Revisando estado de PM2..."
    pm2 describe dobacksoft-backend | head -15
fi

# Verificar que los cron jobs están activos
echo "   Verificando cron jobs de ingesta automática..."
sleep 2
INGESTION_ACTIVE=$(pm2 logs dobacksoft-backend --lines 200 --nostream 2>/dev/null | grep -iE "ingesta automática|ejecutando ingesta automática|Ejecutando ingesta automática|⏰ Ejecutando ingesta" | wc -l)
if [ "$INGESTION_ACTIVE" -gt 0 ]; then
    echo -e "${GREEN}✅ Cron job de ingesta automática detectado en logs${NC}"
    echo "   Última ejecución detectada en los logs"
else
    echo -e "${YELLOW}⚠️ No se detectó actividad de ingesta automática aún${NC}"
    echo "   Esto es normal - el cron job se ejecuta cada 2 minutos"
    echo "   Espera 2-3 minutos y verifica con: pm2 logs dobacksoft-backend | grep -i ingesta"
fi

# Frontend health check
if curl -s http://localhost/ > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend responde en localhost${NC}"
else
    echo -e "${RED}❌ Frontend NO responde${NC}"
fi
echo ""

# 9. Información adicional sobre ingesta automática
echo "9. Información sobre ingesta automática..."
echo "   - Cron job configurado: cada 2 minutos"
echo "   - Directorio escaneado: $INGESTION_DIR"
echo "   - Ver logs de ingesta: pm2 logs dobacksoft-backend | grep -i ingesta"
echo "   - Verificar jobs: curl http://localhost:9998/api/ingestion/jobs?limit=5"
echo ""

# 10. Mostrar estado final
echo "========================================"
echo -e "${GREEN}  SISTEMA REINICIADO${NC}"
echo "========================================"
echo ""
echo "📊 Estado de servicios:"
pm2 list | grep dobacksoft-backend || echo "   Backend: No encontrado en PM2"
echo ""
systemctl status apache2 --no-pager | head -3
echo ""
echo "🌐 URLs de acceso:"
echo "   Frontend: http://31.97.54.148"
echo "   Backend API: http://31.97.54.148/api"
echo "   Health Check: http://31.97.54.148/health"
echo ""
echo "📋 Comandos útiles:"
echo "   Ver logs backend: pm2 logs dobacksoft-backend"
echo "   Reiniciar backend: pm2 restart dobacksoft-backend"
echo "   Estado Apache2: systemctl status apache2"
echo ""

# 9. Abrir terminales para monitorear logs
echo "9. Abriendo terminales para monitorear logs..."
echo ""

# Crear scripts temporales para las terminales
TEMP_DIR="/tmp/dobacksoft_logs_$$"
mkdir -p "$TEMP_DIR"

# Script para terminal de Backend
BACKEND_SCRIPT="$TEMP_DIR/backend_logs.sh"
cat > "$BACKEND_SCRIPT" << 'BACKEND_EOF'
#!/bin/bash
clear
echo "========================================"
echo "  DOBACKSOFT BACKEND - LOGS"
echo "========================================"
echo ""
echo "Puerto: http://localhost:9998"
echo "Health: http://localhost:9998/health"
echo ""
echo "Presiona Ctrl+C para cerrar"
echo ""
sleep 2
# Mostrar últimas 20 líneas y luego seguir en tiempo real
pm2 logs dobacksoft-backend --lines 20 --nostream
echo ""
echo "--- SIGUIENDO LOGS EN TIEMPO REAL ---"
echo ""
pm2 logs dobacksoft-backend --lines 0
BACKEND_EOF
chmod +x "$BACKEND_SCRIPT"

# Script para terminal de Frontend/Apache2
FRONTEND_SCRIPT="$TEMP_DIR/frontend_logs.sh"
cat > "$FRONTEND_SCRIPT" << 'FRONTEND_EOF'
#!/bin/bash
clear
echo "========================================"
echo "  DOBACKSOFT FRONTEND/APACHE2 - LOGS"
echo "========================================"
echo ""
echo "URL: http://31.97.54.148"
echo "Logs de Apache2:"
echo ""
echo "Presiona Ctrl+C para cerrar"
echo ""
sleep 2

# Intentar leer logs con sudo si es necesario
LOG_FILES=""

# Prioridad 1: Logs específicos de dobacksoft
if [ -f "/var/log/apache2/dobacksoft_access.log" ] && [ -f "/var/log/apache2/dobacksoft_error.log" ]; then
    LOG_FILES="/var/log/apache2/dobacksoft_access.log /var/log/apache2/dobacksoft_error.log"
    echo "Usando logs específicos de DobackSoft..."
# Prioridad 2: Logs por defecto de Apache2
elif [ -f "/var/log/apache2/access.log" ] && [ -f "/var/log/apache2/error.log" ]; then
    LOG_FILES="/var/log/apache2/access.log /var/log/apache2/error.log"
    echo "Usando logs por defecto de Apache2..."
# Prioridad 3: Intentar con sudo
elif sudo test -f "/var/log/apache2/dobacksoft_access.log" 2>/dev/null; then
    LOG_FILES="/var/log/apache2/dobacksoft_access.log /var/log/apache2/dobacksoft_error.log"
    echo "Usando logs específicos de DobackSoft (con sudo)..."
elif sudo test -f "/var/log/apache2/access.log" 2>/dev/null; then
    LOG_FILES="/var/log/apache2/access.log /var/log/apache2/error.log"
    echo "Usando logs por defecto de Apache2 (con sudo)..."
fi

if [ -n "$LOG_FILES" ]; then
    echo "Siguiendo logs en tiempo real..."
    echo ""
    # Mostrar últimas 20 líneas y luego seguir
    for log_file in $LOG_FILES; do
        if [ -f "$log_file" ]; then
            echo "--- Últimas 10 líneas de $(basename $log_file) ---"
            tail -n 10 "$log_file" 2>/dev/null || sudo tail -n 10 "$log_file" 2>/dev/null
            echo ""
        fi
    done
    echo "--- SIGUIENDO LOGS EN TIEMPO REAL ---"
    echo ""
    # Seguir logs en tiempo real
    if [ -f "/var/log/apache2/dobacksoft_access.log" ] || sudo test -f "/var/log/apache2/dobacksoft_access.log" 2>/dev/null; then
        sudo tail -f /var/log/apache2/dobacksoft_access.log /var/log/apache2/dobacksoft_error.log 2>/dev/null || \
        tail -f /var/log/apache2/dobacksoft_access.log /var/log/apache2/dobacksoft_error.log 2>/dev/null
    else
        sudo tail -f /var/log/apache2/access.log /var/log/apache2/error.log 2>/dev/null || \
        tail -f /var/log/apache2/access.log /var/log/apache2/error.log 2>/dev/null
    fi
else
    echo "❌ No se pudieron leer los logs de Apache2"
    echo ""
    echo "Verificando permisos..."
    ls -la /var/log/apache2/*.log 2>/dev/null | head -5 || echo "   No se pueden listar los logs"
    echo ""
    echo "Intenta ejecutar manualmente:"
    echo "   sudo tail -f /var/log/apache2/*.log"
    echo ""
    read -p "Presiona Enter para cerrar..."
fi
FRONTEND_EOF
chmod +x "$FRONTEND_SCRIPT"

# Detectar el emulador de terminal disponible y configurar DISPLAY
# Detectar DISPLAY del usuario actual (no hardcodear :0)
ORIGINAL_USER="${SUDO_USER:-$USER}"
ORIGINAL_HOME=$(getent passwd "$ORIGINAL_USER" | cut -d: -f6)

if [ -z "$DISPLAY" ]; then
    # Intentar detectar DISPLAY del usuario que ejecuta el script
    if [ -n "$ORIGINAL_USER" ] && [ "$ORIGINAL_USER" != "root" ]; then
        USER_DISPLAY=$(sudo -u "$ORIGINAL_USER" printenv DISPLAY 2>/dev/null || echo "")
        if [ -n "$USER_DISPLAY" ]; then
            export DISPLAY="$USER_DISPLAY"
        else
            # Buscar DISPLAY en procesos del usuario o en archivos de sesión
            USER_DISPLAY=$(ps aux | grep -E "^$ORIGINAL_USER.*Xorg|^$ORIGINAL_USER.*X" | grep -oP ':\d+\.?\d*' | head -1 || echo "")
            if [ -z "$USER_DISPLAY" ]; then
                # Buscar en archivos de sesión
                USER_DISPLAY=$(find /tmp -name ".X*-lock" -user "$ORIGINAL_USER" 2>/dev/null | head -1 | sed 's/.*\.X\([0-9]*\)-lock/:\1/' || echo ":0")
            fi
            export DISPLAY="$USER_DISPLAY"
        fi
    else
        export DISPLAY=${DISPLAY:-:0}
    fi
else
    export DISPLAY
fi

# Configurar XAUTHORITY - usar el del usuario original, no root
if [ -z "$XAUTHORITY" ]; then
    if [ -n "$ORIGINAL_USER" ] && [ "$ORIGINAL_USER" != "root" ] && [ -n "$ORIGINAL_HOME" ]; then
        # Intentar encontrar XAUTHORITY del usuario
        USER_XAUTH=$(sudo -u "$ORIGINAL_USER" printenv XAUTHORITY 2>/dev/null || echo "")
        if [ -n "$USER_XAUTH" ] && [ -f "$USER_XAUTH" ]; then
            export XAUTHORITY="$USER_XAUTH"
        elif [ -f "$ORIGINAL_HOME/.Xauthority" ]; then
            export XAUTHORITY="$ORIGINAL_HOME/.Xauthority"
        else
            # Buscar XAUTHORITY en ubicaciones comunes
            for xauth_path in "$ORIGINAL_HOME/.Xauthority" "/tmp/.X11-unix/X${DISPLAY#:}" "/run/user/$(id -u "$ORIGINAL_USER" 2>/dev/null)/.Xauthority"; do
                if [ -f "$xauth_path" ]; then
                    export XAUTHORITY="$xauth_path"
                    break
                fi
            done
            if [ -z "$XAUTHORITY" ]; then
                export XAUTHORITY=${XAUTHORITY:-$ORIGINAL_HOME/.Xauthority}
            fi
        fi
    else
        export XAUTHORITY=${XAUTHORITY:-$HOME/.Xauthority}
    fi
else
    export XAUTHORITY
fi

echo "   Usuario original: $ORIGINAL_USER"
echo "   DISPLAY detectado: $DISPLAY"
echo "   XAUTHORITY: $XAUTHORITY"

TERMINAL_CMD=""
if command -v gnome-terminal &> /dev/null; then
    TERMINAL_CMD="gnome-terminal"
elif command -v xterm &> /dev/null; then
    TERMINAL_CMD="xterm"
elif command -v x-terminal-emulator &> /dev/null; then
    TERMINAL_CMD="x-terminal-emulator"
fi

TERMINALS_OPENED=0

if [ -n "$TERMINAL_CMD" ]; then
    # Ejecutar terminales como el usuario original (no como root)
    if [ -n "$ORIGINAL_USER" ] && [ "$ORIGINAL_USER" != "root" ]; then
        # Terminal 1: Logs del Backend (PM2)
        echo "   Abriendo terminal para logs del Backend (como $ORIGINAL_USER)..."
        if [ "$TERMINAL_CMD" == "gnome-terminal" ]; then
            sudo -u "$ORIGINAL_USER" DISPLAY=$DISPLAY XAUTHORITY=$XAUTHORITY setsid gnome-terminal --title="DobackSoft - Backend Logs" -- bash -c "bash '$BACKEND_SCRIPT'; exec bash" > /dev/null 2>&1 &
            TERMINALS_OPENED=$((TERMINALS_OPENED + 1))
        elif [ "$TERMINAL_CMD" == "xterm" ]; then
            sudo -u "$ORIGINAL_USER" DISPLAY=$DISPLAY XAUTHORITY=$XAUTHORITY setsid xterm -title "DobackSoft - Backend Logs" -e bash -c "bash '$BACKEND_SCRIPT'; exec bash" > /dev/null 2>&1 &
            TERMINALS_OPENED=$((TERMINALS_OPENED + 1))
        else
            sudo -u "$ORIGINAL_USER" DISPLAY=$DISPLAY XAUTHORITY=$XAUTHORITY setsid $TERMINAL_CMD -e bash -c "bash '$BACKEND_SCRIPT'; exec bash" > /dev/null 2>&1 &
            TERMINALS_OPENED=$((TERMINALS_OPENED + 1))
        fi
        
        sleep 3
        
        # Terminal 2: Logs del Frontend/Apache2
        echo "   Abriendo terminal para logs del Frontend/Apache2 (como $ORIGINAL_USER)..."
        if [ "$TERMINAL_CMD" == "gnome-terminal" ]; then
            sudo -u "$ORIGINAL_USER" DISPLAY=$DISPLAY XAUTHORITY=$XAUTHORITY setsid gnome-terminal --title="DobackSoft - Frontend/Apache2 Logs" -- bash -c "bash '$FRONTEND_SCRIPT'; exec bash" > /dev/null 2>&1 &
            TERMINALS_OPENED=$((TERMINALS_OPENED + 1))
        elif [ "$TERMINAL_CMD" == "xterm" ]; then
            sudo -u "$ORIGINAL_USER" DISPLAY=$DISPLAY XAUTHORITY=$XAUTHORITY setsid xterm -title "DobackSoft - Frontend/Apache2 Logs" -e bash -c "bash '$FRONTEND_SCRIPT'; exec bash" > /dev/null 2>&1 &
            TERMINALS_OPENED=$((TERMINALS_OPENED + 1))
        else
            sudo -u "$ORIGINAL_USER" DISPLAY=$DISPLAY XAUTHORITY=$XAUTHORITY setsid $TERMINAL_CMD -e bash -c "bash '$FRONTEND_SCRIPT'; exec bash" > /dev/null 2>&1 &
            TERMINALS_OPENED=$((TERMINALS_OPENED + 1))
        fi
    else
        # Si no hay usuario original, ejecutar como root
        echo "   Abriendo terminal para logs del Backend..."
        if [ "$TERMINAL_CMD" == "gnome-terminal" ]; then
            DISPLAY=$DISPLAY XAUTHORITY=$XAUTHORITY setsid gnome-terminal --title="DobackSoft - Backend Logs" -- bash -c "bash '$BACKEND_SCRIPT'; exec bash" > /dev/null 2>&1 &
            TERMINALS_OPENED=$((TERMINALS_OPENED + 1))
        elif [ "$TERMINAL_CMD" == "xterm" ]; then
            DISPLAY=$DISPLAY XAUTHORITY=$XAUTHORITY setsid xterm -title "DobackSoft - Backend Logs" -e bash -c "bash '$BACKEND_SCRIPT'; exec bash" > /dev/null 2>&1 &
            TERMINALS_OPENED=$((TERMINALS_OPENED + 1))
        else
            DISPLAY=$DISPLAY XAUTHORITY=$XAUTHORITY setsid $TERMINAL_CMD -e bash -c "bash '$BACKEND_SCRIPT'; exec bash" > /dev/null 2>&1 &
            TERMINALS_OPENED=$((TERMINALS_OPENED + 1))
        fi
        
        sleep 3
        
        echo "   Abriendo terminal para logs del Frontend/Apache2..."
        if [ "$TERMINAL_CMD" == "gnome-terminal" ]; then
            DISPLAY=$DISPLAY XAUTHORITY=$XAUTHORITY setsid gnome-terminal --title="DobackSoft - Frontend/Apache2 Logs" -- bash -c "bash '$FRONTEND_SCRIPT'; exec bash" > /dev/null 2>&1 &
            TERMINALS_OPENED=$((TERMINALS_OPENED + 1))
        elif [ "$TERMINAL_CMD" == "xterm" ]; then
            DISPLAY=$DISPLAY XAUTHORITY=$XAUTHORITY setsid xterm -title "DobackSoft - Frontend/Apache2 Logs" -e bash -c "bash '$FRONTEND_SCRIPT'; exec bash" > /dev/null 2>&1 &
            TERMINALS_OPENED=$((TERMINALS_OPENED + 1))
        else
            DISPLAY=$DISPLAY XAUTHORITY=$XAUTHORITY setsid $TERMINAL_CMD -e bash -c "bash '$FRONTEND_SCRIPT'; exec bash" > /dev/null 2>&1 &
            TERMINALS_OPENED=$((TERMINALS_OPENED + 1))
        fi
    fi
    
    sleep 3
    
    # Verificar que las terminales se abrieron
    if ps aux | grep -E "(gnome-terminal|xterm).*DobackSoft" | grep -v grep > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Terminales abiertas${NC}"
        echo ""
        echo "   Terminal 1: Logs del Backend (PM2)"
        echo "   Terminal 2: Logs del Frontend/Apache2"
        echo ""
        echo "   Nota: Los scripts temporales están en $TEMP_DIR"
        echo ""
        echo "✅ Proceso completado. Las terminales están abiertas."
        echo "   Esta ventana se cerrará en 2 segundos..."
        sleep 2
    else
        echo -e "${YELLOW}⚠️ Las terminales pueden no haberse abierto correctamente${NC}"
        echo "   Intenta ejecutar manualmente:"
        echo "   - Backend: pm2 logs dobacksoft-backend"
        echo "   - Apache2: tail -f /var/log/apache2/dobacksoft_access.log"
        echo ""
        echo "✅ Proceso completado. La ventana se cerrará en 5 segundos..."
        sleep 5
    fi
else
    echo -e "${YELLOW}⚠️ No se encontró emulador de terminal (gnome-terminal, xterm, etc.)${NC}"
    echo "   Los logs están disponibles con:"
    echo "   - Backend: pm2 logs dobacksoft-backend"
    echo "   - Apache2: tail -f /var/log/apache2/dobacksoft_access.log"
    echo ""
    # Limpiar scripts temporales si no se usaron
    rm -rf "$TEMP_DIR"
    echo "✅ Proceso completado. La ventana se cerrará en 5 segundos..."
    sleep 5
fi
