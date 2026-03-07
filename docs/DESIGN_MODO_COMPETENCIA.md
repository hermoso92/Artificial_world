# Modo Competencia — Diseño Técnico

**Objetivo:** Capa de observabilidad defensiva y forense para proteger el sistema frente a hackeos, scraping, reconocimiento, extracción de lógica, espionaje competitivo, sabotaje interno y conflictos legales futuros.

**Estado:** Diseño listo para implementación.

---

## 1. Arquitectura del Módulo

### 1.1 Ubicación y dependencias

```
sistemas/
├── sistema_modo_competencia.py   # Módulo principal
├── sistema_logs.py               # Logs normales (existente)
├── sistema_persistencia.py       # Persistencia (existente)
└── sistema_watchdog.py            # Anomalías simulación (existente)

tipos/
└── enums.py                      # + TipoEventoCompetencia, SeveridadCompetencia
```

### 1.2 Flujo de datos

```
[Puntos de captura]                    [Sistema Modo Competencia]
       │                                        │
       ├─ persistencia.guardar/cargar ──────────┤
       ├─ gestor_modo_sombra.* ─────────────────┤
       ├─ directivas emitidas ──────────────────┤──► Registrar evento
       ├─ reporte_sesion.generar ───────────────┤      │
       ├─ config modificada (futuro) ───────────┤      ▼
       └─ API/endpoints (futuro web) ───────────┘   Calcular risk_score
                                                           │
                                                           ▼
                                                    Escribir append-only
                                                    (audit_competencia.db)
                                                           │
                                                           ▼
                                                    Si risk >= umbral
                                                    → Marcar requires_review
                                                    → Opcional: alerta
```

### 1.3 Principios

| Principio | Implementación |
|-----------|----------------|
| **Append-only** | Tabla sin UPDATE/DELETE; triggers que rechazan modificaciones |
| **Integridad** | Hash SHA-256 de cada evento (prev + payload) |
| **Correlación** | session_id, correlation_id, tick |
| **Desacoplamiento** | El sistema no bloquea operaciones; registra de forma asíncrona |

---

## 2. Esquema de Base de Datos

**Archivo:** `audit_competencia.db` (separado de `mundo_artificial.db`)

```sql
-- Tabla principal de eventos (append-only)
CREATE TABLE IF NOT EXISTS eventos_competencia (
    event_id         TEXT PRIMARY KEY,           -- UUID v4
    timestamp        REAL NOT NULL,              -- time.time()
    mode             TEXT NOT NULL DEFAULT 'competencia',

    -- Actor (quién realizó la acción)
    actor_id         TEXT,                       -- user_id | id_entidad | "sistema"
    actor_role       TEXT,                       -- "sistema" | "modo_sombra" | "deserializacion" | "local"
    actor_ip         TEXT,                       -- "local" en desktop; IP en web
    actor_user_agent TEXT,                       -- "pygame" | user-agent en web

    -- Target (qué se afectó)
    target_resource   TEXT NOT NULL,
    target_type       TEXT NOT NULL,             -- "persistencia" | "directiva" | "modo_sombra" | "reporte" | "config"

    -- Acción y resultado
    action           TEXT NOT NULL,
    outcome          TEXT,                      -- "success" | "failure" | "partial"

    -- Riesgo y severidad
    risk_score       INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    severity         TEXT NOT NULL,              -- "low" | "medium" | "high" | "critical"

    -- Correlación
    session_id       TEXT,
    correlation_id   TEXT,
    tick             INTEGER,

    -- Señales que contribuyeron al score
    signals          TEXT,                       -- JSON array de strings

    -- Flags
    requires_review  INTEGER NOT NULL DEFAULT 0, -- 0 | 1
    legal_relevance  INTEGER NOT NULL DEFAULT 0, -- 0 | 1

    -- Integridad
    integrity_hash   TEXT NOT NULL,
    prev_hash        TEXT                        -- Hash del evento anterior (cadena)
);

-- Índices para consultas
CREATE INDEX IF NOT EXISTS idx_competencia_ts ON eventos_competencia(timestamp);
CREATE INDEX IF NOT EXISTS idx_competencia_actor ON eventos_competencia(actor_id);
CREATE INDEX IF NOT EXISTS idx_competencia_target ON eventos_competencia(target_resource);
CREATE INDEX IF NOT EXISTS idx_competencia_risk ON eventos_competencia(risk_score);
CREATE INDEX IF NOT EXISTS idx_competencia_review ON eventos_competencia(requires_review);
CREATE INDEX IF NOT EXISTS idx_competencia_session ON eventos_competencia(session_id);
```

