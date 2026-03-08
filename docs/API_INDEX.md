# Índice de API — Artificial World

**Base URL:** `http://localhost:3001` (backend 3001)

**WebSocket:** `ws://localhost:3001/ws`

---

## /api (api.js)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/diagnostics` | Diagnóstico del sistema |
| GET | `/api/status` | Estado: tick, running, agentCount |
| GET | `/api/world` | Estado del mundo | 
| GET | `/api/agents` | Agentes del refugio activo |
| GET | `/api/refuges` | Lista de refugios |
| GET | `/api/blueprints` | Blueprints |
| GET | `/api/logs` | Logs del mundo |
| POST | `/api/blueprints` | Crear blueprint |
| POST | `/api/refuges` | Crear refugio |
| POST | `/api/refuge/node` | Añadir nodo al refugio |
| POST | `/api/refuge/select` | Seleccionar refugio activo |
| POST | `/api/release` | Soltar agentes en refugio |
| GET | `/api/refuge/furniture/catalog` | Catálogo de muebles |
| POST | `/api/refuge/furniture` | Colocar mueble |
| POST | `/api/refuge/interact` | Usar mueble |
| DELETE | `/api/refuge/furniture/:id` | Quitar mueble |
| POST | `/api/refuge/pet/adopt` | Adoptar mascota |
| POST | `/api/refuge/pet/tick` | Tick de mascotas |
| POST | `/api/simulation/start` | Iniciar simulación |
| POST | `/api/simulation/pause` | Pausar simulación |
| POST | `/api/simulation/reset` | Reset mundo |
| GET | `/api/audit/events` | Eventos de auditoría |
| GET | `/api/audit/integrity` | Verificar integridad event store |

---

## /api/ai (ai.js)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/ai/health` | Estado IA local (Ollama) |
| POST | `/api/ai/chat` | Chat contextual |
| POST | `/api/ai/summarize` | Resumir texto |
| POST | `/api/ai/analyze-test-failure` | Analizar fallo de test |
| POST | `/api/ai/analyze-session` | Analizar sesión |

---

## /api/hero (heroRefuge.js)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/hero` | Estado HeroRefuge |
| POST | `/api/hero` | Crear/actualizar |
| POST | `/api/hero/mode` | Cambiar modo |
| POST | `/api/hero/query` | Query IA |
| GET | `/api/hero/civilization-seeds` | Semillas de civilización |
| GET | `/api/hero/worlds` | Mundos del jugador |
| POST | `/api/hero/worlds` | Crear mundo |
| DELETE | `/api/hero/worlds/:worldId` | Eliminar mundo |
| POST | `/api/hero/worlds/tick` | Tick de mundo |
| GET | `/api/hero/unified` | Vista unificada |

---

## /api/dobacksoft (dobacksoft.js)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/dobacksoft/trailer` | URL del trailer |
| GET | `/api/dobacksoft/stats` | Estadísticas demo |
| POST | `/api/dobacksoft/coupon/validate` | Validar cupón |
| POST | `/api/dobacksoft/citizens` | Crear ciudadanos |
| POST | `/api/dobacksoft/upload` | Subir archivos |
| GET | `/api/dobacksoft/sessions` | Sesiones |
| GET | `/api/dobacksoft/session-route/:id` | Ruta de sesión |

---

## /api/subscription (subscription.js)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/subscription/tiers` | Tiers disponibles |
| GET | `/api/subscription/me` | Estado del usuario |
| POST | `/api/subscription/coupon/validate` | Validar cupón |
| POST | `/api/subscription/subscribe` | Suscribirse |
| POST | `/api/subscription/cancel` | Cancelar |
| POST | `/api/subscription/checkout` | Checkout Stripe |
| POST | `/api/subscription/portal` | Portal de Stripe |
| POST | `/api/subscription/webhook` | Webhook Stripe |
| GET | `/api/subscription/stripe-status` | Estado Stripe |

---

## /api/chess (chess.js)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/chess/terms/accept` | Registrar aceptación de términos (body: `{ link?, email? }`) |

---

## /api/admin (admin.js)

Requiere header `x-player-id` en `ADMIN_PLAYER_IDS`.

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/admin/overview` | Vista general |
| POST | `/api/admin/simulation/reset` | Reset simulación |
| DELETE | `/api/admin/hero/worlds/:worldId` | Eliminar mundo |
| POST | `/api/admin/hero/worlds/wipe` | Borrar todos los mundos |
| POST | `/api/admin/refuges/remove` | Eliminar refugios |
| POST | `/api/admin/dobacksoft/reset` | Reset DobackSoft |
| GET | `/api/admin/audit/events` | Eventos de auditoría |

---

## Health (raíz)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Health check global |
