@echo off
REM DobackSoft V3 - Inicio Docker (ejecuta iniciardocker.ps1, siempre muestra logs del backend)
REM Doble clic o: iniciardocker.bat
REM Opcion: iniciardocker.bat solologs  (solo seguir logs, stack ya levantado)

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

set "PS_ARGS="
if /i "%1"=="solologs" set "PS_ARGS=-SoloLogs"
if "%1"=="-SoloLogs"  set "PS_ARGS=-SoloLogs"

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0iniciardocker.ps1" %PS_ARGS%

if errorlevel 1 (
    echo.
    echo Error al ejecutar. Pulsa una tecla para cerrar...
    pause >nul
)
