param(
    [ValidateSet('auto', 'python', 'web', 'debug', 'verify', 'ai')]
    [string]$PathChoice = 'auto',
    [switch]$DoctorOnly
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $repoRoot

$reportPath = Join-Path $repoRoot 'bootstrap_report.json'
$nextStepsPath = Join-Path $repoRoot 'bootstrap_next_steps.md'

function Write-Section([string]$title) {
    Write-Host ""
    Write-Host "== $title ==" -ForegroundColor Cyan
}

function Test-Tool([string]$commandName) {
    return $null -ne (Get-Command $commandName -ErrorAction SilentlyContinue)
}

function Get-CommandVersion([string]$commandName, [string[]]$arguments) {
    if (-not (Test-Tool $commandName)) {
        return $null
    }

    try {
        return (& $commandName @arguments 2>$null | Select-Object -First 1)
    } catch {
        return $null
    }
}

function Test-PortListening([int]$port) {
    try {
        $connection = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction Stop | Select-Object -First 1
        return $null -ne $connection
    } catch {
        return $false
    }
}

function Write-Artifacts([hashtable]$report) {
    $report | ConvertTo-Json -Depth 8 | Set-Content -Path $reportPath -Encoding UTF8

    $lines = @(
        '# Bootstrap Next Steps',
        '',
        "Fecha: $($report.generatedAt)",
        '',
        "Camino recomendado: `"$($report.recommendation.path)`"",
        '',
        '## Resumen',
        "- Python disponible: $($report.checks.python.available)",
        "- Node disponible: $($report.checks.node.available)",
        "- npm disponible: $($report.checks.npm.available)",
        "- Ollama disponible: $($report.checks.ollama.available)",
        "- Backend escuchando en 3001: $($report.checks.ports.backend3001Listening)",
        "- Frontend escuchando en 5173: $($report.checks.ports.frontend5173Listening)",
        '',
        '## Siguiente paso recomendado',
        $report.recommendation.reason,
        '',
        '## Caminos soportados',
        '- `python`: instala lo minimo de Python y ejecuta `principal.py`',
        '- `web`: instala dependencias web y delega en `scripts\iniciar_fullstack.ps1`',
        '- `debug`: ejecuta una verificacion corta (`pruebas\test_core.py`)',
        '- `verify`: ejecuta el runner `pruebas\run_tests_produccion.py`',
        '- `ai`: revisa Ollama y deja listo el backend para `/api/ai/*`',
        '',
        '## Notas',
        '- `Artificial World` sigue teniendo como golden path el motor Python.',
        '- La IA local es opcional y complementaria; no sustituye al motor Python.',
        '- `DobackSoft` real queda como contrato futuro, no como integracion implementada aqui.'
    )

    $lines -join "`r`n" | Set-Content -Path $nextStepsPath -Encoding UTF8
}

function Invoke-PythonInstall() {
    if (-not (Test-Tool 'python')) {
        throw 'Python no esta disponible en PATH.'
    }
    if (Test-Path 'requirements.txt') {
        Write-Host 'Instalando dependencias Python minimas...' -ForegroundColor Yellow
        & python -m pip install -r requirements.txt
    }
}

function Invoke-WebInstall() {
    if (-not (Test-Tool 'npm')) {
        throw 'npm no esta disponible en PATH.'
    }

    if (-not (Test-Path 'backend\node_modules')) {
        Write-Host 'Instalando dependencias backend...' -ForegroundColor Yellow
        Push-Location 'backend'
        try {
            & npm install
        } finally {
            Pop-Location
        }
    }

    if (-not (Test-Path 'frontend\node_modules')) {
        Write-Host 'Instalando dependencias frontend...' -ForegroundColor Yellow
        Push-Location 'frontend'
        try {
            & npm install
        } finally {
            Pop-Location
        }
    }
}

function Resolve-Recommendation([hashtable]$checks) {
    if ($checks.python.available -and (Test-Path 'principal.py')) {
        return @{
            path = 'python'
            reason = 'La parte mas verificable y defendible del repo sigue siendo el motor Python. Usalo primero para ensenar el proyecto sin mezclar demo web ni modulos externos.'
        }
    }

    if ($checks.node.available -and $checks.npm.available -and (Test-Path 'scripts\iniciar_fullstack.ps1')) {
        return @{
            path = 'web'
            reason = 'No se detecto un camino Python listo, pero si la demo web. Este camino sirve como showcase funcional, no como sustituto del motor principal.'
        }
    }

    return @{
        path = 'verify'
        reason = 'Faltan prerrequisitos para ejecutar el producto o la demo. Empieza por verificacion para descubrir bloqueos reales del entorno.'
    }
}

function Resolve-SelectedPath([string]$choice, [string]$recommendedPath) {
    if ($choice -and $choice -ne 'auto') {
        return $choice
    }

    Write-Host ""
    Write-Host "Selecciona camino o pulsa Enter para usar '$recommendedPath':" -ForegroundColor White
    Write-Host "  [1] python   - motor principal (golden path)" -ForegroundColor Gray
    Write-Host "  [2] web      - demo fullstack" -ForegroundColor Gray
    Write-Host "  [3] debug    - verificacion corta" -ForegroundColor Gray
    Write-Host "  [4] verify   - runner de produccion" -ForegroundColor Gray
    Write-Host "  [5] ai       - IA local opcional" -ForegroundColor Gray

    $raw = Read-Host 'Opcion'
    switch ($raw) {
        '1' { return 'python' }
        '2' { return 'web' }
        '3' { return 'debug' }
        '4' { return 'verify' }
        '5' { return 'ai' }
        '' { return $recommendedPath }
        default { return $recommendedPath }
    }
}

Write-Host 'Artificial World - Bootstrap / Doctor / Launcher' -ForegroundColor Cyan

$checks = @{
    python = @{
        available = Test-Tool 'python'
        version = Get-CommandVersion 'python' @('--version')
    }
    node = @{
        available = Test-Tool 'node'
        version = Get-CommandVersion 'node' @('--version')
    }
    npm = @{
        available = Test-Tool 'npm'
        version = Get-CommandVersion 'npm' @('--version')
    }
    ollama = @{
        available = Test-Tool 'ollama'
        version = Get-CommandVersion 'ollama' @('--version')
    }
    files = @{
        principal = Test-Path 'principal.py'
        backendPackage = Test-Path 'backend\package.json'
        frontendPackage = Test-Path 'frontend\package.json'
        aiMemory = Test-Path 'docs\ia-memory\README.md'
        aiRoute = Test-Path 'backend\src\routes\ai.js'
    }
    ports = @{
        backend3001Listening = Test-PortListening 3001
        frontend5173Listening = Test-PortListening 5173
    }
}

$recommendation = Resolve-Recommendation $checks
$report = @{
    generatedAt = (Get-Date).ToString('o')
    repo = 'Artificial World'
    checks = $checks
    recommendation = $recommendation
    selectedPath = $null
    artifacts = @{
        bootstrapReport = 'bootstrap_report.json'
        nextSteps = 'bootstrap_next_steps.md'
    }
}

Write-Artifacts $report

Write-Section 'Doctor'
Write-Host "Python:  $($checks.python.available) $($checks.python.version)" -ForegroundColor Gray
Write-Host "Node:    $($checks.node.available) $($checks.node.version)" -ForegroundColor Gray
Write-Host "npm:     $($checks.npm.available) $($checks.npm.version)" -ForegroundColor Gray
Write-Host "Ollama:  $($checks.ollama.available) $($checks.ollama.version)" -ForegroundColor Gray
Write-Host "Backend 3001 activo:  $($checks.ports.backend3001Listening)" -ForegroundColor Gray
Write-Host "Frontend 5173 activo: $($checks.ports.frontend5173Listening)" -ForegroundColor Gray
Write-Host ""
Write-Host "Camino recomendado: $($recommendation.path)" -ForegroundColor Green
Write-Host $recommendation.reason -ForegroundColor DarkGray

if ($DoctorOnly) {
    Write-Host ""
    Write-Host "Modo doctor completado. Artefactos generados:" -ForegroundColor Green
    Write-Host "  - $reportPath" -ForegroundColor Gray
    Write-Host "  - $nextStepsPath" -ForegroundColor Gray
    exit 0
}

$selectedPath = Resolve-SelectedPath -choice $PathChoice -recommendedPath $recommendation.path
$report.selectedPath = $selectedPath
Write-Artifacts $report

Write-Section "Launcher: $selectedPath"
switch ($selectedPath) {
    'python' {
        Invoke-PythonInstall
        & python .\principal.py
        break
    }
    'web' {
        Invoke-WebInstall
        & powershell -ExecutionPolicy Bypass -File '.\scripts\iniciar_fullstack.ps1'
        break
    }
    'debug' {
        Invoke-PythonInstall
        & python .\pruebas\test_core.py
        break
    }
    'verify' {
        Invoke-PythonInstall
        & python .\pruebas\run_tests_produccion.py
        break
    }
    'ai' {
        if (-not (Test-Tool 'ollama')) {
            throw 'Ollama no esta disponible en PATH. Instalala o usa otro camino.'
        }
        & ollama list
        Invoke-WebInstall
        Write-Host ''
        Write-Host 'IA local preparada. Siguiente paso recomendado:' -ForegroundColor Green
        Write-Host '  1. Inicia el backend web si aun no esta corriendo.' -ForegroundColor Gray
        Write-Host '  2. Consulta /api/ai/health y /api/ai/chat.' -ForegroundColor Gray
        Write-Host '  3. Revisa bootstrap_next_steps.md para contratos y limites.' -ForegroundColor Gray
        break
    }
    default {
        throw "Camino no soportado: $selectedPath"
    }
}
