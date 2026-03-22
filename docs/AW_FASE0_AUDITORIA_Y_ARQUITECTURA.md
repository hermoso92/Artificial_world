# Artificial World — Fase 0: auditorías y arquitectura objetivo

**Rama de trabajo:** `feature/aw-swift-core-fase-0`  
**Visión de producto:** el **único producto** que se persigue entregable al usuario final es la **app iOS** ([`ArtificialWorld/`](../ArtificialWorld/) + [`SwiftAWCore`](../SwiftAWCore/)). Python, la web fullstack, HTML estáticos y demás carpetas del monorepo son **soporte de ingeniería** (especificación, tests, sync con backend, operador, marketing en repo): **no** son aplicaciones rivales ni “segundos productos” en esa visión.  
**Decisión técnica:** el **motor de simulación del cliente** vive en **Swift (SPM)**. El motor Python es **referencia, tests de conformidad y tooling**, no el runtime de la app en el horizonte medio.  
**Fecha:** 2026-03-22  

---

## 1. Resumen ejecutivo

El repositorio es un **monorepo híbrido**: simulación Python/pygame, demo web Node/React, documentación y material de referencia, y un **cliente nativo** nuevo ([`ArtificialWorld/`](../ArtificialWorld/)) enlazado al paquete local [`SwiftAWCore`](../SwiftAWCore/) (`AWDomain`, `AWAgent`, `AWPersistence`). El proyecto Xcode anterior *Atrapa un cuadrado* fue **eliminado del repo** y **no** es referencia de producto.

**Entregables Fase 0 (este documento):**

- Cuatro auditorías paralelas (cliente nativo histórico / diseño AW / producto / SPM); el cliente actual es greenfield en [`ArtificialWorld/`](../ArtificialWorld/).
- Diagnóstico de conservar / refactorizar / rehacer.
- Arquitectura objetivo en capas y criterios de aceptación para el MVP de Fase 2.
- Estado del **scaffolding SPM** y política anti-duplicación del monorepo dentro del target Xcode.

**Hallazgo histórico (mitigado en repo):** en algunos clones existía una copia anidada del monorepo bajo el cliente iOS (~257MB). [`.gitignore`](../.gitignore) ignora `ArtificialWorld/ArtificialWorld/Artificial_world/` para evitar que vuelva a colarse.

---

## 2. Cliente nativo — Artificial World (SwiftUI, greenfield)

### 2.1 Estado actual

- **Proyecto:** [`ArtificialWorld/ArtificialWorld.xcodeproj`](../ArtificialWorld/ArtificialWorld.xcodeproj) — target `ArtificialWorld` (bundle `com.antoniohermoso.artificialworld`), **iOS 17+**, Swift 6.
- **Proyecto V2 (paralelo):** [`ArtificialWorldV2/ArtificialWorldV2.xcodeproj`](../ArtificialWorldV2/ArtificialWorldV2.xcodeproj) — target `ArtificialWorldV2` (bundle `com.antoniohermoso.artificialworld.v2`), mismo `SwiftAWCore`; grid multi-agente y cambio de control — ver [`ArtificialWorldV2/README.md`](../ArtificialWorldV2/README.md).
- **UI:** SwiftUI (`ContentView`, `WorldSessionModel`); **sin** SpriteKit en el MVP.
- **SPM local:** `../SwiftAWCore` — productos `AWDomain`, `AWAgent`, `AWPersistence`.
- **MVP en pantalla:** vitales (`SurvivalVitals`), presencia (`PresenceState`), modo de control (`PlayerControlMode`), directiva de utilidad (`UtilitySafetyRules`), captura vía `CaptureRules` + `SquareArchetype` (slider de “proximidad” como sustituto de geometría hasta Fase 2).
- **Tests:** `ArtificialWorldTests` (Swift Testing), host en simulador/dispositivo vía esquema compartido `ArtificialWorld.xcscheme`.

