# Auditoría integral: DobackSoft + Artificial World

> **Documento maestro** — Auditoría en profundidad, documentación unificada y roadmap de evolución.  
> **Fecha:** Marzo 2025  
> **Alcance:** Repositorio Artificial World (incluye módulo DobackSoft), visión DobackSoft/StabilSafe V3.

---

## 1. Resumen ejecutivo

### 1.1 Qué es cada producto

| Producto | Descripción | Ubicación actual |
|----------|-------------|------------------|
| **Artificial World** | Simulación de vida artificial 2D con agentes autónomos. IA por utilidad, grid, refugios, memoria espacial y social. | Motor Python (principal) + demo web (fullstack) |
| **DobackSoft** | Producto B2B integrado en la web: simulador de camión de bomberos (Fire Simulator), acceso por cupón, telemetría simulada. | Módulo dentro del mismo repo (frontend + backend) |

### 1.2 Visión DobackSoft (StabilSafe V3)

Según las reglas del proyecto, **DobackSoft** aspira a ser una plataforma B2B con:

| Componente | Rol |
|------------|-----|
| **Dispositivo Doback** | Hardware que recoge información: telemetría CAN, GPS, estabilidad del vehículo |
| **DobackSoft (software)** | Paneles, reportes, KPIs, visualización de trayectos, alarmas |
| **Módulos** | Panel de Control, Estabilidad, Telemetría (CAN/GPS), IA, Geofences, Operaciones, Reportes |

**Flujo objetivo:** Dispositivo Doback → ingesta datos → backend → paneles y reportes.

**Estado actual vs visión:** El módulo actual es un **demo/marketing** (Fire Simulator) que simula telemetría en canvas 2D. No hay integración con dispositivos reales ni con la visión StabilSafe V3.

### 1.3 Magnitud del trabajo

| Área | Estado | Esfuerzo estimado |
|-----|--------|-------------------|
| Auditoría código existente | ✅ Completada en este doc | — |
| Documentación unificada | ✅ Este documento | — |
| Evolución DobackSoft → StabilSafe | Pendiente | Alto |
| Integración mini-juego | Parcial (Fire Simulator existe) | Medio |
| Simulación/visualización trayectos | No existe | Alto |
| Incorporación IA | No existe | Medio |

---

## 2. Arquitectura actual

### 2.1 Flujo general

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ARTIFICIAL WORLD (fullstack)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  Landing → Hub (Constructor de Mundos)                                       │
│     ├── Tu Mundo (SimulationView)     → simulación agentes, refugios         │
│     ├── Arena (Minigames)             → Damas, 3 en raya                     │
│     ├── Emergencias (DobackSoft)      → cupón → Fire Simulator              │
│     ├── Observatorio (MissionControl) → vista en vivo, eventos              │
│     └── Admin                         → reset, overview                      │
└─────────────────────────────────────────────────────────────────────────────┘

Backend: Express (3001) → api.js, heroRefuge.js, dobacksoft.js, subscription.js, admin.js
Frontend: React + Vite (5173) → Hub, SimulationView, DobackSoft, FireSimulator, MissionControl
```

### 2.2 Persistencia por módulo

| Módulo | Persistencia | Dependencias |
|--------|--------------|--------------|
| DobackSoft | In-memory (store.js) | Ninguna |
| Simulación (World, refuges) | In-memory | Engine, WebSocket |
| Hero Worlds | In-memory | HeroRefuge singleton |
| Subscriptions | SQLite | — |
| Audit | SQLite (eventStore) | — |

**Conclusión:** DobackSoft es independiente. Si funciona, implica que Express + React + routing están operativos, pero no garantiza el resto.

---

## 3. Auditoría DobackSoft (en profundidad)

### 3.1 Archivos y responsabilidades

| Archivo | Líneas | Responsabilidad |
|---------|--------|-----------------|
| `frontend/src/components/DobackSoft.jsx` | 238 | Página principal: cupón, stats, trailer, acceso Fire Simulator |
| `frontend/src/components/FireSimulator.jsx` | ~743 | Demo jugable canvas 2D: mapa, telemetría simulada, niveles |
| `backend/src/dobacksoft/store.js` | 83 | Lógica cupón, ciudadanos, códigos de acceso |
| `backend/src/routes/dobacksoft.js` | 48 | API: stats, coupon/validate, citizens, trailer |

### 3.2 API DobackSoft

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/dobacksoft/stats` | Estadísticas (ciudadanos, plazas, precios) |
| POST | `/api/dobacksoft/coupon/validate` | Valida cupón, devuelve código de acceso |
| POST | `/api/dobacksoft/citizens` | Registra ciudadano fundador |
| GET | `/api/dobacksoft/trailer` | Video MP4 del trailer |

