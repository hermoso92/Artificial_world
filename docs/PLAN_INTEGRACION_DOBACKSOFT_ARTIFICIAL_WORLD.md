# Plan de integración: DobackSoft ↔ Artificial World

> **Objetivo:** Convertir el minijuego Emergencias en una aplicación completa de telemetría y estabilidad: subida de archivos → visualización de rutas → juego de conducción. DobackSoft como creador y visualizador de rutas; Artificial World como plataforma integrada.

**Ownership:** DobackSoft = producto principal. Artificial World = laboratorio. FireSimulator = superficie de demo/entrenamiento. Ver [docs/OWNERSHIP_ESTRATEGICO.md](OWNERSHIP_ESTRATEGICO.md) y [docs/FRONTERA_CONTRATOS.md](FRONTERA_CONTRATOS.md).

**Fecha:** Marzo 2025  
**Estado:** Diseño — revisar antes de implementar  
**Referencias:** [AUDITORIA_DOBACKSOFT_ARTIFICIAL_WORLD.md](AUDITORIA_DOBACKSOFT_ARTIFICIAL_WORLD.md), [AUDITORIA_DOBACKV2_PROFUNDA.md](AUDITORIA_DOBACKV2_PROFUNDA.md)

---

## 1. Estado actual (revisión desde 0)

### 1.1 Qué tiene DobackSoft

| Componente | Ubicación | Función |
|------------|-----------|---------|
| **SessionsAndRoutesView** | `frontend/src/components/sessions/SessionsAndRoutesView.tsx` (3200+ líneas) | Visor operativo: timeline, mapa Leaflet, ruta GPS, eventos estabilidad, HUD 3D |
| **SubidaManualPage** | `frontend/src/pages/formacion/SubidaManualPage.tsx` | Subida manual: vehículo + archivos (estabilidad, GPS, rotativo) → POST /api/mass-upload/upload-multiple |
| **API session-route** | `backend/src/routes/index.ts` | GET /api/session-route/:id → ruta, eventos, sesión, stats |
| **TelemetryAPI** | `frontend/src/api/telemetry-v2.ts` | getVisorBootstrap, getSessionPoints, getRouteOverview |
| **Formato datos** | `{ route: [{lat, lng, speed, timestamp}], events: [...], session: {...} }` | GPS, eventos estabilidad, severidad |

**Flujo DobackSoft:** 1) Subir archivos (SubidaManualPage) → 2) Backend procesa y crea sessions → 3) Visor (SessionsAndRoutesView) lista sesiones, selecciona una → 4) Carga /api/session-route/:id → 5) Muestra mapa + timeline + eventos.

### 1.2 Qué tiene Artificial World

| Componente | Ubicación | Función |
|------------|-----------|---------|
| **FireSimulator** | `frontend/src/components/FireSimulator.jsx` | Juego canvas 2D: mapa ficticio, telemetría simulada, niveles |
| **DobackSoft** | `frontend/src/components/DobackSoft.jsx` | Landing cupón, acceso Fire Simulator |
| **Backend** | Express 3001 | API simulación, dobacksoft (cupón, stats), heroRefuge |
| **Sin upload** | — | No hay subida de archivos |
| **Sin rutas reales** | — | Fire Simulator usa grid generado, no GPS |

**Flujo actual:** Hub → Emergencias (DobackSoft) → cupón → Fire Simulator (juego sin datos reales).

### 1.3 Gaps identificados

| Gap | Descripción |
|-----|-------------|
| **Subida** | Artificial World no tiene subida de archivos ni procesamiento |
| **Rutas reales** | Fire Simulator no usa datos GPS reales |
| **Visor 2D** | No hay visor operativo 2D en Artificial World |
| **Flujo completo** | Subir → procesar → ver ruta → jugar no existe |
| **Backend** | Artificial World no tiene endpoints para sesiones/rutas |

---

## 2. Flujo objetivo (completo)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  FLUJO COMPLETO: Subir → Procesar → Ver ruta → Jugar                                 │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  1. SUBIDA MANUAL                                                                    │
│     ├── Usuario selecciona vehículo (o crea uno)                                     │
│     ├── Selecciona archivos: Estabilidad, GPS, Rotativo                              │
│     ├── POST /api/.../upload-multiple                                                 │
│     └── Backend procesa → crea Session(s)                                            │
│                                                                                      │
│  2. VISUALIZACIÓN RUTA (2D)                                                          │
│     ├── Lista de sesiones disponibles                                                │
│     ├── Usuario selecciona sesión                                                    │
│     ├── GET /api/session-route/:id → { route, events, session }                      │
│     └── Visor 2D: mapa con ruta GPS + eventos marcados                               │
│                                                                                      │
│  3. JUEGO DE CONDUCCIÓN                                                              │
│     ├── Modo "Reproducir ruta": seguir la ruta real en tiempo real o acelerado       │
│     ├── Modo "Conducir": jugar con controles (WASD) sobre la ruta real               │
│     └── Telemetría: velocidad, eventos, estabilidad (datos reales)                  │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Opciones de arquitectura