### 2.2 Qué **no** hace este documento respecto al proyecto eliminado

El antiguo cliente *Atrapa un cuadrado* **no** se audita aquí ni se usa como referencia de arquitectura. Cualquier idea reutilizable (audio, metajuego, tienda) se reintroducirá **solo** si encaja en el contrato `SwiftAWCore` + flujo refugio/exploración.

---

## 3. Auditoría 2 — Artificial World (diseño de sistema)

### 3.1 Glosario de dominio (objetivo)

| Término | Definición |
|---------|------------|
| **Refugio** | Zona segura: descanso, gestión de inventario/mejoras, persistencia fuerte |
| **Zona / bioma** | Fragmento explorable con reglas de spawn y recursos (`ZoneID`, `PresenceState` en AWDomain) |
| **Captura** | Interacción “atrapar cuadrado” como regla pura: distancia, arquetipo, efecto en vitales (`CaptureRules`) |
| **Vitales** | Energía y hambre normalizados [0,1] (`SurvivalVitals`) |
| **Agente** | Misma entidad que el jugador; la fuente de intención cambia según modo de control |
| **Memoria del agente** | Resumen serializable (`AgentMemorySummary`); en Fase 3+ eventos y embeddings no van aquí |

### 3.2 Modos de control

[`PlayerControlMode`](../SwiftAWCore/Sources/AWAgent/PlayerControlMode.swift): `manual`, `autonomous`, `hybrid`. **Misma simulación**: en manual la intención viene del input; en autónoma de `UtilitySafetyRules` / motor de utilidad; en híbrida se combina (prioridad a definir en Fase 2: p. ej. input override con ventana temporal).

### 3.3 IA (base realista, no cosmética)

- **Fase actual (SPM):** reglas de seguridad (`UtilitySafetyRules`) + directivas de alto nivel (`UtilityDirective`).
- **Fase 3:** scoring fino multi-acción inspirado en [`agentes/motor_decision.py`](../agentes/motor_decision.py) (Python como especificación).
- **Requisitos:** FSM explícita, tests unitarios en `AWAgentTests`, límites de CPU en tick.

### 3.4 Persistencia requerida (roadmap)

| Dato | Dueño sugerido | Fase |
|------|----------------|------|
| Metajuego / progresión | Capa app (UserDefaults o similar) cuando exista | Tras vertical slice |
| Estado mundo + tick | `WorldSnapshotStoring` | 3 |
| Vitales / inventario run | `PlayerProfileStoring` | 3 |
| Memoria agente | `AgentMemoryStoring` | 3 |
| Config remota / sync | Backend + DTOs versionados | 4 |

### 3.5 Dinámicas nuevas vs juego actual

Los arquetipos de dominio (`SquareArchetype`) incluyen `rare`, `nourishing`, `hostile`, etc. **Fase 2:** spawn y geometría real (grid o escena) alineados con tabla de aparición por zona y riesgo/bioma.

---

## 4. Auditoría 3 — Arquitectura de producto (monorepo)

### 4.1 Capas reconocibles en la raíz

| Segmento | Rutas | Papel |
|----------|-------|-------|
| Motor Python | `principal.py`, `nucleo/`, `agentes/`, `mundo/`, `entidades/`, `acciones/`, `sistemas/`, `interfaz/` | Simulación grid, utilidad, SQLite, pygame |
| Demo web | `backend/`, `frontend/` | API (p. ej. `/api/aw`), WS, UI React; motor JS independiente — **soporte y laboratorio**, no el binario que el usuario final instala si la visión es solo iOS |
| Nativo | [`ArtificialWorld/`](../ArtificialWorld/), [`SwiftAWCore/`](../SwiftAWCore/) | **Producto iOS (App Store)** — único entregable de cara al usuario en la visión actual; macOS puede compartir el mismo SPM más adelante, no como “otro producto” desalineado |
| Docs / planes | `docs/`, `AGENTE_ENTRANTE.md`, `PLAN_MUNDO_ARTIFICIAL.md` | Contrato conceptual |
| Referencia / vendor | `Repositorios para auditar/`, `engram-1.7.1/`, `horizons-export-*/`, `IA-Entre-Amigos-main/` | **No** son runtime de la app |

