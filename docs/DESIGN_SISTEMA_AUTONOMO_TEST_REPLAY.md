# Sistema Autónomo: Testing, Replay y Modo Competencia

**Objetivo:** Sistema que pueda testear y debugear en tiempo real y/o en reprocesado, con robustez tipo Modo Competencia (auditoría, integridad, forense).

**Estado:** Diseño técnico. Referencias: Event Sourcing, Deterministic Replay, Regression Games, Replay.io, Modo Competencia (Python).

---

## 1. Visión general

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SISTEMA AUTÓNOMO ARTIFICIAL WORLD                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [Simulación en vivo]          [Event Store]           [Replay / Debug]    │
│         │                            │                         │            │
│         │  tick, agent_move,         │  append-only            │  reproduce │
│         │  release, control...      │  integrity hash         │  con código│
│         └──────────────────────────►│  SQLite / JSONL         │  modificado│
│                                     │                         ▲            │
│                                     │  query por tick,         │            │
│                                     │  session, risk_score     │            │
│                                     └─────────────────────────┘            │
│                                                                             │
│  [Modo Competencia]              [Autonomous Tester]                         │
│  - risk_score por evento         - verificar_todo.js (fullstack)            │
│  - requires_review               - CI: record → replay → assert             │
│  - integridad forense             - headless: N ticks sin UI                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Componentes

### 2.1 Event Store (append-only)

**Propósito:** Registrar todos los eventos de la simulación para replay determinista y auditoría.

**Formato de evento:**
```json
{
  "event_id": "uuid",
  "timestamp": 1234567890.123,
  "tick": 42,
  "session_id": "uuid",
  "type": "tick|agent_move|agent_release|agent_death|control_take|control_release|sim_start|sim_pause|sim_reset",
  "payload": { ... },
  "integrity_hash": "sha256(prev_hash + payload)",
  "prev_hash": "..."
}
```

**Implementación:**
- Backend: módulo `backend/src/audit/eventStore.js`
- Persistencia: SQLite (como Modo Competencia Python) o JSONL para simplicidad
- Append-only: sin UPDATE/DELETE
- Integridad: cadena de hashes (cada evento incluye hash del anterior)

**Puntos de captura (donde se emiten eventos):**
- `engine.js`: cada tick, start, pause, reset
- `refugeSimulation.js`: agent death, reproduction, combat
- `api.js`: release, control, move (cuando exista Modo Sombra)
- `world.js`: blueprint create, refuge select

### 2.2 Replay determinista

**Propósito:** Reproducir una sesión grabada con el mismo resultado, o con código modificado para validar fixes.

**Requisitos:**
- Simulación determinista: mismo seed → mismo resultado
- Hoy: `Math.random()` rompe determinismo. Solución: inyectar RNG con seed fijo (ej. `seedrandom`).
- Replay = consumir eventos del Event Store y aplicar al estado, o ejecutar ticks con RNG fijado.

**Flujo:**
1. **Record:** Simulación corre, Event Store registra cada evento
2. **Replay:** Cargar eventos, resetear mundo, aplicar secuencia (o re-ejecutar ticks con mismo seed)
3. **Assert:** Comparar estado final con snapshot esperado

**Uso en debug:**
- Bug reportado → exportar eventos de la sesión
- Desarrollador modifica código
- Replay con eventos + código nuevo → verificar que el fix no rompe nada

### 2.3 Modo Competencia (adaptado a fullstack)

**Propósito:** Observabilidad defensiva, risk_score, auditoría forense.

**Señales y pesos (alineados con Python):**
| Señal | Peso |
|-------|------|
| acceso_persistencia | 25 |
| modo_sombra_activado | 15 |
| directiva_emitida | 10 |
| exportacion_reporte | 20 |
| carga_externa | 30 |
| alta_frecuencia | 25 |
| recurso_sensible | 20 |
| borrado_masivo | 40 |
| error_deliberado | 15 |

**Integración:**
- Cada evento del Event Store puede tener `risk_score` y `signals`
- Eventos con `risk_score >= 60` → `requires_review`
- Eventos con `risk_score >= 80` → `legal_relevance`
- API: `GET /api/audit/events?risk_min=60` para revisión

### 2.4 Autonomous Tester (verificar_todo.js)

**Propósito:** Ejecutar batería de verificaciones sin intervención humana.

**Verificaciones (equivalentes a verificar_todo.py):**
1. **Tests unitarios:** `npm run test` (backend)
2. **Tests E2E:** Playwright contra frontend (opcional)
3. **Simulación headless:** N ticks sin UI, guardar estado, cargar, verificar integridad
4. **Modo Competencia:** Registrar evento, verificar integridad de cadena
5. **Replay:** Grabar sesión corta, replay, comparar estado final

