# Auditoría Técnica Integral — Artificial World
**Fecha:** 2026-03-09 | **Auditor:** Cursor AI (9 agentes especializados) | **Versión:** 1.0

---

## Resumen Ejecutivo

Artificial World es un monorepo con stack maduro: **Node.js/Express** (backend), **React/Vite/Tailwind** (frontend), **SQLite/better-sqlite3** (persistencia), **WebSocket nativo** (tiempo real). La arquitectura tiene capas bien definidas, logging centralizado correcto y ausencia total de `console.log`. Sin embargo, existen **4 vulnerabilidades críticas de seguridad**, **problemas de concurrencia** en el runtime de simulación, y deuda técnica relevante en componentes frontend y módulos backend de gran tamaño.

---

## Puntuación de Conformidad

| Categoría | Puntuación | Notas |
|-----------|------------|-------|
| Seguridad | **4/10** | CORS abierto, auth basada en localStorage sin firma, admin sin RBAC real |
| Build Health | **7/10** | Sin TypeScript, sin ESLint configurado; buenas prácticas manuales |
| Arquitectura y Diseño | **7/10** | Separación de capas clara, pero singletons mutables globales |
| Calidad de Código | **6/10** | Componentes grandes, catch silenciosos, lógica seed duplicada |
| Dependencias | **7/10** | Dependencias modernas; Stripe sin abstracción |
| Código Muerto | **7/10** | `seedRuntime.js` es solo un re-export, patrones duplicados |
| Observabilidad | **8/10** | Logger propio funcional, broadcast WS, health endpoint presente |
| Concurrencia | **5/10** | Estado global mutable, setInterval sin cleanup garantizado |
| Ciclo de Vida | **6/10** | Sin graceful shutdown, initStripe async sin await correcto |
| **OVERALL** | **6.3/10** | |

---

## Resumen de Severidad

| Severidad | Cantidad |
|-----------|----------|
| Critical | 4 |
| High | 11 |
| Medium | 9 |
| Low | 5 |
| **Total** | **29** |

---

## Domain Health Summary

| Dominio | Arch Score | Quality Score | Issues |
|---------|-----------|--------------|--------|
| backend/simulation | 6/10 | 5/10 | 7 |
| backend/services/missionControl | 7/10 | 6/10 | 5 |
| backend/routes | 8/10 | 8/10 | 2 |
| backend/db | 8/10 | 7/10 | 3 |
| frontend/MissionControl | 7/10 | 6/10 | 4 |
| frontend/components | 6/10 | 5/10 | 6 |
| frontend/hooks | 8/10 | 8/10 | 2 |

---

## 1. Seguridad — CRITICAL

### CRITICAL: CORS abierto sin restricción
**Ubicación:** `backend/src/server.js:49`

```js
const corsOrigins = process.env.ALLOWED_ORIGINS?.split(',')...;
app.use(cors(corsOrigins?.length ? { origin: corsOrigins } : {}));
```

Cuando `ALLOWED_ORIGINS` no está definida, se pasa `{}` a cors() — acepta **cualquier origen**. Un atacante puede realizar peticiones cross-origin desde cualquier dominio.

**Solución:** Denegar por defecto. Exigir que `ALLOWED_ORIGINS` esté definida en producción. Añadir validación en startup:
```js
if (IS_PROD && !process.env.ALLOWED_ORIGINS) {
  throw new Error('ALLOWED_ORIGINS must be set in production');
}
```
**Esfuerzo:** S (pequeño)

---

### CRITICAL: Auth sin integridad — playerId no firmado
**Ubicación:** `backend/src/middleware/playerContext.js:10-14` + `backend/src/middleware/requireAdmin.js:8-25`

El `playerId` se genera en `localStorage` del navegador sin firma criptográfica:
```js
id = `player_${crypto.randomUUID()}_${Math.random().toString(36).slice(2, 9)}`;
localStorage.setItem(PLAYER_ID_KEY, id);
```

Luego se acepta en el servidor desde body, query, o header sin verificación. Cualquier usuario puede abrir DevTools, copiar el ID de un admin desde documentos públicos o fuerza bruta, y acceder a rutas admin.

**Solución:** Emitir el `playerId` como JWT httpOnly cookie desde el servidor. Firmar con `HMAC-SHA256` usando `JWT_SECRET`.

**Esfuerzo:** L (grande)

---

