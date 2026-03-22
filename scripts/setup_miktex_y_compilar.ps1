# =============================================================
# setup_miktex_y_compilar.ps1
# Descarga repositorio MiKTeX completo y compila main.tex
# =============================================================

$RepoPath = "C:\MiKTeX-Repository"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$MainTex = Join-Path $ProjectRoot "main.tex"

# Buscar miktexsetup.exe en rutas comunes
$MiKTeXSetup = @(
    "C:\Program Files\MiKTeX\miktex\bin\x64\miktexsetup.exe",
    "C:\Program Files (x86)\MiKTeX\miktex\bin\miktexsetup.exe",
    (Get-Command miktexsetup.exe -ErrorAction SilentlyContinue)?.Source
) | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1

$PdfLatex = @(
    "C:\Program Files\MiKTeX\miktex\bin\x64\pdflatex.exe",
    "C:\Program Files (x86)\MiKTeX\miktex\bin\pdflatex.exe",
    (Get-Command pdflatex.exe -ErrorAction SilentlyContinue)?.Source
) | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MiKTeX Setup + Compilacion main.tex" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── PASO 1: Crear directorio del repositorio ─────────────────
Write-Host "[1/3] Creando directorio del repositorio..." -ForegroundColor Yellow
if (-not (Test-Path $RepoPath)) {
    New-Item -ItemType Directory -Force -Path $RepoPath | Out-Null
    Write-Host "      Directorio creado: $RepoPath" -ForegroundColor Green
} else {
    Write-Host "      Ya existe: $RepoPath" -ForegroundColor DarkGray
}

# ── PASO 2: Descargar paquetes MiKTeX ────────────────────────
Write-Host ""
Write-Host "[2/3] Descargando repositorio completo de MiKTeX..." -ForegroundColor Yellow
Write-Host "      Destino: $RepoPath"
Write-Host "      (Esto puede tardar varios minutos segun tu conexion)" -ForegroundColor DarkGray
Write-Host ""

if (-not $MiKTeXSetup) {
    Write-Host "ERROR: No se encontro miktexsetup.exe." -ForegroundColor Red
    Write-Host "       Descargalo desde: https://miktex.org/download" -ForegroundColor Yellow
    exit 1
}

Write-Host "      Usando: $MiKTeXSetup" -ForegroundColor DarkGray

& $MiKTeXSetup `
    --verbose `
    --local-package-repository="$RepoPath" `
    --package-set=complete `
    download

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: La descarga fallo (codigo $LASTEXITCODE)." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "      Descarga completada." -ForegroundColor Green

# ── PASO 3: Compilar main.tex ────────────────────────────────
Write-Host ""
Write-Host "[3/3] Compilando main.tex con pdflatex..." -ForegroundColor Yellow

if (-not (Test-Path $MainTex)) {
    Write-Host "ERROR: No se encontro main.tex en: $MainTex" -ForegroundColor Red
    exit 1
}

if (-not $PdfLatex) {
    Write-Host "ERROR: No se encontro pdflatex.exe." -ForegroundColor Red
    exit 1
}

Set-Location $ProjectRoot

# Dos pasadas para resolver referencias cruzadas y lastpage
foreach ($pasada in 1..2) {
    Write-Host "      Pasada $pasada/2..."
    & $PdfLatex -interaction=nonstopmode -output-directory="$ProjectRoot" "$MainTex"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: pdflatex fallo en pasada $pasada (codigo $LASTEXITCODE)." -ForegroundColor Red
        exit $LASTEXITCODE
    }
}

$OutputPdf = Join-Path $ProjectRoot "main.pdf"
if (Test-Path $OutputPdf) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  PDF generado correctamente:" -ForegroundColor Green
    Write-Host "  $OutputPdf" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green

    # Abrir el PDF automaticamente
    Start-Process $OutputPdf
} else {
    Write-Host "ADVERTENCIA: No se encontro main.pdf tras la compilacion." -ForegroundColor Yellow
}
