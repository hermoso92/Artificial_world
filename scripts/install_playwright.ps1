# Instala Playwright y Chromium para tests E2E del navegador
# Uso: .\scripts\install_playwright.ps1

Write-Host "Instalando Playwright..." -ForegroundColor Cyan
pip install playwright --quiet
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "Instalando Chromium..." -ForegroundColor Cyan
python -m playwright install chromium
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "OK. Ejecuta: python pruebas/test_browser_e2e.py" -ForegroundColor Green
