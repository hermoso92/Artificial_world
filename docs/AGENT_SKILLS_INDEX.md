# Índice: Habilidades de Agentes — Artificial World

Plan incremental para añadir habilidades a los agentes de la simulación. Cada fase tiene su propio documento MD independiente.

## Orden de implementación

| Paso | Documento | Dependencias |
|------|-----------|--------------|
| 0 | [AGENT_SKILLS_INDEX.md](AGENT_SKILLS_INDEX.md) | — |
| 1 | [AGENT_SKILLS_01_MEMORIA_ESPACIAL.md](AGENT_SKILLS_01_MEMORIA_ESPACIAL.md) | Ninguna |
| 2 | [AGENT_SKILLS_02_INVENTARIO.md](AGENT_SKILLS_02_INVENTARIO.md) | Ninguna |
| 3 | [AGENT_SKILLS_03_REFUGIOS.md](AGENT_SKILLS_03_REFUGIOS.md) | 01 (memoria de refugios) |
| 4 | [AGENT_SKILLS_04_RASGOS_PERSONALIDAD.md](AGENT_SKILLS_04_RASGOS_PERSONALIDAD.md) | Ninguna |
| 5 | [AGENT_SKILLS_05_COMPARTIR.md](AGENT_SKILLS_05_COMPARTIR.md) | 02, 04 |

## Diagrama de dependencias

```mermaid
flowchart LR
    A[01 Memoria] --> B[02 Inventario]
    B --> C[03 Refugios]
    C --> D[04 Rasgos]
    D --> E[05 Compartir]
```

## Resumen por fase

- **01 Memoria espacial:** Los agentes recuerdan posiciones de recursos y refugios vistos.
- **02 Inventario:** Los agentes guardan comida y material para consumir después.
- **03 Refugios:** Zonas que recuperan energía más rápido cuando el agente está dentro.
- **04 Rasgos de personalidad:** Modificadores (cooperativo, audaz, curioso) que afectan el comportamiento.
- **05 Compartir:** Un agente puede dar comida a otro con energía muy baja.
