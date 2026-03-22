# Verificación Ecosistema Artificial World

**Objetivo:** Documentar el estado verificable del ecosistema. Cada funcionalidad debe poder comprobarse por logs y capturas de pantalla. Técnico, condensado.

---

## 1. Precondiciones

```bash
# Backend
cd backend && npm run build 2>&1 | tail -1
# Esperado: exit 0

# Frontend
cd frontend && npm run build 2>&1 | tail -3
# Esperado: ✓ built in Xs

# Tests
cd frontend && npm run test 2>&1 | tail -2
# Esperado: Test Files 3 passed | Tests 10 passed

cd backend && npm run test 2>&1 | tail -2
# Esperado: Test Files 7 passed | Tests 41 passed
```

---

## 2. Matriz de Funcionalidades

| ID | Módulo | Ruta hash | Verificación | Log clave | Screenshot |
|----|--------|-----------|--------------|-----------|------------|
| F01 | Landing pública | `#` o `#home` | CTA "Crear civilización" y "Entrar al Hub" visibles | `lp-hero`, `lp-cta-section` | `01-landing-public.png` |
| F02 | Onboarding | `#landing` | 3 pasos: semilla → nombre → refugio → "Entrar al Hub" | `landing-step`, `landing-ready` | `02-landing-onboarding.png` |
| F03 | Hub | `#hub` o `#` (onboarded) | Secciones Core, Control, Experiences, Lab; breadcrumb "Hub" | `hub-section`, `app-shell-breadcrumbs` | `03-hub.png` |
| F04 | Tu Mundo (Simulation) | `#simulation` | Canvas, paneles Control/Map/World/Genetic/Refuge; header "Tu Mundo" | `simulation-view`, `simulation-area` | `04-simulation.png` |
| F05 | Arena (Minigames) | `#minigames` | Grid 3 en Raya, Damas, Ajedrez (Próximamente) | `minigames-grid`, `game-card` | `05-minigames.png` |
| F06 | 3 en Raya | `#minigames` → Jugar | Tablero 3×3, controles modo/dificultad | `ttt-board`, `ttt-cell` | `06-tictactoe.png` |
| F07 | Damas | `#minigames` → Damas | Tablero 8×8, piezas rojas/negras | `chk-board`, `chk-piece` | `07-checkers.png` |
| F08 | Mission Control | `#missioncontrol` | Dashboard, filtros, feed, badges WS | `mission-shell`, `MissionControlDashboard` | `08-missioncontrol.png` |
| F09 | Mystic Quest | `#mysticquest` | Secciones, quests, CTA "Entrar en tu mundo" | `mysticquest-section`, `mysticquest-quest-grid` | `09-mysticquest.png` |
| F10 | DobackSoft | `#dobacksoft` | Stats, cupón, tabs Subir/Rutas/Jugar | `dobacksoft-stats`, `dobacksoft-tabs` | `10-dobacksoft.png` |
| F11 | FireSimulator | `#dobacksoft` → Jugar | Gate o canvas según acceso | `firesim-gate` o `firesim-canvas-wrap` | `11-firesimulator.png` |
| F12 | Docs | `#docs` | Secciones Esenciales, Relato, Tesis, Técnicos | `docs-section`, `docs-item` | `12-docs.png` |
| F13 | Admin | `#admin` | Overview simulación/hero/dobacksoft o acceso denegado | `admin-overview` o `admin-error` | `13-admin.png` |
| F14 | AppShell | Todas excepto home/landing/firesim | Header marca, breadcrumbs, sidebar colapsable | `app-shell-header`, `app-shell-breadcrumbs` | `14-appshell.png` |
| F15 | PWA | Build | manifest.webmanifest, sw.js, registerSW inyectado | `dist/manifest.webmanifest` existe | N/A |

---

## 3. Flujo de Verificación Manual

```
1. Iniciar: .\scripts\iniciar_fullstack.ps1
2. Navegar a http://localhost:5173
3. Para cada F01–F14:
   - Ir a ruta hash
   - Comprobar elementos DOM (ver columna "Verificación")
   - Capturar screenshot (resolución: 1920×1080, 375×667 móvil)
   - Registrar en log: [F0X] OK | [F0X] FAIL: <motivo>
```

---

## 4. Comandos de Verificación Automática

```powershell
# Script único (genera docs/verificacion_log.txt)
.\scripts\verificar_ecosistema.ps1
```

```bash
# Manual
cd frontend; npm run build; npm run test
cd backend; npm run test

# PWA
ls frontend/dist/manifest.webmanifest frontend/dist/sw.js

# Rutas
grep -E "ROUTE_TO_DOMAIN|SHELL_ROUTES" frontend/src/config/ecosystemRoutes.js
```

---

## 5. Criterios de Éxito

- **Build:** 0 errores
- **Tests:** 51/51 pasando (10 frontend + 41 backend)
- **Linter:** 0 errores en `frontend/src`
- **Navegación:** Todas las rutas `VALID_ROUTES` cargan sin crash
- **AppShell:** Envuelve hub, simulation, missioncontrol, minigames, mysticquest, docs, admin, dobacksoft
- **Sin doble chrome:** No hay botón "← Hub" duplicado en módulos envueltos

---

## 6. Captura de Screenshots

```powershell
# Crear carpeta
New-Item -ItemType Directory -Force docs/verificacion/screenshots

# Con browser-devtools-cli (si instalado):
# npx browser-devtools-cli capture --url "http://localhost:5173/#hub" --output docs/verificacion/screenshots/03-hub.png

# Manual: DevTools (F12) > Cmd/Ctrl+Shift+P > "Capture full size screenshot"
# Guardar como 01-landing-public.png, 02-landing-onboarding.png, etc.
```

Resoluciones recomendadas: 1920×1080 (desktop), 375×667 (móvil).

---

## 7. Log de Verificación (plantilla)

```
Fecha: YYYY-MM-DD
Entorno: Windows 10 | Node X | npm Y

[BUILD] frontend: OK
[BUILD] backend: OK
[TEST] frontend: 10/10
[TEST] backend: 41/41
[LINT] frontend/src: 0 errores

[F01] Landing pública: OK
[F02] Onboarding: OK
[F03] Hub: OK
...
[F15] PWA: OK

Screenshots: ./docs/verificacion/screenshots/
```

---

## 8. Responsive

| Breakpoint | Comportamiento esperado |
|------------|-------------------------|
| ≥900px | Sidebar visible o colapsable, grid multi-columna |
| 768–899px | Sidebar colapsado por defecto |
| <768px | Sidebar fijo overlay, grid 1 columna, hub-grid 1 columna |

---

*Documento técnico condensado. Actualizar tras cambios en rutas o módulos.*
