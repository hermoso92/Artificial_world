# ROADMAP COMPLETO - Artificial World V2

## Estado actual: ~60% implementado (estimado)

### FASE 0: FUNDAMENTOS (COMPLETO)

- [x] Arquitectura SPM con módulos AWDomain, AWAgent, AWPersistence (`SwiftAWCore/`)
- [x] Grid discreto con coordenadas
- [x] Sistema de agentes básico (`V2GridAgent`)
- [x] Vitales (energy/hunger) con drain/recovery
- [x] UI básica con TabView (Partida / Acerca)
- [x] Canvas de mapa con agentes visuales
- [x] Control manual con D-pad
- [x] Selección de agente por tap
- [x] Tick automático configurable

---

### FASE 1C: TERRENO, MAPA, PERSISTENCIA APP Y TESTS BASE (COMPLETO)

**Modelo de terreno (por celda)**

- [x] `TerrainSquareKind` — valores de terreno visibles en el grid (vacío, refugio, hierba, bosque, roca); distinto de `SquareArchetype` (encuentros)
- [x] `TerrainBiomeCatalog` / `TerrainBiomeDefinition` — perfiles de bioma para generación (`SwiftAWCore/Sources/AWDomain/TerrainCatalog.swift`)

**Mapa y generación**

- [x] `GridMap` — almacenamiento plano de `TerrainSquareKind`, subscript por `GridCoord`, serialización a lista de raw values (`SwiftAWCore/Sources/AWDomain/GridMap.swift`)
- [x] `MapGenerator.generate(side:seed:profile:)` — mapa procedural determinista por semilla (`SwiftAWCore/Sources/AWDomain/MapGenerator.swift`)
- [x] `V2WorldSession` mantiene `gridMap` y usa `MapGenerator` al iniciar si no hay mapa previo
- [x] `GridMapCanvas` colorea celdas según `TerrainSquareKind`

**Recolección ligada al terreno**

- [x] `ResourceGatherRules.tryGatherOnEnter` al entrar en celda tras movimiento (`V2WorldSession`)

**Persistencia JSON (target app)**

- [x] `WorldSaveData` / `AgentSnapshot` y `WorldPersistenceEngine` (`ArtificialWorldV2/WorldPersistence.swift`)
- [x] `V2WorldSession.makeSaveData()` y `V2WorldSession.restored(from:)` (`ArtificialWorldV2/V2WorldSession+Persistence.swift`)
- [x] `SaveLoadView` — listar, guardar, cargar, borrar partidas; integrada desde `V2PlayView`
- [x] `quickSave` desde `RootContentView` (flujo de guardado rápido)

**Tests (ya no “cero”)**

- [x] SPM `SwiftAWCore/Tests/AWDomainTests/TerrainGridTests.swift` — RNG semillado, flatten de `GridMap`, determinismo de `MapGenerator`, reglas de recolección en terreno estéril
- [x] SPM `AWDomainTests` — vitals, captura, refugio, spawn de encuentros, crafting y consumo (`CraftingAndConsumeTests`)
- [x] SPM `AWAgentTests` — reglas de seguridad, `UtilityScoring`, curvas, memoria y directiva refugio/consumo
- [x] SPM `AWPersistenceTests` — metadatos de snapshot (in-memory)
- [x] Target `ArtificialWorldV2Tests/WorldPersistenceEngineTests.swift` — roundtrip save/load con terreno y agentes

---

## FASE 1: MOTOR DE UTILIDAD COMPLETO (~25% falta)

### Ya implementado

