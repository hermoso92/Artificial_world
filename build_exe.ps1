# Script para generar ejecutable MUNDO_ARTIFICIAL
# Requiere: pip install pyinstaller
# Uso: .\build_exe.ps1

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "Instalando PyInstaller si no esta presente..."
pip install pyinstaller --quiet 2>$null

Write-Host "Generando ejecutable..."
pyinstaller --clean MundoArtificial.spec

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "EXE generado en: dist\MundoArtificial.exe"
    Write-Host "Prueba en una maquina sin Python instalado."
} else {
    Write-Host "Error en la generacion."
    exit 1
}