### CRITICAL: Token OpenClaw en query param URL
**Ubicación:** `backend/src/services/missionControl/connectors.js:636-637`

```js
const wsUrl = process.env.OPENCLAW_GATEWAY_TOKEN && !url.includes('?token=')
  ? `${url}${url.includes('?') ? '&' : '?'}token=${encodeURIComponent(process.env.OPENCLAW_GATEWAY_TOKEN)}`
  : url;
```

Los tokens en query params se exponen en logs de servidores proxy, access logs de nginx/Apache, y el historial del navegador.

**Solución:** Usar header `Authorization: Bearer <token>` en el handshake WebSocket inicial o mediante subprotocolo.

**Esfuerzo:** M (medio)

---

### CRITICAL: Sin graceful shutdown
**Ubicación:** `backend/src/server.js` (completo)

No existe ningún handler de `SIGTERM` o `SIGINT`. En Docker/pm2, cuando el contenedor se detiene, SQLite puede recibir la señal mientras hay una transacción abierta, produciendo corrupción de datos.

**Solución:**
```js
async function shutdown(signal) {
  logger.info(`[server] ${signal} received — shutting down`);
  clearInterval(simulationInterval);
  clearInterval(missionControlInterval);
  server.close(() => {
    logger.info('[server] HTTP server closed');
    process.exit(0);
  });
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
```
**Esfuerzo:** S (pequeño)

---

### HIGH: playerId también en body y query
**Ubicación:** `backend/src/middleware/playerContext.js:10-14`

```js
req.playerId =
  req.headers['x-player-id']
  ?? req.body?.playerId
  ?? req.query?.playerId
  ?? null;
```

Amplía la superficie de ataque. Un endpoint que recibe body/query de usuario podría ser manipulado para inyectar un `playerId` diferente.

**Solución:** Aceptar únicamente desde `x-player-id` header.

**Esfuerzo:** S

---

### HIGH: ensureColumn con template string interpolada
**Ubicación:** `backend/src/db/database.js:27` / `backend/src/db/missionControlDb.js:14`

```js
function ensureColumn(db, tableName, columnName, definition) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
```

Si `tableName` llegara de input externo, sería SQL injection. Actualmente solo se llama internamente, pero es un patrón peligroso que puede convertirse en vulnerabilidad tras un refactor.

**Solución:** Whitelist de nombres de tabla válidos antes de interpolar.

**Esfuerzo:** S

---

## 2. Concurrencia y Runtime — HIGH

### HIGH: Variables de módulo mutables globales en runtime
**Ubicación:** `backend/src/services/missionControl/runtime.js:26-30`

```js
let publishRealtime = () => {};
let runtimeStarted = false;
let simulationInterval = null;
let tickCounter = 0;
```

En modo `--watch` (node --watch) o con hot-reload, el módulo puede reinicializarse creando dos runtimes simultáneos. En un cluster con múltiples workers, cada worker tiene su propio estado desincronizado.

**Solución:** Encapsular en clase singleton con estado en la instancia; o externalizar el estado a la DB.

**Esfuerzo:** M

---

### HIGH: setInterval sin cleanup garantizado en shutdown
**Ubicación:** `backend/src/simulation/engine.js:15` / `backend/src/services/missionControl/runtime.js:731`

Dos `setInterval` de larga duración sin `unref()` y sin handlers SIGTERM (ver CRITICAL arriba). En ambientes serverless o Docker, el proceso no termina limpiamente.

**Solución:** (Incluido en la solución de graceful shutdown)

**Esfuerzo:** S

---

### HIGH: Heartbeat WSS sin cleanup explícito
**Ubicación:** `backend/src/realtime/websocket.js:51-57`

```js
const interval = setInterval(() => {
  wss?.clients.forEach((ws) => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => clearInterval(interval));
```

Si el servidor HTTP se cierra sin cerrar el WSS explícitamente (porque no hay SIGTERM handler), el interval permanece activo indefinidamente.

**Solución:** Añadir `wss.close()` en el graceful shutdown handler.

**Esfuerzo:** S

---

### HIGH: Ghost reconnects en connectors
**Ubicación:** `backend/src/services/missionControl/connectors.js:600-617`

La reconexión exponencial usa `setTimeout` recursivo. Si el registry del connector se limpia sin cancelar los timers pendientes, los timers siguen vivos y llaman a `connectGateway()` sobre un registry que ya no tiene el entry.

