# Auditoría de Base de Datos — Artificial Word

**Fecha:** 2025-03-08  
**Alcance:** backend/db/schema.sql, uso de BD en backend (better-sqlite3), mundo_artificial.db, convenciones y compatibilidad PostgreSQL vs SQLite.

---

## 1. Resumen

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| **schema.sql** | ⚠️ No utilizado | Diseñado para PostgreSQL; no se ejecuta en runtime |
| **Backend Node** | ✅ Operativo | better-sqlite3 solo en `eventStore.js` → `audit_simulacion.db` |
| **mundo_artificial.db** | ✅ Operativo | Usado por Python (sistema_persistencia, sistema_modo_competencia) |
| **Incompatibilidades** | ❌ Críticas | schema.sql usa gen_random_uuid(), JSONB, GIN, TIMESTAMPTZ |
| **Convenciones** | ⚠️ Parciales | snake_case vs PascalCase/camelCase esperado |

### Arquitectura actual de persistencia

```
┌─────────────────────────────────────────────────────────────────┐
│ Python (pygame / simulación local)                               │
│  ├── mundo_artificial.db  ← sistema_persistencia.py (estado)     │
│  └── audit_competencia.db ← sistema_modo_competencia.py          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Backend Node (API web)                                           │
│  ├── audit_simulacion.db  ← eventStore.js (better-sqlite3)       │
│  └── world/refuge         ← in-memory (sin persistencia)         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ backend/db/schema.sql                                            │
│  → PostgreSQL, NO USADO por ningún componente                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Violaciones (Schema Consistency)

### 2.1 backend/db/schema.sql

#### Naming conventions

| Regla | Esperado | Actual | Tablas/Columnas afectadas |
|-------|----------|--------|---------------------------|
| Tablas | PascalCase | snake_case | players, worlds, refuges, blueprints, lineages, agent_snapshots, events |
| Columnas | camelCase | snake_case | created_at, world_id, owner_id, plot_index, etc. |
| Índices | idx_table_column | idx_table_column | ✅ Cumple (idx_players_tier, idx_refuges_world) |
| FKs | fk_table_column | Implícitas | Sin nombre explícito en REFERENCES |

#### Nullability

| Tabla | Columna | Problema | Recomendación |
|-------|---------|----------|---------------|
| worlds | created_at | ✅ NOT NULL | — |
| worlds | updated_at | ❌ Ausente | Añadir si se requiere auditoría |
| refuges | owner_id | NULL permitido | ✅ Correcto (refugio sin dueño) |
| events | payload | NULL permitido | ✅ Correcto (evento sin payload) |
| events | tick | NULL permitido | ✅ Correcto |

#### Constraints faltantes

| Tabla | Problema | Recomendación |
|-------|----------|---------------|
| agent_snapshots | energy, matter sin CHECK | `CHECK (energy >= 0 AND matter >= 0)` |
| lineages | death_tick sin CHECK | `CHECK (death_tick IS NULL OR death_tick >= birth_tick)` |
| refuges | UNIQUE sin nombre | `CONSTRAINT unq_refuges_world_plot UNIQUE(world_id, plot_index)` |

#### Índices en FKs

| Tabla | FK | Índice | Estado |
|-------|-----|--------|--------|
| refuges | world_id | idx_refuges_world | ✅ |
| refuges | owner_id | idx_refuges_owner | ✅ |
| blueprints | player_id | idx_blueprints_player | ✅ |
| lineages | blueprint_id, refuge_id | idx_lineages_* | ✅ |
| agent_snapshots | refuge_id, lineage_id | idx_agent_snapshots_* | ✅ |
| events | refuge_id | idx_events_refuge_tick | ✅ |

---

## 3. Incompatibilidades PostgreSQL vs SQLite

### 3.1 Features PostgreSQL no soportadas en SQLite

| Feature | Uso en schema.sql | Alternativa SQLite |
|---------|-------------------|---------------------|
| `gen_random_uuid()` | Todas las PKs | `(lower(hex(randomblob(4))) || '-' || ...)` o `randomUUID()` en app |
| `JSONB` | blueprints.traits, agent_snapshots.traits, events.payload | `TEXT` + `json()` en queries |
| `TIMESTAMPTZ` | created_at, updated_at | `TEXT` ISO8601 o `REAL` (Unix) |
| `now()` | DEFAULT en timestamps | `(strftime('%s','now'))` o en app |
| `USING GIN(traits)` | idx_blueprints_traits | JSON1 + índice en expresión o FTS5 |
| `BOOLEAN` | worlds.running | `INTEGER` (0/1) |
| `VARCHAR(n)` | name, tier, etc. | `TEXT` (SQLite ignora longitud) |
| `DECIMAL(5,4)` | energy, matter | `REAL` o `TEXT` |

### 3.2 Mapeo sugerido para schema SQLite

```sql
-- Ejemplo: players adaptado a SQLite
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6)))),
  name TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('spectator', 'free', 'paid')),
  created_at REAL NOT NULL DEFAULT (strftime('%s','now')),
  updated_at REAL NOT NULL DEFAULT (strftime('%s','now'))
);
-- O más simple: generar UUID en aplicación (randomUUID() en Node, uuid.uuid4() en Python)
```

---

## 4. Uso de BD en Backend (better-sqlite3)

### 4.1 Ubicación y alcance

| Archivo | BD | Tabla(s) | Operaciones |
|---------|-----|----------|-------------|
| `backend/src/audit/eventStore.js` | audit_simulacion.db | eventos_simulacion | INSERT, SELECT, COUNT |

### 4.2 Patrones observados

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| Conexión | Singleton | `getDb()` lazy-init, una instancia global |
| WAL mode | ✅ | `db.pragma('journal_mode = WAL')` |
| Prepared statements | ✅ | `db.prepare(...).run/get/all` |
| Transacciones | ⚠️ Parcial | INSERT individual sin transacción explícita |
| Cierre de conexión | ❌ | No se cierra nunca (singleton persistente) |
| Error handling | ⚠️ | `contar()` usa `catch { return 0 }` sin logger (AGENTS.md: bare catch) |

### 4.3 Queries ejecutadas

```javascript
// Creación
CREATE TABLE IF NOT EXISTS eventos_simulacion (...)
CREATE INDEX IF NOT EXISTS idx_eventos_tick ON ...
CREATE INDEX IF NOT EXISTS idx_eventos_session ON ...
CREATE INDEX IF NOT EXISTS idx_eventos_type ON ...
CREATE INDEX IF NOT EXISTS idx_eventos_risk ON ...