### Opción A: Proxy a DobackSoft (recomendada para MVP)

| Aspecto | Descripción |
|---------|-------------|
| **Idea** | Artificial World llama a DobackSoft backend (9998) cuando está configurado |
| **Backend AW** | Añade rutas proxy: `/api/dobacksoft-proxy/upload`, `/api/dobacksoft-proxy/session-route/:id` |
| **Frontend AW** | Nuevo flujo: SubidaManualPage (lite) → VisorRuta2D → FireSimulatorConRuta |
| **Requisito** | DobackSoft corriendo en 9998 o URL configurable |
| **Auth** | DobackSoft requiere JWT; AW necesitaría login o token de servicio |

**Pro:** Reutiliza toda la lógica de DobackSoft.  
**Contra:** Dependencia de DobackSoft; CORS y auth a resolver.

### Opción B: Backend propio en Artificial World

| Aspecto | Descripción |
|---------|-------------|
| **Idea** | Añadir upload + procesamiento en backend AW (simplificado) |
| **Backend AW** | Nuevas rutas: POST /api/sessions/upload, GET /api/sessions, GET /api/session-route/:id |
| **Persistencia** | SQLite (audit_simulacion.db o nueva) para sesiones, puntos GPS |
| **Procesamiento** | Parser simplificado de archivos (GPS CSV, estabilidad) o delegar a script Python |

**Pro:** Independiente; funciona sin DobackSoft.  
**Contra:** Duplicar lógica; parsers complejos; mantenimiento.

### Opción C: Componentes compartidos (lib npm)

| Aspecto | Descripción |
|---------|-------------|
| **Idea** | Extraer `RouteViewer2D`, `UploadForm`, `DrivingGame` a paquete npm |
| **Uso** | DobackSoft y Artificial World importan el mismo paquete |
| **Backend** | Cada uno sigue con su backend |

**Pro:** Código único; evolución consistente.  
**Contra:** Esfuerzo alto; refactor grande en ambos proyectos.

---

## 4. Plan de implementación por fases

### Fase 4.1: Subida manual (prioridad P0)

**Objetivo:** Usuario puede subir archivos en Artificial World.

| Tarea | Descripción | Ubicación |
|-------|-------------|-----------|
| 4.1.1 | Crear `SubidaManualLite.jsx` en AW | `frontend/src/components/DobackSoft/` |
| 4.1.2 | Opción A: Proxy a DobackSoft (POST /api/.../upload-multiple) | `backend/src/routes/dobacksoftProxy.js` |
| 4.1.3 | Opción B: Endpoint propio POST /api/sessions/upload, parser básico | `backend/src/routes/sessions.js` |
| 4.1.4 | Config: `VITE_DOBACKSOFT_API_URL` o modo standalone | `frontend/src/config/api.js` |

**Verificación:** Subir archivos → sesión creada → listado visible.

### Fase 4.2: Visor de rutas 2D (prioridad P0)

**Objetivo:** Visualizar ruta GPS en 2D (canvas o Leaflet).

| Tarea | Descripción | Ubicación |
|-------|-------------|-----------|
| 4.2.1 | Crear `VisorRuta2D.jsx` | `frontend/src/components/DobackSoft/` |
| 4.2.2 | Lista sesiones: GET /api/sessions o proxy | — |
| 4.2.3 | Cargar ruta: GET /api/session-route/:id o proxy | — |
| 4.2.4 | Renderizar: canvas 2D con puntos GPS (proyección lat/lng → x/y) o Leaflet | — |
| 4.2.5 | Mostrar eventos marcados en la ruta | — |

**Formato datos esperado:** `{ route: [{lat, lng, speed, timestamp}], events: [{lat, lng, type, severity}], session: {...} }`

**Verificación:** Seleccionar sesión → mapa 2D con ruta y eventos.

### Fase 4.3: Juego de conducción con ruta real (prioridad P1)

**Objetivo:** Fire Simulator usa ruta real en lugar de grid ficticio.

| Tarea | Descripción | Ubicación |
|-------|-------------|-----------|
| 4.3.1 | Modo "Ruta real": cargar session-route, proyectar GPS a canvas | FireSimulator.jsx |
| 4.3.2 | Reproducir posición del vehículo según timestamp | — |
| 4.3.3 | Modo "Conducir": jugador controla, comparar con ruta real (opcional) | — |
| 4.3.4 | Telemetría real: velocidad, eventos desde datos | — |

**Flujo:** VisorRuta2D → botón "Jugar esta ruta" → FireSimulator con sessionId.

**Verificación:** Ruta cargada → juego muestra la ruta real; telemetría coherente.

### Fase 4.4: Integración en Hub (prioridad P1)

**Objetivo:** Flujo unificado en Emergencias.

