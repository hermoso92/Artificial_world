# Sube chess-private.tar a Transfer.sh y devuelve enlace
# Uso: .\scripts\chess_upload_transfer.ps1 [ruta-al-tar]
# Requiere: tar generado con docker save

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$clientId = $env:CHESS_CLIENT_ID ?? "default"
$tarPath = $args[0] ?? (Join-Path $root "chess-private-$clientId.tar")

if (-not (Test-Path $tarPath)) {
    Write-Host "Creando tar primero..." -ForegroundColor Yellow
    $tag = "chess-private:$clientId"
    docker save $tag -o $tarPath
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Ejecute chess_apply_build.ps1 antes" -ForegroundColor Red
        exit 1
    }
}

$fileName = Split-Path $tarPath -Leaf
Write-Host "Subiendo $fileName a Transfer.sh..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "https://transfer.sh/$fileName" -Method Put -InFile $tarPath
    Write-Host "Enlace de descarga (válido ~14 días):" -ForegroundColor Green
    Write-Host $response.Trim()
} catch {
    Write-Host "Error Transfer.sh: $_" -ForegroundColor Red
    Write-Host "Alternativa: subir manualmente a WeTransfer o Google Drive" -ForegroundColor Gray
    exit 1
}