### 2.1 Enfoque append-only

- No se exponen métodos `UPDATE` ni `DELETE` en el API del módulo.
- Opcional: trigger que rechaza UPDATE/DELETE:

```sql
CREATE TRIGGER IF NOT EXISTS trg_no_modificar_competencia
BEFORE UPDATE OR DELETE ON eventos_competencia
BEGIN
    SELECT RAISE(ABORT, 'eventos_competencia es append-only');
END;
```

---

## 3. Modelo de Datos (Python)

```python
@dataclass
class EventoCompetencia:
    event_id: str
    timestamp: float
    mode: str = "competencia"

    actor_id: str | None
    actor_role: str
    actor_ip: str
    actor_user_agent: str

    target_resource: str
    target_type: str

    action: str
    outcome: str | None

    risk_score: int
    severity: str

    session_id: str | None
    correlation_id: str | None
    tick: int | None

    signals: list[str]
    requires_review: bool
    legal_relevance: bool

    integrity_hash: str
    prev_hash: str | None
```

---

## 4. Sistema de Scoring de Riesgo

### 4.1 Escala

| Rango | Nivel | Acción |
|-------|-------|--------|
| 0-30 | Normal | Solo registro |
| 30-60 | Sospechoso | Marcar para revisión opcional |
| 60-80 | Alto riesgo | `requires_review=1` |
| 80-100 | Crítico | `requires_review=1`, `legal_relevance=1`, alerta |

### 4.2 Señales y pesos (ejemplo)

| Señal | Peso | Descripción |
|-------|------|-------------|
| `acceso_persistencia` | +25 | Guardar/cargar estado |
| `modo_sombra_activado` | +15 | Usuario toma control |
| `directiva_emitida` | +10 | Directiva externa |
| `exportacion_reporte` | +20 | Generación reporte_sesion.json |
| `carga_externa` | +30 | Cargar estado desde archivo |
| `fuera_horario` | +15 | (Futuro web) Acceso fuera de horario |
| `alta_frecuencia` | +25 | (Futuro) Muchas peticiones en poco tiempo |
| `recurso_sensible` | +20 | Acceso a config/prompts |
| `borrado_masivo` | +40 | (Futuro) Borrado de recursos |
| `error_deliberado` | +15 | Secuencia de errores 404/500 |

### 4.3 Cálculo

```python
def calcular_risk_score(signals: list[str], contexto: dict) -> int:
    base = 0
    for s in signals:
        base += PESOS.get(s, 10)
    # Límites y ajustes por contexto
    return min(100, base)
```

---

## 5. Puntos de Captura (Interceptores)

### 5.1 Contexto actual (desktop)

| Punto | Acción | target_type | Señales |
|-------|--------|-------------|---------|
| `SistemaPersistencia.guardar_estado` | guardar_estado | persistencia | acceso_persistencia |
| `SistemaPersistencia.cargar_estado` | cargar_estado | persistencia | carga_externa, acceso_persistencia |
| `GestorModoSombra.activar` | modo_sombra_activado | modo_sombra | modo_sombra_activado |
| `GestorModoSombra.desactivar` | modo_sombra_desactivado | modo_sombra | modo_sombra_activado |
| `GestorModoSombra.emitir_comando` | comando_sombra_emitido | modo_sombra | directiva_emitida |
| Directiva emitida (sintaxis) | directiva_emitida | directiva | directiva_emitida |
| `SistemaReporte.generar_*` | exportar_reporte | reporte | exportacion_reporte |

### 5.2 Integración (no invasiva)

El módulo se integra mediante **inyección de callbacks** o **decoradores**:

