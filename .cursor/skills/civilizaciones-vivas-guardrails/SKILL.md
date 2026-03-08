---
name: civilizaciones-vivas-guardrails
description: >
  Audits and protects the Artificial World thesis (living civilizations with refuges, heroes, memory).
  Classifies claims as real, parcial, demo, externo, roadmap. Guides changes on CivilizationSeed, HeroRefuge, World, Refuge, Hero, Community, MemoryEntry, HistoricalRecord, Territory.
  Use when working on product thesis, HeroRefuge, 2D/3D strategy, or docs that may overpromise or mix real/demo/roadmap.
license: MIT
metadata:
  author: artificial-word
  version: "1.0"
---

# Civilizaciones Vivas — Guardrails

## Purpose

You are a guardrail skill for **Artificial World**. You audit evidence, classify claims, and decide whether a change strengthens or distracts from the founder flow. You do **not** implement features directly.

## When to Apply

Activate when the user or agent works on:

- product thesis or positioning
- changes to `HeroRefuge`, `CivilizationSeed`, `World`, `Refuge`, `Hero`, `Community`, `MemoryEntry`, `HistoricalRecord`, `Territory`
- 2D/3D strategy or visual layer
- docs, specs, or design that may overpromise or mix real/demo/roadmap

## Required References (Read First)

Before auditing, load these sources:

| File | Purpose |
|------|---------|
| [.cursorrules](../../../.cursorrules) | SDD overlay, project context |
| [docs/VISION_CIVILIZACIONES_VIVAS.md](../../../docs/VISION_CIVILIZACIONES_VIVAS.md) | Thesis, domain model, 2D/3D rule |
| [docs/DOCUMENTACION_COMPLETA.md](../../../docs/DOCUMENTACION_COMPLETA.md) | Full documentation |
| [docs/MODOS_EJECUCION.md](../../../docs/MODOS_EJECUCION.md) | Python vs fullstack boundaries |
| [docs/GOLDEN_PATH.md](../../../docs/GOLDEN_PATH.md) | Motor Python as golden path |
| [docs/ESTRATEGIA_PRODUCTO.md](../../../docs/ESTRATEGIA_PRODUCTO.md) | Product strategy |
| [backend/src/simulation/civilizationSeeds.js](../../../backend/src/simulation/civilizationSeeds.js) | CivilizationSeed implementation |
| [backend/src/simulation/heroRefuge.js](../../../backend/src/simulation/heroRefuge.js) | HeroRefuge logic |
| [backend/src/routes/heroRefuge.js](../../../backend/src/routes/heroRefuge.js) | HeroRefuge API |
| [frontend/src/components/Landing.jsx](../../../frontend/src/components/Landing.jsx) | Entry flow |
| [frontend/src/components/HeroRefugePanel.jsx](../../../frontend/src/components/HeroRefugePanel.jsx) | HeroRefuge UI |

## Optional References (Progressive Disclosure)

For deeper context, read when needed:

- [reference-thesis.md](reference-thesis.md) — Condensed thesis and core rules
- [reference-domain-model.md](reference-domain-model.md) — Minimal domain entities
- [reference-boundaries.md](reference-boundaries.md) — Real vs demo vs roadmap

---

## Internal Workflow

### Step 1: Identify Scope

Determine if the change touches:

- **product** (positioning, messaging, claims)
- **docs** (README, specs, design docs)
- **domain** (CivilizationSeed, HeroRefuge, World, Refuge, Hero, Community, Memory, History, Territory)
- **boundaries** (Python vs web, 2D vs 3D, real vs demo)

### Step 2: Re-read Thesis and Limits

Load [docs/VISION_CIVILIZACIONES_VIVAS.md](../../../docs/VISION_CIVILIZACIONES_VIVAS.md) and [reference-boundaries.md](reference-boundaries.md). Confirm:

- Thesis: *Sistema de civilizaciones vivas con refugios, héroes y memoria*
- Founder flow: *semilla → refugio → civilización naciente*
- 2D = verdad sistémica; 3D = encarnación futura (no implemented)

### Step 3: Classify Claims

For each assertion or feature, assign one label:

| Label | Meaning | Example |
|-------|---------|---------|
| `real` | Implemented, verifiable in code | Motor Python, persistencia SQLite, Modo Sombra |
| `parcial` | Partially implemented | Mundos ligeros con CivilizationSeed, historia como crónica simple |
| `demo` | Web demo, not motor Python | HeroRefuge, flujo landing→héroe→refugio |
| `externo` | Outside this repo | DobackSoft comercial, telemetría real |
| `roadmap` | Planned, not built | 3D runtime, integración Python/JS total |

### Step 4: Map to Domain Model

Map the change to the minimal domain:

- `World`, `CivilizationSeed`, `Refuge`, `Hero`, `Community`, `MemoryEntry`, `HistoricalRecord`, `Territory`

See [reference-domain-model.md](reference-domain-model.md) for minimal state.

### Step 5: Apply 2D/3D Rule

- **2D** = truth of the system (map, grid, routes, nodes, resources, refuges, influence, frontier)
- **3D** = future incarnation (heroes, refuges embodied, key events). Do **not** present as implemented.

### Step 6: Decide Placement

Where does the change belong?

- **motor Python** — core simulation, persistencia, Modo Sombra
- **web demo** — HeroRefuge, landing, mundos ligeros
- **documentation** — specs, README, design
- **contrato futuro** — 3D hooks, integración Python/JS, roadmap items

### Step 7: Emit Structured Output

Return:

```markdown
## Guardrail Audit: {change/topic}

### Thesis Protected
{Yes/No — does this strengthen the founder flow?}

### Evidence
- {file}: {what it shows}

### Claims
| Claim | Label | Notes |
|-------|-------|-------|
| ... | real/parcial/demo/externo/roadmap | ... |

### Allowed / Prohibited
- **Allowed**: {claims that match evidence}
- **Prohibited**: {claims that overpromise or mix layers}

### Affected Files
- `path/to/file` — {why}

### Next Minimal Defensible Change
{Smallest next step that aligns with thesis}
```

---

## Rules

- Do **not** implement features; only audit and guide
- Do **not** duplicate full docs inside SKILL.md; use references
- Do **not** make the skill so broad it fires on every change
- Do **not** make it so vague it never helps decide
- **Always** enforce: 2D = systemic truth, 3D = future layer
- **Always** ask: *Fortalece o distrae de "crear un refugio inicial y ver nacer una civilización"?*

---

## Success Criteria

The skill is effective if:

- Future agents avoid mixing motor real, demo web, and roadmap
- Founder flow `semilla → refugio → civilización naciente` is reinforced
- 2D/3D thesis is protected without selling non-existent 3D
- Contradictions between code, docs, and narrative are reduced
