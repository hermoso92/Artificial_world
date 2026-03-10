# Script único de inicio para DobackSoft V3
# Método oficial para iniciar todo el sistema

# Configurar UTF-8 para mostrar emojis correctamente
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DOBACKSOFT V3 - INICIO COMPLETO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Directorio raíz del proyecto
$projectRoot = $PSScriptRoot
$backendDir = Join-Path $projectRoot "backend"
$frontendDir = Join-Path $projectRoot "frontend"

# Liberar puertos si están en uso (solo procesos que usan 9998/5174, no el resto de Node)
$backendPort = 9998
$frontendPort = 5174

Write-Host "[0] Liberando puertos en uso..." -ForegroundColor Yellow

# netstat con timeout 5s (evita colgados); una sola llamada para ambos puertos
$netstatOutput = $null
try {
    $job = Start-Job -ScriptBlock { netstat -ano 2>$null }
    $null = Wait-Job $job -Timeout 5
    if ($job.State -eq 'Completed') {
        $netstatOutput = Receive-Job $job
    }
    Remove-Job $job -Force -ErrorAction SilentlyContinue
} catch {}
if (-not $netstatOutput) {
    Write-Host "   [INFO] netstat timeout/error; omitiendo liberacion de puertos" -ForegroundColor Gray
    Write-Host "   [OK] Continuando..." -ForegroundColor Green
} else {
    function Get-PidsFromNetstat {
        param([string[]]$Lines, [int]$Port)
        $pids = @()
        foreach ($line in $Lines) {
            if ($line -match ":$Port\s" -and $line -match '\s+(\d+)\s*$') {
                $procId = [int]$Matches[1]
                if ($procId -gt 0) { $pids += $procId }
            }
        }
        return $pids | Select-Object -Unique
    }
    function Stop-PidsOnPort {
        param([int]$Port)
        $pids = Get-PidsFromNetstat -Lines $netstatOutput -Port $Port
        if ($pids.Count -gt 0) {
            foreach ($procId in $pids) {
                try { Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue } catch {}
                Start-Sleep -Milliseconds 200
                cmd /c "taskkill /F /T /PID $procId 2>nul" | Out-Null
            }
            Start-Sleep -Seconds 1
            return $true
        }
        return $false
    }
    if (Stop-PidsOnPort -Port $backendPort) {
        Write-Host "   [OK] Puerto $backendPort liberado" -ForegroundColor Green
    } else {
        Write-Host "   [OK] Puerto $backendPort disponible" -ForegroundColor Green
    }
    if (Stop-PidsOnPort -Port $frontendPort) {
        Write-Host "   [OK] Puerto $frontendPort liberado" -ForegroundColor Green
    } else {
        Write-Host "   [OK] Puerto $frontendPort disponible" -ForegroundColor Green
    }
}

Write-Host ""

# 🆕 LIMPIEZA DE CACHÉ (CRÍTICO PARA CAMBIOS EN CÓDIGO)
Write-Host "[0.5] Limpiando cachés del sistema..." -ForegroundColor Yellow

# Limpiar caché de ts-node-dev (backend)
$tsNodeCache = Join-Path $backendDir ".ts-node-dev"
if (Test-Path $tsNodeCache) {
    Write-Host "   Eliminando caché ts-node-dev..." -ForegroundColor Gray
    Remove-Item -Path $tsNodeCache -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   [OK] Caché ts-node-dev eliminado" -ForegroundColor Green
}
else {
    Write-Host "   [OK] No hay caché ts-node-dev" -ForegroundColor Green
}

# Limpiar caché de TypeScript (backend)
$tsCache = Join-Path $backendDir "node_modules\.cache\ts-node"
if (Test-Path $tsCache) {
    Write-Host "   Eliminando caché TypeScript..." -ForegroundColor Gray
    Remove-Item -Path $tsCache -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   [OK] Caché TypeScript eliminado" -ForegroundColor Green
}

# Limpiar caché de Node.js (backend)
$nodeCache = Join-Path $backendDir "node_modules\.cache"
if (Test-Path $nodeCache) {
    Write-Host "   Eliminando caché Node.js (backend)..." -ForegroundColor Gray
    Remove-Item -Path $nodeCache -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   [OK] Caché Node.js (backend) eliminado" -ForegroundColor Green
}

