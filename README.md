# Artificial World

**Producto objetivo:** app **iOS** de simulación 2D con agentes autónomos, refugios, héroes y memoria — open source, local-first. El resto de este monorepo existe para **especificar, probar, sincronizar y documentar** esa app, no como segundo producto frente al usuario.

> **Lema interno:** *No persigas la IA. Construye un mundo que la necesite.*

---

## ¿De qué va?

En pantalla, el mundo modela entidades que perciben, recuerdan, puntúan acciones por utilidad y persisten estado. **Lo que se publica como “Artificial World” al usuario final es la app** en [`ArtificialWorld/`](ArtificialWorld/) + [`SwiftAWCore`](SwiftAWCore/) (SwiftUI, núcleo en SPM: `AWDomain`, `AWAgent`, `AWPersistence`). Arquitectura y fases: [docs/AW_FASE0_AUDITORIA_Y_ARQUITECTURA.md](docs/AW_FASE0_AUDITORIA_Y_ARQUITECTURA.md).

**Qué más hay en el repo (ingeniería, no el binario de App Store):**

| Capa | Rol frente a la app iOS |
|------|-------------------------|
| **App iOS** ([`ArtificialWorld/`](ArtificialWorld/) + [`SwiftAWCore`](SwiftAWCore/)) | **Único entregable de producto** (vertical slice + sync) |
| **App iOS V2** ([`ArtificialWorldV2/`](ArtificialWorldV2/)) | Cliente **nuevo** para grid multi-agente y cambio de control; mismo SPM, bundle distinto — ver [README](ArtificialWorldV2/README.md) |
| **Motor Python** (`principal.py`, `nucleo/`, `agentes/`, …) | Referencia auditable, tests y spec del dominio; pygame + SQLite en laboratorio |
| **Web** (`frontend/` + `backend/`) | Demo React + Express (motor JS aparte), sync nativo (`/api/aw`), operador — **soporte**; no sustituye la app |
| **HTML estáticos** (`artificial-world.html`, `docs/…`) | Marketing / Pages; **no** son spec de simulación para iOS |

Dentro de la carpeta web hay verticales históricas o de laboratorio (DobackSoft, HeroRefuge, Mission Control, Control Tower, etc.): **no definen** el producto iOS salvo que se porten explícitamente a Swift bajo contrato de dominio.

**Integraciones externas y límites del núcleo:** [docs/AW_FASE0_AUDITORIA_Y_ARQUITECTURA.md](docs/AW_FASE0_AUDITORIA_Y_ARQUITECTURA.md) §10 y [docs/CORE_BOUNDARIES.md](docs/CORE_BOUNDARIES.md).

---

## Stack tecnológico

### Motor Python
- Python 3.11+
- pygame 2.6.1
- SQLite (via Python stdlib)
- python-dotenv

### Demo web — Backend
- Node.js 20
- Express 4
- better-sqlite3 (SQLite)
- WebSocket (ws)
- Stripe (pagos opcionales)
- Ollama (IA local opcional, modelo `llama3.2`)
- Vitest

### Demo web — Frontend
- React 18
- Vite 5
- Tailwind CSS 4
- Zustand 5
- Radix UI
- i18next (ES, EN, PT, FR, DE)
- Recharts
- PWA (vite-plugin-pwa)
- Vitest + Testing Library

### Infraestructura
- Docker / Docker Compose (dev, prod, VPS, CI)
- Puppeteer (generación de PDFs, screenshots)

---

## Cómo correr el proyecto

### Prerrequisitos

- **App iOS:** Xcode (Swift 6), ver [docs/AW_FASE0_AUDITORIA_Y_ARQUITECTURA.md](docs/AW_FASE0_AUDITORIA_Y_ARQUITECTURA.md) (build SPM + proyecto).
- **Monorepo (laboratorio):** Python 3.11+, Node.js 20+, npm

### App iOS (producto)

Abrí `ArtificialWorld/ArtificialWorld.xcodeproj` en Xcode y compilá el esquema **ArtificialWorld** (simulador o dispositivo). Tests del núcleo: `swift test --package-path SwiftAWCore` desde la raíz del repo.

### Motor Python (laboratorio — pygame)

```bash
pip install -r requirements.txt
python principal.py
```

Esto abre la ventana pygame con la simulación de **referencia** en laboratorio (no sustituye la app iOS).

**Variante headless — Crónica fundacional:**

```bash
python cronica_fundacional.py --seed 42 --ticks 200
```

Genera `cronica_fundacional.json` y `cronica_fundacional.md` sin ventana gráfica.

**Variante — abrir landing HTML:**

```bash
python principal.py --web
```

### Demo web fullstack (local)

```bash
# Backend (puerto 3001)
cd backend
npm install
npm run dev

# Frontend (puerto 5173) — en otra terminal
cd frontend
npm install
npm run dev
```

Abrir: `http://localhost:5173`

### Demo web con Docker

```bash
docker compose up
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`
- Mission Control: `http://localhost:5173/#missioncontrol`

### Producción con Docker

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Sirve frontend compilado y backend desde `http://localhost:3001`.

