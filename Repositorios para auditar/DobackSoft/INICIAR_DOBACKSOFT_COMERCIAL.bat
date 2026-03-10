@echo off
chcp 65001 >nul
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0INICIAR_DOBACKSOFT_COMERCIAL.ps1"
pause