// Lectura
SELECT integrity_hash FROM eventos_simulacion ORDER BY timestamp DESC LIMIT 1
SELECT * FROM eventos_simulacion WHERE 1=1 [filtros] ORDER BY timestamp ASC [LIMIT]
SELECT * FROM eventos_simulacion ORDER BY rowid ASC  -- verificarIntegridad
SELECT COUNT(*) as n FROM eventos_simulacion

// Escritura
INSERT INTO eventos_simulacion (event_id, timestamp, tick, session_id, type, payload, risk_score, signals, integrity_hash, prev_hash) VALUES (?, ?, ...)
```

### 4.4 Integración con eventStore

- `api.js`: registrar (agent_release), obtener (GET /events), verificarIntegridad
- `engine.js`: registrar (sim_start, sim_pause, sim_reset, tick, agent_death, agent_combat, agent_reproduce, agent_release)
- `diagnostics.js`: registrar (detection)

---

## 5. Recomendaciones prioritarias

### P1 — Críticas

1. **Decidir destino de schema.sql**
   - Si se mantiene PostgreSQL como objetivo: documentar que es diseño futuro y no ejecutable en SQLite.
   - Si se migra a SQLite: crear `backend/db/schema_sqlite.sql` con el mapeo completo y usarlo en el flujo de init.

2. **Corregir bare catch en eventStore.js**
   ```javascript
   // Línea 183-185: actual
   } catch {
     return 0;
   }
   // Debe ser:
   } catch (err) {
     logger.error('[eventStore] Error contando eventos:', err?.message);
     return 0;
   }
   ```

3. **Unificar o documentar BDs**
   - Hoy hay 3 BDs SQLite distintas: `mundo_artificial.db`, `audit_competencia.db`, `audit_simulacion.db`.
   - Documentar en README/AGENTE_ENTRANTE qué BD usa cada componente.

### P2 — Importantes

4. **Añadir transacciones en eventStore para batch**
   - Si en el futuro se insertan múltiples eventos en un mismo tick, usar `db.transaction(() => { ... })`.

5. **Cierre graceful de conexión**
   - En `server.js` o shutdown handler: `eventStore.close?.()` si se expone un método para cerrar la conexión SQLite.

6. **Schema schema.sql: constraints**
   - Añadir CHECK en agent_snapshots (energy, matter >= 0) y lineages (death_tick >= birth_tick).

### P3 — Mejoras

7. **Naming conventions**
   - Si se adopta schema-consistency-checker: migrar tablas/columnas a PascalCase/camelCase en un futuro schema v2.

8. **Índice GIN en SQLite**
   - Para búsquedas en JSON: usar `json_extract(traits, '$.key')` y crear índice en esa expresión, o FTS5 si se necesita full-text.

9. **Performance eventStore**
   - Considerar `PRAGMA synchronous = NORMAL` para auditoría append-only (menor durabilidad, mayor throughput).
   - Mantener WAL para concurrencia lectura/escritura.

---

## 6. Checklist

### Schema (backend/db/schema.sql)

- [ ] Documentar que es PostgreSQL y no se ejecuta en runtime
- [ ] Crear schema_sqlite.sql si se adopta SQLite para Artificial Worlds
- [ ] Añadir CHECK en agent_snapshots (energy, matter)
- [ ] Añadir CHECK en lineages (death_tick)
- [ ] Nombrar constraint UNIQUE en refuges

### Backend (eventStore.js)

- [ ] Corregir bare catch en `contar()` → usar logger
- [ ] Exponer `close()` para shutdown graceful
- [ ] Considerar transacciones para inserts batch

### Documentación

- [ ] README: listar mundo_artificial.db, audit_simulacion.db, audit_competencia.db
- [ ] AGENTE_ENTRANTE: aclarar que schema.sql es diseño futuro PostgreSQL

### Migración Postgres → SQLite (si aplica)

- [ ] Sustituir gen_random_uuid() por UUID en aplicación
- [ ] Cambiar JSONB → TEXT + json()
- [ ] Cambiar TIMESTAMPTZ → REAL o TEXT
- [ ] Eliminar índice GIN o sustituir por índice en json_extract
- [ ] Cambiar now() por strftime o valor en app

---

## 7. Referencias

- `backend/db/schema.sql` — Schema PostgreSQL (no usado)
- `backend/src/audit/eventStore.js` — Uso de better-sqlite3
- `sistemas/sistema_persistencia.py` — mundo_artificial.db
- `sistemas/sistema_modo_competencia.py` — audit_competencia.db
- AGENTS.md — Reglas de code review (logger, bare except)
- Schema Consistency Checker skill — Convenciones de nombres y tipos