### Tests

```bash
# Tests Python (11 suites)
python pruebas/run_tests_produccion.py

# Tests backend JS
cd backend && npm test

# Tests frontend JS
cd frontend && npm test
```

---

## Variables de entorno

No hay `.env.example` en la raíz del proyecto. Las variables del backend se leen desde `.env` en la raíz (buscado automáticamente por el servidor). Crear un archivo `.env` con:

```dotenv
# Puerto del backend (default: 3001)
PORT=3001

# Entorno (development | production)
NODE_ENV=development

# CORS en producción (requerido si NODE_ENV=production)
# ALLOWED_ORIGINS=https://tudominio.com

# IA local — Ollama (opcional)
# OLLAMA_HOST=http://127.0.0.1:11434
# OLLAMA_MODEL=llama3.2
# OLLAMA_TIMEOUT_MS=30000

# Stripe (opcional — la app funciona sin esto)
# STRIPE_SECRET_KEY=sk_test_...
# STRIPE_WEBHOOK_SECRET=whsec_...

# Mission Control
# MISSION_CONTROL_RUNTIME_MODE=seed   # seed | disabled
# MISSION_CONTROL_TICK_MS=4000

# OpenClaw gateway (opcional)
# OPENCLAW_GATEWAY_URLS=ws://localhost:18789
# OPENCLAW_GATEWAY_TOKEN=
# OPENCLAW_GATEWAY_SCOPES=operator.read,operator.approvals

# Frontend (Vite — en frontend/.env si aplica)
# VITE_BACKEND_PORT=3001
```

**Importante:** En `NODE_ENV=production` el servidor lanza un error fatal si `ALLOWED_ORIGINS` no está definida.

---

## Estructura del proyecto

```
Artificial_world/
├── principal.py              # Punto de entrada del motor Python
├── configuracion.py          # Parámetros de la simulación
├── cronica_fundacional.py    # Sesión headless reproducible
├── requirements.txt          # Dependencias Python
│
├── core/                     # Dominio puro (fuente de verdad Python)
│   ├── world/                # Mapa, celdas, recursos, zonas, terreno
│   ├── shelter/              # Refugio (bonus descanso, ownership futuro)
│   ├── entity/               # EntidadBase, EntidadSocial, EntidadGato, Fábrica
│   └── simulation/           # Tick runner y contextos de decisión
│
├── systems/                  # Sistemas transversales
│   ├── memory/               # Memoria espacial y social de entidades
│   ├── events/               # Bus de eventos
│   ├── ai/                   # Motor de decisión y percepción
│   ├── persistence/          # Guardado/carga SQLite
│   └── observability/        # Logs y métricas
│
├── agentes/                  # IA, memoria, rasgos, relaciones (reexporta systems)
├── nucleo/                   # Simulacion, contexto, gestor ticks, bus eventos
├── acciones/                 # 13 tipos de acción ejecutable
├── sistemas/                 # Persistencia, watchdog, Modo Sombra, modo competencia
├── interfaz/                 # Pygame: renderizador, paneles, cámara, entrada
├── tipos/                    # Enums y modelos
├── utilidades/               # Arranque, paths, azar, conversores
│
├── mundo/                    # Reexporta core.world (compatibilidad)
├── entidades/                # Reexporta core.entity (compatibilidad)
├── interface/                # Reexporta interfaz (compatibilidad)
├── gameplay/                 # Reexporta acciones/directivas (compatibilidad)
│
├── pruebas/                  # 11 suites de tests Python
│
├── backend/                  # API Express + WebSocket + SQLite
│   ├── src/
│   │   ├── server.js         # Entry point, monta todas las rutas
│   │   ├── config.js         # Ollama, puertos
│   │   ├── routes/           # api, ai, heroRefuge, dobacksoft, chess, missionControl...
│   │   ├── services/         # aiCore, llmService, stripeService, missionControl, controlTower
│   │   ├── simulation/       # Motor JS: engine, agent, world, heroRefuge, blueprints
│   │   ├── db/               # database.js (SQLite), missionControlDb.js
│   │   ├── realtime/         # WebSocket
│   │   ├── middleware/       # errorHandler, playerContext, requireAdmin, validate
│   │   └── audit/            # eventStore
│   └── db/schema.sql         # Schema PostgreSQL preparado (no usado actualmente)
│
├── frontend/                 # React 18 + Vite + Tailwind 4
│   └── src/
│       ├── App.jsx           # Router hash-based
│       ├── components/       # Hub, SimulationView, MissionControl, DobackSoft, HeroRefuge...
│       ├── hooks/            # useRealtimeSimulation, useSimulationData
│       ├── services/         # api.js
│       └── locales/          # ES, EN, PT, FR, DE
│
├── web/                      # App React alternativa con Three.js/3D (en desarrollo)
├── docker-compose.yml        # Dev (backend + frontend)
├── docker-compose.prod.yml   # Producción (imagen única)
├── docker-compose.vps.yml    # VPS
├── Dockerfile.prod           # Multi-stage: build frontend + serve con Node
├── docs/                     # Documentación extensa (arquitectura, roadmap, auditorías)
└── scripts/                  # Scripts de deploy, generación de PDFs, guardrails
```

