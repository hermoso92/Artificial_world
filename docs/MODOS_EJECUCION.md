# Modos de ejecución — Python vs Fullstack

Este documento describe las **dos formas distintas** de ejecutar Artificial World. Son implementaciones paralelas del mismo concepto (simulación de vida artificial), pero con tecnologías y alcance diferentes.

---

## Resumen rápido

| Aspecto | `python principal.py` | Fullstack (`iniciar_fullstack.ps1`) |
|---------|------------------------|-------------------------------------|
| **Tecnología** | Python 3.11+ + pygame | Node.js + React + Vite |
| **Interfaz** | Ventana de escritorio (pygame) | Navegador web |
| **Motor** | `nucleo.Simulacion` (Python) | `backend/simulation/` (JavaScript) |
| **Inicio** | `python principal.py` | `.\scripts\iniciar_fullstack.ps1` |
| **Puertos** | N/A (aplicación local) | Backend 3001, Frontend 5173 |

---

## 1. Python + pygame (`principal.py`)

### Qué es

Simulación de escritorio con interfaz gráfica nativa. Es el **motor principal** del proyecto, con la arquitectura más completa.

### Cómo iniciar

```bash
python principal.py          # Simulación pygame
python principal.py --web    # Abre landing HTML en el navegador
```

### Componentes

- **Motor**: `nucleo.Simulacion` → `core.simulation.tick_runner`
- **Mundo**: `mundo/` (mapa, celdas, recursos, refugios)
- **Entidades**: `entidades/` (EntidadSocial, EntidadGato, etc.)
- **IA**: `agentes/` (MotorDecision, memoria espacial, relaciones)
- **Interfaz**: `interfaz/` (Renderizador pygame, paneles, controles)
- **Sistemas**: persistencia SQLite, modo sombra, watchdog, competencia

### Características

- Grid 2D configurable
- Memoria espacial (recursos, refugios vistos)
- Relaciones sociales (confianza, miedo, hostilidad)
- Modo Sombra (control manual de una entidad)
- Persistencia en `mundo_artificial.db`
- Modo competencia (umbrales de alerta)
- 12 tipos de acciones (mover, comer, compartir, robar, huir, etc.)

### Tests

```bash
SDL_VIDEODRIVER=dummy SDL_AUDIODRIVER=dummy python pruebas/test_core.py
SDL_VIDEODRIVER=dummy SDL_AUDIODRIVER=dummy python pruebas/test_modo_sombra_completo.py
SDL_VIDEODRIVER=dummy SDL_AUDIODRIVER=dummy python pruebas/test_interacciones_sociales.py
```

---

## 2. Fullstack (backend + frontend)

### Qué es

Versión web con API REST y WebSocket. Motor de simulación **independiente** en JavaScript, pensado para uso en navegador.

### Cómo iniciar

```powershell
.\scripts\iniciar_fullstack.ps1
```

Inicia:
1. **Backend** (Node.js, puerto 3001)
2. **Frontend** (Vite + React, puerto 5173)
3. Abre el navegador en http://localhost:5173

### Componentes

- **Backend**: `backend/src/`
  - `server.js` — Express, CORS, WebSocket
  - `simulation/` — World, Refuge, Agent, Blueprint
  - `routes/` — API REST (refuges, agents, blueprints, simulation)
- **Frontend**: `frontend/src/`
  - React, Mission Control, Simulation Canvas
  - Hub, Hero Refuge, DobackSoft

### Características

- Modelo **AW-256**: 16 refugios iniciales, grid 32×32 por refugio
- Refugios personales ("Mi casa") con ownerId
- Blueprints (especies) y liberación de agentes
- API REST + WebSocket
- Sin persistencia entre reinicios (estado en memoria)

### Modelo de simulación

El backend usa su propio motor:

- `world.js` — Mundo con refugios y blueprints
- `refuge.js` — Refugio 32×32 con nodos solares/minerales
- `agent.js` — Agentes con energía, inventario
- `refugeSimulation.js` — Tick loop por refugio activo

---

## Comparación

### Lo que comparten

- Concepto: simulación de vida artificial con agentes autónomos
- Grid 2D, recursos, refugios
- Agentes con energía, hambre, inventario

### Lo que NO comparten

| Aspecto | Python | Fullstack |
|---------|--------|-----------|
| Persistencia | SQLite | En memoria |
| Modo Sombra | Sí | No |
| Relaciones sociales | Sí (confianza, miedo) | No |
| Memoria espacial | Sí | Sí (recuerdos básicos) |
| Modo competencia | Sí | No |
| Interfaz | Pygame (ventana) | Web (React) |
| API | No | REST + WebSocket |

---

## Cuándo usar cada uno

| Objetivo | Usar |
|----------|------|
| Desarrollo del motor core, IA, memoria | `python principal.py` |
| Tests del core, modo sombra, persistencia | `python principal.py` |
| Demo web, compartir por URL | Fullstack |
| Integración con APIs, frontend React | Fullstack |
| Debug interactivo (consola de comandos) | Fullstack + `debug_consola.ps1` |

---

## Referencias

- `docs/architecture.md` — Arquitectura del motor Python
- `docs/ARTIFICIAL_WORD_ENGINE.md` — Motor de decisión e IA
- `docs/DEBUG_FULLSTACK.md` — Debug del fullstack
- `AGENTS.md` — Reglas de inicio y tests