- [x] `UtilityDirective`, `UtilityContext`, `UtilitySafetyRules`
- [x] `UtilityScoring` (scoring por directiva, overload con `ExploringUtilityCurves`)
- [x] Curvas de respuesta — `ResponseCurve`, `ExploringUtilityCurves` (`SwiftAWCore/Sources/AWAgent/ResponseCurves.swift`)
- [x] Memoria operativa en sesión — `AgentMemory` + peso en scoring y umbral de huida (`SwiftAWCore/Sources/AWAgent/AgentMemory.swift`)
- [x] **V2**: `V2GridAgent.memory` pasa a `UtilityContext`; se actualiza en cada tick de IA y al consumir nutriente manual; persiste en `AgentSnapshot.memory` (JSON)
- [x] **V2**: evento `perceived_threat_stress` sincronizado cada tick con distancia Manhattan al otro agente (menor que 12 entra, se limpia al alejarse; sin duplicados en `notableEvents`)
- [x] Directiva `consumeNutrient` y elección en refugio (`UtilitySafetyRules` + tests AWAgent)
- [x] Tests de regresión en directivas (exploración vs captura, curvas, memoria, refugio/consumo)

### Por implementar

- [ ] Consideraciones multi-agente (aglomeraciones)
- [ ] Scoring dinámico por “personalidad”
- [ ] Más casos límite de directivas (regresión continua)

**Archivos SPM (estado)**

- [x] `SwiftAWCore/Sources/AWAgent/ResponseCurves.swift`
- [x] `SwiftAWCore/Sources/AWAgent/AgentMemory.swift`
- [x] Tests bajo `SwiftAWCore/Tests/AWAgentTests/` (ampliados)

---

## FASE 2: MUNDO RICO Y RECURSOS (~20% falta)

### Ya implementado

- [x] `BiomeCatalog` / `SquareArchetype` para encuentros (roll de arquetipo por zona)
- [x] `TerrainSquareKind` + `TerrainBiomeCatalog` para terreno visual y generación
- [x] `GridMap` + `MapGenerator` + integración en sesión y canvas
- [x] `InventoryState`, `RefugeImprovements` y recolección básica al mover (`ResourceGatherRules`)
- [x] **Crafting (reglas puras SPM)** — `CraftingRules` (fibra → `restEfficiencyRank` / `storageRank`, tope 3) + tests `CraftingAndConsumeTests`
- [x] **Consumo de `nutrientPackets` (núcleo)** — `NutrientConsumeRules.consumeNutrient` (hambre + energía) + directiva `consumeNutrient` en refugio; tests dominio y AWAgent
- [x] **`V2WorldSession` + directiva** — en `aiMovementPlan`, si `UtilitySafetyRules` resuelve `.consumeNutrient` y el agente está en refugio, se llama `NutrientConsumeRules.consumeNutrient` vía `tryAIConsumeNutrient`
- [x] **Consumo/craft en app** — `tryConsumeNutrientForControlled()`, `tryCraftRestEfficiencyAtRefugeForControlled()`, `tryCraftStorageAtRefugeForControlled()` y UI `InventoryRefugeSheet` (botones que usan `CraftingRules` / dominio)

### Por implementar

- [ ] **UX refugio / inventario** — leyenda, feedback más rico, accesibilidad y pulido visual (la hoja base ya existe)
- [x] **Selector de bioma de terreno** en nueva partida (`NewGameSheet` + `terrainBiomeZoneID` en guardado v3)
- [ ] **Sistema de recursos** más rico (tipos, caps, eventos de UI)

**Archivos**

- [x] `SwiftAWCore/Sources/AWDomain/CraftingRules.swift`, `NutrientConsumeRules.swift`
- [x] `ArtificialWorldV2/V2WorldSession.swift` — consumo IA + APIs para UI
- [x] `ArtificialWorldV2/InventoryRefugeSheet.swift` — inventario, craft y “Usar 1 nutriente”

---

## FASE 3: PERSISTENCIA (~25% falta)

### Ya implementado

- [x] Codable completo y motor JSON en el target app
- [x] Integración con `V2WorldSession` (`makeSaveData` / `restored(from:)`)
- [x] UI `SaveLoadView` + quick save
- [x] Inclusión de terreno en guardado (`terrainCellRawValues`) con regeneración por semilla si falta