**Solución:** Llevar registro de todos los timers en el registry y cancelarlos en `cleanup()`.

**Esfuerzo:** M

---

### HIGH: O(n) queries en cada tick de simulación
**Ubicación:** `backend/src/services/missionControl/runtime.js:521-577`

`progressTaskLifecycle()` ejecuta cada 4 segundos:
```js
const tasks = listTasks();    // SELECT * FROM tasks
const agents = listAgents();  // SELECT * FROM agents
const runs = listRuns();      // SELECT * FROM runs
```

Sin paginación ni cache. Con miles de registros esto es una query completa triplicada en cada tick.

**Solución:** Cache con TTL de 1 tick, o filtrar en SQL solo entidades con `status IN ('backlog', 'in_progress', 'review')`.

**Esfuerzo:** M

---

## 3. Arquitectura y Diseño

### HIGH: runtime.js monolítico (~833 líneas)
**Ubicación:** `backend/src/services/missionControl/runtime.js`

Un único archivo contiene: seed data, tick engine, task lifecycle, approval lifecycle, gateway heartbeats, reconexión y exports. Viola SRP y hace el código difícil de testear de forma aislada.

**Solución:** Separar en:
- `seedData.js` — datos iniciales
- `taskLifecycle.js` — progresión de tareas
- `approvalLifecycle.js` — resolución de approvals
- `tickEngine.js` — loop principal

**Esfuerzo:** L

---

### HIGH: connectors.js monolítico (~840 líneas)
**Ubicación:** `backend/src/services/missionControl/connectors.js`

Mismo problema: normalización de frames, reconexión, approval handling y contract summary todo mezclado.

**Solución:** Separar en:
- `framingNormalizer.js`
- `reconnectionManager.js`
- `approvalGatewayBridge.js`

**Esfuerzo:** L

---

### MEDIUM: createId() con colisión potencial
**Ubicación:** `backend/src/services/missionControl/runtime.js:39-41` y `connectors.js`

```js
function createId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
```

Probabilidad de colisión ~1/46656 por milisegundo. Bajo carga alta puede generar IDs duplicados violando las PK de SQLite.

**Solución:** Usar `crypto.randomUUID()` (ya importado en otros módulos del proyecto).

**Esfuerzo:** S

---

### MEDIUM: Patrón de DB duplicado
**Ubicación:** `backend/src/db/database.js` + `backend/src/db/missionControlDb.js`

`ensureColumn`, `getDb`, singleton pattern — código casi idéntico duplicado en dos archivos para dos bases de datos distintas.

**Solución:** Extraer a `backend/src/db/createSqliteDb.js` genérico.

**Esfuerzo:** M

---

### MEDIUM: Snapshot completo en cada tick WS
**Ubicación:** `backend/src/services/missionControl/aggregator.js:156-211`

`getMissionControlSnapshot()` hidrata todos los datos en memoria en cada llamada. Se invoca tanto en HTTP como en cada tick del runtime (cada 4s). Con snapshot grande (~10KB JSON) y muchos clientes conectados, el throughput de WS se degrada.

**Solución:** Publicar delta events por WS en lugar de snapshots completos. El snapshot completo solo al conectar.

**Esfuerzo:** M

---

### MEDIUM: Routing hash manual sin React Router
**Ubicación:** `frontend/src/App.jsx:55-91`

El routing por hash (`window.location.hash`) es manual y no aprovecha el historial del navegador correctamente. `MissionControl` usa `lazy()` pero el resto de componentes se cargan sincrónicamente.

**Solución:** Migrar a `react-router-dom` con rutas declarativas y lazy loading para todos los módulos pesados.

**Esfuerzo:** L

---

### MEDIUM: seedRuntime.js — abstracción muerta
**Ubicación:** `backend/src/services/missionControl/seedRuntime.js`

```js
import { initMissionControlRuntime } from './runtime.js';
export function initMissionControlSeedRuntime(options = {}) {
  return initMissionControlRuntime(options);
}
```

5 líneas que solo reexportan. Zero valor añadido.

**Solución:** Eliminar y actualizar la importación en `server.js`.

**Esfuerzo:** S

---

## 4. Calidad de Código

### HIGH: SimulationView.jsx supera 300 líneas
**Ubicación:** `frontend/src/components/SimulationView.jsx`

Componente con lógica de fetch, múltiples event handlers, estado local y render — viola la regla de 300 líneas de `AGENTS.md`.