# Limpiar caché de Vite (frontend)
$viteCache = Join-Path $frontendDir "node_modules\.vite"
if (Test-Path $viteCache) {
    Write-Host "   Eliminando caché Vite..." -ForegroundColor Gray
    Remove-Item -Path $viteCache -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   [OK] Caché Vite eliminado" -ForegroundColor Green
}

# Limpiar dist del frontend (build limpio; útil con muchos cambios en frontend)
$distDir = Join-Path $frontendDir "dist"
if (Test-Path $distDir) {
    Write-Host "   Limpiando build anterior del frontend..." -ForegroundColor Gray
    Remove-Item -Path $distDir -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   [OK] Build anterior limpiado" -ForegroundColor Green
}

# 🆕 Limpiar logs antiguos (más de 7 días)
$logsDir = Join-Path $projectRoot "logs"
if (Test-Path $logsDir) {
    $oldLogs = Get-ChildItem -Path $logsDir -Filter "*.log" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) }
    if ($oldLogs.Count -gt 0) {
        Write-Host "   Eliminando $($oldLogs.Count) logs antiguos (>7 días)..." -ForegroundColor Gray
        $oldLogs | Remove-Item -Force -ErrorAction SilentlyContinue
        Write-Host "   [OK] Logs antiguos eliminados" -ForegroundColor Green
    }
}

Write-Host ""

# Verificar que los directorios existen
if (-not (Test-Path $backendDir)) {
    Write-Host "[ERROR] Directorio backend no encontrado: $backendDir" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $frontendDir)) {
    Write-Host "[ERROR] Directorio frontend no encontrado: $frontendDir" -ForegroundColor Red
    exit 1
}

Write-Host "[1] Verificando estructura del proyecto..." -ForegroundColor Yellow
Write-Host "   [OK] Backend: $backendDir" -ForegroundColor Green
Write-Host "   [OK] Frontend: $frontendDir" -ForegroundColor Green
Write-Host ""

