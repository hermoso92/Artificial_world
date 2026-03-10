# Script para solucionar el problema de la columna existe en Prisma
Write-Host "Solucionando problema de Prisma Client..." -ForegroundColor Yellow

# 1. Detener procesos de Node.js (backend)
Write-Host "1. Deteniendo procesos de Node.js..." -ForegroundColor Cyan
try {
    Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
    Write-Host "   Procesos de Node.js detenidos" -ForegroundColor Green
    Start-Sleep -Seconds 2
}
catch {
    Write-Host "   No se pudieron detener todos los procesos" -ForegroundColor Yellow
}

# 2. Limpiar clientes de Prisma antiguos
Write-Host "2. Limpiando clientes de Prisma antiguos..." -ForegroundColor Cyan
$rootPath = $PSScriptRoot
$paths = @(
    "$rootPath\node_modules\.prisma",
    "$rootPath\backend\node_modules\.prisma"
)

foreach ($path in $paths) {
    if (Test-Path $path) {
        try {
            Remove-Item -Recurse -Force $path -ErrorAction Stop
            Write-Host "   Eliminado: $path" -ForegroundColor Green
        }
        catch {
            Write-Host "   No se pudo eliminar: $path" -ForegroundColor Yellow
        }
    }
}

# 2.5. Limpiar cache de ts-node si existe
Write-Host "2.5. Limpiando cache de TypeScript..." -ForegroundColor Cyan
$tsNodeCache = "$rootPath\backend\node_modules\.cache"
if (Test-Path $tsNodeCache) {
    try {
        Remove-Item -Recurse -Force $tsNodeCache -ErrorAction Stop
        Write-Host "   Cache de TypeScript eliminado" -ForegroundColor Green
    }
    catch {
        Write-Host "   No se pudo eliminar cache de TypeScript" -ForegroundColor Yellow
    }
}

# 3. Regenerar cliente de Prisma
Write-Host "3. Regenerando cliente de Prisma..." -ForegroundColor Cyan
Set-Location $rootPath
try {
    npx prisma generate
    Write-Host "   Cliente de Prisma regenerado exitosamente" -ForegroundColor Green
    
    # Verificar que se generó en la ubicación correcta
    $backendClientPath = "$rootPath\backend\node_modules\.prisma\client\default.js"
    if (Test-Path $backendClientPath) {
        Write-Host "   Cliente verificado en backend/node_modules/.prisma/client" -ForegroundColor Green
    }
    else {
        Write-Host "   Advertencia: Cliente no encontrado en ubicacion esperada" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "   Error regenerando cliente" -ForegroundColor Red
    exit 1
}

# 4. Sincronizar BD con schema (crear tablas Lens, Evidence, AuditLog si faltan)
Write-Host "4. Sincronizando BD con schema (prisma db push)..." -ForegroundColor Cyan
try {
    npx prisma db push
    Write-Host "   BD sincronizada" -ForegroundColor Green
}
catch {
    Write-Host "   Advertencia: db push falló (revisa DATABASE_URL). Puedes ejecutar 'npx prisma db push' manualmente." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Proceso completado" -ForegroundColor Green
Write-Host "Proximos pasos:" -ForegroundColor Cyan
Write-Host "   1. Reinicia el backend con: .\iniciar.ps1" -ForegroundColor White
Write-Host "   2. Si aun ves 'columna existe': el cliente ya no la usa; si la BD la tenia, no la uses." -ForegroundColor White
Write-Host "   3. Si ves 'tabla Lens no existe': ya se intento db push; revisa DATABASE_URL y ejecuta 'npx prisma db push'" -ForegroundColor White
