# Fase 05: Compartir

## Objetivo

Un agente puede dar comida del inventario a otro agente con energía muy baja si está cerca. El rasgo "cooperative" determina la probabilidad de compartir.

## Dependencias

- **Fase 02 (Inventario):** El agente debe tener `inventory.food` para poder compartir.
- **Fase 04 (Rasgos):** Se usa `agent.traits.cooperative` para decidir si compartir.

## Modelo de datos

No se añaden nuevos campos. Se usan `inventory` y `traits` de fases anteriores.

Constantes sugeridas en `world.js`:

```javascript
const SHARE_RADIUS = 35;           // distancia máxima para compartir
const SHARE_COOPERATIVE_THRESHOLD = 0.6;  // mínimo cooperative para compartir
const RECEIVER_ENERGY_THRESHOLD = 0.25;   // energía del receptor para recibir
const GIVER_ENERGY_MIN = 0.5;             // energía mínima del dador
```

## Cambios en backend

### 1. `backend/src/simulation/world.js`

**Nueva función:**

```javascript
findNearbyAgentNeedingFood(agent) {
  let needy = null;
  let minEnergy = RECEIVER_ENERGY_THRESHOLD;
  for (const other of this.agents) {
    if (other.id === agent.id) continue;
    const d = dist(agent.x, agent.y, other.x, other.y);
    if (d < SHARE_RADIUS && other.energy < minEnergy && other.energy < RECEIVER_ENERGY_THRESHOLD) {
      minEnergy = other.energy;
      needy = other;
    }
  }
  return needy;
}

tryShare(agent) {
  if (agent.inventory.food < 1) return false;
  if (agent.energy < GIVER_ENERGY_MIN) return false;
  if ((agent.traits?.cooperative ?? 0) < SHARE_COOPERATIVE_THRESHOLD) return false;

  const needy = this.findNearbyAgentNeedingFood(agent);
  if (!needy) return false;

  agent.inventory.food--;
  needy.energy = Math.min(1, needy.energy + FOOD_ENERGY);
  this.addLog(`${agent.name} compartió comida con ${needy.name}`, 'share');
  agent.action = `Compartiendo con ${needy.name}`;
  agent.thought = 'Espero que le ayude.';
  needy.action = 'Recibiendo ayuda';
  needy.thought = '¡Gracias!';
  return true;
}
```

**Cambios en `tickSimulation`:**

- Al inicio del loop para cada agente, antes de buscar recursos:
  - Si `agent.inventory.food > 0`, `agent.energy >= GIVER_ENERGY_MIN`, y `agent.traits.cooperative >= SHARE_COOPERATIVE_THRESHOLD`:
    - Llamar `tryShare(agent)`.
    - Si retorna `true`, saltar al siguiente agente (no buscar recurso este tick).

Orden sugerido en el tick:
1. Consumir del inventario si energía muy baja.
2. Intentar compartir si hay condiciones.
3. Buscar refugio si energía muy baja.
4. Buscar/comer recurso.
5. Wander.

## Cambios en API

- No se requieren nuevos endpoints.
- El evento de compartir aparece en `GET /api/logs` con `type: 'share'`.

## Cambios en frontend

### 1. `frontend/src/components/LogPanel.jsx`

- Añadir estilo para eventos tipo `share` (ej. borde verde o icono distinto).
- Los logs ya incluyen el mensaje "X compartió comida con Y".

### 2. Opcional: `AgentDetailPanel`

- Si el agente acaba de compartir, mostrar badge "Compartió recientemente" o similar (requiere campo temporal en agente).

## Criterios de verificación

- [ ] Un agente con comida en inventario y cooperative >= 0.6 comparte si hay otro con energía < 0.25 cerca.
- [ ] El receptor gana energía (FOOD_ENERGY).
- [ ] El dador pierde 1 unidad de comida del inventario.
- [ ] El log muestra "Ana compartió comida con Bruno".
- [ ] Los pensamientos/acciones reflejan la acción de compartir.
- [ ] Un agente con cooperative < 0.6 no comparte.

## Pensamientos/acciones sugeridos

- Dador: "Compartiendo con Bruno", "Espero que le ayude."
- Receptor: "Recibiendo ayuda", "¡Gracias!"
- Dador no cooperativo: "Tengo comida pero no la compartiré."
