# Fase 04: Rasgos de personalidad

## Objetivo

Cada agente tiene rasgos (cooperativo, audaz, curioso) que modifican su comportamiento. En esta fase se implementa el modelo y al menos un efecto visible: el rasgo "curioso" afecta el patrón de exploración.

## Modelo de datos

En `backend/src/simulation/agent.js`:

```javascript
constructor(x, y, name = null) {
  // ... campos existentes ...
  this.traits = {
    cooperative: 0.3 + Math.random() * 0.7,  // 0-1
    bold: 0.3 + Math.random() * 0.7,
    curious: 0.3 + Math.random() * 0.7,
  };
}
```

Valores por defecto pueden variar por nombre para dar personalidad distintiva (opcional).

## Cambios en backend

### 1. `backend/src/simulation/agent.js`

- Añadir `this.traits = { cooperative, bold, curious }` en el constructor.
- En `toJSON()`: incluir `traits: { ...this.traits }` (valores redondeados a 2 decimales).

### 2. `backend/src/simulation/world.js`

**Cambios en `wander(agent)`:**

- Usar `agent.traits.curious` para variar el comportamiento:
  - `curious` alto (> 0.6): velocidad de wander mayor (ej. `speed * 1.2`), ángulo más aleatorio.
  - `curious` bajo (< 0.4): velocidad menor (ej. `speed * 0.8`), movimientos más conservadores.

```javascript
wander(agent) {
  const baseSpeed = AGENT_SPEED * 0.3;
  const curiousMult = 0.8 + (agent.traits?.curious ?? 0.5) * 0.4;  // 0.8 - 1.2
  const speed = baseSpeed * curiousMult;
  const angle = Math.random() * Math.PI * 2;
  agent.x = Math.max(10, Math.min(this.width - 10, agent.x + Math.cos(angle) * speed));
  agent.y = Math.max(10, Math.min(this.height - 10, agent.y + Math.sin(angle) * speed));
}
```

**Uso futuro (fase 05):**

- `cooperative`: umbral para decidir compartir comida.
- `bold`: umbral para robar o arriesgarse (futuro).

## Cambios en API

- Incluir `traits` en `toJSON()` del agente.
- No se requieren nuevos endpoints.

## Cambios en frontend

En `frontend/src/components/AgentDetailPanel.jsx`:

- Mostrar rasgos como badges cuando `selectedAgent.traits` existe.
- Formato: "Cooperativo: alto | Audaz: medio | Curioso: alto" o iconos/badges.
- Mapeo sugerido: 0-0.33 = bajo, 0.34-0.66 = medio, 0.67-1 = alto.

```javascript
const traitLabel = (v) => v < 0.34 ? 'bajo' : v < 0.67 ? 'medio' : 'alto';
// Cooperativo: {traitLabel(selectedAgent.traits.cooperative)}
```

## Criterios de verificación

- [ ] Cada agente tiene `traits` con valores entre 0 y 1.
- [ ] El rasgo `curious` afecta la velocidad o patrón del wander.
- [ ] El panel de detalle muestra los tres rasgos con etiquetas (bajo/medio/alto).
- [ ] Los rasgos persisten tras reset (se regeneran aleatoriamente).

## Pensamientos/acciones sugeridos

- "Me gusta explorar" (curious alto).
- "Prefiero quedarme cerca" (curious bajo).
- "Estoy dispuesto a ayudar" (cooperative alto, para fase 05).