# Verificar Node.js
Write-Host "[2] Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "   [OK] Node.js $nodeVersion disponible" -ForegroundColor Green
}
catch {
    Write-Host "   [ERROR] Node.js no está instalado" -ForegroundColor Red
    Write-Host "   Instala Node.js desde: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Verificar npm
Write-Host "[3] Verificando npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "   [OK] npm $npmVersion disponible" -ForegroundColor Green
}
catch {
    Write-Host "   [ERROR] npm no está instalado" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Verificar puertos (ya deberían estar libres)
Write-Host "[4] Verificando puertos..." -ForegroundColor Yellow

$verifyNetstat = $null
try {
    $vJob = Start-Job -ScriptBlock { netstat -ano 2>$null }
    $null = Wait-Job $vJob -Timeout 5
    if ($vJob.State -eq 'Completed') { $verifyNetstat = Receive-Job $vJob }
    Remove-Job $vJob -Force -ErrorAction SilentlyContinue
} catch {}
if ($verifyNetstat) {
    $getPids = { param($lines, $port)
        $pids = @()
        foreach ($l in $lines) {
            if ($l -match ":$port\s" -and $l -match '\s+(\d+)\s*$') {
                $id = [int]$Matches[1]
                if ($id -gt 0) { $pids += $id }
            }
        }
        return $pids | Select-Object -Unique
    }
    $backendPids = & $getPids $verifyNetstat $backendPort
    $frontendPids = & $getPids $verifyNetstat $frontendPort
    if ($backendPids.Count -gt 0) {
        foreach ($processId in $backendPids) {
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            cmd /c "taskkill /F /T /PID $processId 2>nul" | Out-Null
        }
        Write-Host "   [OK] Puerto $backendPort liberado" -ForegroundColor Green
    } else { Write-Host "   [OK] Puerto $backendPort disponible" -ForegroundColor Green }
    if ($frontendPids.Count -gt 0) {
        foreach ($processId in $frontendPids) {
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            cmd /c "taskkill /F /T /PID $processId 2>nul" | Out-Null
        }
        Write-Host "   [OK] Puerto $frontendPort liberado" -ForegroundColor Green
    } else { Write-Host "   [OK] Puerto $frontendPort disponible" -ForegroundColor Green }
} else {
    Write-Host "   [INFO] Verificacion omitida (timeout); continuando" -ForegroundColor Gray
}
Write-Host ""

# Verificar .env (backend carga de raíz y backend; comprobamos ambos)
Write-Host "[5] Verificando configuración del backend..." -ForegroundColor Yellow
$rootEnv = Join-Path $projectRoot ".env"
$backendEnv = Join-Path $backendDir ".env"

function Test-EnvVarDefined {
    param([string[]]$Paths, [string]$Var)
    foreach ($p in $Paths) {
        if (-not (Test-Path $p)) { continue }
        $lines = Get-Content $p -ErrorAction SilentlyContinue
        foreach ($line in $lines) {
            $clean = ($line -replace '#.*', '').Trim()
            if ($clean -match "^$Var\s*=") { return $true }
        }
    }
    return $false
}

$envPaths = @($rootEnv, $backendEnv) | Where-Object { Test-Path $_ }
if ($envPaths.Count -eq 0) {
    Write-Host "   [WARNING] No se encontró .env (ni en raíz ni en backend)" -ForegroundColor Yellow
}
else {
    Write-Host "   [OK] Archivo(s) .env encontrado(s)" -ForegroundColor Green
    $criticalVars = @("JWT_SECRET", "JWT_REFRESH_SECRET", "DATABASE_URL")
    $missingVars = @()
    foreach ($var in $criticalVars) {
        if (-not (Test-EnvVarDefined -Paths $envPaths -Var $var)) { $missingVars += $var }
    }
    if ($missingVars.Count -gt 0) {
        Write-Host "   [WARNING] Variables faltantes (en raíz o backend/.env): $($missingVars -join ', ')" -ForegroundColor Yellow
    }
    else {
        Write-Host "   [OK] Variables críticas presentes" -ForegroundColor Green
    }
}

# 🆕 Verificar y regenerar Prisma Client (CRÍTICO para cambios en schema)
Write-Host "[5.5] Verificando y regenerando Prisma Client..." -ForegroundColor Yellow
$prismaSchemaPath = Join-Path $projectRoot "prisma\schema.prisma"
$prismaClientPath = Join-Path $projectRoot "node_modules\@prisma\client"
$prismaClientBackendPath = Join-Path $backendDir "node_modules\@prisma\client"

# Verificar que el schema existe
if (-not (Test-Path $prismaSchemaPath)) {
    Write-Host "   [ERROR] Schema de Prisma no encontrado: $prismaSchemaPath" -ForegroundColor Red
    exit 1
}
Write-Host "   [OK] Schema encontrado: $prismaSchemaPath" -ForegroundColor Green

# ⚠️ En Windows, prisma generate puede fallar con EPERM si el query_engine está en uso.
# Si el cliente ya existe, omitimos generate para evitar el error.
$prismaQueryEngine = Join-Path $backendDir "node_modules\.prisma\client\query_engine-windows.dll.node"
$prismaClientExists = Test-Path $prismaQueryEngine

if ($prismaClientExists) {
    Write-Host "   [OK] Prisma Client ya presente (omitir generate evita EPERM en Windows)" -ForegroundColor Green
}
else {
    Write-Host "   Regenerando Prisma Client desde raíz del proyecto..." -ForegroundColor Gray
    Push-Location $projectRoot
    try {
        $null = npx prisma validate --schema=prisma/schema.prisma 2>&1
        if ($LASTEXITCODE -eq 0) { Write-Host "   [OK] Schema de Prisma válido" -ForegroundColor Green }
        $prismaOutput = npx prisma generate --schema=prisma/schema.prisma 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   [OK] Prisma Client regenerado exitosamente" -ForegroundColor Green
        }
        else {
            Pop-Location
            Push-Location $backendDir
            $prismaOutput2 = npx prisma generate --schema=../prisma/schema.prisma 2>&1
            if ($LASTEXITCODE -eq 0) { Write-Host "   [OK] Prisma Client regenerado desde backend" -ForegroundColor Green }
            else { Write-Host "   [WARNING] Generate falló; usa cliente existente o ejecuta manualmente tras cerrar backend" -ForegroundColor Yellow }
        }
    }
    catch { Write-Host "   [WARNING] Excepción en Prisma generate: $_" -ForegroundColor Yellow }
    finally { Pop-Location }
}

# Verificación final solo si no confirmamos antes
if (-not $prismaClientExists) {
    $prismaClientBackend = Test-Path $prismaClientBackendPath
    if ($prismaClientBackend) { Write-Host "   [OK] Prisma Client disponible en backend" -ForegroundColor Green }
    elseif (Test-Path $prismaClientPath) { Write-Host "   [OK] Prisma Client en raíz" -ForegroundColor Green }
    else { Write-Host "   [WARNING] Prisma Client no encontrado; ejecuta: cd backend; npx prisma generate --schema=../prisma/schema.prisma" -ForegroundColor Yellow }
}
Write-Host ""