**Nota sobre alias de carpetas:** `mundo/`, `entidades/`, `interface/`, `gameplay/` son módulos de compatibilidad que reexportan el código que vive en `core/` y `systems/`. El código fuente real está en `core/`.

---

## Estado actual

### Qué funciona

- Motor Python completo: simulación pygame, mapa 60x60, entidades con hambre/energía/salud, 13 tipos de acción, memoria espacial y social, relaciones dinámicas, refugios
- Persistencia real en SQLite (`mundo_artificial.db`)
- Modo Sombra: control manual de una entidad en tiempo real
- Modo Competencia: auditoría forense activa (`audit_competencia.db`)
- Crónica fundacional headless: genera artefactos JSON/Markdown reproducibles
- 11 suites de tests Python ejecutables sin pantalla (`SDL_VIDEODRIVER=dummy`)
- Demo web: simulación JavaScript con REST API y WebSocket en tiempo real
- Mission Control: dashboard operativo con kanban, feed de eventos, approval center
- Control Tower: análisis estático de repositorios → dossier técnico-ejecutivo
- HeroRefuge: refugios jugables con persistencia parcial
- FireSimulator: mini-juego de rutas de vehículos de emergencia
- Internacionalización (ES, EN, PT, FR, DE) en el frontend
- PWA instalable (manifiesto + service worker)
- Docker multi-stage para producción

### Qué no funciona o puede fallar

- **No existe `.env.example` en la raíz**: el desarrollador que clona el repo no sabe qué variables configurar para arrancar el backend
- **Stripe deshabilitado por defecto**: funciona pero emite warning en cada arranque si `STRIPE_SECRET_KEY` no está configurada
- **Ollama requerido para IA local**: `aiCore.js` y `llmService.mjs` dependen de Ollama corriendo localmente; si no está disponible, los endpoints `/api/ai/*` fallan
- **ALLOWED_ORIGINS en producción**: si `NODE_ENV=production` sin esta variable, el servidor no arranca
- **Schema PostgreSQL sin usar**: `backend/db/schema.sql` define un schema para PostgreSQL, pero el backend usa SQLite (`better-sqlite3`). Son dos modelos distintos que no están sincronizados
- **Motor Python y demo web son independientes**: no hay puente real entre ambas capas; el README lo documenta, pero puede confundir a nuevos contribuidores
- **`web/`**: app React alternativa con Three.js (visión 3D) en estado de exploración, sin integración con el resto
- **DobackSoft en este repo**: usa datos en memoria y rutas mock; el producto B2B real vive en otro repositorio
- **carpetas duplicadas con alias**: `mundo/`, `entidades/`, `interface/`, `gameplay/` son módulos de reexportación; puede generar confusión al navegar el código

### Qué falta

- `.env.example` en la raíz del proyecto con todas las variables documentadas
- Tests de integración entre motor Python y demo web (actualmente son sistemas separados sin tests de contrato)
- CI/CD configurado: existe `docker-compose.ci.yml` y workflows referenciados en docs, pero no hay `.github/workflows/` en el repo
- Documentación de setup en Linux/macOS (todos los scripts de arranque son `.ps1` o `.bat`)
- Alineación del schema PostgreSQL (`backend/db/schema.sql`) con el modelo SQLite real
- Implementación del espacio 20x20 del Refugio (clase preparada, lógica no implementada)
- Conexiones entre zonas/refugios (estructura definida, lógica pendiente)
- Desacoplamiento de feedback visual en la persistencia (actualmente escribe directo en `estado_panel`)

---

## Documentación relevante

| Documento | Propósito |
|-----------|-----------|
| [docs/architecture.md](docs/architecture.md) | Arquitectura técnica del motor Python |
| [docs/GOLDEN_PATH.md](docs/GOLDEN_PATH.md) | Recorrido de demostración recomendado |
| [AGENTE_ENTRANTE.md](AGENTE_ENTRANTE.md) | Onboarding técnico para nuevos contribuidores |
| [docs/MODOS_EJECUCION.md](docs/MODOS_EJECUCION.md) | Comparación motor Python vs demo web |
| [docs/IA_LOCAL_BASE.md](docs/IA_LOCAL_BASE.md) | Capa de IA local con Ollama |
| [docs/SISTEMA_CHESS.md](docs/SISTEMA_CHESS.md) | Auditoría con agentes Docker |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Roadmap del proyecto |
| [docs/OWNERSHIP_ESTRATEGICO.md](docs/OWNERSHIP_ESTRATEGICO.md) | Relación entre AW, DobackSoft y la demo |

---

## Regla editorial

Artificial World puede hablar en grande, pero no puede prometer por encima de su evidencia. La ambición es obligatoria. La confusión, no.

Lo que este repo **no es** hoy:
- Un producto enterprise listo para producción
- DobackSoft completo (ese vive en otro repo)
- Una integración real Python ↔ web
- Un sistema con miles de agentes o latencia < 1ms