**Solución:** Extraer handlers a `useSimulationHandlers.js`.

**Esfuerzo:** M

---

### MEDIUM: catch silencioso en useMissionControlRealtime
**Ubicación:** `frontend/src/components/MissionControl/hooks/useMissionControlRealtime.js:67`

```js
} catch {
  setWsState('degraded');
}
```

Fallo silencioso cuando el mensaje WS no puede parsearse — imposible depurar.

**Solución:**
```js
} catch (err) {
  logger.warn('[MC WS] invalid message', { data: event.data, err: err.message });
  setWsState('degraded');
}
```
**Esfuerzo:** S

---

### MEDIUM: catch silencioso en MCAuditLog
**Ubicación:** `frontend/src/components/MissionControl/MCAuditLog.jsx:49`

```js
try {
  return JSON.stringify(p);
} catch {
  return '-';
}
```

**Solución:** `catch (err) { logger.debug('[MCAuditLog] bad payload', p); return '-'; }`

**Esfuerzo:** S

---

### MEDIUM: catch silencioso en MCLiveLog
**Ubicación:** `frontend/src/components/MissionControl/MCLiveLog.jsx:67`

```js
} catch { /* ignore non-json */ }
```

**Solución:** `} catch (err) { logger.debug('[MCLiveLog] non-json WS message', err.message); }`

**Esfuerzo:** S

---

## 5. Observabilidad

### MEDIUM: initStripe async sin await correcto
**Ubicación:** `backend/src/server.js:110-116`

```js
server.listen(PORT, async () => {
  logger.info(`Constructor de Mundos API...`);
  await initStripe();
});
```

El callback de `server.listen()` no es async natively en Node.js — si `initStripe()` lanza, el error no se captura correctamente.

