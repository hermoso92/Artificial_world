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

## Modo Fullstack (Web)

Backend (Node.js/Express) + Frontend (React/Vite):

```powershell
.\scripts\iniciar_fullstack.ps1
```

Abre automaticamente `http://localhost:5173`. Backend en puerto 3001, frontend en 5173. Ver [docs/MODOS_EJECUCION.md](docs/MODOS_EJECUCION.md).

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

## Code Review automatico con IA (gga)

Cada `git commit` es revisado automaticamente por una IA local (Ollama) contra las reglas del proyecto definidas en `AGENTS.md`.

### Instalacion (una sola vez)

**Requisitos:** [Ollama](https://ollama.com/download/windows) instalado en el sistema.

Desde **Git Bash**:

```bash
bash install-gga.sh
```

El script descarga el modelo `qwen2.5-coder:7b` (~4GB), instala gga y activa el hook automaticamente.

### Uso diario

No necesitas hacer nada. Al hacer `git commit`, el hook se activa solo:

- `STATUS: PASSED` → commit procede normalmente
- `STATUS: FAILED` → commit bloqueado, se muestran las violaciones a corregir

### Saltar el review puntualmente

```bash
git commit --no-verify -m "wip: trabajo en curso"
```

### Reglas activas

Ver `AGENTS.md` en la raiz del proyecto. Revisa: no `console.log`, no URLs hardcodeadas, `organizationId` en requests, TypeScript estricto, componentes <300 lineas, y mas.

---

## Documentacion

- [docs/INFOGRAFIA_ARTIFICIAL_WORLD.md](docs/INFOGRAFIA_ARTIFICIAL_WORLD.md) — **Infografía 6 páginas** — para informáticos, jefes, inversores y abuelos
- [docs/CONOCE_ARTIFICIAL_WORLD.md](docs/CONOCE_ARTIFICIAL_WORLD.md) — Para el mundo — conócelo, pruébalo, adóptalo (2 páginas)
- [docs/ESENCIAL.md](docs/ESENCIAL.md) — **Guía técnica en 2 páginas** — para desarrolladores
- [docs/PROYECTO_GUIA.md](docs/PROYECTO_GUIA.md) — Guía completa (arquitectura, stack, ejecución)
- [docs/ESTRATEGIA_PRODUCTO.md](docs/ESTRATEGIA_PRODUCTO.md) — Estrategia: Python motor, Web demo
- [AGENTE_ENTRANTE.md](AGENTE_ENTRANTE.md) — Documentacion tecnica completa
- [PRODUCCION_PLAN.md](PRODUCCION_PLAN.md) — Plan de produccion y checklist
- [CAMINO_B_LISTO.md](CAMINO_B_LISTO.md) — Camino B (B2B): landing, emails, despliegue
