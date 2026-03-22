# Reference: Boundaries

> Real vs demo vs roadmap. From [docs/MODOS_EJECUCION.md](../../../docs/MODOS_EJECUCION.md), [docs/GOLDEN_PATH.md](../../../docs/GOLDEN_PATH.md), [docs/ESTRATEGIA_PRODUCTO.md](../../../docs/ESTRATEGIA_PRODUCTO.md), [docs/REALIDAD_VS_VISION.md](../../../docs/REALIDAD_VS_VISION.md).

## Layer Boundaries

| Layer | What It Is | Evidence |
|-------|------------|----------|
| **Motor Python** | Producto real del repo | `principal.py`, `nucleo/`, `agentes/`, `sistemas/`, persistencia SQLite |
| **Web demo** | Showcase funcional | `backend/src/`, `frontend/src/`, HeroRefuge, mundos ligeros |
| **DobackSoft** | Vertical demo | `DobackSoft.jsx`, `FireSimulator.jsx`, rutas mock |

## Golden Path

**Motor Python** = golden path. Demuestra:

- motor real
- persistencia
- Modo Sombra
- control manual

**No** demuestra: integración web, DobackSoft completo, telemetría real.

## 2D vs 3D

| | 2D | 3D |
|---|------|------|
| **Status** | Verdad sistémica | Encarnación futura |
| **Today** | Map, grid, routes, nodes, resources, refuges | No implementado |
| **Claims** | Permitido | Solo como "futuro" o "roadmap" |

## Python vs Fullstack

| Aspecto | Python | Fullstack |
|---------|--------|-----------|
| Producto real | Sí | No |
| Demo visual | No | Sí |
| Persistencia mundo | Sí | Sí en módulos concretos (HeroRefuge) |
| Modo Sombra | Sí | No |
| Motor | `nucleo.Simulacion` | `backend/src/simulation/` |

## Claims Prohibidos

- "Motor único Python + web"
- "3D real integrado"
- "DobackSoft completo en este repo"
- "Integración total"

## Claims Permitidos

- "Motor Python real con persistencia y Modo Sombra"
- "Demo web con HeroRefuge y flujo fundador"
- "Civilizaciones vivas con refugios, héroes y memoria (2D hoy, 3D futuro)"
