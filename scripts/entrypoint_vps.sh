#!/bin/bash
# Arranque: Xvfb + x11vnc + noVNC + Artificial World
# Acceso: http://localhost:6080/vnc.html

set -e

# 1. Iniciar display virtual
Xvfb :99 -screen 0 1024x768x24 &
XVFB_PID=$!
sleep 2

# 2. Iniciar VNC sobre el display
x11vnc -display :99 -forever -shared -localhost -nopw -rfbport 5900 &
VNC_PID=$!
sleep 1

# 3. Iniciar juego en segundo plano (usa DISPLAY=:99)
python principal.py &
GAME_PID=$!

# 4. Esperar a que pygame cree la ventana
sleep 3

# 5. Servir noVNC (websockify + web client) en 6080
# --web=/usr/share/novnc/ sirve los archivos estáticos de noVNC
exec websockify --web=/usr/share/novnc/ 6080 localhost:5900
