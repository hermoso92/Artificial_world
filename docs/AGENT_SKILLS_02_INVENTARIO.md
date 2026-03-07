# Fase 02: Inventario

## Objetivo

Los agentes pueden guardar comida y material para consumir después. Si la energía es baja y tienen comida en el inventario, la consumen del inventario en lugar de buscar en el mapa.

## Modelo de datos

En `backend/src/simulation/agent.js`:

```javascript
constructor(x, y, name = null) {
  // ... campos existentes ...
  this.inventory = { food: 0, material: 0 };
}

const MAX_FOOD = 3;
const MAX_MATERIAL = 5;
```

## Cambios en backend

### 1. `backend/src/simulation/agent.js`

- Añadir `this.inventory = { food: 0, material: 0 }` en el constructor.
- En `toJSON()`: incluir `inventory: { ...this.inventory }`.

### 2. `backend/src/simulation/world.js`

**Nueva función:**

```javascript
consumeFromInventory(agent, type) {
  if (type === 'food' && agent.inventory.food > 0) {
    agent.inventory.food--;
    agent.energy = Math.min(1, agent.energy + FOOD_ENERGY);
    this.addLog(`${agent.name} comió del inventario`, 'consume');
    return true;
  }
  if (type === 'material' && agent.inventory.material > 0) {
    agent.inventory.material--;
    agent.energy = Math.min(1, agent.energy + MATERIAL_ENERGY);
    this.addLog(`${agent.name} usó material del inventario`, 'consume');
    return true;
  }
  return false;
}
```

**Cambios en `consumeResource`:**

- En lugar de aplicar el bonus de energía directamente, incrementar el inventario:
  - `agent.inventory.food++` si `resource.type === 'food'` (hasta MAX_FOOD).
  - `agent.inventory.material++` si `resource.type === 'material'` (hasta MAX_MATERIAL).
- Si el inventario está lleno, no recoger (o consumir inmediatamente).
- Opción: si `agent.energy < 0.4` al recoger comida, consumir inmediatamente en lugar de guardar.

**Cambios en `tickSimulation`:**

- Al inicio del loop para cada agente:
  - Si `agent.energy < 0.4` y `agent.inventory.food > 0`: llamar `consumeFromInventory(agent, 'food')` y saltar al siguiente.
  - Si no, continuar con la lógica actual (buscar recurso, mover, etc.).

## Cambios en API

- Incluir `inventory` en `toJSON()` del agente.
- No se requieren nuevos endpoints.

## Cambios en frontend

En `frontend/src/components/AgentDetailPanel.jsx`:

- Mostrar "Inventario: X comida, Y material" cuando `selectedAgent.inventory` existe.
- Formato: `Inventario: 2 comida, 3 material`.

## Criterios de verificación

- [ ] Al recoger un recurso, se incrementa el inventario.
- [ ] Si energía < 0.4 y hay comida en inventario, el agente consume del inventario.
- [ ] El inventario no supera MAX_FOOD ni MAX_MATERIAL.
- [ ] El panel de detalle muestra el inventario correctamente.
- [ ] Los logs incluyen eventos de consumo del inventario.

## Pensamientos/acciones sugeridos

- "Recogí comida, la guardo."
- "Tengo hambre, como lo que guardé."
- "Inventario lleno, no puedo recoger más."