# Verificar node_modules
Write-Host "[6] Verificando dependencias..." -ForegroundColor Yellow
$backendNodeModules = Join-Path $backendDir "node_modules"
$frontendNodeModules = Join-Path $frontendDir "node_modules"

if (-not (Test-Path $backendNodeModules)) {
    Write-Host "   [WARNING] node_modules del backend no encontrado" -ForegroundColor Yellow
    Write-Host "   Instalando dependencias del backend..." -ForegroundColor Gray
    Push-Location $backendDir
    npm install
    Pop-Location
}
else {
    Write-Host "   [OK] Dependencias del backend instaladas" -ForegroundColor Green
}

if (-not (Test-Path $frontendNodeModules)) {
    Write-Host "   [WARNING] node_modules del frontend no encontrado" -ForegroundColor Yellow
    Write-Host "   Instalando dependencias del frontend..." -ForegroundColor Gray
    Push-Location $frontendDir
    npm install --legacy-peer-deps
    Pop-Location
}
else {
    Write-Host "   [OK] Dependencias del frontend instaladas" -ForegroundColor Green
}
Write-Host ""

# M6-1: Copiar openapi.json a dist para Swagger UI (si se ejecuta backend desde dist)
Write-Host "[6.5] Copiando openapi.json para Swagger UI..." -ForegroundColor Yellow
$openapiSrc = Join-Path $backendDir "src\openapi.json"
$openapiDestDir = Join-Path $backendDir "dist\src"
$openapiDest = Join-Path $openapiDestDir "openapi.json"
if (Test-Path $openapiSrc) {
    if (-not (Test-Path $openapiDestDir)) {
        New-Item -ItemType Directory -Path $openapiDestDir -Force | Out-Null
    }
    Copy-Item -Path $openapiSrc -Destination $openapiDest -Force
    Write-Host "   [OK] openapi.json copiado a backend\dist\src\" -ForegroundColor Green
}
else {
    Write-Host "   [OK] openapi.json no presente (Swagger opcional)" -ForegroundColor Gray
}
Write-Host ""

# Preparar logs
Write-Host "[7] Preparando directorio de logs..." -ForegroundColor Yellow
if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir | Out-Null
}
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backendLogFile = Join-Path $logsDir "backend_$timestamp.log"
$frontendLogFile = Join-Path $logsDir "frontend_$timestamp.log"
Write-Host "   [OK] Directorio de logs preparado: $logsDir" -ForegroundColor Green
Write-Host ""

# Iniciar Backend (npm run dev = sin watch, ideal para ingesta larga; dev:watch = con reinicio al guardar)
Write-Host "[8] Iniciando Backend..." -ForegroundColor Yellow
Write-Host "   Puerto: $backendPort" -ForegroundColor Gray
Write-Host "   Directorio: $backendDir" -ForegroundColor Gray
Write-Host "   Modo: sin watch (no reinicia al guardar archivos)" -ForegroundColor Gray

$backendScript = Join-Path $env:TEMP "dobacksoft_backend_$timestamp.ps1"
@"
# Configurar UTF-8 para mostrar emojis correctamente
`$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null

Set-Location '$backendDir'
Write-Host '========================================' -ForegroundColor Cyan
Write-Host '  DOBACKSOFT BACKEND - LOGS' -ForegroundColor Green
Write-Host '========================================' -ForegroundColor Cyan
Write-Host ''
Write-Host 'Puerto: http://localhost:$backendPort' -ForegroundColor Yellow
Write-Host 'Log guardado en: $backendLogFile' -ForegroundColor Gray
Write-Host 'Encoding: UTF-8 (emojis habilitados)' -ForegroundColor Gray
Write-Host 'Caché limpiado al inicio' -ForegroundColor Green
Write-Host ''
Write-Host 'Presiona Ctrl+C para detener' -ForegroundColor Gray
Write-Host ''
npm run dev 2>&1 | Tee-Object -FilePath '$backendLogFile'
"@ | Out-File -FilePath $backendScript -Encoding UTF8

# cmd /c start abre ventana visible de forma fiable en Windows
$backendCmd = "start `"Doback Backend`" powershell -NoExit -NoProfile -ExecutionPolicy Bypass -File `"$backendScript`""
Start-Process cmd.exe -ArgumentList "/c", $backendCmd -WindowStyle Normal

