# ROADMAP V2 — Constructor de Mundos

> "No persigas la IA. Construye un mundo que la necesite."

Estado: **En producción** en `http://187.77.94.167:3001`  
Rama: `feature/roadmap-v2`  
Última actualización: 2026-03-08

---

## Estado actual del proyecto

### Arquitectura

| Capa | Tecnología | Estado |
|------|-----------|--------|
| Frontend | React 18 + Vite 5 | ✅ Funcionando |
| Backend | Node.js + Express | ✅ Funcionando |
| Base de datos | SQLite (better-sqlite3) | ✅ Heroes, mundos y suscripciones |
| WebSocket | ws | ✅ Funcionando |
| Deploy | Docker + Nginx en Hostinger VPS | ✅ Puerto 3001 |
| SSL/Dominio | Certbot + Nginx | ❌ Pendiente (firewall Hostinger) |

### Funcionalidades implementadas

- [x] Onboarding (Landing: elegir mundo → nombre → refugio)
- [x] Hub con 4 pilares (Tu Mundo, Arena, Emergencias, Observatorio)
- [x] Simulación con canvas 2D, agentes autónomos, refugios
- [x] WebSocket en tiempo real (tick loop, broadcast de estado)
- [x] Suscripciones (3 tiers, cupones, SQLite)
- [x] HeroRefuge (héroe, compañero IA, modos, mundos artificiales)
- [x] MissionControl / Observatorio (5 tabs: overview, agentes, actividad, sistema, auditoría)
- [x] Minijuegos (TicTacToe funciona)
- [x] DobackSoft (cupón, vídeo, registro)
- [x] FireSimulator (código de acceso)
- [x] Deploy Docker en VPS con persistencia de volumen

### Funcionalidades con limitaciones

- ~~⚠️ Hero y mundos se pierden al reiniciar~~ → ✅ Persistencia SQLite
- ~~⚠️ Damas marcado como "Próximamente"~~ → ✅ Funcional
- ~~⚠️ Límites de suscripción no se aplican~~ → ✅ Enforcement completo
- ~~⚠️ Hero y simulación desconectados~~ → ✅ Flujo unificado
- ~~⚠️ Un solo usuario~~ → ✅ Scoping por playerId en todos los endpoints
- ⚠️ "Unirme con código" deshabilitado
- ⚠️ Sin pagos reales (Stripe no integrado)

---

## Roadmap — Ordenado por prioridad

### Fase 1: Estabilidad y Persistencia (CRÍTICA)

Todo lo que se pierde al reiniciar el servidor debe persistir.

#### 1.1 Persistencia de Hero y Refugio ✅
- [x] Migrar `heroRefuge.js` de memoria a SQLite
- [x] Tabla `heroes`: id, player_id, name, active_mode, companion_name, companion_traits, created_at
- [x] Tabla `hero_worlds`: id, hero_id, name, type, biomes, scale, entities, state, created_at
- [x] Al crear hero → INSERT en SQLite
- [x] Al cargar hero → SELECT por player_id
- [x] Al modificar hero (modo, companion) → UPDATE
- [ ] Tests: reiniciar servidor y verificar que hero persiste

#### 1.2 Persistencia del Mundo y Agentes
- [ ] Tabla `worlds`: id, player_id, name, config, state_json, created_at, updated_at
- [ ] Tabla `agents`: id, world_id, name, type, state_json, memory_json, position, energy, alive
- [ ] Tabla `refuges`: id, world_id, player_id, name, position, furniture_json, pets_json
- [ ] Serializar/deserializar estado del mundo cada N ticks
- [ ] Al arrancar → restaurar último estado guardado
- [ ] Tests: crear agentes, reiniciar, verificar que siguen

#### 1.3 Unificar base de datos
- [ ] Un solo archivo `data/constructor.db` para todo
- [ ] Módulo `backend/src/db/database.js` centralizado
- [ ] Migrar suscripciones de `subscription/store.js` al módulo central
- [ ] Migrar audit events de `audit/eventStore.js` al módulo central

### Fase 2: Multi-usuario (ALTA)

Sin esto, solo puede haber un jugador.

#### 2.1 Identidad de jugador ✅
- [x] Tabla `players`: id, display_name, created_at, last_seen
- [x] El `playerId` de localStorage se registra en la DB al primer uso (middleware `playerContext`)
- [x] Todos los endpoints reciben `playerId` (header `x-player-id` automático)

#### 2.2 Scoping por jugador ✅
- [x] Middleware global `playerContext` extrae `playerId` de header y lo adjunta a `req`
- [x] Hero pertenece a un player_id (routes usan `req.playerId`)
- [x] Refugios validan propiedad via `req.playerId` (no body.ownerId)
- [x] Mundos artificiales scoped por playerId
- [x] Subscriptions scoped por playerId (header, no body)
- [x] Frontend: `fetchApi` envía `x-player-id` automáticamente en todas las requests
- [x] Frontend: eliminado `playerId`/`ownerId` redundante de todos los body requests
- [x] Admin middleware usa `req.playerId` como fallback

