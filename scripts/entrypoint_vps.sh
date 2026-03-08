#!/bin/bash
# Arranque: Xvfb + x11vnc + noVNC + Artificial World
# Acceso: http://localhost:6080/vnc.html

set -e

# 1. Iniciar display virtual (resolución fija para VNC estable)
Xvfb :99 -screen 0 1280x720x24 &
XVFB_PID=$!
sleep 3

# 2. Iniciar VNC sobre el display
x11vnc -display :99 -forever -shared -localhost -nopw -rfbport 5900 -wait 50 -noxdamage &
VNC_PID=$!
sleep 2

# 3. Iniciar juego en segundo plano (usa DISPLAY=:99)
# SDL con X11 explícito para Xvfb; salida a stderr para docker logs
export SDL_VIDEODRIVER=x11
python principal.py 2>&1 | tee /tmp/game.log &
GAME_PID=$!

# 4. Esperar a que pygame cree y dibuje la ventana (VPS puede ser lento)
sleep 8

# 5. Servir noVNC (websockify + web client) en 6080
# --web=/usr/share/novnc/ sirve los archivos estáticos de noVNC
exec websockify --web=/usr/share/novnc/ 6080 localhost:5900