### 3.3 Fire Simulator — Contenido actual

| Promesa | Implementación |
|---------|----------------|
| Mapa de despacho en tiempo real | Minimap con posición camión e incendio, ruta dinámica |
| Telemetría del vehículo | Velocidad, combustible, temperatura, agua, sirena |
| Paisajes 2D realistas | Calles, edificios, tráfico, semáforos, peatones |
| Simulación de incidentes | Incendios, accidentes, lluvia, niebla, tormenta |
| Progresión y niveles | 5 niveles con dificultad creciente |

### 3.4 Configuración

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `DOBACKSOFT_COUPON_CODE` | Cupón válido fundadores | `FUNDADOR1000` |
| `dobacksoft_access_code` (localStorage) | Código para Fire Simulator | — |

### 3.5 Hallazgos de auditoría

| Área | Estado | Detalle |
|------|--------|---------|
| COUPON_CODE | ✅ Corregido | Ya usa `process.env.DOBACKSOFT_COUPON_CODE` |
| Persistencia ciudadanos | ⚠️ In-memory | Se pierde al reiniciar backend |
| Trailer | ⚠️ Opcional | 404 si no existe `assets/dobacksoft/fire_truck_trailer.mp4` |
| FireSimulator | ⚠️ >300 líneas | Viola AGENTS.md (743 líneas) |
| Telemetría | Simulada | No hay datos reales de dispositivo |
| Integración con Artificial World | Mínima | Solo navegación desde Hub |

---

## 4. Auditoría Artificial World (resumen)

### 4.1 Motor Python (principal)

- **13 acciones**: mover, comer, compartir, robar, huir, atacar, etc.
- **Modo Sombra**: control manual de una entidad.
- **Relaciones sociales**: confianza, miedo, hostilidad.
- **Persistencia**: SQLite (`mundo_artificial.db`).

### 4.2 Motor web (demo)

- **Simplificado**: Gather → Decide → Move → Combat → Reproduce.
- **Estado en memoria**: no persistente.
- **WebSocket**: tiempo real (tick, world, agents, logs).

### 4.3 Issues conocidos (auditorías previas)

| Auditoría | Hallazgos críticos |
|-----------|--------------------|
| Backend | Código debug en api.js (eliminado), CORS abierto, sin Helmet |
| Frontend | SimulationCanvas >300 líneas, SimulationView >300 líneas, `key={i}` en listas |
| Base de datos | schema.sql PostgreSQL no usado, DobackSoft in-memory |

---

## 5. Relación Artificial World ↔ DobackSoft

### 5.1 Puntos de contacto actuales

1. **Hub**: card "Emergencias" → navega a `#dobacksoft`.
2. **DobackSoft**: botón "Jugar Fire Simulator" → `#firesimulator`.
3. **Admin**: reset ciudadanos DobackSoft.
4. **Mismo backend/frontend**: comparten Express, React, puertos.

### 5.2 Puntos de desconexión

- DobackSoft no usa datos de la simulación (refugios, agentes).
- Fire Simulator no usa el mundo de Artificial World.
- No hay flujo de datos: dispositivo → backend → paneles (visión StabilSafe).

---

