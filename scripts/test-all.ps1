# Test runner completo - Backend + Frontend + AI analysis
# Uso: .\scripts\test-all.ps1
# Con IA: $env:OPENAI_API_KEY="sk-..."; .\scripts\test-all.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

Write-Host "`n=== Artificial Worlds - Test Suite ===" -ForegroundColor Cyan
Write-Host ""

# Backend
Write-Host "Backend tests..." -ForegroundColor Yellow
Push-Location (Join-Path $root "backend")
npm run test
$backendExit = $LASTEXITCODE
Pop-Location
if ($backendExit -ne 0) { Write-Host "Backend tests FAILED" -ForegroundColor Red; exit $backendExit }

# Frontend
Write-Host "`nFrontend tests..." -ForegroundColor Yellow
Push-Location (Join-Path $root "frontend")
npm run test
$frontendExit = $LASTEXITCODE
Pop-Location
if ($frontendExit -ne 0) { Write-Host "Frontend tests FAILED" -ForegroundColor Red; exit $frontendExit }

# E2E autónoma (backend desde 0, Reset/Release/Start, Event Store)
Write-Host "`nE2E autónoma (Event Store)..." -ForegroundColor Yellow
Push-Location $root
node scripts/test-e2e-autonomous.js
$e2eExit = $LASTEXITCODE
Pop-Location
if ($e2eExit -ne 0) { Write-Host "E2E autónoma FAILED" -ForegroundColor Red; exit $e2eExit }

Write-Host "`n=== All tests passed ===" -ForegroundColor Green