### 4.2 Política de “qué es el producto”

- **Producto:** solo la **app iOS** (`SwiftAWCore` + Xcode). Todo lo demás en el repo existe para **construirla, probarla o operarla** (sync, CI, spec Python), no para competir con ella como “segunda app”.
- **Golden path de implementación:** `SwiftAWCore` + app Xcode.
- **Golden path laboratorio:** Python o web según tarea de ingeniería (no mezclar reglas sin contrato).
- **Prohibido:** volcar el monorepo bajo el directorio sincronizado de la app (`.gitignore` actual).

### 4.3 Conservar / refactorizar / rehacer (tabla consolidada)

| Área | Conservar | Refactorizar | Rehacer / evitar |
|------|-----------|--------------|------------------|
| Swift app | SwiftUI + `SwiftAWCore` ya enlazado | Grid/visual, persistencia run, audio | Duplicar repo dentro de `ArtificialWorld/` |
| SwiftAWCore | Paquetes y tests | Ampliar modelos (grid, inventario) | Lógica UI en SPM |
| Python | Tests + `motor_decision` como spec | Exportar fixtures JSON para CI Swift | Runtime embebido en iOS |
| Web | Patrones API, auth | OpenAPI esquemas sync | Copiar `world.js` a Swift sin dominio compartido |

---

## 5. Auditoría 4 — iOS, macOS y SPM

### 5.1 Estado actual

- **SPM:** [`SwiftAWCore/Package.swift`](../SwiftAWCore/Package.swift) — `swift-tools-version: 6.0`, plataformas **iOS 17+**, **macOS 14+**.
- **Xcode:** referencia local `../SwiftAWCore` ([`ArtificialWorld.xcodeproj/project.pbxproj`](../ArtificialWorld/ArtificialWorld.xcodeproj/project.pbxproj)); el target `ArtificialWorld` declara `AWDomain`, `AWAgent`, `AWPersistence`.
- **App:** configuración de proyecto orientada a **iPhone** (`SDKROOT = iphoneos` en configuraciones compartidas). **No hay target macOS** aún; el núcleo Swift **sí** compila en macOS vía `swift test`.

### 5.2 Estrategia multiplataforma

1. Mantener **toda la lógica** en `SwiftAWCore` sin UIKit/SpriteKit.
2. Añadir target **macOS** o **multiplatform** en Xcode cuando el slice vertical esté estable.
3. Compartir assets y escenas vía carpetas comunes o paquetes de recursos en fases posteriores.

### 5.3 Tests SPM

Ejecutar desde la raíz del paquete:

```bash
cd SwiftAWCore && swift test
```

Los targets de test (`AWDomainTests`, `AWAgentTests`, `AWPersistenceTests`) deben crecer con cada regla nueva de simulación.

---

## 6. Arquitectura objetivo (recordatorio)

```
SwiftAWCore (SPM)
  AWDomain     — modelos, zonas, vitales, captura, memoria, inventario/refugio
  AWAgent      — modos de control, seguridad (`UtilitySafetyRules`) + scoring (`UtilityScoring`)
  AWPersistence— protocolos + `SQLiteArtificialWorldStore` (libsqlite3 + outbox telemetría)

App (iOS / futuro macOS)
  SwiftUI — presentación; UserDefaults (sesión) + SQLite `aw_core.sqlite` (núcleo + cola sync)
  Puentes finos — geometría → `CaptureRules`; inventario → `UtilityContext`; `SyncEnvelopeV1` → cola SQLite + `POST /api/aw/sync/batch` (cliente nativo)
```