## 6. Propuesta: evolución y sinergias

### 6.1 DobackSoft como puerta al mini-juego

**Situación actual:** Fire Simulator es un mini-juego independiente (canvas 2D, WASD, niveles).

**Propuesta:**

1. **Entrada unificada**: Desde Hub → Emergencias → DobackSoft → Fire Simulator (ya existe).
2. **Recompensas cruzadas**: Completar misiones en Fire Simulator podría desbloquear contenido en "Tu Mundo" (ej. skin, bonus).
3. **Narrativa compartida**: "Protege tu comunidad" — el refugio del usuario podría ser el destino de la misión (futuro).

### 6.2 Simulación y visualización de trayectos (reales o ficticios)

**Objetivo:** Juego/simulación de visualización de trayectos de vehículos (reales o ficticios).

**Enfoque por fases:**

| Fase | Descripción | Dependencias |
|------|-------------|--------------|
| **Fase 1** | Reutilizar Fire Simulator: mapa 2D, telemetría, rutas. Añadir modo "replay" con datos ficticios (JSON). | FireSimulator.jsx, store |
| **Fase 2** | API para subir trayectos (lat, lon, timestamp, telemetría). Visualización en mapa Leaflet. | Backend nuevo, Leaflet |
| **Fase 3** | Integración dispositivo Doback: ingesta de datos reales, almacenamiento, visualización. | Dispositivo, API ingest |

**Arquitectura propuesta (Fase 2):**

```
┌──────────────┐     ┌─────────────────┐     ┌────────────────────┐
│ Dispositivo  │────▶│ POST /trajectory│────▶│ SQLite / archivos  │
│ o JSON       │     │ (ingest)        │     │ (trayectos)        │
└──────────────┘     └─────────────────┘     └────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ GET /trajectory/:id  →  GeoJSON / puntos  →  Mapa Leaflet        │
│ Panel: lista trayectos, filtros, reproducción en tiempo real      │
└──────────────────────────────────────────────────────────────────┘
```

### 6.3 Incorporación de IA a DobackSoft

**Casos de uso:**

| Caso | Descripción | Implementación sugerida |
|------|-------------|-------------------------|
| **Patrones en telemetría** | Detectar anomalías (frenazos bruscos, exceso velocidad). | Reglas + umbrales iniciales; luego modelo simple (ej. isolation forest) |
| **Recomendaciones** | "Reduce velocidad en curvas", "Revisa frenos". | Reglas basadas en eventos + LLM opcional para texto natural |
| **Predicción de rutas** | Sugerir ruta óptima según tráfico histórico. | Algoritmo de rutas (A*, Dijkstra) + datos históricos |
| **Chat IA** | Asistente para el operador. | Integración API LLM (OpenAI, Anthropic, local) |

**Integración con Artificial World:**

- El motor de decisión de Artificial World (`motor_decision.py`, utilidad) podría inspirar un "motor de recomendaciones" para DobackSoft: puntuar acciones posibles (rutas, maniobras) y elegir la óptima.
- No requiere LLM: reglas + scoring similar a los agentes.

---

## 7. Roadmap recomendado

### 7.1 Corto plazo (1–2 sprints)

| Tarea | Prioridad | Esfuerzo |
|-------|-----------|----------|
| Refactorizar FireSimulator.jsx (<300 líneas) | P1 | Medio |
| Persistir ciudadanos DobackSoft en SQLite | P1 | Bajo |
| Documentar API DobackSoft en índice único | P2 | Bajo |
| Añadir tests E2E para flujo cupón → Fire Simulator | P2 | Medio |

### 7.2 Medio plazo (3–6 meses)

| Tarea | Prioridad | Esfuerzo |
|-------|-----------|----------|
| API de trayectos (ingest + listado) | P0 | Alto |
| Visualización de trayectos en mapa (Leaflet) | P0 | Alto |
| Panel DobackSoft: KPIs, telemetría (datos ficticios primero) | P1 | Alto |
| Integración IA: detección de patrones/anomalías | P1 | Medio |