| Tarea | Descripción |
|-------|-------------|
| 4.4.1 | DobackSoft: pestañas o tabs "Subir", "Ver rutas", "Jugar" |
| 4.4.2 | Navegación: Subir → (tras éxito) Ver rutas → Seleccionar → Jugar |
| 4.4.3 | Sin cupón para modo demo: permitir subir/jugar sin registro (datos locales) |

**Verificación:** Flujo completo desde Hub sin romper nada.

### Fase 4.5: Sinergias bidireccionales (prioridad P2)

#### Artificial World → DobackSoft

| Sinergia | Descripción |
|----------|-------------|
| **Motor de IA** | `motor_decision.py` (utilidad) → inspiración para recomendaciones de conducción |
| **Narrativa** | Refugio del usuario como "destino" en misiones de emergencia |
| **Gamificación** | Badges, puntos, progresión en DobackSoft inspirados en agentes |
| **Demo integrada** | Enlace desde DobackSoft a Artificial World (Emergencias) como teaser |
| **Fire Simulator** | DobackSoft puede enlazar al juego como "modo práctica" para conductores |

#### DobackSoft → Artificial World

| Sinergia | Descripción |
|----------|-------------|
| **Visor 2D** | Lógica de SessionsAndRoutesView (proyección GPS, timeline) reutilizable |
| **Upload** | Flujo SubidaManualPage como referencia para SubidaManualLite |
| **API session-route** | Formato de datos estándar para rutas y eventos |
| **Telemetría real** | Velocidad, eventos, estabilidad desde datos reales en el juego |
| **Producto completo** | Emergencias pasa de "juego" a "app telemetría + juego" |

---

## 5. Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| **Romper Fire Simulator** | Mantener modo "demo" (sin ruta) por defecto; ruta real solo si sessionId |
| **CORS** | Proxy en backend AW; evitar llamadas directas desde frontend a otro puerto |
| **Auth DobackSoft** | Modo standalone en AW sin auth; proxy con token de servicio si se usa DobackSoft |
| **Tamaño SessionsAndRoutesView** | No replicar; extraer solo lógica de ruta y mapa |
| **Parsers complejos** | Opción A (proxy) evita reimplementar parsers |

---

## 6. Checklist de verificación (no romper nada)

Antes de cada merge:

- [ ] Fire Simulator arranca sin sessionId (modo demo actual)
- [ ] DobackSoft landing y cupón siguen funcionando
- [ ] Hub muestra todas las cards
- [ ] `iniciar_fullstack.ps1` arranca backend 3001 y frontend 5173
- [ ] No hay `console.log` en código nuevo
- [ ] URLs en `config/api.js`
- [ ] Componentes <300 líneas o se documenta excepción

---

## 7. Orden recomendado de implementación

1. **Fase 4.2 (Visor 2D)** con datos mock o proxy a DobackSoft — valida visualización.
2. **Fase 4.1 (Subida)** — completa el flujo de datos.
3. **Fase 4.3 (Juego con ruta)** — integra con Fire Simulator.
4. **Fase 4.4 (Hub)** — unifica UX.
5. **Fase 4.5 (Sinergias)** — según prioridad producto.

---

## 8. Archivos a crear/modificar (resumen)

### Artificial World

| Archivo | Acción |
|---------|--------|
| `frontend/src/components/DobackSoft/SubidaManualLite.jsx` | Crear |
| `frontend/src/components/DobackSoft/VisorRuta2D.jsx` | Crear |
| `frontend/src/components/FireSimulator.jsx` | Modificar (modo ruta real) |
| `frontend/src/components/DobackSoft.jsx` | Modificar (tabs Subir/Ver/Jugar) |
| `backend/src/routes/dobacksoftProxy.js` | Crear (si Opción A) |
| `frontend/src/config/api.js` | Modificar (VITE_DOBACKSOFT_API_URL) |

### DobackSoft (cambios mínimos)

| Archivo | Acción |
|---------|--------|
| `backend/src/routes/` | Exponer CORS o endpoint público para proxy (si Opción A) |
| — | Opcional: exportar componentes como lib |

---

## 9. Referencias técnicas

### DobackSoft — Endpoints clave

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/mass-upload/upload-multiple` | POST | Subida archivos (estabilidad, GPS, rotativo) |
| `/api/session-route/:id` | GET | Ruta + eventos + sesión |
| `/api/telemetry-v2/visor/bootstrap` | GET | Sesiones + dailySummary |
| `/api/telemetry-v2/sessions/:id/points` | GET | Puntos GPS (downsample) |

### Formato session-route (response)

```json
{
  "success": true,
  "data": {
    "route": [{ "lat": 40.4, "lng": -3.7, "speed": 45, "timestamp": "..." }],
    "events": [{ "lat": 40.41, "lng": -3.71, "type": "...", "severity": "critical" }],
    "session": { "id": "...", "vehicleId": "...", "startTime": "...", "endTime": "..." },
    "stats": { ... }
  }
}
```

---

*Documento de diseño. Revisar y actualizar antes de implementar. No ejecutar cambios sin validar el plan.*