**Flujo de datos:** tick de simulación opera sobre structs de dominio → la vista actualiza nodos → eventos (captura, entrada a refugio) vuelven al dominio → persistencia asíncrona según contratos.

---

## 7. Fases 1–4 y criterios de aceptación

### Fase 1 — Estructura y límites

- [x] Proyecto Xcode greenfield [`ArtificialWorld/`](../ArtificialWorld/) con SwiftUI, esquema compartido y tests `ArtificialWorldTests`.
- [x] Pantalla que consume `SurvivalVitals`, `PresenceState`, `PlayerControlMode`, `UtilitySafetyRules` y `CaptureRules` (MVP sin geometría de juego).
- [x] Documentar módulos: README enlaza este doc y la capa nativa.
- [x] CI: en `pipeline.yml` y `ci-completo.yml`, job macOS ejecuta `swift test` en `SwiftAWCore` y `xcodebuild build` de `ArtificialWorld` (simulador genérico, `CODE_SIGNING_ALLOWED=NO`).

### Fase 2 — MVP Artificial World (vertical slice)

- [x] Flujo jugable: salir de refugio → explorar una zona → capturas con efecto en vitales → regreso → guardado mínimo (`UserDefaults` + JSON en [`SessionPersistence.swift`](../ArtificialWorld/ArtificialWorld/SessionPersistence.swift)).
- [x] Un bioma con tabla de spawn: `BiomeCatalog.wildEdge` + `ZoneSpawnProfile` / `WeightedArchetype` en [`ZoneSpawnProfile.swift`](../SwiftAWCore/Sources/AWDomain/ZoneSpawnProfile.swift).
- [x] Modo manual y comportamiento autónomo visible: **autónomo** (ticks cada 2 s con `captureNearest` / `returnToRefuge`); **híbrido** fuerza refugio si `UtilitySafetyRules` lo exige (hostil cerca o vitales críticos).

### Fase 3 — Persistencia seria + IA básica

- [x] SQLite local [`SQLiteArtificialWorldStore.swift`](../SwiftAWCore/Sources/AWPersistence/SQLiteArtificialWorldStore.swift): `WorldSnapshotStoring`, `PlayerProfileStoring`, `AgentMemoryStoring`, `InventoryStoring`, `RefugeImprovementsStoring`.
- [x] Dominio [`InventoryAndRefuge.swift`](../SwiftAWCore/Sources/AWDomain/InventoryAndRefuge.swift); recuperación en refugio con multiplicador; app persiste también en `UserDefaults`.
- [x] Motor de utilidad: `UtilityScoring` + inventario en `UtilityContext`; tests en `AWAgentTests` y `SQLiteStoreTests`.

### Fase 4 — Plataforma