### 7.3 Largo plazo (6+ meses)

| Tarea | Prioridad | Esfuerzo |
|-------|-----------|----------|
| Integración dispositivo Doback real | P0 | Muy alto |
| **Nota:** StabilSafe V3 ya está implementado en dobackv2 (repo separado) | — | — |
| Chat IA / recomendaciones (dobackv2 ya tiene módulo IA) | P1 | Medio |
| Sinergia narrativa: Fire Simulator (Artificial World) ↔ DobackSoft v2 | P2 | Medio |

---

## 8. Repositorio DobackSoft separado (dobackv2)

### 8.1 Repositorio DobackSoft v2 — StabilSafe V3

**URL:** https://github.com/hermoso92/dobackv2  
**Clonado en:** `C:\Users\Cosigein SL\Desktop\dobackv2`

Es un **proyecto independiente** con stack completo:

| Aspecto | DobackSoft v2 |
|---------|---------------|
| **Backend** | Node.js + Express + Prisma + PostgreSQL + Redis |
| **Frontend** | React 18 + TypeScript + Vite + Tailwind + Leaflet + TomTom |
| **Puertos** | 9998 (backend), 5174 (frontend) |
| **Inicio** | `.\iniciar.ps1` (único método oficial) |
| **Auth** | JWT + httpOnly cookies, roles ADMIN/MANAGER |
| **Multi-tenant** | Filtro por `organizationId` en todos los handlers |

### 8.2 Módulos DobackSoft v2 (StabilSafe V3)

| Módulo | Descripción |
|--------|-------------|
| Panel de Control | KPIs, modo TV Wall, mantenimiento, alertas |
| Estabilidad | Métricas conducción, eventos críticos, comparador, PDF |
| Telemetría | CAN en tiempo real, mapa GPS, alarmas, comparador CAN/GPS |
| Inteligencia Artificial | Chat IA, patrones detectados, recomendaciones |
| Geofences | CRUD zonas, eventos entrada/salida, alertas |
| Operaciones | Eventos, alertas, mantenimiento |
| Reportes | PDF automático, personalizables, comparativos |
| Administración | Organizaciones, usuarios, configuración (solo ADMIN) |

### 8.3 Base de datos (Prisma + PostgreSQL)

Modelos principales: `Organization`, `Vehicle`, `Session`, `CanMeasurement`, `GpsPoint`, `AdvancedVehicleKPI`, `ArchivoSubido`, `Geofence`, etc. Schema en `prisma/schema.prisma`.

### 8.4 Diferencias: Artificial World vs DobackSoft v2

| Aspecto | Artificial World (módulo DobackSoft) | DobackSoft v2 (repo separado) |
|---------|-------------------------------------|-------------------------------|
| Propósito | Demo Fire Simulator + cupón fundadores | Plataforma B2B estabilidad vehicular |
| Persistencia | In-memory | PostgreSQL + Redis |
| Auth | No (cupón solo) | JWT, ADMIN/MANAGER |
| Telemetría | Simulada (canvas) | Real (CAN, GPS, sesiones) |
| Mapas | Canvas 2D | Leaflet + TomTom |
| Puertos | 3001, 5173 | 9998, 5174 |

### 8.5 Situación en Artificial World

En el workspace **Artificial World**, DobackSoft es un **módulo demo** (Fire Simulator) integrado en el Hub. El **producto comercial completo** está en el repo `dobackv2`.

### 8.6 Cómo iniciar DobackSoft v2 (ya clonado)

```powershell
cd "C:\Users\Cosigein SL\Desktop\dobackv2"
.\iniciar.ps1
```

- Requiere Docker para PostgreSQL y Redis (ver `docs/INFRAESTRUCTURA/INSTALACION-LOCAL-DOCKER.md`).
- Acceso: http://localhost:5174 — usuario `antoniohermoso92@manager.com`, password `password123`.

