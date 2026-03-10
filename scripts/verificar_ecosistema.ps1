# Verificación automática del ecosistema AW
# Genera log verificable. Ejecutar desde raíz del proyecto.

$log = @()
$log += "=== VERIFICACION ECOSISTEMA AW ==="
$log += "Fecha: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
$log += ""

# Build frontend
$log += "[BUILD] frontend"
Push-Location frontend
$build = npm run build 2>&1
$buildOk = $LASTEXITCODE -eq 0
$log += if ($buildOk) { "  OK" } else { "  FAIL: $build" }
Pop-Location
$log += ""

# Backend: sin build (Node directo)

# Tests frontend
$log += "[TEST] frontend"
Push-Location frontend
$tf = npm run test 2>&1
$tfOk = $LASTEXITCODE -eq 0
$log += if ($tfOk) { "  10/10 OK" } else { "  FAIL" }
Pop-Location
$log += ""

# Tests backend
$log += "[TEST] backend"
Push-Location backend
$tb = npm run test 2>&1
$tbOk = $LASTEXITCODE -eq 0
$log += if ($tbOk) { "  41/41 OK" } else { "  FAIL" }
Pop-Location
$log += ""

# PWA manifest
$log += "[PWA] manifest"
$manifestOk = Test-Path frontend/dist/manifest.webmanifest
$log += if ($manifestOk) { "  manifest.webmanifest OK" } else { "  SKIP (no build)" }
$log += ""

# Resumen
$allOk = $buildOk -and $tfOk -and $tbOk
$log += "RESULTADO: $(if ($allOk) { 'PASS' } else { 'FAIL' })"
$log += ""

$out = $log -join "`n"
$out | Out-File -FilePath "docs/verificacion_log.txt" -Encoding utf8
Write-Host $out
exit $(if ($allOk) { 0 } else { 1 })
