# Artificial World — Un mundo dentro de un mundo

**Ecosistema de experiencias conectadas.**  
**Minijuegos, simuladores y vida artificial en un solo universo.**

---

## Introducción: Un mundo dentro de un mundo

Artificial World evoluciona más allá de la simulación de agentes. La visión es un **ecosistema integrado** donde los usuarios pueden:

- **Jugar minijuegos** contra otros jugadores o contra IAs que piensan
- **Conducir un camión de bomberos** por paisajes 2D realistas hasta la emergencia
- **Observar y controlar** la simulación base de agentes autónomos

Todo conectado. Un mundo contenedor con submundos que se alimentan del mismo núcleo: el motor de decisión, la memoria y las relaciones.

---

## Pilar 1 — Minijuegos sociales

### Concepto

Juegos clásicos de mesa — **3 en raya, damas, ajedrez** — jugables de dos formas:

| Modo | Descripción |
|------|-------------|
| **PvP** | Jugador vs Jugador — partidas contra otros usuarios en tiempo real |
| **PvAI** | Jugador vs IA — partidas contra agentes que usan el motor de decisión de Artificial World |

### Por qué tiene sentido

- Las IAs de los minijuegos **no son bots tontos**: usan el mismo motor utility-based que los agentes de la simulación
- Los jugadores **entrenan contra IAs** que "piensan" con memoria y prioridades
- El **engagement social** (PvP) atrae a jugadores que quieren competir con amigos
- **Onboarding suave**: minijuegos simples para entrar al ecosistema antes de la simulación completa

### Roadmap minijuegos

1. **3 en raya** — MVP; lógica simple; PvP y PvAI
2. **Damas** — Reglas claras; IA con evaluación de tablero
3. **Ajedrez** — Complejidad máxima; IA con motor de decisión adaptado

---

## Pilar 2 — DobackSoft: Simulador de bomberos

### Concepto

Un **simulador 2D** donde el jugador conduce un camión de bomberos por un paisaje realista. El objetivo: **llegar a la emergencia**.

### Características

| Elemento | Descripción |
|----------|-------------|
| **Camión** | Vehículo controlable (acelerar, frenar, girar) |
| **Paisaje** | Mapa 2D con carreteras, edificios, obstáculos |
| **Objetivo** | Punto de emergencia al que hay que llegar |
| **Niveles** | Progresión de dificultad; nuevos escenarios |
| **Objetos** | Semáforos, peatones, otros vehículos, condiciones climáticas |

### Integración

DobackSoft es un **submundo** dentro de Artificial World. Puede existir como experiencia independiente o como "minijuego" accesible desde el hub principal. Comparte el estilo visual y la filosofía: simulación, decisión, objetivo claro.

### Roadmap DobackSoft

1. **MVP** — Camión, mapa básico, punto de llegada
2. **Niveles** — Varios escenarios con distintas rutas
3. **Objetos y obstáculos** — Tráfico, semáforos, peatones
4. **Paisaje realista** — Gráficos mejorados, iluminación, efectos

---

## Pilar 3 — Artificial World (núcleo)

La **simulación base** de agentes autónomos sigue siendo el corazón del ecosistema:

- Motor de decisión utility-based
- Memoria y percepción
- Relaciones sociales (confianza, miedo, hostilidad)
- Modo Sombra — control humano por turnos
- 12 acciones, persistencia SQLite, watchdog

Este núcleo **alimenta** las IAs de los minijuegos y establece la identidad del producto.

---

## Arquitectura: Mundo contenedor

```
┌─────────────────────────────────────────────────────────────┐
│                    ARTIFICIAL WORLD                         │
│                   (Mundo contenedor)                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │
│  │ Minijuegos  │  │ DobackSoft  │  │ Simulación agentes  │   │
│  │ 3 en raya   │  │ Camión      │  │ (núcleo)            │   │
│  │ Damas       │  │ bomberos    │  │                     │   │
│  │ Ajedrez     │  │ 2D          │  │ Motor + Memoria +   │   │
│  │ PvP / PvAI  │  │ Niveles     │  │ Relaciones          │   │
│  └──────┬──────┘  └─────────────┘  └──────────┬──────────┘   │
│         │                                      │              │
│         └──────────────┬───────────────────────┘              │
│                        │                                      │
│                 Motor de decisión                              │
│                 (IA compartida)                                │
└─────────────────────────────────────────────────────────────┘
```

---

## Roadmap visual

| Fase | Alcance | Estado |
|------|---------|--------|
| **Fase 1** | Artificial World — simulación, demo, app Pygame | En curso |
| **Fase 2** | Minijuegos — 3 en raya, damas, ajedrez (PvP + PvAI) | Planificado |
| **Fase 3** | DobackSoft — simulador bomberos 2D, niveles, objetos | Planificado |
| **Fase 4** | Integración — hub/lobby que conecta todo | Futuro |

---

## Resumen

- **Un mundo dentro de un mundo**: ecosistema de experiencias conectadas
- **Minijuegos**: 3 en raya, damas, ajedrez — contra jugadores o contra IAs
- **DobackSoft**: simulador de camión de bomberos 2D, objetivo llegar a la emergencia
- **Artificial World**: núcleo que alimenta las IAs y da identidad al producto
