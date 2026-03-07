# Artificial World - Script completo con debug interactivo
# Inicia backend, frontend y consola de debug
# Uso: .\scripts\debug_fullstack.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$backend = Join-Path $root "backend"
$frontend = Join-Path $root "frontend"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Artificial World - Debug Full-Stack" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar dependencias
if (-not (Test-Path (Join-Path $backend "node_modules"))) {
    Write-Host "Instalando dependencias del backend..." -ForegroundColor Yellow
    Set-Location $backend
    npm install
    Set-Location $root
}
if (-not (Test-Path (Join-Path $frontend "node_modules"))) {
    Write-Host "Instalando dependencias del frontend..." -ForegroundColor Yellow
    Set-Location $frontend
    npm install
    Set-Location $root
}

Write-Host "Iniciando servicios..." -ForegroundColor Green
Write-Host "  Backend:  http://localhost:3001" -ForegroundColor Gray
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor Gray
Write-Host "  Debug:    Consola interactiva" -ForegroundColor Gray
Write-Host ""

# Ventana 1: Backend
$backendCmd = "cd '$backend'; node --watch src/server.js"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd

Start-Sleep -Seconds 2

# Ventana 2: Frontend
$frontendCmd = "cd '$frontend'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd

Start-Sleep -Seconds 4

# Verificar que el backend responde
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "Backend OK" -ForegroundColor Green
} catch {
    Write-Host "Esperando backend... (puede tardar unos segundos)" -ForegroundColor Yellow
    Start-Sleep -Seconds 3
}

# Ventana 3: Debug interactivo
Write-Host ""
Write-Host "Abriendo consola de debug interactivo..." -ForegroundColor Green
Write-Host "Comandos: world, agents, agent <id>, resources, logs, start, pause, reset, help, quit" -ForegroundColor Gray
Write-Host ""

$debugScript = Join-Path $root "scripts\debug_interactivo.js"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root'; node $debugScript"

Start-Sleep -Seconds 2

# Abrir navegador
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "Listo. 3 ventanas abiertas:" -ForegroundColor Green
Write-Host "  1. Backend (API)" -ForegroundColor White
Write-Host "  2. Frontend (Vite)" -ForegroundColor White
Write-Host "  3. Debug interactivo (comandos en consola)" -ForegroundColor White
Write-Host ""
Write-Host "En la consola de debug puedes escribir:" -ForegroundColor Cyan
Write-Host "  world    - Estado del mundo" -ForegroundColor Gray
Write-Host "  agents   - Lista de agentes con inventario y memoria" -ForegroundColor Gray
Write-Host "  agent 1  - Detalle del agente 1" -ForegroundColor Gray
Write-Host "  start    - Iniciar simulación" -ForegroundColor Gray
Write-Host "  pause    - Pausar" -ForegroundColor Gray
Write-Host "  reset    - Reiniciar mundo" -ForegroundColor Gray
Write-Host ""
