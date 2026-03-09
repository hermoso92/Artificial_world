# CLAUDE.md — Artificial World

> Guía de referencia para AI assistants trabajando en este repositorio.

---

## What This Project Is

**Artificial World** is a 2D artificial-life simulation with autonomous agents driven by utility-based AI (no LLMs). The project has two parallel execution modes:

- **Python/Pygame** — full simulation engine: 13 action types, Shadow Mode, social relationships, spatial memory, persistence
- **Web (Fullstack)** — functional demo: React frontend + Node.js backend, lighter simulation, HeroRefuge game, Stripe subscriptions

Both share the same codebase but serve different purposes. See `docs/MODOS_EJECUCION.md` for detailed differences.

---

## Repository Structure

```
/
├── principal.py              # Python entry point
├── cronica_fundacional.py    # Headless chronicle (CI-friendly)
├── configuracion.py          # Central config dataclass (60x60 map, 30 FPS, etc.)
├── AGENTS.md                 # Code review rules (MUST READ)
├── AGENTE_ENTRANTE.md        # Full technical reference (28KB)
│
├── nucleo/                   # Python orchestration
│   ├── simulacion.py         # Main orchestrator (10 systems)
│   ├── gestor_ticks.py       # Tick controller
│   ├── bus_eventos.py        # Event bus (decoupled comms)
│   └── contexto.py           # Decision context dataclasses
│
├── agentes/                  # AI decision-making
│   ├── motor_decision.py     # generate → score → select loop
│   ├── memoria.py            # Spatial + social memory
│   ├── directivas.py         # External behavior directives
│   ├── pesos_utilidad.py     # Utility weight config
│   └── relaciones.py         # Agent relationship tracking
│
├── acciones/                 # 13 action types (inherit AccionBase)
│   ├── accion_mover.py
│   ├── accion_atacar.py
│   ├── accion_compartir.py
│   └── ... (10 more)
│
├── sistemas/                 # Cross-cutting Python systems
│   ├── sistema_persistencia.py    # SQLite auto-save (every 20 ticks)
│   ├── sistema_watchdog.py        # Anomaly detection
│   ├── sistema_modo_sombra.py     # Manual agent control mode
│   ├── sistema_logging_reporte.py # Session reports
│   └── sistema_metricas.py
│
├── interfaz/                 # Pygame UI (6-tab control panel)
│   ├── renderizador.py
│   ├── panel_control.py
│   ├── camara.py
│   └── manejador_entrada.py
│
├── backend/                  # Node.js Express API
│   └── src/
│       ├── server.js         # Entry point (port 3001)
│       ├── routes/           # REST + WebSocket endpoints
│       ├── services/         # AI, Stripe, simulation logic
│       ├── db/               # SQLite setup
│       ├── audit/            # Event store
│       ├── middleware/       # Auth, error handling
│       ├── realtime/         # WebSocket (/ws)
│       └── utils/logger.js   # Logger (use this, never console.log)
│
├── frontend/                 # React 18 + Vite 5
│   └── src/
│       ├── App.jsx           # Root component
│       ├── components/       # 15+ components (<300 lines each)
│       ├── config/api.js     # ALL API URLs live here
│       ├── services/         # API clients
│       ├── hooks/            # Custom React hooks
│       └── locales/          # i18n (ES/EN)
│
├── pruebas/                  # Python test suites (18 files)
│   └── run_tests_produccion.py  # Runs all 11 suites
│
├── scripts/                  # Startup + deployment scripts
│   ├── iniciar_fullstack.ps1    # Main fullstack startup
│   └── deploy_vps.sh
│
├── docs/                     # 50+ markdown docs
│   ├── ESENCIAL.md           # 2-page quick start
│   ├── GOLDEN_PATH.md        # Recommended demo flow
│   └── MODOS_EJECUCION.md    # Python vs Web differences
│
└── .github/workflows/        # CI/CD (Python 3.11/3.12 matrix + Docker)
```

---

## How to Run

### Python simulation (full engine)
```bash
pip install -r requirements.txt
python principal.py
```

### Web fullstack (backend + frontend)
```powershell
.\scripts\iniciar_fullstack.ps1
# Backend: http://localhost:3001
# Frontend: http://localhost:5173
```

### Headless chronicle (CI / no display)
```bash
python principal.py --cronica
# or directly:
python cronica_fundacional.py
```

### Individual services
```bash
# Backend only
cd backend && npm install && npm run dev

# Frontend only
cd frontend && npm install && npm run dev
```

---

## Running Tests

### Python tests (headless, no display needed)
```bash
# All suites
SDL_VIDEODRIVER=dummy SDL_AUDIODRIVER=dummy python pruebas/run_tests_produccion.py

# Individual suites
SDL_VIDEODRIVER=dummy SDL_AUDIODRIVER=dummy python pruebas/test_core.py
SDL_VIDEODRIVER=dummy SDL_AUDIODRIVER=dummy python pruebas/test_modo_sombra_completo.py
SDL_VIDEODRIVER=dummy SDL_AUDIODRIVER=dummy python pruebas/test_interacciones_sociales.py
SDL_VIDEODRIVER=dummy SDL_AUDIODRIVER=dummy python pruebas/test_cronica_fundacional.py
```

PowerShell equivalent:
```powershell
$env:SDL_VIDEODRIVER="dummy"; $env:SDL_AUDIODRIVER="dummy"
python pruebas/test_core.py
```

### JavaScript tests
```bash
cd backend && npm test
cd frontend && npm test
```

---

## Key APIs

| Endpoint | Description |
|----------|-------------|
| `GET /api/world` | World state |
| `POST /api/simulation/start` | Start simulation |
| `GET /api/ai/chat` | AI chat |
| `ws://localhost:3001/ws` | Real-time WebSocket |
| `GET /health` | Health check |

