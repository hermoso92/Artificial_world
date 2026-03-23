# RESUMEN EJECUTIVO - Artificial World V2

## Fase 1C (cerrada en repo)

- **Terreno**: `TerrainSquareKind` y `TerrainBiomeCatalog` en `SwiftAWCore/Sources/AWDomain/TerrainCatalog.swift` (terreno por celda; no confundir con `SquareArchetype` de encuentros).
- **Mapa**: `GridMap` + `MapGenerator` en el mismo paquete; sesión con `gridMap` y semilla estable (`V2WorldSession`); generación usa semilla efectiva si `worldSeed == 0`.
- **Visual**: `GridMapCanvas` pinta celdas según `TerrainSquareKind`; leyenda y hints de accesibilidad en `V2PlayView`.
- **Recolección**: `ResourceGatherRules.tryGatherOnEnter` al mover agentes (`V2WorldSession`).
- **Memoria por agente (V2)**: `V2GridAgent.memory` (`AgentMemory`) alimenta `UtilityContext`; se actualiza cada tick de IA y al consumir nutriente manual; persiste en `AgentSnapshot.memory` (JSON).
- **Persistencia app**: `WorldPersistenceEngine` y tipos en `ArtificialWorldV2/WorldPersistence.swift` (`schemaVersion` 3 incluye `terrainBiomeZoneID`, terreno, `rngState`); `makeSaveData()` / `restored(from:)`; `SaveLoadView`; `quickSave` + `autosaveWarning` en `RootContentView`.
- **Nueva partida / bioma**: toolbar «Nueva partida» → si `worldTick > 0`, diálogo de confirmación; luego `NewGameSheet` elige `TerrainBiomeCatalog`; `V2WorldSession.terrainProfile` alimenta `MapGenerator` y la zona en `UtilityContext`; guardados sin clave siguen usando `wildEdge` al regenerar.
- **Craft / consumo**: `CraftingRules`, `NutrientConsumeRules` en AWDomain; UI `InventoryRefugeSheet`; directiva `.consumeNutrient` en refugio (IA y manual).
- **Tests**: paquete `SwiftAWCore` (`swift test`) y `ArtificialWorldV2Tests/WorldPersistenceEngineTests.swift` (roundtrip con terreno, RNG y memoria de agente).

---

## Problemas de dependencias SPM (recordatorio)

Si aparece “SwiftAWCore already opened” o productos de paquete faltantes:

- Cerrar otros workspaces/proyectos que abran el mismo paquete.
- Abrir solo `ArtificialWorldV2.xcodeproj`.
- File → Packages → Reset Package Caches; Clean Build Folder; Build.

(Detalle ampliado en `SOLUCION_SPM.md`.)

---

## Estado actual del proyecto (orientativo)

| Área | Progreso |
|------|-----------|
| Fundamentos | 100% |
| Fase 1C (terreno, mapa, persistencia UI, tests base) | 100% |
| Motor de utilidad (SPM + memoria en partida V2) | ~80% |
| Mundo rico (crafting, consumo, UI refugio) | ~75% |
| Persistencia (autosave, RNG, memoria en save) | ~85% |
| UI/UX pulida | ~60% |
| Testing / calibración | ~55% |
| **Total estimado** | **~70%** |

---

## Próximos pasos recomendados

1. **Multi-agente / personalidad** — pesos distintos por agente y anti-aglomeración (ver `ROADMAP.md` Fase 1).
2. **Migraciones JSON explícitas** — tabla por `schemaVersion` si el formato crece.
3. **CI** — `swift test` + `xcodebuild test` en simulador documentado o automatizado.

---

## Cómo encajan los componentes (sin código)

- **Utilidad**: `UtilityScoring` / `UtilitySafetyRules` eligen la directiva según contexto; en V2 el contexto incluye `agent.memory` (rachas, eventos, umbral de huida ampliado bajo estrés). Cada tick, `syncHostileThreatMemoryForAllAgents` mantiene `perceived_threat_stress` si el otro agente está a distancia Manhattan menor que 12 (una sola entrada en `notableEvents`; se quita al alejarse).
- **Encuentros vs terreno**: `BiomeCatalog` y `SquareArchetype` modelan encuentros por zona; el grid visible usa `TerrainSquareKind`.
- **Guardado**: `makeSaveData()` serializa tick, lado, semilla, terreno, agentes (incl. `memory`), control, mejoras y `rngState`; `restored(from:)` reconstruye la sesión; `.awsave` en Documents.

---

## Estructura relevante

```
Artificial_world/
├── SwiftAWCore/                 # Paquete SPM (hermano del .xcodeproj)
│   ├── Package.swift
│   ├── Sources/AWDomain/
│   ├── Sources/AWAgent/
│   ├── Sources/AWPersistence/
│   └── Tests/
├── ArtificialWorldV2/
│   ├── ArtificialWorldV2.xcodeproj
│   ├── ArtificialWorldV2/       # App SwiftUI
│   ├── WorldPersistence.swift   # WorldSaveData, AgentSnapshot, motor JSON
│   ├── ArtificialWorldV2Tests/
│   ├── ROADMAP.md
│   └── RESUMEN.md
```

---

## Debugging rápido

- **No compila**: Clean, reset de paquetes, cerrar Xcode, limpiar DerivedData si hace falta.
- **Agentes quietos**: revisar auto-tick, modo de control y celdas ocupadas.
- **Refugio**: esquina (0,0); craft solo ahí según reglas de dominio.

---

## FAQ breve

- **¿Dónde está el terreno?** `TerrainSquareKind` en `TerrainCatalog.swift`; instancia en `GridMap`.
- **¿Dónde se guarda?** Documents de la app; `WorldPersistenceEngine.listSaves()`.
- **¿Hay tests?** Sí: `swift test` en `SwiftAWCore` y tests de app en `ArtificialWorldV2Tests`.

---

## Checklist manual de humo

- [ ] La app compila.
- [ ] Grid con colores de terreno y leyenda.
- [ ] Inventario / craft / consumo desde la hoja y refugio (0,0).
- [ ] Guardar y cargar conserva mapa, agentes, memoria y RNG (partidas nuevas).
- [ ] Autosave sin error o aviso visible si falla.

---

**Última actualización:** 22 de marzo de 2026
