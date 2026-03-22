# MUNDO_ARTIFICIAL

## Overview
Simulación social multiagente 2D con entidades autónomas sobre un grid. Las entidades perciben, recuerdan, toman decisiones por utilidad (motor utility-based con 9 modificadores) y reaccionan a directivas externas sin ejecutarlas ciegamente. El proyecto tiene DOS modos de ejecución: una app de escritorio Python/Pygame (`principal.py`) y un fullstack web Node.js + React (`scripts/iniciar_fullstack.ps1`). Fases 0–4 completadas; pendientes Fases 5–7 (relaciones, directivas, observabilidad).

## Tech Stack

### Python/Pygame (simulación de escritorio)
- Python 3.11+
- pygame 2.6.1
- python-dotenv >=1.0.0
- playwright >=1.40.0 (tests E2E opcionales)
- SQLite via stdlib (persistencia)

### Backend web
- Node.js (ESM)
- Express ^4.21.0
- better-sqlite3 ^12.6.2
- ws ^8.18.0 (WebSockets)
- Stripe ^20.4.1
- Vitest ^2.1.0 (tests)
- Puerto: **3001**

### Frontend web
- React ^18.3.1 (NO React 19 — verificado en package.json)
- Tailwind CSS ^4.2.1
- Zustand ^5.0.11
- Vite ^5.4.10
- Radix UI, Recharts, i18next
- Vitest ^2.1.0 (tests)
- Puerto: **5173**

## Directory Structure

```
Artificial_world/
├── principal.py              — Entry point Python/Pygame
├── configuracion.py          — Configuracion dataclass (todos los parámetros)
│
├── acciones/                 — 13 acciones independientes (AccionBase + subclases)
├── agentes/                  — IA: motor_decision, pesos_utilidad, memoria, relaciones, directivas, percepcion
├── entidades/                — EntidadBase, EntidadSocial, EntidadGato, FabricaEntidades
├── mundo/                    — Grid 2D: mapa, celda, recurso, refugio, generador
├── nucleo/                   — simulacion.py (orquestador), bus_eventos, gestor_ticks, contexto
├── sistemas/                 — logs, métricas, persistencia (SQLite), regeneracion, watchdog
├── interfaz/                 — renderizador, panel_control (6 pestañas), camara, seleccion
├── tipos/                    — enums.py, modelos.py (sin dependencias internas)
├── utilidades/               — geometria, azar, conversores
├── pruebas/                  — 9 suites de test; runner: run_tests_produccion.py
│
├── backend/                  — API Node.js/Express (puerto 3001)
│   └── src/                  — routes/, db/, middleware/, realtime/, audit/
├── frontend/                 — React app (Vite, puerto 5173)
│   └── src/                  — components/, config/, stores/
│
├── core/                     — Módulos alternativos/refactorizados (en paralelo a raíz)
├── gameplay/                 — Módulos alternativos de acciones/directivas
├── systems/                  — Módulos alternativos de sistemas
├── scripts/                  — Scripts Node.js: guardrails, portfolio, PDF, E2E
├── docker/                   — Agentes dockerizados (coordinator + agents)
├── docs/                     — Documentación técnica del proyecto
│
└── .github/workflows/        — pipeline.yml: test → deploy Pages + VPS
```

> ATENCIÓN: existen módulos duplicados en la raíz (`acciones/`, `entidades/`, etc.) Y dentro de `core/`, `gameplay/`, `systems/`. Los que usa `principal.py` son los de la raíz. Los de `core/` son una refactorización en paralelo.

## Skills to Auto-Load

- `~/.claude/skills/react-19/SKILL.md` — componentes en `frontend/src/` (React 18, pero las convenciones aplican)
- `~/.claude/skills/tailwind-4/SKILL.md` — clases Tailwind en el frontend
- `~/.claude/skills/zustand-5/SKILL.md` — stores en `frontend/src/`
- `~/.claude/skills/pytest/SKILL.md` — tests en `pruebas/` (Python)

> El proyecto también tiene un skill propio: `.cursor/skills/civilizaciones-vivas-guardrails/SKILL.md` — leerlo antes de modificar la lógica de entidades/simulación.

## Project Conventions

### Python (simulación)
- Type hints obligatorios en todas las funciones públicas
- Docstrings en clases y funciones públicas
- Usar `logger` (`sistemas/sistema_logs.py`) — NUNCA `print()`
- `except:` con excepción específica siempre — no bare except
- Variables de una letra solo en bucles cortos

### JavaScript/TypeScript (fullstack)
- NUNCA hardcodear URLs — usar `frontend/src/config/api.js` o variables de entorno
- NUNCA `console.log` — usar `utils/logger`
- Imports nombrados — no `import * as React`
- Componentes < 300 líneas
- No `var`, no `any` sin justificación comentada

### Seguridad
- Sin JWT ni tokens en variables globales del frontend
- Filtrar siempre por `organizationId` al acceder a datos de org
- Inputs del usuario sanitizados antes de queries

## Key Entry Points

| Archivo | Rol |
|---------|-----|
| `principal.py` | Entry point Python/Pygame |
| `nucleo/simulacion.py` | Orquestador central del loop de simulación |
| `agentes/motor_decision.py` | Núcleo de IA: generar→puntuar→seleccionar acción |
| `agentes/pesos_utilidad.py` | Tabla de pesos base de todas las acciones |
| `tipos/enums.py` | Todos los enums del sistema |
| `tipos/modelos.py` | Dataclasses compartidos |
| `backend/src/server.js` | Entry point API web |
| `frontend/src/App.jsx` | Entry point React |
| `configuracion.py` | Todos los parámetros de la simulación (dataclass) |
| `AGENTE_ENTRANTE.md` | Documentación técnica completa para agentes/IA |
| `PLAN_MUNDO_ARTIFICIAL.md` | Documento maestro: arquitectura + roadmap + checklist |

## Important Notes

- **Tests Python headless:** requieren `SDL_VIDEODRIVER=dummy SDL_AUDIODRIVER=dummy` — sin eso Pygame crashea
- **Runner de tests:** `python pruebas/run_tests_produccion.py` — ejecuta 9 suites en orden
- **Persistencia:** SQLite (`mundo_artificial.db`) auto-guardado cada 20 ticks. Si la DB es antigua (nombre "Michi"), borrarla y reiniciar
- **Módulos duplicados:** la raíz (`acciones/`, `entidades/`, `mundo/`, etc.) es lo activo en producción. `core/`, `gameplay/`, `systems/` son refactorizaciones en progreso — no mezclar imports
- **Modo Sombra:** el jugador controla a "Amiguisimo" (el gato) en turn-based. El mundo se congela hasta que Amiguisimo actúa
- **Watchdog:** se activa cada 10 ticks, detecta 8 tipos de anomalías. Para verlo en UI: pestaña "WATC" del panel derecho
- **CI:** `pipeline.yml` corre tests Python + deploy GitHub Pages + deploy VPS en cada push a main
- **Fase actual:** Fases 0–4 completas. Próximo: Fase 5 (GestorRelaciones + impacto en acciones sociales)
- **No usar:** Unity, Godot, LLM, RL, embeddings, bases vectoriales en la simulación Python