- [x] Contrato DTO en Swift: [`SyncAndTelemetry.swift`](../SwiftAWCore/Sources/AWDomain/SyncAndTelemetry.swift) (`SyncEnvelopeV1`, `TelemetryEventDTO`, `TenantContext`).
- [x] Backend Node: `POST /api/aw/sync/batch` — [`backend/src/routes/awSync.js`](../backend/src/routes/awSync.js), validación [`awSyncIngest.js`](../backend/src/services/awSyncIngest.js), tabla `aw_sync_batches`. Cabeceras: **`x-player-id` obligatoria**; `x-organization-id` opcional (debe coincidir con `organizationId` del cuerpo si ambas existen). URL en frontend: [`api.js`](../frontend/src/config/api.js) → `AW_NATIVE_SYNC_BATCH_URL`.
- [x] Especificación OpenAPI del prefijo nativo: [`docs/openapi-artificial-world-native-sync.yaml`](openapi-artificial-world-native-sync.yaml) — `POST /api/aw/auth/login`, `POST /api/aw/auth/logout`, `POST /api/aw/sync/batch`, `GET /api/aw/sync/batches`, `GET /api/aw/sync/batches/{batchId}`, esquemas y errores. Un OpenAPI único para **toda** la API HTTP del monorepo sigue siendo opcional.
- [x] Cola local SQLite `telemetry_outbox` + protocolo `TelemetryOutboxStoring` en [`SQLiteArtificialWorldStore.swift`](../SwiftAWCore/Sources/AWPersistence/SQLiteArtificialWorldStore.swift); la app puede copiar JSON al portapapeles y marcar lote enviado a mano (depuración / sin red).
- [x] Cliente iOS — subida real al mismo endpoint: [`NativeSyncConfig.swift`](../ArtificialWorld/ArtificialWorld/NativeSyncConfig.swift) (URL batch + `resolvedAuthLoginURL()` + `resolvedAuthLogoutURL()`), [`NativeAwAuth.swift`](../ArtificialWorld/ArtificialWorld/NativeAwAuth.swift) (login + logout), [`NativeSyncBatchUploader.swift`](../ArtificialWorld/ArtificialWorld/NativeSyncBatchUploader.swift), [`WorldSessionModel.swift`](../ArtificialWorld/ArtificialWorld/WorldSessionModel.swift) (`loginForNativeJwt`, `logoutNativeJwtFully`, `uploadPendingSyncBatch`), UI en [`ContentView.swift`](../ArtificialWorld/ArtificialWorld/ContentView.swift). Bearer estático opcional `aw_native_sync_bearer_token` / plist; JWT en `aw_native_jwt_access_token`. ATS: [`Info-ATS.plist`](../ArtificialWorld/Info-ATS.plist). **Dispositivo físico:** IP LAN del Mac en la URL, no `127.0.0.1`.
- [x] Auth y filtrado servidor (sync nativo): `AW_NATIVE_SYNC_BEARER_TOKEN` → `Authorization: Bearer` en POST y `GET /api/aw/sync/batches`; sin token en env, el listado exige admin (`ADMIN_PLAYER_IDS`). `AW_SYNC_REQUIRE_ORGANIZATION_ID` fuerza `organizationId` en el sobre. Listado con query `organizationId`, `playerId`, `limit` — [`listAwSyncBatches`](../backend/src/db/database.js), rutas [`awSync.js`](../backend/src/routes/awSync.js), middleware [`nativeSyncAuth.js`](../backend/src/middleware/nativeSyncAuth.js).
- [x] Detalle operador: `GET /api/aw/sync/batches/:batchId` con eventos parseados; query opcional `organizationId` (404 si no coincide — aislamiento). [`getAwSyncBatchById`](../backend/src/db/database.js). Variables documentadas en [`backend/.env.example`](../backend/.env.example). Frontend: [`awNativeSyncBatchDetailUrl`](../frontend/src/config/api.js).
- [x] JWT HS256 + cookie httpOnly bajo `/api/aw`: [`awAuth.js`](../backend/src/routes/awAuth.js) `POST /api/aw/auth/login` y `POST /api/aw/auth/logout`, [`awJwt.js`](../backend/src/services/awJwt.js), [`cookie-parser`](../backend/src/server.js) + [`nativeSyncAuth.js`](../backend/src/middleware/nativeSyncAuth.js) (Bearer estático **o** JWT). Con JWT: `x-player-id` = `sub`; si el token lleva `org`, el sobre debe traer ese `organizationId`. Variables: `JWT_AUTH_SECRET`, `JWT_EXPIRES_IN`, `JWT_COOKIE_NAME`, `AW_AUTH_BOOTSTRAP_SECRET`. Cliente iOS: guardar `data.token` en `UserDefaults` `aw_native_jwt_access_token` (prioridad sobre Bearer estático en [`NativeSyncConfig`](../ArtificialWorld/ArtificialWorld/NativeSyncConfig.swift)); cierre remoto + borrado local vía `logoutNativeJwtFully`.
- [ ] Cuentas de usuario finales (registro/password/OAuth) y unificación con el resto de rutas `/api/*` fuera del prefijo `/api/aw` (este bloque ya no depende de ello para sync).

