# Refugio Interior — Arquitectura

Sistema de refugio 32x32 interactivo con zonas, muebles, mascotas y stats del jugador.

## Modelo de datos

### Refuge (extendido)

Archivo: `backend/src/simulation/refuge.js`

Propiedades nuevas en `Refuge`:

| Propiedad | Tipo | Descripcion |
|-----------|------|-------------|
| `furniture` | `Array<{id, type, gridX, gridY, lastUsedAt}>` | Muebles colocados en el grid |
| `zones` | `Array<{id, name, x1, y1, x2, y2, color}>` | Regiones funcionales del refugio |
| `pets` | `Array<{id, species, gridX, gridY, state}>` | Mascotas del refugio |
| `playerStats` | `{energy, hunger, mood}` (0-100) | Stats del jugador. Solo en refugios con owner. |

**Decision provisional**: `playerStats` vive en `Refuge` para simplificar el MVP. Cuando existan multiples refugios visitables, migrar a un store por jugador (por `ownerId`), no por refugio.

### Zonas por defecto

Al crear un refugio con `ownerId`, se generan 4 zonas:

- **Entrada** (filas 26-31): zona inferior, color azul
- **Salon** (filas 12-25, columnas 8-23): centro, color naranja
- **Dormitorio** (filas 0-11, columnas 0-14): arriba-izquierda, color purpura
- **Cocina** (filas 0-11, columnas 15-31): arriba-derecha, color verde

### Catalogo de muebles

Archivo: `backend/src/simulation/furnitureCatalog.js`

| Tipo | Emoji | Efecto | Cooldown |
|------|-------|--------|----------|
| `bed` | Cama | +30 energy | 5s |
| `table` | Mesa | +25 hunger | 4s |
| `fireplace` | Fuego | +20 mood | 3s |
| `sofa` | Sofa | +15 mood, +10 energy | 3s |

Cada mueble ocupa 1 celda. No se pueden apilar. Cooldown previene spam.

## API

Todos los endpoints de interior requieren `ownerId` en el body y validan propiedad.

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| `GET` | `/api/refuge/furniture/catalog` | Catalogo de muebles disponibles |
| `POST` | `/api/refuge/furniture` | Colocar mueble (`type, gridX, gridY, ownerId`) |
| `POST` | `/api/refuge/interact` | Usar mueble (`furnitureId, ownerId`) — aplica efecto a stats |
| `DELETE` | `/api/refuge/furniture/:id` | Quitar mueble |
| `POST` | `/api/refuge/pet/adopt` | Adoptar mascota (`species, ownerId`) |
| `POST` | `/api/refuge/pet/tick` | Tick de mascota con posicion del jugador (`playerX, playerY, ownerId`) |

### Respuesta de `/api/refuge/interact`

```json
{
  "success": true,
  "data": {
    "used": true,
    "type": "bed",
    "changes": {
      "energy": { "prev": 60, "now": 90, "delta": 30 }
    },
    "stats": { "energy": 90, "hunger": 75, "mood": 80 }
  }
}
```

## Frontend

### SimulationCanvas

Archivo: `frontend/src/components/SimulationCanvas.jsx`

Orden de dibujado (draw loop):
1. Fondo oscuro
2. Zonas (rectangulos semitransparentes con nombre)
3. Grid lines
4. Solar Flux nodes
5. Mineral Deposits
6. Muebles (emoji, con resaltado si jugador adyacente)
7. Mascotas (circulo + emoji gato)
8. Agentes de simulacion
9. Avatar del jugador
10. HUD de stats (barras en esquina inferior derecha del canvas)

### Interaccion

- **WASD/flechas**: mover jugador
- **E**: usar mueble adyacente (llama `POST /api/refuge/interact`)
- **Click en modo edicion**: colocar nodo o mueble
- El mueble mas cercano al jugador (adyacente) se resalta con borde verde

### Barras de stats

Tres barras debajo del canvas: Energia (verde), Hambre (naranja), Animo (azul).
Tambien se renderizan en miniatura dentro del canvas (esquina inferior derecha).

### Feedback

Texto flotante que aparece sobre el jugador al usar un mueble (ej: "+30 energy").
Desaparece con animacion fadeUp en 2 segundos.

## Decay de stats

Los stats bajan automaticamente en el tick de simulacion del backend:
- Cada 5 ticks: energy -1, hunger -2, mood -1
- El jugador debe usar muebles para mantenerlos

## Mascotas

- Se adoptan via boton "Adoptar gato" (visible si no hay mascotas)
- Se mueven con random walk + follow player cuando estan cerca
- Efecto pasivo: +1 mood cuando el gato esta a 2 celdas o menos
- Estados: `idle`, `follow`, `wander`

## Como extender

### Anadir nuevo mueble

1. Agregar entrada en `furnitureCatalog.js` con `name, emoji, zone, effect, cooldownMs`
2. Agregar emoji al map `FURNITURE_EMOJI` en `SimulationCanvas.jsx`
3. Agregar tipo al array `PLACE_TYPES` y `PLACE_LABELS` en `SimulationCanvas.jsx`

### Preparacion para aldea

El sistema esta preparado para escalar a aldea porque:
- Cada refugio es independiente con su propio `plotIndex`
- Un jugador puede tener multiples refugios (mismo `ownerId`)
- Las zonas son datos, no hardcoded — se pueden redefinir al expandir
- Los muebles son un catalogo extensible (solo anadir entradas)
- La mascota es una entidad genérica con posicion y estado — patron para NPCs futuros
- `playerStats` es explicitamente provisional (ver nota en el modelo)
