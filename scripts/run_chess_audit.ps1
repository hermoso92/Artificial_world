# Ejecuta auditoría Chess completa (agentes + coordinator)
# Salida: docker/chess-output/REPORTE_CHESS_1.md
# Uso: .\scripts\run_chess_audit.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$compose = Join-Path $root "docker\docker-compose.agents.yml"

Set-Location $root

$outDir = Join-Path $root "docker\chess-output"
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force }

Write-Host "Ejecutando auditoría Chess (agentes + coordinator)..." -ForegroundColor Cyan
docker compose -f $compose --profile agents up coordinator 2>&1

# Copiar reporte al root para fácil acceso
$reporte = Join-Path $outDir "REPORTE_CHESS_1.md"
if (Test-Path $reporte) {
    Copy-Item $reporte -Destination (Join-Path $root "REPORTE_CHESS_1.md") -Force
    Write-Host "Reporte copiado a REPORTE_CHESS_1.md" -ForegroundColor Green
}

Write-Host "Auditoría completada." -ForegroundColor Green
