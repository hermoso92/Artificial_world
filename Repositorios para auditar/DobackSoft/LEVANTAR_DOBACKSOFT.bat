@echo off
chcp 65001 >nul
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0LEVANTAR_DOBACKSOFT.ps1"
pause