---

## Databases

| File | Owner | Purpose |
|------|-------|---------|
| `mundo_artificial.db` | Python | Simulation state (auto-created) |
| `audit_simulacion.db` | Node | Event store |
| `audit_competencia.db` | Python | Competition mode |
| `subscriptions.db` | Node | Stripe subscriptions |

All SQLite, auto-created on first run. Never delete in production without a backup.

---

## Code Conventions (Enforced by AGENTS.md)

These rules are enforced by a pre-commit hook (GGA — local AI review). Violations will block commits.

### All files
- **No hardcoded credentials or secrets** — use `.env`
- **No silent `catch` blocks** — always handle or rethrow errors

### JavaScript / TypeScript
- **No `console.log`** → always use `logger` from `backend/src/utils/logger.js`
- **No hardcoded URLs** (`localhost:3001`, etc.) → use `frontend/src/config/api.js` or env vars
- **No `import * as React`** → use named imports `{ useState, useEffect }`
- **No `var`** → use `const` or `let`
- **React components ≤ 300 lines**
- **No hardcoded hex colors in `className`** → use Tailwind classes
- **No `useMemo`/`useCallback` without justification**
- **No functions with >3 levels of nesting** without refactoring
- **No `any` in TypeScript** without an explanatory comment
- Prefer named exports over default exports
- Prefer composition over inheritance

### Python
- **No `print()`** → always use `logger`
- **No bare `except:`** → always specify exception type
- **Type hints required** on all public functions
- **Docstrings required** on all public classes and functions
- **No single-letter variable names** outside short loops (`i`, `j` are fine)

### Ports (do not change)
- Backend: **3001**
- Frontend: **5173**

### Startup script (do not change)
- `scripts\iniciar_fullstack.ps1` is the canonical fullstack startup

---

## Architecture Patterns

### Python simulation loop
```
Simulacion.ejecutar_bucle_principal()
  └─ per tick, per entity:
       percepcion.actualizar()
       motor_decision.generar_acciones()   # candidate set
       motor_decision.puntuar_acciones()   # score each by utility
       motor_decision.seleccionar_accion() # pick best
       accion.ejecutar()
  └─ every 20 ticks: sistema_persistencia.auto_guardar()
  └─ every tick: sistema_watchdog.verificar()
```

### Adding a new action
1. Create `acciones/accion_nueva.py` inheriting from `AccionBase`
2. Implement `ejecutar(entidad, mundo, contexto) -> ResultadoAccion`
3. Register in `motor_decision.py` candidate generation
4. Add utility weight in `agentes/pesos_utilidad.py`

### Adding a new API route (Node.js)
1. Create `backend/src/routes/nuevaRuta.js`
2. Register in `backend/src/server.js` under a consistent prefix
3. Add any new URL constants to `frontend/src/config/api.js`
4. Never hardcode the URL in components

### Event-driven communication (Python)
Use `BusEventos` for cross-system communication — never import system A directly from system B.

### Dependency injection
Systems are passed via constructor. No globals for system references.

---

## Environment Setup

```bash
# Copy env template
cp .env.example .env
# Fill in:
#   STRIPE_PUBLISHABLE_KEY / STRIPE_SECRET_KEY
#   ADMIN_SECRET
#   ALLOWED_ORIGINS
#   SSH_HOST / SSH_USER (for VPS deploy)
```

---

## CI/CD

- **Trigger:** Push to `main` or `feature/*`, PRs, schedule (every 6h), manual
- **Matrix:** Ubuntu + Python 3.11 and 3.12
- **On `main`:** deploys to GitHub Pages (docs) and VPS (SSH)
- **Docker:** `Dockerfile.prod` builds React → serves from Node (Alpine, ~40MB)

```bash
# Local Docker build
docker build -f Dockerfile.prod -t artificial-world .
docker compose -f docker-compose.prod.yml up -d
```

---

## Commit Message Format

```
<type>: <short description in English> — <detail in Spanish if needed>
```

Types: `feat`, `fix`, `chore`, `ci`, `docs`, `refactor`, `test`

Examples:
```
feat: Stripe integration — checkout, webhook, portal, auto-products
fix: proteger acceso a icon en ModeGrid para evitar undefined
chore: clean history - consolidate project
```

---

## Key Reference Documents

| Document | When to read |
|----------|-------------|
| `AGENTS.md` | Before any code review or commit |
| `AGENTE_ENTRANTE.md` | Deep technical architecture (28KB) |
| `docs/ESENCIAL.md` | 2-page quick start |
| `docs/MODOS_EJECUCION.md` | Python vs Web differences |
| `docs/GOLDEN_PATH.md` | Recommended demo/test flow |
| `docs/OWNERSHIP_ESTRATEGICO.md` | DobackSoft vs AW vs Game — what belongs where |
| `docs/SISTEMA_CHESS.md` | AI audit agent system (6 Docker agents) |
| `docs/IA_LOCAL_BASE.md` | Local AI services (chat, summarize, analyze) |
| `docs/VISION_CIVILIZACIONES_VIVAS.md` | Product thesis and long-term vision |

---

## What NOT to Do

- Do not change ports 3001 or 5173
- Do not add routes outside the existing route prefixes without updating `server.js` and `config/api.js`
- Do not use `print()` in Python or `console.log` in JS
- Do not hardcode any URL, credential, or secret
- Do not create React components over 300 lines — split them
- Do not use bare `except:` in Python
- Do not push directly to `master` — use feature branches
- Do not delete `.db` files without a backup
- Do not modify `scripts/iniciar_fullstack.ps1` without updating the docs
