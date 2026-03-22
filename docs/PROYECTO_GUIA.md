# 🌍 Guía del Proyecto — Artificial World

> **Documento de referencia** para desarrolladores nuevos. Cubre arquitectura, stack, ejecución y convenciones en un solo lugar.

**Versión:** 1.0  
**Última actualización:** Marzo 2025  
**Auditorías de referencia:** Base de datos, Frontend, Backend, Documentación

---

## 📋 Índice

1. [Visión general](#-visión-general)
2. [Estrategia de producto](#-estrategia-de-producto)
3. [Stack tecnológico](#-stack-tecnológico)
3. [Arquitectura](#-arquitectura)
4. [Estructura del repositorio](#-estructura-del-repositorio)
5. [Cómo ejecutar](#-cómo-ejecutar)
6. [Bases de datos](#-bases-de-datos)
7. [API y rutas](#-api-y-rutas)
8. [Convenciones y reglas](#-convenciones-y-reglas)
9. [Tests y verificación](#-tests-y-verificación)
10. [Documentación adicional](#-documentación-adicional)

---

## 🎯 Visión general

**Artificial World** (también *MUNDO_ARTIFICIAL* o *artificial word*) es una **simulación de vida artificial 2D** con agentes autónomos. Las entidades toman decisiones por utilidad, reaccionan al entorno y pueden ser controladas mediante **Modo Sombra** (control manual de una entidad).

| Aspecto | Descripción |
|---------|-------------|
| **Propósito** | Simulación de agentes con IA basada en utilidad (sin LLMs) |
| **Modelo** | Grid 2D, recursos, refugios, memoria espacial y social |
| **Modos** | Python (pygame) + Fullstack (web) — implementaciones paralelas |
| **Estado** | Activo, en desarrollo iterativo |

### Productos en el repositorio

| Producto | Puertos | Descripción |
|----------|---------|-------------|
| **Artificial World** | Backend 3001, Frontend 5173 | Simulación principal |
| **DobackSoft** | 9998, 5174 (en .cursorrules) | Producto B2B en el mismo repo |

---

## 🎯 Estrategia de producto

**Decisión:** Python como motor principal, Web como demo.

| Componente | Rol |
|------------|-----|
| **Python** | Motor completo (13 acciones, Modo Sombra, relaciones, persistencia) |
| **Web** | Demo sin instalación, puerta de entrada |
| **DobackSoft** | Producto B2B en web |

Ver [ESTRATEGIA_PRODUCTO.md](ESTRATEGIA_PRODUCTO.md) para detalles y próximos pasos.

---

## 🛠 Stack tecnológico

### Python (motor principal)

| Tecnología | Versión | Uso |
|------------|---------|-----|
| Python | 3.11+ | Runtime |
| pygame | 2.6.1 | Interfaz gráfica de escritorio |
| SQLite | — | Persistencia (`mundo_artificial.db`) |

### Fullstack (versión web)

| Capa | Tecnología | Versión |
|------|------------|---------|
| **Backend** | Node.js + Express | 4.21 |
| **Backend** | better-sqlite3 | 12.x |
| **Backend** | ws (WebSocket) | 8.x |
| **Frontend** | React | 18.3 |
| **Frontend** | Vite | 5.x |
| **Frontend** | Recharts | 3.x |

### Bases de datos

| Archivo | Componente | Uso |
|---------|------------|-----|
| `mundo_artificial.db` | Python | Persistencia del mundo |
| `audit_competencia.db` | Python | Modo competencia |
| `audit_simulacion.db` | Node | Event store (auditoría) |
| `backend/db/schema.sql` | — | Diseño futuro PostgreSQL (no ejecutado) |

---

## 🏗 Arquitectura

### Flujo general

```
┌─────────────────────────────────────────────────────────────────────┐
│                         MODO PYTHON (principal.py)                   │
├─────────────────────────────────────────────────────────────────────┤
│  nucleo.Simulacion → core.simulation.tick_runner                      │
│  mundo/ (mapa, celdas) → entidades/ → agentes/ (IA) → interfaz/      │
│  sistemas/ (persistencia, watchdog, logs)                            │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    MODO FULLSTACK (iniciar_fullstack.ps1)            │
├─────────────────────────────────────────────────────────────────────┤
│  Backend (Express) → simulation/ (world, refuge, agent)               │
│  Frontend (React) → Hub → SimulationView, MissionControl, DobackSoft  │
│  WebSocket para tiempo real                                           │
└─────────────────────────────────────────────────────────────────────┘
```

### Componentes clave Python

| Módulo | Responsabilidad |
|--------|-----------------|
| `nucleo/simulacion.py` | Orquestador central |
| `agentes/motor_decision.py` | IA: generar → puntuar → seleccionar acciones |
| `agentes/memoria.py` | Recuerdos espaciales y sociales |
| `mundo/mapa.py` | Grid 2D, celdas, recursos |
| `entidades/entidad_social.py` | Entidad con relaciones |
| `acciones/` | 13 acciones (mover, comer, compartir, robar, etc.) |
| `sistemas/sistema_persistencia.py` | Guardar/cargar en SQLite |
| `sistemas/sistema_watchdog.py` | Monitor de anomalías |

### Componentes clave Fullstack

| Ruta | Responsabilidad |
|------|-----------------|
| `backend/src/simulation/` | World, Refuge, Agent, Blueprint |
| `backend/src/routes/api.js` | API REST principal |
| `backend/src/realtime/websocket.js` | WebSocket |
| `backend/src/audit/eventStore.js` | Event store (better-sqlite3) |
| `frontend/src/components/SimulationView.jsx` | Vista principal simulación |
| `frontend/src/components/MissionControl/` | Panel de control |
| `frontend/src/components/Hub.jsx` | Navegación central |

---

## 📁 Estructura del repositorio

```
artificial word/
├── principal.py              # Punto de entrada Python
├── configuracion.py          # Parámetros (dataclass)
├── AGENTS.md                 # Reglas de code review
├── AGENTE_ENTRANTE.md        # Documentación técnica completa
│
├── acciones/                 # 13 acciones del motor
├── agentes/                  # IA, memoria, relaciones
├── entidades/                # EntidadBase, EntidadSocial, EntidadGato
├── mundo/                    # Mapa, celdas, recursos, refugios
├── nucleo/                   # Simulacion, bus_eventos, contexto
├── sistemas/                 # Persistencia, watchdog, logs
├── interfaz/                 # Renderizador pygame, paneles
├── tipos/                    # Enums, modelos
├── utilidades/               # Azar, geometría
│
├── backend/                  # API Node.js
│   ├── src/
│   │   ├── server.js
│   │   ├── routes/           # api, heroRefuge, dobacksoft
│   │   ├── simulation/       # Motor JS
│   │   ├── audit/            # eventStore
│   │   └── middleware/
│   └── db/schema.sql         # Diseño PostgreSQL (futuro)
│
├── frontend/                 # React + Vite
│   └── src/
│       ├── App.jsx
│       ├── components/       # Hub, SimulationView, MissionControl, etc.
│       ├── config/api.js     # URLs centralizadas
│       └── utils/logger.js   # Logger estructurado
│
├── docs/                     # Documentación
├── pruebas/                  # Tests Python
└── scripts/                 # iniciar_fullstack.ps1, etc.
```

---

## 🚀 Cómo ejecutar

### Python (motor principal)

```powershell
# Instalar dependencias
pip install -r requirements.txt

# Ejecutar simulación
python principal.py

# Con landing web
python principal.py --web
```

### Fullstack (recomendado para desarrollo web)

```powershell
.\scripts\iniciar_fullstack.ps1
```

- Libera puertos 3001 y 5173
- Instala dependencias si faltan
- Inicia backend y frontend en ventanas separadas
- Abre `http://localhost:5173`

### Variables de entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DOBACKSOFT_COUPON_CODE` | Cupón fundadores DobackSoft | `FUNDADOR1000` |
| `VITE_BACKEND_PORT` | Puerto backend (frontend) | `3001` |
| `VITE_BACKEND_HOST` | Host backend (frontend) | `localhost` |

Ver `.env.example` para la plantilla completa.

---

## 🗄 Bases de datos

### Arquitectura actual

| BD | Componente | Contenido |
|----|------------|-----------|
| `mundo_artificial.db` | `sistema_persistencia.py` | Estado del mundo Python |
| `audit_competencia.db` | `sistema_modo_competencia.py` | Eventos modo competencia |
| `audit_simulacion.db` | `eventStore.js` | Eventos de auditoría (Node) |

### Schema PostgreSQL (futuro)

`backend/db/schema.sql` define tablas para PostgreSQL (players, worlds, refuges, blueprints, lineages, agent_snapshots, events). **No se ejecuta en runtime**; es diseño para futura migración.

---

## 🔌 API y rutas

### Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/world` | Estado del mundo |
| GET | `/api/agents` | Agentes del refugio activo |
| GET | `/api/refuges` | Lista de refugios |
| GET | `/api/blueprints` | Blueprints (especies) |
| POST | `/api/blueprints` | Crear blueprint |
| POST | `/api/refuges` | Crear refugio |
| POST | `/api/refuge/select` | Seleccionar refugio activo |
| POST | `/api/release` | Liberar agentes |
| POST | `/api/simulation/start` | Iniciar simulación |
| POST | `/api/simulation/pause` | Pausar |
| POST | `/api/simulation/reset` | Reiniciar mundo |

### WebSocket

- **URL:** `ws://localhost:3001/ws`
- **Eventos:** tick, world, agents, logs

### Formato de respuesta

```json
{ "success": true, "data": { ... } }
{ "success": false, "error": { "message": "...", "code": "...", "statusCode": 422 } }
```

---

## 📐 Convenciones y reglas

### AGENTS.md (obligatorio)

| Regla | Descripción |
|-------|-------------|
| **Logger** | Usar `logger` de `utils/logger` — nunca `console.log` |
| **URLs** | Centralizar en `config/api.js` — nunca hardcodear |
| **Catch** | No bloques `catch` vacíos — siempre manejar error |
| **Componentes** | Máximo 300 líneas por componente React |
| **Colores** | Usar Tailwind o variables CSS — no hex inline |
| **Puertos** | Backend 3001, Frontend 5173 — no cambiar |

### Estructura de inicio

- **Script único:** `scripts\iniciar_fullstack.ps1`
- No iniciar backend/frontend manualmente salvo debug

### Python

- `print()` → usar `logger`
- Type hints en funciones públicas
- Docstrings en clases y funciones públicas

---

## ✅ Tests y verificación

### Python

```powershell
$env:SDL_VIDEODRIVER="dummy"
$env:SDL_AUDIODRIVER="dummy"
python pruebas/test_core.py
python pruebas/test_modo_sombra_completo.py
python pruebas/test_interacciones_sociales.py
```

### Verificación completa

```powershell
python pruebas/verificar_todo.py
```

Genera `verificacion_completa.json`. Exit 0 = todo OK.

### Fullstack

```powershell
cd backend; npm test
cd frontend; npm test
```

---

## 📚 Documentación adicional

| Documento | Contenido |
|-----------|-----------|
| [AGENTE_ENTRANTE.md](../AGENTE_ENTRANTE.md) | Documentación técnica completa, motor, modo sombra |
| [MODOS_EJECUCION.md](MODOS_EJECUCION.md) | Python vs Fullstack, diferencias |
| [architecture.md](architecture.md) | Diagrama Mermaid, sistemas |
| [ARTIFICIAL_WORD_ENGINE.md](ARTIFICIAL_WORD_ENGINE.md) | Motor de decisión e IA |
| [DEBUG_FULLSTACK.md](DEBUG_FULLSTACK.md) | Debug del fullstack |
| [TESTING.md](TESTING.md) | Comandos de tests |
| [refugio/ARQUITECTURA.md](refugio/ARQUITECTURA.md) | Refuge interior, furniture, API |

### Auditorías (Marzo 2025)

| Informe | Área | Ubicación |
|---------|------|-----------|
| AUDITORIA_BASE_DATOS.md | Schema, SQLite, eventStore | `docs/` |
| AUDITORIA_FRONTEND_REACT.md | React, useEffect, keys | `docs/` |
| AUDITORIA_BACKEND_EXPRESS.md | REST, seguridad, middleware | `docs/` |
| AUDITORIA_DOCUMENTACION.md | Cobertura, gaps | `docs/` |

---

## 🔧 Correcciones aplicadas (P0)

Las siguientes correcciones se aplicaron tras las auditorías:

| Paso | Archivo | Cambio |
|------|---------|--------|
| 1 | `backend/src/routes/api.js` | Eliminados 3 bloques de debug (`import('fs')` + appendFileSync) |
| 2 | `backend/src/dobacksoft/store.js` | `COUPON_CODE` movido a `process.env.DOBACKSOFT_COUPON_CODE` |
| 3 | `frontend/src/components/SimulationView.jsx` | Eliminado `console.warn` de debug |
| 4 | `frontend/src/components/SimulationCanvas.jsx` | Eliminadas URLs hardcodeadas de telemetría |
| 5 | `backend/src/audit/eventStore.js` | Bare catch corregido → `logger.error` |
| 5 | `frontend/src/components/SimulationView.jsx` | Catch vacíos → `logger.warn` |

---

<div align="center">

**Artificial World** — Simulación de vida artificial 2D

*Constrúyelo. Habítalo. Haz que crezca.*

</div>
