# Changelog — Artificial World

> Historial de cambios significativos, ordenado del más reciente al más antiguo.  
> Formato: [Keep a Changelog](https://keepachangelog.com/es/1.0.0/)

---

## [Sin versión] — 2026-03-08

### Añadido
- Sistema Chess completo: 6 agentes Docker de auditoría independiente (`agent-docs`, `agent-backend`, `agent-frontend`, `agent-bd`, `agent-tests`, `agent-marketing`) + coordinator
- `docker/docker-compose.full.yml` — 3 entornos en paralelo: tests, prod, auditores con redes aisladas
- `scripts/populate-docs.js` — script de población y análisis de documentación multi-módulo
- `docs/SISTEMA_CHESS.md` — mapa completo del sistema de auditoría
- `docs/ACCESO_TESTERS.md` — guía de acceso para grupo reducido de evaluadores
- `docs/DOC_DOBACKSOFT_COMPLETA.md` — documentación maestro para todos los públicos
- `docs/DOC_DOBACKSOFT_API.md` — referencia completa de la API (ambos repos)
- `docs/DOC_DOBACKSOFT_ONBOARDING.md` — guía de inicio desde 0 para nuevos devs
- `docs/DOC_DOBACKSOFT_PARA_TESTERS.md` — 18 casos de prueba numerados
- `docs/ROADMAP.md` — roadmap único maestro (unifica `ROADMAP_BASE`, `ROADMAP_TECNICO`, `ROADMAP_V2`)
- `docs/CHANGELOG.md` — este documento
- `docs/GUIA_CONTRIBUCION.md` — flujo de trabajo para contribuidores
- Agentes Chess mejorados: `agent-bd` detecta SQL injection, `agent-tests` mide cobertura, `agent-marketing` audita claims de overselling

### Corregido
- Regla del agente `agent-backend`: deja de marcar como HIGH los fallbacks de Ollama y logs de arranque (falsos positivos)

---

## [Fase 5.1] — 2026-02-xx — Stripe + Crónica fundacional

### Añadido
- Integración Stripe: checkout session, webhook, portal de cliente, productos auto-creados
- `PricingModal`: upsell natural al alcanzar límites de suscripción
- Crónica fundacional: flujo headless reproducible con semilla fija, PDF generado automáticamente
- Deploy VPS con docker-compose.prod + secrets SSH en GitHub Actions

### Corregido
- `playerContext` logging excesivo
- Pipeline: deploys independientes de tests, Pages sin `PAGES_TOKEN`
- Mount `.env` en contenedor Docker
- `better-sqlite3` build tools para bindings nativos en Docker

---

## [Fase 4] — 2026-01-xx — Contenido y enforcement

### Añadido
- Minijuego Damas funcional (minimax con alpha-beta, sin badge "Próximamente")
- Enforcement completo de límites de suscripción en todos los endpoints de creación
- Logs en tiempo real desde el Observatorio vía WebSocket (filtros por nivel y fuente)

---

## [Fase 3] — 2025-12-xx — Multi-usuario y unificación

### Añadido
- Scoping por `playerId` en todos los endpoints (header `x-player-id`)
- Middleware global `playerContext`
- Unificación HeroRefuge con simulación principal (flujo único)
- Endpoint `/api/hero/unified` para snapshot combinado
- Onboarding unificado en un solo flujo `Landing.jsx`

---

## [Fase 2] — 2025-11-xx — Backend y Hub

### Añadido
- Hub fullstack con 4 pilares: Tu Mundo, Arena, Emergencias, Observatorio
- MissionControl / Observatorio (5 tabs)
- WebSocket en tiempo real (tick loop, broadcast de estado)
- HeroRefuge: héroe, compañero IA, modos, mundos artificiales
- DobackSoft: cupón, código de acceso, Fire Simulator
- Persistencia SQLite: héroes, mundos, suscripciones

---

## [Fase 1] — 2025-10-xx — Motor Python + Demo web

### Añadido
- Motor Python 2D: 13 acciones, IA por utilidad, relaciones sociales
- Modo Sombra: control manual de entidad
- Persistencia SQLite (`mundo_artificial.db`)
- Demo HTML (`artificial-world.html`)
- App ejecutable Windows (`.exe`)
- 11 suites de tests Python
- CI GitHub Actions: tests + deploy Pages

---

## Convención de versiones

Este proyecto usa versiones narrativas por fase hasta alcanzar v1.0. A partir de entonces:

```
MAJOR.MINOR.PATCH
  │     │     └── fix: bug sin cambio de API
  │     └── feat: nueva funcionalidad compatible
  └── breaking: cambio que rompe compatibilidad
```
