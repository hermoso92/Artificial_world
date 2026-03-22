# DobackSoft - Un solo clic para el comercial: restaura backup + levanta stack + abre navegador
# Coloca el backup en: backups\enero2026_completo.dump (ruta relativa al proyecto, funciona en cualquier PC)
# Uso: doble clic en INICIAR_DOBACKSOFT_COMERCIAL.bat (o ejecutar este .ps1 desde la raíz del proyecto)

$ErrorActionPreference = "Stop"
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null

# Ruta relativa al proyecto (cualquier ordenador)
$projectRoot = $PSScriptRoot
$backupRelativePath = "backups\enero2026_completo.dump"
$backupPath = Join-Path $projectRoot $backupRelativePath
$composeFile = "docker-compose.yml"
$backendPort = 9998
$frontendPort = 5174

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DOBACKSOFT - INICIO PARA COMERCIAL" -ForegroundColor Green
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
    Write-Host "   Copia .env.docker.example a .env y configura POSTGRES_*, JWT_SECRET, etc." -ForegroundColor Gray
    exit 1
}
Write-Host "[2] [OK] Configuración .env encontrada" -ForegroundColor Green
Write-Host ""

# --- 3. Restaurar backup + levantar stack, o solo levantar ---
Push-Location $projectRoot
try {
    if (Test-Path $backupPath) {
        Write-Host "[3] Backup encontrado: $backupRelativePath" -ForegroundColor Green
        Write-Host "    Restaurando base de datos y levantando todo (puede tardar varios minutos)..." -ForegroundColor Yellow
        Write-Host ""
        & (Join-Path $projectRoot "scripts\backup\restaurar-y-levantar-stack.ps1") -BackupFile $backupPath
        if ($LASTEXITCODE -ne 0) {
            Write-Host "   [ERROR] Falló la restauración o el arranque." -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "[3] No hay backup en $backupRelativePath - construyendo con código actual y levantando stack." -ForegroundColor Yellow
        $out = cmd /c "docker compose -f $composeFile up -d --build 2>&1"
        $out | ForEach-Object { Write-Host "   $_" }
        Start-Sleep -Seconds 5
        $waited = 0
        while ($waited -lt 90) {
            Start-Sleep -Seconds 5
            $waited += 5
            try {
                $r = Invoke-WebRequest -Uri "http://localhost:$backendPort/api/health" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
                if ($r.StatusCode -eq 200) { break }
            } catch { }
        }
    }
} finally {
    Pop-Location
}

# --- 4. Abrir navegador ---
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  DOBACKSOFT LISTO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Frontend:    http://localhost:$frontendPort" -ForegroundColor White
Write-Host "  Backend:     http://localhost:$backendPort" -ForegroundColor White
Write-Host ""
Start-Process "http://localhost:$frontendPort"
Write-Host "  Navegador abierto." -ForegroundColor Gray
Write-Host ""
Write-Host "  Para detener: docker compose -f $composeFile down" -ForegroundColor Gray
Write-Host ""
