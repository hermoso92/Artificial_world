# Fase 03: Refugios con bonus

## Objetivo

Zonas de refugio que recuperan energía más rápido cuando el agente está dentro. Si la energía es muy baja, el agente prioriza ir al refugio antes que buscar comida.

## Modelo de datos

Crear `backend/src/simulation/shelter.js`:

```javascript
export class Shelter {
  static nextId = 1;

  constructor(x, y) {
    this.id = Shelter.nextId++;
    this.x = x;
    this.y = y;
    this.radius = 30;
    this.restBonus = 0.02;  // energía por tick cuando está dentro
  }

  toJSON() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      radius: this.radius,
    };
  }
}
```

## Cambios en backend

### 1. `backend/src/simulation/shelter.js`

- Crear el archivo con la clase `Shelter` como arriba.

### 2. `backend/src/simulation/world.js`

**Import y constantes:**

```javascript
import { Shelter } from './shelter.js';

const SHELTER_COUNT = 4;
const SHELTER_RADIUS = 30;
const REST_BONUS = 0.02;
```

**En `reset()`:**

- Inicializar `this.shelters = []`.
- Crear SHELTER_COUNT refugios con posiciones aleatorias (margen adecuado).
- Resetear `Shelter.nextId = 1` antes de crear.

**Nueva función:**

```javascript
findNearestShelter(agent) {
  let nearest = null;
  let minDist = Infinity;
  for (const s of this.shelters) {
    const d = dist(agent.x, agent.y, s.x, s.y);
    if (d < PERCEPTION_RADIUS * 1.2 && d < minDist) {
      minDist = d;
      nearest = s;
    }
  }
  return nearest;
}

isAgentInShelter(agent) {
  for (const s of this.shelters) {
    if (dist(agent.x, agent.y, s.x, s.y) < s.radius) return s;
  }
  return null;
}
```

**Cambios en `tickSimulation`:**

- Antes de aplicar ENERGY_DECAY: si `isAgentInShelter(agent)` devuelve un refugio, aplicar `agent.energy += REST_BONUS` (hasta 1) en lugar de `energy - ENERGY_DECAY`.
- En la prioridad de objetivos:
  - Si `agent.energy < 0.3` y hay refugio cercano: target = refugio.
  - Si no hay refugio visible pero hay en memoria (fase 01): ir hacia memoria de refugio.
  - Si no, continuar con comida/material.
- Al moverse hacia refugio: usar `moveToward(agent, shelter.x, shelter.y)`.
- Si el agente está dentro del refugio: `agent.state = 'resting'`, `agent.action = 'Descansando'` (o similar).

**En `toJSON()` del World:**

- Incluir `shelterCount: this.shelters.length` o `shelters: this.shelters.map(s => s.toJSON())`.

## Cambios en API

- Incluir `shelters` en la respuesta de `GET /api/world` (o crear `GET /api/shelters`).
- Opción: devolver `shelters` en world para que el frontend los dibuje.

## Cambios en frontend

### 1. `frontend/src/components/SimulationCanvas.jsx`

- Recibir `shelters` en props (desde world o endpoint separado).
- Dibujar cada refugio como un círculo con color distinto (ej. violeta `#9c27b0`), radio `shelter.radius`.

### 2. `frontend/src/components/WorldPanel.jsx`

- Mostrar "Refugios: N" si `world.shelterCount` o `world.shelters?.length` existe.

### 3. `frontend/src/App.jsx`

- Pasar `shelters` al SimulationCanvas (p. ej. `world?.shelters`).

## Criterios de verificación

- [ ] Los refugios se generan en reset y se dibujan en el canvas.
- [ ] Si el agente está dentro de un refugio, recupera energía (REST_BONUS).
- [ ] Si energía < 0.3, el agente prioriza ir al refugio.
- [ ] El estado del agente muestra "Descansando" cuando está en refugio.
- [ ] El WorldPanel muestra el número de refugios.

## Pensamientos/acciones sugeridos

- "Necesito descansar, voy al refugio."
- "Descansando... recupero fuerzas."
- "Recuerdo un refugio por aquí."