```python
# En sistema_persistencia.py (ejemplo)
def guardar_estado(self, simulacion, ...):
    resultado = self._guardar_interno(...)
    if getattr(simulacion, "sistema_competencia", None):
        simulacion.sistema_competencia.registrar(
            action="guardar_estado",
            target_resource="estado",
            target_type="persistencia",
            outcome="success" if resultado else "failure",
            signals=["acceso_persistencia"],
            tick=simulacion.gestor_ticks.tick_actual,
        )
    return resultado
```

O mediante un **bus de eventos** que el Modo Competencia escucha (similar a `bus_eventos`).

---

## 6. Sistema de Alertas

### 6.1 Umbrales

- `risk_score >= 60` → `requires_review = 1`
- `risk_score >= 80` → `legal_relevance = 1` + emitir alerta al log

### 6.2 Almacenamiento de alertas

- Las alertas se registran en el mismo `eventos_competencia` con `requires_review=1`.
- Opcional: buffer en memoria para UI (similar a `sistema_watchdog.alertas_activas`).

### 6.3 Consulta de eventos para revisión

```python
def obtener_eventos_revision(self, limite: int = 50) -> list[EventoCompetencia]:
    """Eventos con requires_review=1 ordenados por timestamp desc."""
```

---

## 7. Estrategia de Integridad

### 7.1 Cadena de hashes

Cada evento incluye:
- `integrity_hash`: SHA-256 de `event_id + timestamp + action + target_resource + ...` (campos inmutables)
- `prev_hash`: Hash del último evento insertado (cadena encadenada)

El primer evento tiene `prev_hash = "genesis"`.

### 7.2 Verificación

```python
def verificar_integridad(self) -> list[str]:
    """Verifica la cadena de hashes. Devuelve lista de event_ids corruptos."""
```

---

## 8. API de Consulta

### 8.1 Métodos propuestos

| Método | Descripción |
|--------|-------------|
| `registrar(...)` | Inserta un evento (API interna) |
| `obtener_por_rango(desde_ts, hasta_ts)` | Eventos en ventana temporal |
| `obtener_por_actor(actor_id)` | Eventos de un actor |
| `obtener_por_riesgo(min_score)` | Eventos con risk_score >= min |
| `obtener_para_revision(limite)` | requires_review=1 |
| `verificar_integridad()` | Valida cadena de hashes |
| `contar_eventos()` | Total de eventos (para estadísticas) |

### 8.2 Formato de salida

Los eventos se devuelven como `EventoCompetencia` o como `dict` serializable para exportación.

---

## 9. Configuración

En `configuracion.py`:

```python
# Modo Competencia
modo_competencia_activo: bool = True
modo_competencia_ruta_db: str = "audit_competencia.db"
modo_competencia_umbral_alerta: int = 60
modo_competencia_umbral_legal: int = 80
modo_competencia_session_id: str | None = None  # Auto-generado si None
```

---

## 10. Diferencia con Logs Normales

| Aspecto | Logs normales | Modo Competencia |
|---------|---------------|------------------|
| Propósito | Qué ocurrió | Qué riesgo implica, si es anómalo, relevancia legal |
| Destino | simulacion.log (texto) | audit_competencia.db (estructurado) |
| Modificación | Append a archivo | Append-only DB con integridad |
| Consulta | grep, tail | SQL, API estructurada |
| Alertas | No | Sí (risk >= umbral) |

---

## 11. Plan de Implementación

1. **Fase 1:** Crear `sistema_modo_competencia.py` con modelo, esquema DB, `registrar()`, integridad.
2. **Fase 2:** Añadir configuración en `configuracion.py`.
3. **Fase 3:** Integrar en `SistemaPersistencia`, `GestorModoSombra`, `SistemaReporte`.
4. **Fase 4:** Métodos de consulta y verificación de integridad.
5. **Fase 5:** (Opcional) Panel UI para ver eventos de revisión.

---

## 12. Extensibilidad Futura (Web/API)

Cuando el proyecto tenga endpoints HTTP:

- **Actor:** `user_id`, `ip`, `user_agent` reales desde request.
- **Middleware:** Interceptor en cada request que registra endpoint, método, status.
- **Señales adicionales:** `alta_frecuencia`, `exploracion_endpoints`, `error_deliberado`.
- **Session:** `session_id` desde cookie o header.

El diseño actual ya contempla estos campos; solo hay que poblarlos.