#### 2.3 Simulación multi-mundo
- [ ] El engine puede correr múltiples mundos en paralelo
- [ ] Cada mundo tiene su propio tick loop
- [ ] WebSocket scoped por mundo (el cliente indica qué mundo observa)

### Fase 3: Experiencia de usuario (ALTA)

#### 3.1 Logs en tiempo real desde la app ✅
- [x] Nuevo endpoint WebSocket: `type: 'log'` con level, message, timestamp, source
- [x] Backend: interceptar logger y emitir por WS
- [x] Frontend: panel de logs en MissionControl/Observatorio
- [x] Filtros por nivel (info, warn, error) y por fuente (engine, api, ws)
- [x] Auto-scroll con pause al hacer scroll manual

#### 3.2 Pulir onboarding ✅
- [x] Unificar Landing.jsx y OnboardingTutorial.jsx en un solo flujo
- [x] Eliminar duplicación de pasos
- [x] "Unirme con código": quitada opción deshabilitada (se añadirá cuando esté lista)
- [ ] Animaciones de transición entre pasos

#### 3.3 Unificar HeroRefuge con simulación principal ✅
- [x] Header de simulación muestra nombre del hero y compañero IA
- [x] Hero data compartida entre SimulationView y HeroRefugePanel (single source of truth)
- [x] Crear mundo artificial → crea refugio en la simulación real
- [x] Compañero IA recibe contexto de la simulación (tick, agentes, refugios)
- [x] HeroRefugePanel muestra estado en vivo de la simulación (habitantes, refugios, tick)
- [x] WorldCard muestra link al refugio en la simulación cuando existe
- [x] Endpoint `/api/hero/unified` para snapshot combinado hero + simulación
- [x] toJSON() del hero incluye snapshot de la simulación

### Fase 4: Contenido y Juego (MEDIA)

#### 4.1 Minijuego Damas ✅
- [x] Implementar lógica de damas completa (ya existía Checkers + checkersAI)
- [x] IA opponent (minimax con alpha-beta)
- [x] Quitar badge "Próximamente" (solo Ajedrez lo tiene)

#### 4.2 Enforcement de suscripciones ✅
- [x] Verificar límites en TODOS los endpoints de creación (createWorld, releaseAgents)
- [x] Mensajes claros cuando se alcanza un límite
- [x] Upsell natural (PricingModal) al alcanzar límites
- [ ] Rate limiting por tier

#### 4.3 Mejoras de simulación
- [ ] Más tipos de agentes
- [ ] Eventos emergentes (tormentas, migraciones, descubrimientos)
- [ ] Sistema de logros/achievements
- [ ] Estadísticas históricas del mundo

### Fase 5: Monetización y Escala (BAJA — cuando haya usuarios)

#### 5.1 Integración Stripe
- [ ] Cuenta Stripe configurada
- [ ] Checkout session para tier Constructor (9.99€/mes)
- [ ] Checkout session para tier Fundador (29.99€/mes + cupón)
- [ ] Webhook para confirmar pagos
- [ ] Portal de gestión de suscripción

#### 5.2 Dominio y SSL
- [ ] Configurar DNS (registro A → IP del VPS)
- [ ] Abrir puertos 80/443 en firewall Hostinger
- [ ] Certbot automático para SSL
- [ ] Redirect HTTP → HTTPS

#### 5.3 Infraestructura
- [ ] CI/CD con GitHub Actions (build + deploy automático al push)
- [ ] Monitoring (uptime, errores, métricas)
- [ ] Backups automáticos de SQLite
- [ ] CDN para assets estáticos

---

## Convenciones de desarrollo

### Commits
Cada tarea completada = 1 commit con prefijo:
- `feat:` nueva funcionalidad
- `fix:` corrección de bug
- `refactor:` reestructuración sin cambio funcional
- `docs:` documentación
- `chore:` mantenimiento, dependencias

### Deploy al VPS
Después de cada commit significativo:
```bash
# En el VPS
cd /opt/constructor-de-mundos && git pull && docker compose -f docker-compose.prod.yml up -d --build
```

### Testing
```bash
# Backend health
curl http://187.77.94.167:3001/health

# Frontend loads
curl -s http://187.77.94.167:3001 | head -5
```

---

## Decisiones de arquitectura

| Decisión | Elección | Razón |
|----------|---------|-------|
| Base de datos | SQLite | Simplicidad, sin servidor externo, suficiente para MVP |
| Auth | playerId en localStorage | Sin fricción de registro, suficiente para MVP |
| Pagos | Stripe (futuro) | Estándar de la industria, fácil integración |
| Deploy | Docker single-container | Simple, un solo comando para actualizar |
| Frontend routing | Hash-based (#) | Sin necesidad de configurar servidor para SPA |
| WebSocket | ws nativo | Ligero, sin dependencias extra |

---

## Cómo contribuir a este PR

1. Cada fase tiene issues/tareas claras
2. Se trabaja de arriba a abajo (Fase 1 antes que Fase 2)
3. Cada tarea se marca con [x] al completarse
4. Cada implementación va con su commit descriptivo
5. Se despliega al VPS tras cada fase completada

---

*Constructor de Mundos — Cosigein SL*
