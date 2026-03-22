# Fase 01: Memoria espacial

## Objetivo

Cada agente recuerda posiciones de recursos y refugios que ha visto. Si no hay recurso visible en el radio de percepción, el agente puede ir hacia una posición recordada.

## Modelo de datos

En `backend/src/simulation/agent.js`:

```javascript
constructor(x, y, name = null) {
  // ... campos existentes ...
  this.memory = [];  // Array de { type, x, y, tick }, capacidad 15-20
}

const MEMORY_CAPACITY = 18;
```

Estructura de cada entrada en `memory`:
- `type`: 'food' | 'material' | 'shelter'
- `x`, `y`: posición
- `tick`: momento en que se recordó (para expiración opcional)

## Cambios en backend

### 1. `backend/src/simulation/agent.js`

- Añadir `this.memory = []` en el constructor.
- En `toJSON()`: incluir `memory: this.memory` (o resumen `memoryCount: { food: N, material: M }` si se prefiere no exponer posiciones).

### 2. `backend/src/simulation/world.js`

**Nuevas funciones:**

```javascript
addMemory(agent, type, x, y) {
  // Evitar duplicados cercanos (misma posición ±10)
  for (const m of agent.memory) {
    if (m.type === type && dist(m.x, m.y, x, y) < 15) return;
  }
  agent.memory.push({ type, x, y, tick: this.tick });
  if (agent.memory.length > MEMORY_CAPACITY) agent.memory.shift();
}

findInMemory(agent, type) {
  const MEMORY_RADIUS = PERCEPTION_RADIUS * 1.5;
  let best = null;
  let minD = Infinity;
  for (const m of agent.memory) {
    if (m.type !== type) continue;
    const d = dist(agent.x, agent.y, m.x, m.y);
    if (d < MEMORY_RADIUS && d < minD) {
      minD = d;
      best = m;
    }
  }
  return best;
}

removeMemoryAt(agent, x, y) {
  agent.memory = agent.memory.filter(m => dist(m.x, m.y, x, y) > 20);
}
```

**Cambios en `tickSimulation`:**

- Cuando el agente percibe un recurso (dentro de PERCEPTION_RADIUS): llamar `addMemory(agent, resource.type, resource.x, resource.y)`.
- Cuando consume un recurso: llamar `removeMemoryAt(agent, resource.x, resource.y)`.
- Si no hay recurso visible:
  - Si `agent.energy < 0.6`: buscar en memoria tipo 'food'.
  - Si no hay comida en memoria: buscar en memoria tipo 'material'.
  - Si hay posición en memoria: usar `moveToward(agent, mem.x, mem.y)`.
  - Si no hay nada en memoria: `wander(agent)`.

## Cambios en API

- Incluir `memory` (o `memoryCount`) en el JSON del agente en `GET /api/agents`.
- No se requieren nuevos endpoints.

## Cambios en frontend

En `frontend/src/components/AgentDetailPanel.jsx`:

- Si `selectedAgent.memory` existe, mostrar resumen: "Recuerdos: X comida, Y material" (contar por tipo).
- Opcional: lista compacta de los últimos 3-5 recuerdos.

## Criterios de verificación

- [ ] Los agentes añaden entradas a `memory` cuando perciben recursos.
- [ ] Si no hay recurso visible, el agente se mueve hacia posiciones recordadas.
- [ ] Al consumir un recurso, se elimina la entrada correspondiente de la memoria.
- [ ] La memoria no supera MEMORY_CAPACITY (FIFO).
- [ ] El panel de detalle muestra el resumen de recuerdos.

## Pensamientos/acciones sugeridos

- "Recuerdo comida por ahí..."
- "Voy hacia donde vi material."
- "No veo nada, pero recuerdo una zona con recursos."
