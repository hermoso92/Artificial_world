# Reference: Domain Model

> Minimal entities from [docs/VISION_CIVILIZACIONES_VIVAS.md](../../../docs/VISION_CIVILIZACIONES_VIVAS.md)

## Entities

### World
- identity, resources, tick, crónica
- civilizationSeed, foundingRefuge, community
- heroes, memory, history

### CivilizationSeed
- id, label, archetype
- values, tensions, conflictStyle
- visualTone2d, visualTone3d
- heroArchetype, defaultRefugeName, defaultCommunityName

### Refuge
- name, resources, security, morale
- threats, memoryCount, stage

### Hero
- name, role, archetype
- loyalties, presence2d, presence3d (future hook)

### Community
- name, culture, tensions, norms
- cohesion, leadership

### MemoryEntry
- id, type, scope, summary, createdAt

### HistoricalRecord
- eventType, title, summary, significance, createdAt

### Territory
- coreRefugeName, influenceRadius, frontierStatus, routes

## Relations

- `CivilizationSeed` conditions `World` tone
- `World` is born around a `Refuge`
- `Community` organizes around `Refuge`(s)
- `Hero` can found, lead, abandon, or fracture `Community`
- `Event` → `MemoryEntry` → `HistoricalRecord`
- `Territory` and `Route` explain 2D power reading

## Implementation Locations

| Entity | Python | Web (JS) |
|--------|--------|----------|
| CivilizationSeed | — | `backend/src/simulation/civilizationSeeds.js` |
| HeroRefuge | — | `backend/src/simulation/heroRefuge.js` |
| World (ligero) | — | `backend/src/simulation/civilizationSeeds.js` |
| Refuge | `mundo/refugio.py` | Via HeroRefuge |
| Agent/Memory | `agentes/`, `systems/memory/` | — |
