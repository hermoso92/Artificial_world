@echo off
title MUNDO ARTIFICIAL
cd /d "%~dp0"
set SDL_VIDEODRIVER=
echo Iniciando MUNDO ARTIFICIAL...
echo Si no aparece la ventana, busca "MUNDO ARTIFICIAL" en la barra de tareas.
echo.
python principal.py
echo.
echo Simulacion terminada.
pause
