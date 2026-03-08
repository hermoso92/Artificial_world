# DobackSoft — Flujo de acceso y juego

> Documentación del flujo: cupón → validación → código de acceso → registro → Fire Simulator.

**Versión:** 1.0  
**Última actualización:** Marzo 2025

---

## Resumen

DobackSoft es un simulador de camión de bomberos integrado en Constructor de Mundos. El acceso está limitado a los primeros 1000 ciudadanos fundadores mediante cupón.

---

## Flujo completo

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  Hub            │     │  DobackSoft      │     │  Fire Simulator      │
│  Emergencias →  │────▶│  Introduce      │────▶│  Jugar demo         │
└─────────────────┘     │  cupón          │     │  (canvas 2D)        │
                         └────────┬─────────┘     └─────────────────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │  fundador1000    │
                         │  Validar         │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │  Cupón válido    │
                         │  €9.99/mes       │
                         │  Código: DOBACK- │
                         │  08VA-GLG7       │
                         └────────┬─────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
           ┌────────────────┐         ┌────────────────┐
           │  Reservar      │         │  Jugar Fire     │
           │  (registro)    │         │  Simulator      │
           └────────────────┘         └────────────────┘
```

---

## Paso a paso

### 1. Acceso a DobackSoft

- Desde el **Hub** (Constructor de Mundos), clic en **Emergencias**.
- Ruta: `#dobacksoft`.

### 2. Introducir cupón

- Cupón válido: **fundador1000** (insensible a mayúsculas/minúsculas).
- Clic en **Validar**.

### 3. Resultado de la validación

**Si el cupón es válido y hay plazas:**

- Mensaje: *"Cupón válido. Tu precio: €9.99/mes (en lugar de €29)."*
- Código de acceso: formato `DOBACK-XXXX-XXXX` (ej: `DOBACK-08VA-GLG7`).
- Opciones:
  - **Reservar por €9.99/mes** — registro como ciudadano fundador.
  - **Jugar Fire Simulator** — acceso al demo jugable.

**Si el cupón no es válido:**

- Mensaje: *"Cupón no válido. Precio estándar: €29/mes."*

**Si las 1000 plazas están agotadas:**

- Mensaje: *"Las 1000 plazas de fundadores están agotadas."*

### 4. Fire Simulator (demo jugable)

- Requiere código de acceso en formato `DOBACK-XXXX-XXXX`.
- El código se guarda en `localStorage` al validar el cupón o al introducirlo manualmente.
- Controles: **WASD** o **flechas** para conducir el camión.
- Objetivo: llegar al incendio antes de que se agote el tiempo (90 s) o el combustible.

**Contenido del simulador (alineado con las promesas de DobackSoft):**

| Promesa | Implementación |
|---------|----------------|
| 🗺️ **Mapa de despacho en tiempo real** | Minimap en esquina con posición del camión y del incendio. Ruta dinámica (línea verde) que se recalcula según accidentes. |
| 🚒 **Telemetría del vehículo** | Velocidad (km/h), combustible (%), temperatura motor (°C), agua (%), estado, sirena (L). |
| 🏙️ **Paisajes 2D realistas** | Calles, edificios con ventanas, tráfico, semáforos, peatones en aceras. |
| 🌩️ **Simulación de incidentes** | Incendios, accidentes que bloquean calles, condiciones climáticas (lluvia, niebla, tormenta). |
| 📊 **Progresión y niveles** | 5 niveles con dificultad creciente: más tráfico, peatones, accidentes y clima adverso. |

### 5. Acceso directo al Fire Simulator

- Ruta: `#firesimulator`.
- Si no hay código guardado, se muestra una pantalla para introducir el código.
- Formato aceptado: `DOBACK-XXXX-XXXX` (ej: `DOBACK-08VA-GLG7`).

---

## Configuración técnica

| Variable de entorno | Descripción | Valor por defecto |
|--------------------|-------------|-------------------|
| `DOBACKSOFT_COUPON_CODE` | Cupón válido para fundadores | `FUNDADOR1000` |

| Clave localStorage | Descripción |
|-------------------|-------------|
| `dobacksoft_access_code` | Código de acceso para el Fire Simulator |

---

## API backend

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/dobacksoft/stats` | GET | Estadísticas (ciudadanos, plazas, precios) |
| `/api/dobacksoft/coupon/validate` | POST | Valida cupón, devuelve código de acceso |
| `/api/dobacksoft/citizens` | POST | Registra ciudadano fundador |
| `/api/dobacksoft/trailer` | GET | Video MP4 del trailer |

---

## Archivos relevantes

| Ruta | Descripción |
|------|--------------|
| `frontend/src/components/DobackSoft.jsx` | Página principal DobackSoft |
| `frontend/src/components/FireSimulator.jsx` | Demo jugable canvas 2D |
| `backend/src/dobacksoft/store.js` | Lógica de cupón y ciudadanos |
| `backend/src/routes/dobacksoft.js` | Rutas API |

---

## Relación con otros productos

- **Artificial World**: simulación principal (refugios, agentes).
- **DobackSoft**: producto B2B, simulador de bomberos, acceso por cupón.
- **Minijuegos** (Damas, 3 en raya): acceso gratuito desde el Hub.

## ¿Si DobackSoft funciona, funciona el 100% de la app?

**No.** DobackSoft es un módulo independiente. La aplicación completa incluye:

| Módulo | Persistencia | Dependencias |
|--------|--------------|--------------|
| DobackSoft | In-memory | Ninguna |
| Simulación (World, refuges) | In-memory | Engine, WebSocket |
| Hero Worlds | In-memory | HeroRefuge singleton |
| Subscriptions | SQLite | — |
| Audit | SQLite | — |

Si DobackSoft funciona, implica que el backend Express, el frontend React y el routing están operativos. Pero la simulación, Mission Control, minijuegos y subscriptions son independientes.
