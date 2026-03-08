# Pipeline Chess: aplicar mejoras y construir contenedor privado
# Uso: .\scripts\chess_apply_build.ps1
# Requiere: auditoría previa (run_chess_audit.ps1), Docker

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$outputDir = Join-Path $root "docker\chess-output"
$reporte = Join-Path $outputDir "reporte-completo.json"
$clientId = $env:CHESS_CLIENT_ID ?? "default"

if (-not (Test-Path $reporte)) {
    Write-Host "Ejecutando auditoría Chess primero..." -ForegroundColor Yellow
    & (Join-Path $root "scripts\run_chess_audit.ps1")
}

if (-not (Test-Path $reporte)) {
    Write-Host "Error: No existe reporte-completo.json. Ejecute run_chess_audit.ps1" -ForegroundColor Red
    exit 1
}

Write-Host "Construyendo contenedor privado para cliente: $clientId" -ForegroundColor Cyan
$dockerDir = Join-Path $root "docker\chess-private"
$tag = "chess-private:$clientId"

Set-Location $root
docker build -f docker/chess-private/Dockerfile -t $tag --build-arg BUILDKIT_INLINE_CACHE=1 .
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Imagen creada: $tag" -ForegroundColor Green
Write-Host "Exportar: docker save $tag -o chess-private-$clientId.tar" -ForegroundColor Gray
