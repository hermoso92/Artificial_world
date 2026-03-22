# Abre la demo web de Artificial World en el navegador por defecto
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$webPath = Join-Path $projectRoot "artificial-world.html"
if (Test-Path $webPath) {
    Start-Process $webPath
    Write-Host "Artificial World abierto en el navegador."
} else {
    Write-Error "No se encontró artificial-world.html en: $webPath"
    exit 1
}
