# Backend — Artificial World

API REST + WebSocket para la demo web de Artificial World.

## Estructura

```
backend/src/
├── server.js           ← entrada, monta rutas y WebSocket
├── routes/
│   ├── api.js          ← /api (mundo, refugios, simulación, audit)
│   ├── ai.js           ← /api/ai (chat, summarize, analyze)
│   ├── heroRefuge.js   ← /api/hero (mundos, semillas, tick)
│   ├── dobacksoft.js   ← /api/dobacksoft (trailer, stats, upload)
│   ├── subscription.js ← /api/subscription (Stripe, cupones)
│   └── admin.js       ← /api/admin (reset, overview)
├── simulation/        ← motor JS (engine, world, refuge, agent)
├── services/          ← aiCore, llmService, stripeService
├── middleware/        ← playerContext, errorHandler, validate
├── audit/             ← eventStore
├── realtime/          ← websocket.js
└── utils/             ← logger
```

## Rutas montadas

| Prefijo | Archivo | Descripción |
|---------|---------|-------------|
| `/api` | api.js | Mundo, refugios, blueprints, simulación, audit |
| `/api/ai` | ai.js | IA local: health, chat, summarize, analyze |
| `/api/hero` | heroRefuge.js | HeroRefuge: mundos, semillas, tick |
| `/api/dobacksoft` | dobacksoft.js | DobackSoft demo: trailer, stats, upload |
| `/api/subscription` | subscription.js | Suscripciones, Stripe, cupones |
| `/api/admin` | admin.js | Admin: reset, overview (requiere admin) |

Índice completo: [docs/API_INDEX.md](../API_INDEX.md)

## Scripts

| Comando | Uso |
|---------|-----|
| `npm start` | Inicia servidor (puerto 3001) |
| `npm run dev` | Desarrollo con watch |
| `npm run prod` | Producción (NODE_ENV=production) |
| `npm test` | Tests Vitest |
| `npm run test:coverage` | Tests con cobertura |

## Variables de entorno

| Variable | Uso |
|---------|-----|
| `PORT` | Puerto (default 3001) |
| `NODE_ENV` | development | production |
| `OLLAMA_HOST` | URL de Ollama para IA local |
| `STRIPE_SECRET_KEY` | Stripe (suscripciones) |
| `ADMIN_PLAYER_IDS` | IDs de jugadores admin (comma-separated) |

## WebSocket

`ws://localhost:3001/ws` — tiempo real (logs, simulación).

## Base de datos

- `audit_simulacion.db` — event store SQLite
- `subscriptions.db` — suscripciones (si Stripe)

## Reglas (AGENTS.md)

- Usar `logger` en lugar de `console.log`
- URLs en config, no hardcodeadas
- Filtro `organizationId` en datos multi-tenant
