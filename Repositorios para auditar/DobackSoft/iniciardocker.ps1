# Script de inicio Docker para DobackSoft V3
# Comprueba/levanta el stack completo (db, redis, backend, frontend) y muestra los logs del backend.
# Uso: .\iniciardocker.ps1
#      .\iniciardocker.ps1 -SoloLogs   → solo seguir logs (stack ya levantado)

param(
    [switch]$SoloLogs  # Solo adjuntar a logs del backend (no hacer up)
)

$ErrorActionPreference = "Stop"
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null

$projectRoot = $PSScriptRoot
$composeFile = "docker-compose.yml"
$backendPort = 9998
$frontendPort = 5174

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DOBACKSOFT V3 - INICIO DOCKER" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# --- 1. Verificar Docker ---
Write-Host "[1] Verificando Docker..." -ForegroundColor Yellow
try {
    $null = docker info 2>&1
    Write-Host "   [OK] Docker en ejecución" -ForegroundColor Green
} catch {
    Write-Host "   [ERROR] Docker no está en ejecución o no está en el PATH" -ForegroundColor Red
    Write-Host "   Inicia Docker Desktop y vuelve a ejecutar este script" -ForegroundColor Gray
    exit 1
}

# --- 2. Verificar .env ---
Write-Host "[2] Verificando configuración (.env)..." -ForegroundColor Yellow
$envPath = Join-Path $projectRoot ".env"
if (-not (Test-Path $envPath)) {
    Write-Host "   [WARNING] .env no encontrado en la raíz" -ForegroundColor Yellow
    Write-Host "   Copia .env.docker.example a .env y configura JWT_SECRET, POSTGRES_*, etc." -ForegroundColor Gray
} else {
    $envContent = Get-Content $envPath -Raw -ErrorAction SilentlyContinue
    $needVars = @("JWT_SECRET", "POSTGRES_PASSWORD")
    $missing = $needVars | Where-Object { $envContent -notmatch "$_\s*=" }
    if ($missing.Count -gt 0) {
        Write-Host "   [WARNING] Variables recomendadas en .env: $($missing -join ', ')" -ForegroundColor Yellow
    } else {
        Write-Host "   [OK] .env con variables necesarias" -ForegroundColor Green
    }
}
Write-Host ""

if (-not $SoloLogs) {
    # --- 3. Levantar stack ---
    Write-Host "[3] Levantando stack Docker..." -ForegroundColor Yellow
    Push-Location $projectRoot
    $eaSave = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        docker compose -f $composeFile up -d 2>&1 | ForEach-Object { Write-Host "   $_" }
        Start-Sleep -Seconds 2
        $backendQ = docker compose -f $composeFile ps -q backend 2>$null
        $allQ = docker compose -f $composeFile ps -q 2>$null
        if ($backendQ -and $allQ) {
            Write-Host "   [OK] Servicios iniciados o ya en ejecución (db, redis, backend, frontend)" -ForegroundColor Green
        } else {
            Write-Host "   [WARNING] Comprueba el estado: docker compose -f $composeFile ps" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   [ERROR] $_" -ForegroundColor Red
        Pop-Location
        $ErrorActionPreference = $eaSave
        exit 1
    }
    $ErrorActionPreference = $eaSave
    Pop-Location
    Write-Host ""

    # --- 4. Esperar backend y comprobar salud ---
    Write-Host "[4] Esperando a que el backend esté listo..." -ForegroundColor Yellow
    $maxWait = 60
    $step = 5
    $waited = 0
    $backendOk = $false
    while ($waited -lt $maxWait) {
        Start-Sleep -Seconds $step
        $waited += $step
        try {
            $r = Invoke-WebRequest -Uri "http://localhost:$backendPort/api/health" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
            if ($r.StatusCode -eq 200) {
                $backendOk = $true
                Write-Host "   [OK] Backend respondiendo en http://localhost:$backendPort" -ForegroundColor Green
                break
            }
        } catch {
            Write-Host "   Esperando... ($waited s)" -ForegroundColor Gray
        }
    }
    if (-not $backendOk) {
        Write-Host "   [WARNING] Backend no respondió en $maxWait s. Revisa: docker compose -f $composeFile logs backend" -ForegroundColor Yellow
    }
    Write-Host ""

    # --- 5. Comprobar frontend ---
    Write-Host "[5] Comprobando frontend..." -ForegroundColor Yellow
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:$frontendPort/" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        Write-Host "   [OK] Frontend en http://localhost:$frontendPort" -ForegroundColor Green
    } catch {
        Write-Host "   [WARNING] Frontend no responde aún: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    Write-Host ""

    # --- 6. Resumen y abrir navegador ---
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  STACK DOCKER LEVANTADO" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Frontend:    http://localhost:$frontendPort" -ForegroundColor White
    Write-Host "  Backend API: http://localhost:$backendPort" -ForegroundColor White
    Write-Host "  Health:      http://localhost:$backendPort/api/health" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  Detener:     docker compose -f $composeFile down" -ForegroundColor Gray
    Write-Host "  Logs todos:  docker compose -f $composeFile logs -f" -ForegroundColor Gray
    Write-Host ""

    Start-Process "http://localhost:$frontendPort"
    Write-Host "  Navegador abierto" -ForegroundColor Gray
    Write-Host ""
}

# --- 7. Seguir logs del backend (salir con Ctrl+C) ---
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  LOGS DEL BACKEND (Ctrl+C para salir)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Push-Location $projectRoot
try {
    docker compose -f $composeFile logs -f backend
} finally {
    Pop-Location
}