---

## 8. Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Divergencia Python vs Swift | Fixtures compartidos; escenarios nombrados en docs; tests Swift que citan IDs de escenario |
| Reintroducción de copia masiva en Xcode | `.gitignore` + [`scripts/check_repo_hygiene.sh`](../scripts/check_repo_hygiene.sh) en CI + revisión en PR del árbol `ArtificialWorld/` |
| Alcance inflado | Una vertical completa antes de más biomas |
| Motores externos tipo MiroFish (LLM + OASIS + Zep, AGPL) | **No** como dependencia del monorepo; servicio/documentación aparte si el negocio lo pide; revisión legal antes de fork |

---

## 9. Referencias cruzadas

- Límites del core Python: [`docs/CORE_BOUNDARIES.md`](CORE_BOUNDARIES.md)
- Visión README monorepo: [`README.md`](../README.md)
- Paquete Swift: [`SwiftAWCore/Package.swift`](../SwiftAWCore/Package.swift)
- App iOS: [`ArtificialWorld/ArtificialWorld.xcodeproj`](../ArtificialWorld/ArtificialWorld.xcodeproj)
- CI nativo (misma secuencia en local): [`.github/workflows/pipeline.yml`](../.github/workflows/pipeline.yml) — job `test-swift-core`.

**Build local alineado con CI** (desde la raíz del monorepo; no depende del nombre del simulador, evita errores tipo «iPhone 16 no encontrado»):

```bash
swift test --package-path SwiftAWCore

set -o pipefail
xcodebuild build \
  -project ArtificialWorld/ArtificialWorld.xcodeproj \
  -scheme ArtificialWorld \
  -destination 'generic/platform=iOS Simulator' \
  -configuration Debug \
  CODE_SIGNING_ALLOWED=NO
```

Para compilar contra un simulador concreto (p. ej. firma local o depuración en Xcode), lista destinos:  
`xcodebuild -project ArtificialWorld/ArtificialWorld.xcodeproj -scheme ArtificialWorld -showdestinations`  
y usa `-destination 'platform=iOS Simulator,name=…,OS=…'` con un nombre que aparezca en la salida.

---

## 10. Integración externa e higiene del repo (decisión ejecutada)

**Objetivo:** el **producto** sigue siendo **solo la app iOS**; mantener un solo golden path de implementación (`SwiftAWCore` + app), con `/api/aw` y Python como **soporte**, sin arrastrar repos de “simulación LLM” dentro del árbol ni del proceso de build.

| Regla | Estado |
|--------|--------|
| No submódulos ni vendor de MiroFish (u otros motores AGPL/cloud) en este monorepo | Activa |
| `SwiftAWCore` sin LLM / Zep / OASIS en el tick | Activa |
| Cualquier laboratorio narrativo-LLM → **servicio o repo aparte**, no mezclar con `backend/src` del demo web salvo contrato HTTP nuevo y revisión de licencia | Activa |
| CI falla si existe contenido bajo `ArtificialWorld/ArtificialWorld/Artificial_world/` | Activa — `bash scripts/check_repo_hygiene.sh` en [`.github/workflows/pipeline.yml`](../.github/workflows/pipeline.yml) y [`ci-completo.yml`](../.github/workflows/ci-completo.yml) |

**Local:** desde la raíz del monorepo, `bash scripts/check_repo_hygiene.sh` antes de un PR si tocaste rutas bajo `ArtificialWorld/`.

**Duplicación Python / JS / HTML:** sigue clasificada en [`CORE_BOUNDARIES.md`](CORE_BOUNDARIES.md); no se eliminó código demo en esta pasada — solo se fija política y guardarraíl mecánico contra la copia anidada (~257MB) que ya documentaste.
