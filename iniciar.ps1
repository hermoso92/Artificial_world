# =====================================================
# iniciar.ps1 - Artificial Worlds - Script de inicio
# Backend: http://localhost:3001
# Frontend: http://localhost:5173
# =====================================================

Write-Host "Artificial Worlds - Iniciando sistema..." -ForegroundColor Cyan
Write-Host ""

# 1. Liberar puertos
Write-Host "[1/4] Liberando puertos 3001 y 5173..." -ForegroundColor Yellow
$ports = @(3001, 5173)
foreach ($port in $ports) {
    $pids = netstat -ano 2>$null | Select-String ":$port\s" | ForEach-Object {
        ($_ -split '\s+')[-1]
    } | Select-Object -Unique
    foreach ($procId in $pids) {
        if ($procId -match '^\d+$' -and $procId -ne '0') {
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
            Write-Host "  Proceso $procId en puerto $port liberado" -ForegroundColor Gray
        }
    }
}
Start-Sleep -Seconds 2

# 2. Verificar node_modules
Write-Host "[2/4] Verificando dependencias..." -ForegroundColor Yellow
if (-not (Test-Path "backend\node_modules")) {
    Write-Host "  Instalando dependencias backend..." -ForegroundColor Gray
    Set-Location backend; npm install --silent; Set-Location ..
}
if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "  Instalando dependencias frontend..." -ForegroundColor Gray
    Set-Location frontend; npm install --silent; Set-Location ..
}
Write-Host "  Dependencias OK" -ForegroundColor Green

# 3. Iniciar backend
Write-Host "[3/4] Iniciando backend en puerto 3001..." -ForegroundColor Yellow
$backendJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$(Get-Location)\backend'; node src/server.js" -WindowStyle Normal -PassThru
Start-Sleep -Seconds 3

# Verificar backend
$backendOk = $false
for ($i = 0; $i -lt 5; $i++) {
    try {
        $res = Invoke-RestMethod "http://localhost:3001/health" -ErrorAction Stop
        if ($res.status -eq "ok") { $backendOk = $true; break }
    } catch {}
    Start-Sleep -Seconds 1
}
if ($backendOk) {
    Write-Host "  Backend OK: http://localhost:3001" -ForegroundColor Green
} else {
    Write-Host "  ADVERTENCIA: Backend no responde, verifica manualmente" -ForegroundColor Red
}

# 4. Iniciar frontend
Write-Host "[4/4] Iniciando frontend en puerto 5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$(Get-Location)\frontend'; npm run dev" -WindowStyle Normal
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "  ARTIFICIAL WORLDS - SISTEMA INICIADO" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  App:      http://localhost:5173" -ForegroundColor White
Write-Host "  API:      http://localhost:3001" -ForegroundColor White
Write-Host "  Health:   http://localhost:3001/health" -ForegroundColor White
Write-Host ""
Write-Host "  Hero Refuge API:" -ForegroundColor Gray
Write-Host "    GET  /api/hero           - Estado del heroe" -ForegroundColor Gray
Write-Host "    POST /api/hero/mode      - Cambiar modo (13 modos)" -ForegroundColor Gray
Write-Host "    POST /api/hero/query     - Consultar al agente IA" -ForegroundColor Gray
Write-Host "    GET  /api/hero/worlds    - Listar mundos vivos" -ForegroundColor Gray
Write-Host "    POST /api/hero/worlds    - Crear mundo artificial" -ForegroundColor Gray
Write-Host "    DELETE /api/hero/worlds/:id - Destruir mundo" -ForegroundColor Gray
Write-Host ""

# Abrir navegador
Start-Sleep -Seconds 2
Start-Process "http://localhost:5173"
Write-Host "  Navegador abierto en http://localhost:5173" -ForegroundColor Cyan