Start-Sleep -Seconds 3
Write-Host "   [OK] Backend iniciado en nueva ventana" -ForegroundColor Green
Write-Host ""

# Iniciar Frontend
Write-Host "[9] Iniciando Frontend..." -ForegroundColor Yellow
Write-Host "   Puerto: $frontendPort" -ForegroundColor Gray
Write-Host "   Directorio: $frontendDir" -ForegroundColor Gray

$frontendScript = Join-Path $env:TEMP "dobacksoft_frontend_$timestamp.ps1"
@"
# Configurar UTF-8 para mostrar emojis correctamente
`$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null

Set-Location '$frontendDir'
Write-Host '========================================' -ForegroundColor Cyan
Write-Host '  DOBACKSOFT FRONTEND - LOGS' -ForegroundColor Green
Write-Host '========================================' -ForegroundColor Cyan
Write-Host ''
Write-Host 'Puerto: http://localhost:$frontendPort' -ForegroundColor Yellow
Write-Host 'Log guardado en: $frontendLogFile' -ForegroundColor Gray
Write-Host 'Encoding: UTF-8 (emojis habilitados)' -ForegroundColor Gray
Write-Host 'Caché limpiado al inicio' -ForegroundColor Green
Write-Host ''
Write-Host 'Presiona Ctrl+C para detener' -ForegroundColor Gray
Write-Host ''
npm run dev 2>&1 | Tee-Object -FilePath '$frontendLogFile'
"@ | Out-File -FilePath $frontendScript -Encoding UTF8

# cmd /c start abre ventana visible de forma fiable en Windows
$frontendCmd = "start `"Doback Frontend`" powershell -NoExit -NoProfile -ExecutionPolicy Bypass -File `"$frontendScript`""
Start-Process cmd.exe -ArgumentList "/c", $frontendCmd -WindowStyle Normal

Start-Sleep -Seconds 3
Write-Host "   [OK] Frontend iniciado en nueva ventana" -ForegroundColor Green
Write-Host ""

# Esperar y verificar
Write-Host "[10] Esperando a que los servicios inicien..." -ForegroundColor Yellow
Write-Host "   Tiempo estimado: 20-30 segundos" -ForegroundColor Gray
Start-Sleep -Seconds 10

Write-Host "[11] Verificando conectividad..." -ForegroundColor Yellow

# Reintentos para backend (puede tardar más en compilar)
$backendReady = $false
for ($i = 1; $i -le 3; $i++) {
    try {
        $backendResponse = Invoke-WebRequest -Uri "http://localhost:$backendPort/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        Write-Host "   [OK] Backend respondiendo (Status: $($backendResponse.StatusCode))" -ForegroundColor Green
        $backendReady = $true
        break
    }
    catch {
        if ($i -lt 3) {
            Write-Host "   [INFO] Intento $i/3: Backend aún compilando..." -ForegroundColor Gray
            Start-Sleep -Seconds 5
        }
        else {
            Write-Host "   [WARNING] Backend tardando más de lo esperado" -ForegroundColor Yellow
            Write-Host "   Verifica la ventana de logs del backend" -ForegroundColor Gray
        }
    }
}

# Verificar frontend
$frontendReady = $false
for ($i = 1; $i -le 3; $i++) {
    try {
        $frontendResponse = Invoke-WebRequest -Uri "http://localhost:$frontendPort" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        Write-Host "   [OK] Frontend respondiendo (Status: $($frontendResponse.StatusCode))" -ForegroundColor Green
        $frontendReady = $true
        break
    }
    catch {
        if ($i -lt 3) {
            Write-Host "   [INFO] Intento $i/3: Frontend aún compilando..." -ForegroundColor Gray
            Start-Sleep -Seconds 5
        }
        else {
            Write-Host "   [WARNING] Frontend tardando más de lo esperado" -ForegroundColor Yellow
            Write-Host "   Verifica la ventana de logs del frontend" -ForegroundColor Gray
        }
    }
}
Write-Host ""

