# DobackSoft — Referencia de API

> Todos los endpoints documentados. Válido para `artificial-word` (puerto 3001) y `dobackv2` (puerto 9998).  
> **Fecha:** 2026-03-08

---

## artificial-word — API DobackSoft (puerto 3001)

Base URL: `http://localhost:3001/api/dobacksoft`

### Endpoints públicos (sin auth)

---

#### `GET /api/dobacksoft/stats`

Devuelve estadísticas del programa de early adopters.

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "citizensCount": 0,
    "maxCitizens": 1000,
    "slotsRemaining": 1000,
    "priceEarly": 9.99,
    "priceRegular": 29
  }
}
```

---

#### `POST /api/dobacksoft/coupon/validate`

Valida un cupón de acceso anticipado.

**Body:**
```json
{ "code": "FUNDADOR1000" }
```

**Cupones válidos:**
- `FUNDADOR1000` — early adopter (mientras queden plazas)
- `DEMO` — siempre válido, precio early

**Respuesta (válido):**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "price": 9.99,
    "isEarlyAdopter": true,
    "slotsRemaining": 999,
    "message": "Cupón válido. Tu precio: €9.99/mes (en lugar de €29).",
    "accessCode": "DOBACK-AB12-CD34"
  }
}
```

**Respuesta (inválido):**
```json
{
  "success": true,
  "data": {
    "valid": false,
    "price": 29,
    "isEarlyAdopter": false,
    "slotsRemaining": 1000,
    "message": "Cupón no válido. Precio estándar: €29/mes."
  }
}
```

---

#### `POST /api/dobacksoft/citizens`

Registra un ciudadano fundador (incrementa contador).

**Body:** ninguno requerido

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "citizensCount": 1,
    "slotsRemaining": 999,
    "message": "¡Bienvenido, ciudadano #1!"
  }
}
```

**Error (plazas agotadas):**
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "No quedan plazas de fundador." } }
```
HTTP 422.

---

#### `GET /api/dobacksoft/trailer`

Devuelve el video MP4 del trailer. HTTP 404 si no existe el archivo.

**Content-Type:** `video/mp4`

---

#### `POST /api/dobacksoft/upload`

Sube archivos de telemetría. Crea una sesión en el store.

**Content-Type:** `multipart/form-data`

**Campos:**
| Campo | Tipo | Máx. | Descripción |
|-------|------|------|-------------|
| `vehicleName` | string | 80 chars | Nombre del vehículo |
| `ESTABILIDAD` | file (CSV) | 50 MB | Datos de estabilidad |
| `GPS` | file (CSV/GPX) | 50 MB | Coordenadas GPS |
| `ROTATIVO` | file (CSV) | 50 MB | Estado del rotativo (opcional) |

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "sessionId": "upload-1709900000000-abc123",
    "message": "2 archivo(s) recibidos. Sesión creada. Revisa \"Ver rutas\"."
  }
}
```

---

#### `GET /api/dobacksoft/sessions`

Lista todas las sesiones disponibles.

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "mock-session-1",
      "vehicleId": "v1",
      "vehicleName": "Vehículo demo",
      "startTime": "2025-03-08T10:00:00Z",
      "endTime": "2025-03-08T10:30:00Z",
      "distanceKm": 12.5,
      "durationSeconds": 1800
    }
  ]
}
```

---

#### `GET /api/dobacksoft/session-route/:id`

Devuelve la ruta GPS y eventos de una sesión.

**Parámetros:** `:id` — ID de la sesión

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "route": [
      { "lat": 40.4168, "lng": -3.7038, "speed": 0, "timestamp": "2025-03-08T10:00:00Z" }
    ],
    "events": [
      { "lat": 40.42, "lng": -3.698, "type": "EXCESO_VELOCIDAD", "severity": "moderate" }
    ],
    "session": { "id": "mock-session-1", "vehicleName": "Vehículo demo" }
  }
}
```

---

## dobackv2 — API StabilSafe V3 (puerto 9998)

Base URL: `http://localhost:9998/api`

### Auth

---

#### `POST /api/auth/login`

```json
{ "email": "antoniohermoso92@manager.com", "password": "password123" }
```

**Respuesta:**
```json
{
  "user": { "id": "...", "email": "...", "role": "MANAGER", "organizationId": "..." },
  "accessToken": "eyJ..."
}
```

Cookie `refreshToken` (httpOnly) también se establece.

---

#### `POST /api/auth/refresh-token`

Renueva el accessToken usando la cookie httpOnly.

---

#### `POST /api/auth/logout`

Invalida la sesión.

---

### Salud del sistema

#### `GET /health` o `GET /api/health`

```json
{ "status": "ok", "timestamp": "2026-03-08T12:00:00Z", "version": "3.0.0" }
```

---

### Dashboard y KPIs

#### `GET /api/dashboard`

KPIs principales de la organización del usuario.

**Headers:** `Authorization: Bearer <token>` (o cookie)

**Respuesta:** métricas de disponibilidad, tiempos de respuesta, eventos del día, alertas activas.

---

#### `GET /api/kpis`

KPIs avanzados por vehículo/flota/período.

**Query params:**
| Param | Tipo | Descripción |
|-------|------|-------------|
| `vehicleId` | string | Filtrar por vehículo |
| `from` | ISO date | Inicio del período |
| `to` | ISO date | Fin del período |
| `groupBy` | `day\|week\|month` | Agrupación |

---

### Vehículos

#### `GET /api/vehicles`

Lista vehículos de la organización.

#### `POST /api/vehicles`

Crear vehículo.

```json
{
  "name": "Bomba 01",
  "plateNumber": "1234-ABC",
  "vehicleType": "BOMBA",
  "parkId": "..."
}
```

#### `GET /api/vehicles/:id`

