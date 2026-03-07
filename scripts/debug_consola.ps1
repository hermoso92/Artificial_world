# Solo consola de debug interactivo
# Usar cuando backend y frontend ya están corriendo
# Uso: .\scripts\debug_consola.ps1

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$script = Join-Path $root "scripts\debug_interactivo.js"

Write-Host "Artificial World - Debug Interactivo" -ForegroundColor Cyan
Write-Host "Conectando a http://localhost:3001..." -ForegroundColor Gray
Write-Host ""

Set-Location $root
node $script
