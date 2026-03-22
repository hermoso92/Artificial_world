# DobackSoft - Solo levantar el stack (sin restaurar backup)
# Uso cuando ya tienes todo y solo quieres iniciar los contenedores tras haberlos detenido.
# Doble clic en LEVANTAR_DOBACKSOFT.bat (o ejecutar este .ps1 desde la raíz del proyecto)

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
Write-Host "  DOBACKSOFT - LEVANTAR STACK" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# --- 1. Verificar Docker ---
Write-Host "[1] Verificando Docker..." -ForegroundColor Yellow
try {
    $null = docker info 2>&1
    Write-Host "   [OK] Docker en ejecución" -ForegroundColor Green
} catch {
    Write-Host "   [ERROR] Docker no está en ejecución" -ForegroundColor Red
    Write-Host "   Inicia Docker Desktop y vuelve a ejecutar." -ForegroundColor Gray
    exit 1
}

# --- 2. Verificar .env ---
$envPath = Join-Path $projectRoot ".env"
if (-not (Test-Path $envPath)) {
    Write-Host "[2] [ERROR] No se encontró .env en la raíz del proyecto." -ForegroundColor Red
    exit 1
}
Write-Host "[2] [OK] Configuración .env encontrada" -ForegroundColor Green
Write-Host ""

# --- 3. Levantar stack (sin restaurar, sin borrar volúmenes) ---
Write-Host "[3] Levantando contenedores..." -ForegroundColor Yellow
Push-Location $projectRoot
try {
    $out = cmd /c "docker compose -f $composeFile up -d 2>&1"
    $out | Write-Host
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   [ERROR] docker compose up falló" -ForegroundColor Red
        exit 1
    }
    Write-Host "   [OK] Contenedores iniciados" -ForegroundColor Green
} finally {
    Pop-Location
}

# --- 4. Esperar backend (opcional) ---
Write-Host ""
Write-Host "[4] Esperando a que el backend responda..." -ForegroundColor Yellow
$waited = 0
while ($waited -lt 90) {
    Start-Sleep -Seconds 3
    $waited += 3
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:$backendPort/api/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($r.StatusCode -eq 200) {
            Write-Host "   [OK] Backend listo" -ForegroundColor Green
            break
        }
    } catch { }
}
if ($waited -ge 90) {
    Write-Host "   [WARNING] Backend no respondió en 90 s. Revisa: docker compose -f $composeFile logs backend" -ForegroundColor Yellow
}
Write-Host ""

# --- 5. Resumen y navegador ---
Write-Host "========================================" -ForegroundColor Green
Write-Host "  STACK LEVANTADO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Frontend:    http://localhost:$frontendPort" -ForegroundColor White
Write-Host "  Backend:     http://localhost:$backendPort" -ForegroundColor White
Write-Host ""
Start-Process "http://localhost:$frontendPort"
Write-Host "  Navegador abierto." -ForegroundColor Gray
Write-Host "  Para detener: docker compose -f $composeFile down" -ForegroundColor Gray
Write-Host ""
