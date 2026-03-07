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
Write-Host ""
Write-Host "Se abriran 2 ventanas (backend y frontend). Espera 5 segundos..."
Write-Host ""

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backend'; node src/server.js" -WindowStyle Normal
Start-Sleep -Seconds 3
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontend'; npm run dev" -WindowStyle Normal
Start-Sleep -Seconds 5
$url = $null
foreach ($port in 5173, 5174) {
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:$port" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($r.StatusCode -eq 200) { $url = "http://localhost:$port"; break }
    } catch {
        # Frontend puede tardar en arrancar
    }
}
if ($url) {
    Write-Host "Abriendo navegador en $url"
    Start-Process $url
} else {
    Write-Host "Esperando frontend... Abre manualmente: http://localhost:5173"
    Start-Process "http://localhost:5173"
}
Write-Host ""
Write-Host "Si no se abrio, copia: http://localhost:5173"
Read-Host "Pulsa Enter para cerrar"
