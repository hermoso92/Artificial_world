# Análisis: Mystic Quest, visión visual AW y OpenClaw

> Revisión para añadir visión de aquí, atractivo visual para Artificial World, y aprovechamiento de OpenClaw.

---

## 1. Estado actual: Mystic Quest

**No existe** ninguna referencia a "Mystic Quest" en el codebase. Es una oportunidad para crear una **serie de contenido** o **línea narrativa** nueva dentro de AW.

### Propuesta: Mystic Quest como serie

Encaja con la tesis de civilizaciones vivas y las semillas existentes:

| Semilla existente | Tono visual 2D | Conexión Mystic Quest |
|-------------------|----------------|------------------------|
| Comunidad espiritual | centro ritual, periferia protectora | **Guía visionario** — ideal para quests místicos |
| Tribu de frontera | perimetros compactos, rutas cortas | Exploración y presagios |
| Reino guerrero | fronteras fuertes, rutas de conflicto | Campeón fundador, profecías |

**Recomendación:** Crear una serie "Mystic Quest" como:

1. **Serie de misiones/quests** ligadas a la semilla "Comunidad espiritual" (`spiritual-community`)
2. **Narrativa emergente** que use la crónica y la memoria del mundo
3. **Tono visual:** velas, piedra, símbolos, presencia solemne (ya definido en `civilizationSeeds.js`)

---

## 2. Revisión visual y visión de AW

### 2.1 Lo que existe hoy

| Componente | Ubicación | Estado visual |
|------------|-----------|---------------|
| **Landing público** | `LandingPublic` | Entrada limpia, CTA claro |
| **Onboarding** | `Landing` | Pasos: mundo → héroe → refugio → listo |
| **Hub** | `Hub.jsx` | 4 pilares (Simulación, Arena, DobackSoft, Mission Control) con colores por pilar |
| **Simulación** | `SimulationView`, `artificial-world.html` | Canvas 2D, sidebar, stats en tiempo real |
| **DobackSoft** | `DobackSoft.jsx` | Video trailer, tabs (Subir/Rutas/Jugar), features grid |
| **Arena** | `MinigamesLobby` | Cards por juego (3 en raya, Damas, Ajedrez) |
| **Demo estática** | `docs/artificial-world.html` | Demo embebida, panel lateral, eventos |

### 2.2 Paleta y tokens actuales

```css
/* artificial-world.html, index.css */
--bg-dark: #0a0b0d
--bg-card: #12141a
--bg-elevated: #181b22
--border: rgba(255, 255, 255, 0.06)
--text: #e8eaed
--text-muted: #8b8f98
--accent: #00d4ff
--success: #00e676
--warning: #ffb74d
--danger: #ff5252
```

### 2.3 Oportunidades de mejora visual

| Área | Mejora propuesta |
|------|------------------|
| **Hero / Hub** | Añadir ilustración o iconografía por semilla (ej. Comunidad espiritual → símbolo místico) |
| **Simulación** | Modos de visualización por `visualTone2d` de la semilla (ya existe en seeds, no aplicado en UI) |
| **Transiciones** | Animaciones suaves entre rutas (fade, slide) |
| **Mystic Quest** | Sección dedicada con tono distinto: fondos más oscuros, acentos violeta/ámbar |
| **Landing** | Video/GIF de la simulación en acción como hero background |
| **DobackSoft** | Ya tiene trailer; considerar poster/thumbnail más impactante |

### 2.4 "Visión de aquí"

Interpretado como **identidad visual coherente** y **mensaje claro**:

- **Mensaje actual:** "Constructor de Mundos", "No persigas la IA. Construye un mundo que la necesite."
- **Refuerzo:** Usar `visualTone2d` y `visualTone3d` de `civilizationSeeds.js` en la UI cuando el usuario elige una semilla (ej. en Landing y en el Hub cuando hay mundo activo).
- **Mystic Quest:** Añadir un bloque "Serie Mystic Quest" en el Hub o como sub-ruta bajo Simulación/Arena, con estética diferenciada.

---

## 3. OpenClaw — Qué podemos aprovechar

### 3.1 Resumen OpenClaw

