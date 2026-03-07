# Despliega la landing a Hostinger VPS (Windows PowerShell)
# Uso: .\scripts\deploy_landing.ps1
# Requiere: SSH_HOST, SSH_USER en .env o variables de entorno

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir
$LandingSrc = Join-Path $ProjectDir "docs\index.html"

if (-not (Test-Path $LandingSrc)) {
    Write-Error "No existe $LandingSrc"
    exit 1
}

# Cargar .env si existe
$EnvPath = Join-Path $ProjectDir ".env"
if (Test-Path $EnvPath) {
    Get-Content $EnvPath | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), "Process")
        }
    }
}

$SshHost = $env:SSH_HOST
$SshUser = if ($env:SSH_USER) { $env:SSH_USER } else { "root" }
$RemotePath = if ($env:REMOTE_PATH) { $env:REMOTE_PATH } else { "/var/www/html/artificialword" }

if (-not $SshHost) {
    Write-Host "Define SSH_HOST en .env o como variable de entorno"
    Write-Host "Ejemplo: `$env:SSH_HOST='tu-ip'; .\scripts\deploy_landing.ps1"
    exit 1
}

$BuildDir = Join-Path $ProjectDir "build\landing"
New-Item -ItemType Directory -Force -Path $BuildDir | Out-Null
Copy-Item $LandingSrc (Join-Path $BuildDir "index.html")

Write-Host "Desplegando a ${SshUser}@${SshHost}:${RemotePath}"
scp -r (Join-Path $BuildDir "*") "${SshUser}@${SshHost}:${RemotePath}/"
Write-Host "Landing desplegada correctamente"