### 8.7 Sinergias entre ambos repos

| Opción | Descripción |
|--------|-------------|
| **Puerta de entrada** | Hub Artificial World → Emergencias → enlace a DobackSoft v2 (https://tu-dominio-dobacksoft.com) |
| **Demo integrada** | Fire Simulator en Artificial World como teaser; DobackSoft v2 como producto completo |
| **Componentes compartidos** | Extraer lógica de mapas/telemetría a librería npm reutilizable |
| **Narrativa** | "Protege tu comunidad" — refugio Artificial World como destino de misión en DobackSoft |

### 8.8 Recomendación

Mantener **DobackSoft como módulo demo** dentro de Artificial World como puerta de entrada. El **producto comercial** (dobackv2) se ejecuta por separado. Evaluar integración (iframe, enlace, SSO) según estrategia de producto.
- Equipo dedicado
- Despliegue independiente
- Ciclo de releases distinto

Hasta entonces, evolucionar el módulo actual hacia paneles, trayectos e IA.

---

## 9. Checklist de verificación

### DobackSoft actual

- [ ] Cupón `FUNDADOR1000` o `DEMO` funciona
- [ ] Código de acceso se guarda en localStorage
- [ ] Fire Simulator arranca con código válido
- [ ] Trailer se sirve si existe `assets/dobacksoft/fire_truck_trailer.mp4`
- [ ] Admin puede resetear ciudadanos
- [ ] Stats muestran ciudadanos/máximo/precios

### Artificial World

- [ ] `iniciar_fullstack.ps1` arranca backend 3001 y frontend 5173
- [ ] Hub muestra todas las cards (Tu Mundo, Arena, Emergencias, Observatorio)
- [ ] Simulación, Mission Control, minijuegos accesibles
- [ ] WebSocket envía ticks en tiempo real

### Integración

- [ ] Navegación Hub → Emergencias → DobackSoft → Fire Simulator fluida
- [ ] Sin conflictos de rutas (`#dobacksoft`, `#firesimulator`)

---

## 10. Referencias

### Artificial World (este repo)

| Documento | Contenido |
|-----------|-----------|
| [DOBACKSOFT_FLUJO.md](DOBACKSOFT_FLUJO.md) | Flujo cupón → código → Fire Simulator |
| [PROYECTO_GUIA.md](PROYECTO_GUIA.md) | Guía técnica, stack, API |
| [AUDITORIA_BACKEND_EXPRESS.md](AUDITORIA_BACKEND_EXPRESS.md) | Backend Express |
| [AUDITORIA_FRONTEND_REACT.md](AUDITORIA_FRONTEND_REACT.md) | Frontend React |
| [AUDITORIA_BASE_DATOS.md](AUDITORIA_BASE_DATOS.md) | Base de datos |
| [AGENTE_ENTRANTE.md](../AGENTE_ENTRANTE.md) | Motor Python, estructura completa |

### DobackSoft v2 (repo separado)

| Documento | Ubicación |
|-----------|-----------|
| README, AGENTS.md | `C:\Users\Cosigein SL\Desktop\dobackv2\` |
| **Auditoría profunda** | [AUDITORIA_DOBACKV2_PROFUNDA.md](AUDITORIA_DOBACKV2_PROFUNDA.md) |
| **Plan integración** | [PLAN_INTEGRACION_DOBACKSOFT_ARTIFICIAL_WORLD.md](PLAN_INTEGRACION_DOBACKSOFT_ARTIFICIAL_WORLD.md) |
| Instalación Docker | `dobackv2\docs\INFRAESTRUCTURA\INSTALACION-LOCAL-DOCKER.md` |
| Guía desde cero | `dobackv2\docs\00-INICIO\GUIA-DESDE-CERO-LOCAL-Y-PRODUCCION.md` |
| Módulos | `dobackv2\docs\MODULOS\` |

---

*Documento generado como auditoría integral DobackSoft + Artificial World. Revisar y actualizar según evolución del proyecto.*
