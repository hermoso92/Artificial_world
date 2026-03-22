# RESUMEN EJECUTIVO - Artificial World V2

## Fase 1C (cerrada en repo)

- **Terreno**: `TerrainSquareKind` y `TerrainBiomeCatalog` en `SwiftAWCore/Sources/AWDomain/TerrainCatalog.swift` (terreno por celda; no confundir con `SquareArchetype` de encuentros).
- **Mapa**: `GridMap` + `MapGenerator` en el mismo paquete; sesión con `gridMap` y semilla estable (`V2WorldSession`).
- **Visual**: `GridMapCanvas` pinta celdas según `TerrainSquareKind`.
- **Recolección**: `ResourceGatherRules.tryGatherOnEnter` al mover agentes (`V2WorldSession`).
- **Persistencia app**: `WorldPersistenceEngine` y tipos en `ArtificialWorldV2/WorldPersistence.swift`; `makeSaveData()` y `restored(from:)` en `V2WorldSession+Persistence.swift`; UI en `SaveLoadView` (desde `V2PlayView`); `quickSave` en `RootContentView`.
- **Tests**: `SwiftAWCore/Tests/AWDomainTests/TerrainGridTests.swift`, tests existentes en `AWDomainTests`, `AWAgentTests`, `AWPersistenceTests`, y `ArtificialWorldV2Tests/WorldPersistenceEngineTests.swift` (roundtrip con terreno).

---

## Problemas de dependencias SPM (recordatorio)

Si aparece “SwiftAWCore already opened” o productos de paquete faltantes:

- Cerrar otros workspaces/proyectos que abran el mismo paquete.
- Abrir solo `ArtificialWorldV2.xcodeproj`.
- File → Packages → Reset Package Caches; Clean Build Folder; Build.

(Detalle ampliado en `SOLUCION_SPM.md` si lo necesitás.)

---

## Estado actual del proyecto (orientativo)

| Área | Progreso |
|------|-----------|
| Fundamentos | 100% |
| Fase 1C (terreno, mapa, persistencia UI, tests base) | 100% en repo |
| Motor de utilidad | ~65% |
| Mundo rico (crafting, consumo UI, bioma elegible) | ~60% |
| Persistencia (autosave, migraciones) | ~75% |
| UI/UX pulida | ~55% |
| Testing / calibración | ~40% |
| **Total estimado** | **~55%** |

---

## Próximos pasos recomendados

1. **Inventario jugable** — consumo de `nutrientPackets` y/o botones que afecten vitales.
2. **Crafting y refugio** — reglas en dominio + pantalla de mejoras.
3. **Autosave** — temporizador o cada N ticks; convivencia con `SaveLoadView`.
4. **Migración de `schemaVersion`** — evolución segura del JSON.
5. **Tests de integración** — sesión larga, multi-agente, errores de E/S en guardados.

---

## Cómo encajan los componentes (sin código)

- **Utilidad**: `UtilityScoring` / `UtilitySafetyRules` eligen la directiva explorando según contexto (vitales, inventario, distancias).
- **Encuentros vs terreno**: `BiomeCatalog` y `SquareArchetype` modelan qué puede “aparecer” en una zona; el grid visible usa `TerrainSquareKind`.
- **Guardado**: `makeSaveData()` serializa tick, lado, semilla, celdas de terreno, agentes, control y mejoras; `restored(from:)` reconstruye la sesión; archivos bajo Documents (extensión `.awsave`, JSON).

---

## Estructura relevante

```
ArtificialWorldV2/
├── SwiftAWCore/
│   ├── Package.swift
│   ├── Sources/AWDomain/     # TerrainCatalog, GridMap, MapGenerator, vitals, inventario, encuentros…
│   ├── Sources/AWAgent/
│   ├── Sources/AWPersistence/
│   └── Tests/                  # Incl. TerrainGridTests, AWDomainTests, AWAgentTests, AWPersistenceTests
├── ArtificialWorldV2/          # App
│   ├── V2WorldSession.swift
│   ├── V2WorldSession+Persistence.swift
│   ├── WorldPersistence.swift  # WorldSaveData, WorldPersistenceEngine (target app)
│   ├── SaveLoadView.swift
│   ├── GridMapCanvas.swift
│   ├── V2PlayView.swift
│   └── …
├── ArtificialWorldV2Tests/
│   └── WorldPersistenceEngineTests.swift
├── ROADMAP.md
└── RESUMEN.md
```

---

## Debugging rápido

- **No compila**: Clean, reset de paquetes, cerrar Xcode, limpiar DerivedData si hace falta.
- **Agentes quietos**: revisar auto-tick, modo de control y celdas ocupadas.
- **Refugio**: esquina (0,0); terreno refugio alineado con `TerrainSquareKind.refuge` en generación.

---

## FAQ breve

- **¿Dónde está el terreno?** `TerrainSquareKind` en `TerrainCatalog.swift`; instancia concreta en `GridMap`.
- **¿Dónde se guarda?** Directorio de documentos de la app; listado vía `WorldPersistenceEngine.listSaves()`.
- **¿Hay tests?** Sí en el paquete SPM y un test de persistencia en el target de tests de la app.

---

## Checklist manual de humo

- [ ] La app compila.
- [ ] Se ven agentes y el grid con colores de terreno.
- [ ] Refugio reconocible en (0,0).
- [ ] Tick y vitales / inventario en status.
- [ ] Guardar y cargar desde `SaveLoadView` conserva mapa y agentes.
- [ ] `quickSave` no falla en flujo normal.

---

**Última actualización:** 22 de marzo de 2026