# Abrir navegador solo si frontend está listo
if ($frontendReady) {
    Write-Host "[12] Abriendo navegador..." -ForegroundColor Yellow
    Start-Sleep -Seconds 2
    Start-Process "http://localhost:$frontendPort"
    Write-Host "   [OK] Navegador abierto" -ForegroundColor Green
}
else {
    Write-Host "[12] Navegador NO abierto (frontend aún iniciando)" -ForegroundColor Yellow
    Write-Host "   Abre manualmente: http://localhost:$frontendPort" -ForegroundColor Gray
}
Write-Host ""

# Resumen
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  SISTEMA INICIADO EXITOSAMENTE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "URLs disponibles:" -ForegroundColor Yellow
Write-Host "  Frontend: http://localhost:$frontendPort" -ForegroundColor White
Write-Host "  Backend API: http://localhost:$backendPort" -ForegroundColor White
Write-Host "  Swagger UI: http://localhost:$backendPort/api-docs/" -ForegroundColor White
Write-Host "  Backend Health: http://localhost:$backendPort/health" -ForegroundColor Gray
Write-Host ""
Write-Host "Credenciales de login (si ejecutaste seed):" -ForegroundColor Yellow
Write-Host "  CMadrid:    admin@cmadrid.com / admin123   |   manager@cmadrid.com / admin123" -ForegroundColor Gray
Write-Host "  Demo:       admin@demo.com / admin123   |   manager@demo.com / admin123" -ForegroundColor Gray
Write-Host "  Formación: admin@formacion.com / admin123   |   manager@formacion.com / admin123" -ForegroundColor Gray
Write-Host "  (Pruebas: usuario@pruebas.com / user123 si usaste createTestOrganization)" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Ventanas PowerShell abiertas:" -ForegroundColor Yellow
Write-Host "  - Backend (logs en tiempo real)" -ForegroundColor White
Write-Host "  - Frontend (logs en tiempo real)" -ForegroundColor White
Write-Host ""
Write-Host "Logs guardados en:" -ForegroundColor Yellow
Write-Host "  Backend: $backendLogFile" -ForegroundColor Gray
Write-Host "  Frontend: $frontendLogFile" -ForegroundColor Gray
Write-Host ""
Write-Host "Optimizaciones aplicadas:" -ForegroundColor Yellow
Write-Host "  ✅ Caché limpiado (Vite, Node, TypeScript, Prisma)" -ForegroundColor Green
Write-Host "  ✅ Prisma Client regenerado con modelos actualizados" -ForegroundColor Green
Write-Host "  ✅ Logs antiguos eliminados (>7 días)" -ForegroundColor Green
Write-Host "  ✅ Puertos liberados solo 9998/5174 (no se cierran otros procesos Node)" -ForegroundColor Green
Write-Host "  ✅ Frontend dist limpiado (build limpio en cada inicio)" -ForegroundColor Green
Write-Host "  ✅ Backend sin watch (no reinicia al guardar; ingesta larga estable)" -ForegroundColor Green
Write-Host ""
Write-Host "COMANDOS ÚTILES:" -ForegroundColor Yellow
Write-Host "  Detener servicios: Cerrar las ventanas PowerShell" -ForegroundColor Gray
Write-Host "  Ver logs: Abrir archivos en logs/" -ForegroundColor Gray
Write-Host "  Reiniciar: Ejecutar .\iniciar.ps1 nuevamente" -ForegroundColor Gray
Write-Host "  Backend con watch (reinicio al guardar): en backend ejecutar npm run dev:watch" -ForegroundColor Gray
Write-Host ""
Write-Host "EXPLORADOR DE ARCHIVOS (Cursor/VS Code):" -ForegroundColor Yellow
Write-Host "  El script elimina cachés (dist, .vite, .ts-node-dev). Si no ves los cambios" -ForegroundColor Gray
Write-Host "  en el explorador, presiona F5 en el panel de archivos o Ctrl+Shift+E y F5" -ForegroundColor Gray
Write-Host ""

# Marcador para que el IDE detecte cambios y refresque el árbol de archivos
$refreshMarker = Join-Path $projectRoot ".iniciar.lastrun"
Set-Content -Path $refreshMarker -Value (Get-Date -Format "o") -Force -ErrorAction SilentlyContinue
Write-Host ""

if ($backendReady -and $frontendReady) {
    Write-Host "✅ Listo para usar!" -ForegroundColor Green
}
else {
    Write-Host "⚠️  Sistema iniciado pero algunos servicios aún están cargando" -ForegroundColor Yellow
    Write-Host "   Espera 30 segundos más y verifica las ventanas de logs" -ForegroundColor Gray
}
Write-Host ""
