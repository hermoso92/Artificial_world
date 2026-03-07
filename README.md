# MUNDO_ARTIFICIAL

Simulacion de vida artificial 2D con agentes autonomos. Las entidades toman decisiones por utilidad, reaccionan al entorno y pueden ser controladas mediante Modo Sombra.

## Requisitos

- Python 3.11+
- pygame 2.6.1

## Instalacion

```powershell
pip install -r requirements.txt
```

## Ejecucion

```powershell
python principal.py
```

## Demo web / Landing

```powershell
python principal.py --web
```

O con el script: `.\scripts\abrir_web.ps1`

La landing (`artificial-world.html`) incluye demo interactiva y documentación de todas las funcionalidades.

## Generar ejecutable (Windows)

Para distribuir a usuarios sin Python:

```powershell
.\build_exe.ps1
```

El archivo `dist\MundoArtificial.exe` se puede ejecutar en Windows sin instalar Python.

**Logs al usar el .exe:** Los archivos `app_diagnostico.log`, `simulacion.log`, `mundo_artificial.db` y `error_critico.txt` se crean en la misma carpeta que el ejecutable (p. ej. `dist\`).

## Verificacion automatica

Ejecuta tests + simulacion + Modo Competencia + modo sombra en un solo comando:

```powershell
python pruebas/verificar_todo.py
```

Genera `verificacion_completa.json`. Exit 0 = todo OK.

## Tests de navegador (E2E)

Para probar `artificial-world.html` con Playwright:

```powershell
pip install playwright
python -m playwright install chromium
python pruebas/test_browser_e2e.py
```

O usa el script: `.\scripts\install_playwright.ps1`

Con `--visible` se abre el navegador para debug: `python pruebas/test_browser_e2e.py --visible`

## Tests

```powershell
$env:SDL_VIDEODRIVER="dummy"
$env:SDL_AUDIODRIVER="dummy"
python pruebas/test_core.py
python pruebas/test_modo_sombra_completo.py
python pruebas/test_interacciones_sociales.py
python pruebas/test_bug_robar.py
python pruebas/test_watchdog_fixes.py
python pruebas/test_watchdog_integracion.py
python pruebas/test_arranque_limpio.py
```

## Despliegue en VPS (aplicacion completa)

La aplicacion Pygame se puede ejecutar en un VPS y acceder desde el navegador:

```bash
docker build -f Dockerfile.vps -t artificial-world .
docker compose -f docker-compose.vps.yml up -d
```

Abre `http://TU_IP:6080/vnc.html` para jugar. Ver [docs/DEPLOY_VPS_APLICACION.md](docs/DEPLOY_VPS_APLICACION.md).

## Documentacion

- [AGENTE_ENTRANTE.md](AGENTE_ENTRANTE.md) — Documentacion tecnica completa
- [PRODUCCION_PLAN.md](PRODUCCION_PLAN.md) — Plan de produccion y checklist
- [CAMINO_B_LISTO.md](CAMINO_B_LISTO.md) — Camino B (B2B): landing, emails, despliegue