Detalle de un vehículo con KPIs recientes.

#### `PUT /api/vehicles/:id`

Actualizar vehículo.

---

### Subida de archivos

#### `POST /api/upload`

Subida principal de archivos de telemetría.

**Content-Type:** `multipart/form-data`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `vehicleId` | string (required) | ID del vehículo |
| `ESTABILIDAD` | file CSV | Datos estabilidad del dispositivo Doback |
| `GPS` | file CSV/GPX | Puntos GPS |
| `CAN` | file CSV | Mediciones CAN bus |
| `ROTATIVO` | file CSV | Estado rotativo (clave 2/5) |

**Respuesta:**
```json
{
  "sessionId": "...",
  "jobId": "...",
  "message": "Procesando en segundo plano. Recibirás notificación al terminar."
}
```

---

### Sesiones

#### `GET /api/sessions`

Lista sesiones de la organización con filtros.

#### `GET /api/sessions/:id`

Detalle de sesión con KPIs calculados.

#### `GET /api/sessions/:id/route`

Ruta GPS completa de la sesión (GeoJSON).

#### `GET /api/sessions/:id/can`

Mediciones CAN de la sesión.

---

### Estabilidad

#### `GET /api/stability`

Eventos de estabilidad de la organización.

**Query:** `vehicleId`, `from`, `to`, `severity` (low|moderate|high|critical)

#### `GET /api/stability/events`

Listado detallado de eventos: frenazos, aceleraciones bruscas, excesos de velocidad.

---

### Telemetría

#### `GET /api/telemetry`

Datos de telemetría CAN/GPS en tiempo real o histórico.

#### `GET /api/telemetry/realtime`

Stream WebSocket de datos en tiempo real.

---

### Geofences

#### `GET /api/geofences`

Lista geocercas de la organización.

#### `POST /api/geofences`

Crear geocerca.

```json
{
  "name": "Parque Central",
  "type": "POLYGON",
  "coordinates": [[[lng, lat], ...]],
  "alertOnEnter": true,
  "alertOnExit": true
}
```

#### `PUT /api/geofences/:id`

Actualizar geocerca.

#### `DELETE /api/geofences/:id`

Eliminar geocerca.

#### `GET /api/geofences/:id/events`

Eventos de entrada/salida de la geocerca.

---

### Alertas

#### `GET /api/alerts`

Alertas activas de la organización.

**Query:** `severity` (low|medium|high|critical), `status` (open|acknowledged|resolved)

#### `PUT /api/alerts/:id/acknowledge`

Reconocer una alerta.

#### `GET /api/alert-rules`

Reglas de alertas configuradas (umbrales por variable).

#### `POST /api/alert-rules`

Crear regla de alerta.

```json
{
  "variable": "velocidad",
  "operator": "gt",
  "threshold": 120,
  "severity": "high",
  "vehicleId": "..."
}
```

---

### Mantenimiento

#### `GET /api/maintenance`

Tareas de mantenimiento de la flota.

**Tipos:** `preventive` | `corrective` | `predictive`

#### `POST /api/maintenance`

Crear tarea de mantenimiento.

#### `GET /api/maintenance/calendar`

Vista calendario de mantenimientos programados.

---

### Reportes y PDF

#### `GET /api/reports`

Lista reportes disponibles.

#### `POST /api/reports/pdf`

Generar PDF en 1 clic.

```json
{
  "type": "stability",
  "vehicleId": "...",
  "from": "2026-03-01",
  "to": "2026-03-08",
  "includeAI": true
}
```

**Respuesta:** URL de descarga del PDF o stream binario.

#### `GET /api/reports/scheduled`

Reportes programados (diario, semanal, mensual).

#### `POST /api/reports/scheduled`

Crear reporte programado.

---

### Inteligencia Artificial

#### `POST /api/ai/chat`

Chat con el asistente IA.

```json
{ "message": "¿Cuáles son los vehículos con más incidencias esta semana?" }
```

**Respuesta:**
```json
{
  "response": "Los vehículos con más incidencias son...",
  "patterns": [...],
  "recommendations": [...]
}
```

#### `GET /api/ai/patterns`

Patrones detectados por la IA en los datos recientes.

#### `GET /api/ai/recommendations`

Recomendaciones automáticas para la flota.

---

### Administración (solo ADMIN)

#### `GET /api/organizations`

Lista todas las organizaciones.

#### `POST /api/organizations`

Crear organización.

#### `GET /api/users`

Lista usuarios del sistema.

#### `POST /api/users`

Crear usuario.

#### `PUT /api/users/:id`

Actualizar usuario (incluye cambio de rol).

---

### WebSocket

#### `ws://localhost:9998/ws`

Eventos en tiempo real:

| Evento | Payload | Descripción |
|--------|---------|-------------|
| `tick` | `{ tick, agents }` | Tick de simulación |
| `alert` | `{ alertId, severity, message }` | Nueva alerta |
| `upload:complete` | `{ sessionId, kpisReady }` | Procesamiento terminado |
| `geofence:event` | `{ vehicleId, type, geofenceId }` | Entrada/salida geocerca |

---

## Códigos de error comunes

| Código HTTP | Código interno | Descripción |
|-------------|---------------|-------------|
| 400 | `VALIDATION_ERROR` | Parámetros inválidos |
| 401 | `UNAUTHORIZED` | Sin token o token inválido |
| 403 | `FORBIDDEN` | Sin permisos para este recurso |
| 404 | `NOT_FOUND` | Recurso no encontrado |
| 422 | `UNPROCESSABLE` | Entidad no procesable |
| 429 | `RATE_LIMIT` | Demasiadas peticiones |
| 500 | `INTERNAL_ERROR` | Error interno del servidor |

---

*DobackSoft API Reference — actualizado 2026-03-08*