**Salida:** `verificacion_completa.json` (como Python)

**CI:** Pipeline ejecuta `node scripts/verificar_todo.js`; exit 0 = OK.

### 2.5 Debug en tiempo real

**Propósito:** Observar y debugear la simulación mientras corre.

**Opciones:**
1. **WebSocket streaming:** Ya existe. Añadir eventos de auditoría al stream.
2. **Panel de auditoría en UI:** Lista de eventos recientes, filtro por risk_score
3. **Logs estructurados:** Cada tick/evento → stdout en formato JSON (consumible por herramientas externas)
4. **Breakpoint por tick:** Modo "pausar en tick N" para inspección manual (futuro)

---

## 3. Arquitectura de datos

### 3.1 Event Store (esquema SQLite)

```sql
CREATE TABLE IF NOT EXISTS eventos_simulacion (
    event_id         TEXT PRIMARY KEY,
    timestamp        REAL NOT NULL,
    tick             INTEGER,
    session_id       TEXT,
    type             TEXT NOT NULL,
    payload          TEXT NOT NULL,  -- JSON
    risk_score       INTEGER DEFAULT 0,
    signals          TEXT,           -- JSON array
    integrity_hash   TEXT NOT NULL,
    prev_hash        TEXT
);

CREATE INDEX idx_eventos_tick ON eventos_simulacion(tick);
CREATE INDEX idx_eventos_session ON eventos_simulacion(session_id);
CREATE INDEX idx_eventos_type ON eventos_simulacion(type);
CREATE INDEX idx_eventos_risk ON eventos_simulacion(risk_score);
```

### 3.2 Determinismo: RNG con seed

Para replay, la simulación debe ser determinista. Hoy `refugeSimulation.js` usa `Math.random()` en:
- `wander()`: dirección aleatoria
- `findEmptyAdjacent()`: shuffle de direcciones
- `releaseAgents()`: shuffle de slots
- Mutación en reproducción

**Solución:** Inyectar generador con seed:

```javascript
// En world o engine: rng = seedrandom(sessionSeed)
// En refugeSimulation: usar rng() en lugar de Math.random()
```

Librería: `seedrandom` (npm). Al grabar, se guarda `session_seed` en el primer evento. Al replay, se reutiliza el mismo seed.

---

## 4. Plan de implementación

### Fase A: Event Store mínimo
- Crear `backend/src/audit/eventStore.js`
- Persistencia: SQLite `audit_simulacion.db`
- `registrar(tick, type, payload)` con integridad hash
- Integrar en `engine.js` (tick, start, pause, reset) y en `refugeSimulation` (agent death, reproduce)

### Fase B: Determinismo
- Añadir `seedrandom` al backend
- Refactorizar `refugeSimulation.js` para usar RNG inyectado
- Guardar `session_seed` en primer evento

### Fase C: Replay
- `backend/src/audit/replay.js`: cargar eventos, aplicar a mundo (o re-ejecutar con seed)
- Script `npm run replay -- --file=session_xxx.jsonl` o similar
- Tests de replay: grabar 50 ticks, replay, assert estado idéntico

### Fase D: Modo Competencia + risk_score
- Calcular `risk_score` y `signals` en eventos sensibles (release, control, move)
- API `GET /api/audit/events`
- Panel UI opcional para revisión

### Fase E: verificar_todo.js
- Script que ejecuta: tests, simulación headless, integridad Event Store, replay
- Genera `verificacion_completa.json`
- Integrable en CI

---

## 5. Referencias

- **Event Sourcing:** Eventos como fuente de verdad; replay para reconstruir estado
- **Deterministic Replay:** Replay.io, DebuggAI; mismo input → mismo output
- **Regression Games:** Smart Playback, validaciones automáticas en replay
- **Modo Competencia (Python):** `docs/DESIGN_MODO_COMPETENCIA.md`, `sistemas/sistema_modo_competencia.py`
- **verificar_todo.py:** `pruebas/verificar_todo.py` — modelo a replicar en JS

---

## 6. Criterios de éxito

1. **Record:** Cada sesión de simulación genera eventos en Event Store con integridad verificable
2. **Replay:** Sesión grabada se puede reproducir con resultado idéntico (determinismo)
3. **Debug:** Replay con código modificado permite validar fixes sin reproducir manualmente
4. **Autonomous:** `verificar_todo.js` ejecuta en <2 min y genera reporte OK/FAIL
5. **Modo Competencia:** Eventos sensibles tienen risk_score; consulta por umbral funciona