### Por implementar

- [ ] **Autosave periódico** (por tiempo o cada N ticks), configurable
- [ ] **Migración de esquema** (`SaveDataMigration` o equivalente) para versiones futuras de `schemaVersion`
- [ ] (Opcional) alinear documentación de “única fuente” entre SQLite en AWPersistence y JSON en app, si se unifica estrategia

---

## FASE 4: UI/UX PULIDA (~45% falta)

### Ya implementado

- [x] `GridMapCanvas` con tap, D-pad, terreno coloreado por `TerrainSquareKind`
- [x] Lista de agentes con vitales; mensaje de estado con inventario resumido (fibra / nutrientes)
- [x] Toggle de auto-tick y picker de modo de control

### Por implementar

- [ ] Indicadores visuales de hambre/cansancio sobre agentes; barras de progreso
- [ ] Animación de movimiento más suave
- [ ] Refugio: pantalla de mejoras y crafting
- [ ] Minimapa o zoom
- [ ] Log de eventos, tutoriales, ajustes (tick, tamaño grid), estadísticas de partida

---

## FASE 5: TESTING Y CALIBRACIÓN (~55% falta)

### Ya implementado

- [x] Tests de dominio (vitals, captura, spawn, terreno, grid, generador, gather)
- [x] Tests de agente (seguridad + utility scoring)
- [x] Test de metadatos AWPersistence
- [x] Test de app: roundtrip `WorldPersistenceEngine` con mapa y agentes

### Por implementar

- [ ] Más tests de integración de sesión (ticks largos, varios agentes)
- [ ] Calibración documentada (drain, pesos, probabilidades de drop)
- [ ] Pruebas de rendimiento (muchos agentes, grids 128×128)
- [ ] Cobertura sistemática de casos límite en persistencia (borrar, nombres inválidos, corruptos)

---

## FASE 6: FEATURES AVANZADAS (futuro)

- [ ] Combate / captura ampliada entre agentes
- [ ] Clima y eventos aleatorios
- [ ] Control multi-agente
- [ ] iCloud / sync nativa (relacionado con backend del repo monolito)
- [ ] Replay, editor de mapas, modo competitivo

---

## Checklist inmediato (siguiente incremento)

1. Consumo de nutrientes y/o UI de inventario accionable
2. Crafting y mejoras de refugio en UI
3. Autosave periódico + política de nombres/quick slots
4. Versionado y migración de `WorldSaveData`
5. Ampliar tests de sesión e integración

---

## Métricas de progreso (orientativas)

| Fase | Completado | Notas |
|------|------------|--------|
| Fase 0: Fundamentos | 100% | — |
| Fase 1C: Terreno, mapa, persistencia app, tests base | 100% | Hitos de esta entrega |
| Fase 1: Utilidad | ~65% | Falta refinamiento y más tests |
| Fase 2: Mundo rico | ~60% | Falta crafting, consumo UI, elección de bioma |
| Fase 3: Persistencia | ~75% | Falta autosave programado y migraciones |
| Fase 4: UI/UX | ~55% | Falta overlays, refugio detallado, ajustes |
| Fase 5: Testing | ~40% | Base real; falta integración y carga |
| **TOTAL** | **~55%** | — |

---

## Notas de diseño

- Grid **discreto**; simulación **por ticks**; motor por **utilidad**; paquete **SPM** `SwiftAWCore` compartido con la app.
- **Dos vocabularios**: terreno (`TerrainSquareKind` + `GridMap`) vs encuentros (`SquareArchetype` + `BiomeCatalog` / zonas).

## Deuda técnica vigente

- Autosave y migración de guardados aún no cerrados
- Crafting y consumo de inventario desde UI pendientes
- Calibración y tests de carga por documentar y automatizar

---

**Última actualización:** 22 de marzo de 2026  
**Versión del proyecto:** 0.4.5+ (MVP en progreso; Fase 1C cerrada en repo)