- **Qué es:** Asistente de IA personal self-hosted (WhatsApp, Telegram, Slack, etc.)
- **Stack:** TypeScript, Node ≥22, WebSocket Gateway
- **Licencia:** MIT
- **Repos:** [github.com/openclaw/openclaw](https://github.com/openclaw/openclaw)

### 3.2 Elementos reutilizables para AW

| Concepto OpenClaw | Aplicación en AW |
|-------------------|------------------|
| **Live Canvas / A2UI** | Workspace visual donde el agente "empuja" widgets. **Inspiración:** Overlays dinámicos en la simulación (tooltips, paneles de agente, eventos) que se actualicen por WebSocket sin recargar. |
| **Protocolo A2UI** | `add`, `update`, `remove`, `event` para widgets. **Inspiración:** Sistema de overlays/paneles en el canvas 2D: el backend envía deltas y el frontend aplica sin full refresh. |
| **Skills platform** | Skills como módulos instalables. **Inspiración:** Minijuegos y módulos (DobackSoft, Mystic Quest) como "skills" opcionales del Hub. |
| **WebSocket control plane** | Gateway central. **Ya tenemos:** `useRealtimeSimulation` y WS en la simulación. Podemos extender el protocolo para eventos más ricos. |
| **Control UI / Dashboard** | Interfaz de administración. **Inspiración:** Mission Control y Admin Panel podrían adoptar patrones de dashboard (cards, métricas, acciones). |
| **Session model** | Sesiones `main`, grupos, activación. **Inspiración:** Mundos del Hero como "sesiones" con estado aislado. |

### 3.3 Lo que NO encaja

- **Canales de mensajería** (WhatsApp, Telegram, etc.): fuera del scope de AW.
- **Voice Wake / Talk Mode**: no prioritario para simulación 2D.
- **OAuth/API keys para modelos**: AW usa motor propio, no LLMs externos para el núcleo.

### 3.4 A2UI (Google) — Referencia técnica

- **Repo:** [github.com/google/A2UI](https://github.com/google/A2UI)
- **Protocolo:** JSON con `add`, `update`, `remove`, `event` para widgets.
- **Grid:** 12 columnas CSS.
- **Uso en AW:** Podríamos definir un subconjunto mínimo para paneles dinámicos (ej. "evento reciente", "estado del agente seleccionado") que el backend envíe por WS y el frontend renderice sin lógica pesada.

---

## 4. Plan de acción sugerido

### Fase 1 — Visión y cohesión ✅ (parcial)

1. ~~**Aplicar `visualTone2d` en la UI**~~ → Badge de semilla en Hub con acento por civilización (spiritual → violeta, frontier → verde, etc.).
2. ~~**Documentar Mystic Quest**~~ → `docs/ANALISIS_MYSTIC_QUEST_OPENCLAW_VISION.md`.
3. **Revisar colores hardcodeados** — pendiente (bajo impacto).

### Fase 2 — Mystic Quest ✅ (implementado)

1. ~~**Añadir ruta `mysticquest`**~~ → Ruta `#mysticquest` añadida en App.jsx.
2. ~~**Crear componente `MysticQuestView`**~~ → Componente con tono violeta/ámbar, fondo `#0f0a1a`.
3. ~~**Vincular a semilla `spiritual-community`**~~ → Vista explica cómo elegir la semilla y entrar al mundo.
4. ~~**Quests iniciales**~~ → 3 quests: Encuentra el símbolo, Protege el santuario, La crónica del ritual.

### Fase 3 — Inspiración OpenClaw (opcional)

1. **Extender protocolo WS** de la simulación para enviar "overlays" (eventos destacados, estado de agente) en formato tipo A2UI (add/update/remove).
2. **Refactorizar paneles laterales** para que consuman esos mensajes en lugar de polling.
3. **Skills como módulos:** Estructurar Minigames, DobackSoft, Mystic Quest como entidades registrables en un registry interno.

---

## 5. Referencias

- `docs/VISION_CIVILIZACIONES_VIVAS.md` — Tesis de producto
- `backend/src/simulation/civilizationSeeds.js` — Semillas y tonos visuales
- `frontend/src/components/Hub.jsx` — Pilares actuales
- `docs/DESIGN_SCOPE_C_UI_UPGRADE.md` — Diseño de navegación
- OpenClaw: [github.com/openclaw/openclaw](https://github.com/openclaw/openclaw)
- A2UI: [github.com/google/A2UI](https://github.com/google/A2UI)
