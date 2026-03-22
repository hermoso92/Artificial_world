# Inicia backend y frontend de Artificial World full-stack
# Backend: puerto 3001
# Frontend: puerto 5173

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root
$backend = Join-Path $root "backend"
$frontend = Join-Path $root "frontend"

# Liberar puertos
Write-Host "Liberando puertos 3001 y 5173..." -ForegroundColor Yellow
$ports = @(3001, 5173)
foreach ($port in $ports) {
    $pids = netstat -ano 2>$null | Select-String ":$port\s" | ForEach-Object { ($_ -split '\s+')[-1] } | Select-Object -Unique
    foreach ($procId in $pids) {
        if ($procId -match '^\d+$' -and $procId -ne '0') {
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
            Write-Host "  Puerto $port liberado" -ForegroundColor Gray
        }
    }
}
Start-Sleep -Seconds 2

if (-not (Test-Path (Join-Path $backend "node_modules"))) {
    Write-Host "Instalando dependencias del backend..."
    Set-Location $backend
    npm install
    Set-Location $root
}
if (-not (Test-Path (Join-Path $frontend "node_modules"))) {
    Write-Host "Instalando dependencias del frontend..."
    Set-Location $frontend
    npm install
    Set-Location $root
}

Write-Host ""
Write-Host "Iniciando Artificial World full-stack..." -ForegroundColor Cyan
Write-Host "  Backend:  http://localhost:3001"
Write-Host "  Frontend: http://localhost:5173"
Write-Host "  Mission Control: http://localhost:5173/#missioncontrol"
Write-Host ""
Write-Host "Se abriran 2 ventanas (backend y frontend). Espera 5 segundos..."
Write-Host ""

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backend'; node src/server.js" -WindowStyle Normal

# Esperar a que el backend responda antes de lanzar el frontend
$backendReady = $false
for ($i = 0; $i -lt 15; $i++) {
    Start-Sleep -Seconds 1
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($r.StatusCode -eq 200) {
            $backendReady = $true
            Write-Host "  Backend listo" -ForegroundColor Green
            break
        }
    } catch {}
    Write-Host "  Esperando backend... ($($i+1)s)" -ForegroundColor Gray
}
if (-not $backendReady) {
    Write-Host "  AVISO: Backend no respondio en 15s, continuando..." -ForegroundColor Yellow
}

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontend'; npm run dev" -WindowStyle Normal

# Esperar a que el frontend responda
$url = $null
for ($i = 0; $i -lt 15; $i++) {
    Start-Sleep -Seconds 1
    foreach ($port in 5173, 5174) {
        try {
            $r = Invoke-WebRequest -Uri "http://localhost:$port" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
            if ($r.StatusCode -eq 200) { $url = "http://localhost:$port"; break }
        } catch {}
    }
    if ($url) { break }
    Write-Host "  Esperando frontend... ($($i+1)s)" -ForegroundColor Gray
}
if ($url) {
    Write-Host "  Frontend listo" -ForegroundColor Green
    Write-Host ""
    Write-Host "Abriendo navegador en $url"
    Start-Process $url
} else {
    Write-Host ""
    Write-Host "Esperando frontend... Abre manualmente: http://localhost:5173"
    Start-Process "http://localhost:5173"
}
Write-Host ""
Write-Host "Si no se abrio, copia: http://localhost:5173"
Write-Host "Ruta directa Mission Control: http://localhost:5173/#missioncontrol"
Read-Host "Pulsa Enter para cerrar"