**Solución:** Refactorizar el startup:
```js
await initStripe();
server.listen(PORT, () => {
  logger.info(`Constructor de Mundos API at http://localhost:${PORT}`);
});
```
**Esfuerzo:** S

---

### MEDIUM: Health check superficial
**Ubicación:** `backend/src/server.js:80-82`

```js
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'constructor-de-mundos', ws: true });
});
```

No verifica el estado real de SQLite ni del runtime. Un healthcheck falso da falsa seguridad a orquestadores como Kubernetes.

**Solución:**
```js
app.get('/health', (req, res) => {
  const db = getDb();
  const dbOk = db.prepare('SELECT 1').get()?.['1'] === 1;
  res.status(dbOk ? 200 : 503).json({
    status: dbOk ? 'ok' : 'degraded',
    db: dbOk ? 'ok' : 'error',
    runtime: runtimeStarted,
  });
});
```
**Esfuerzo:** S

---

### LOW: Logger frontend sin control en runtime
**Ubicación:** `frontend/src/utils/logger.js`

El nivel de log requiere rebuild para cambiarse. En producción, no hay forma de activar logs de debug sin redesplegar.

**Solución:** `const level = localStorage.getItem('aw_log_level') ?? import.meta.env.VITE_LOG_LEVEL ?? 'warn';`

**Esfuerzo:** S

---

## 6. Build y Configuración

### MEDIUM: localhost:3001 hardcodeado en vite.config.js
**Ubicación:** `frontend/vite.config.js:44-46`

```js
proxy: {
  '/api': {
    target: 'http://localhost:3001',
```

Viola la regla del workspace de no hardcodear URLs.

**Solución:**
```js
const BACKEND_PORT = process.env.VITE_BACKEND_PORT ?? '3001';
proxy: {
  '/api': { target: `http://localhost:${BACKEND_PORT}` }
}
```
**Esfuerzo:** S

---

### LOW: Sin ESLint configurado
**Ubicación:** Raíz del proyecto

No hay `.eslintrc` ni `eslint.config.js`. La consistencia de código depende del editor de cada desarrollador.

**Solución:** Añadir `eslint.config.js` mínimo con `no-console`, `no-unused-vars`, `react-hooks/exhaustive-deps`.

**Esfuerzo:** S

---

### LOW: PWA sin estrategias de cache
**Ubicación:** `frontend/vite.config.js:33`

```js
workbox: { globPatterns: ['**/*.{js,css,html...}'], runtimeCaching: [] }
```

`runtimeCaching: []` vacío — la PWA no cachea nada dinámicamente. No funciona offline.

**Esfuerzo:** M

---

## 7. Código Muerto

### LOW: seedRuntime.js — re-export vacío
**Ubicación:** `backend/src/services/missionControl/seedRuntime.js`
(Ver sección Arquitectura arriba)

### LOW: Patrón ensureColumn duplicado
**Ubicación:** `backend/src/db/database.js:26-32` / `backend/src/db/missionControlDb.js:14-20`

Código idéntico en dos archivos. Debe extraerse a `backend/src/db/schemaUtils.js`.

**Esfuerzo:** S

---

## Acciones Prioritarias

| Prioridad | Categoría | Ubicación | Issue | Esfuerzo |
|-----------|-----------|-----------|-------|---------|
| **CRITICAL** | Seguridad | `server.js:49` | CORS abierto sin restricción | S |
| **CRITICAL** | Seguridad | `playerContext.js` + `requireAdmin.js` | Auth basada en localStorage sin firma | L |
| **CRITICAL** | Seguridad | `connectors.js:636` | Token en URL query param | M |
| **CRITICAL** | Concurrencia | `server.js` | Sin graceful shutdown | S |
| **HIGH** | Calidad | `runtime.js` (833 líneas) | Archivo monolítico | L |
| **HIGH** | Calidad | `connectors.js` (840 líneas) | Archivo monolítico | L |
| **HIGH** | Seguridad | `db/database.js:27` | ensureColumn con template string | S |
| **HIGH** | Performance | `aggregator.js` | Snapshot completo en cada WS tick | M |
| **HIGH** | Concurrencia | `runtime.js:521` | listTasks() completa en cada tick | M |
| **HIGH** | Concurrencia | `connectors.js:600` | Ghost reconnects sin cleanup | M |
| **MEDIUM** | Build | `vite.config.js:44` | localhost:3001 hardcodeado | S |
| **MEDIUM** | Observabilidad | `server.js:80` | Health check superficial | S |
| **MEDIUM** | Observabilidad | `server.js:110` | initStripe async incorrecto | S |
| **MEDIUM** | Calidad | `runtime.js:39` | createId() con colisión potencial | S |
| **MEDIUM** | Calidad | 3x catch silenciosos | Error handling opaco | S |

---

## Fortalezas del Codebase

1. **Logger centralizado** — 0 `console.log` en todo el codebase. Todas las capas usan el logger con broadcast WS.
2. **Rutas consistentes** — Todas usan `asyncHandler` + `ApiError` con respuestas `{ success, data/error }` estructuradas.
3. **SQLite con WAL + FK** — Ambas bases de datos tienen `journal_mode = WAL` y `foreign_keys = ON`.
4. **URLs centralizadas** — Frontend usa `config/api.js` para todos los endpoints. ✅ Regla workspace cumplida.
5. **WebSocket con reconexión exponencial** — `useRealtimeSimulation` y `useMissionControlRealtime` implementan backoff correcto.
6. **Audit log con integridad SHA-256** — El event store encadena eventos con hash previo — arquitectura robusta para auditoría.
7. **Lazy loading de MissionControl** — Cargado con `React.lazy()` reduciendo el bundle inicial.
8. **i18n completa** — 5 idiomas (es, en, de, fr, pt) con `react-i18next`.
9. **Separación frontend/backend real** — Sin rutas hardcodeadas en componentes (salvo `vite.config.js`).
10. **Tests presentes** — `vitest` configurado con tests en simulación, routes y componentes.

---

## Stack Técnico Auditado

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Backend Runtime | Node.js + Express | express ^4.21.0 |
| Base de Datos | SQLite (better-sqlite3) | ^12.6.2 |
| WebSocket | ws | ^8.18.0 |
| Pagos | Stripe | ^20.4.1 |
| IA Local | Ollama (llama3.2) | http API |
| Frontend | React | ^18.3.1 |
| Build Tool | Vite | ^5.4.10 |
| CSS | Tailwind CSS | ^4.2.1 |
| Estado | Zustand | ^5.0.11 |
| i18n | react-i18next | ^16.5.6 |
| Charts | Recharts | ^3.8.0 |
| PWA | vite-plugin-pwa | ^1.2.0 |
| Tests | Vitest | ^2.1.0 |

---

*Auditoría generada por Cursor AI — 9 agentes especializados (Security, Build, Architecture, Code Quality, Dependencies, Dead Code, Observability, Concurrency, Lifecycle)*

*Artificial World — Constructor de Mundos — 2026-03-09*
