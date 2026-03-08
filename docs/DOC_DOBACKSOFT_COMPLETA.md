# DobackSoft — Documentación completa

> Un solo documento para entender el producto, la arquitectura, el estado real y el roadmap.  
> Escrito para fundadores, desarrolladores, testers e inversores.  
> **Fecha:** 2026-03-08

---

## Índice

1. [Qué es DobackSoft](#1-qué-es-dobacksoft)
2. [Los dos repositorios](#2-los-dos-repositorios)
3. [DobackSoft en Artificial World (demo)](#3-dobacksoft-en-artificial-world-demo)
4. [DobackSoft v2 — StabilSafe V3 (producto)](#4-dobacksoft-v2--stabilsafe-v3-producto)
5. [Base de datos](#5-base-de-datos)
6. [Arquitectura técnica](#6-arquitectura-técnica)
7. [Flujos principales](#7-flujos-principales)
8. [Estado real hoy](#8-estado-real-hoy)
9. [Roadmap](#9-roadmap)
10. [Cómo contribuir](#10-cómo-contribuir)

---

## 1. Qué es DobackSoft

**DobackSoft** es una plataforma B2B de análisis de estabilidad y telemetría vehicular para flotas de emergencia (bomberos, policía, ambulancias).

**Propósito central:** un vehículo de emergencia lleva el dispositivo Doback. Ese dispositivo recoge datos CAN (bus de datos del vehículo), GPS, estado del rotativo y estabilidad. DobackSoft procesa, visualiza y analiza esos datos.

**Tesis de producto:** *Cada vehículo de emergencia tiene una historia. DobackSoft la cuenta.*

### El dispositivo Doback

```
Vehículo de emergencia
  └── Dispositivo Doback (hardware)
        ├── Bus CAN  → velocidad, rpm, combustible, temperatura, frenos
        ├── GPS      → posición, trayecto, geofences
        └── Rotativo → clave 2 (contacto) / clave 5 (emergencia)
              └── DobackSoft (software) ← ingesta, procesamiento, paneles
```

### Para quién es

| Perfil | Uso |
|--------|-----|
| **Jefe de parque** | Ver disponibilidad de flota, tiempos de respuesta, incidencias |
| **Conductor** | Ver su historial, formación, recomendaciones |
| **Gerente de organización** | KPIs, reportes PDF, comparativos |
| **Administrador** | Gestión de usuarios, organizaciones, configuración global |

---

## 2. Los dos repositorios

| | `artificial-word` | `dobackv2` |
|--|-------------------|------------|
| **Qué es** | Demo Fire Simulator + cupón fundadores | Producto comercial completo (StabilSafe V3) |
| **Propósito** | Laboratorio + superficie de marketing | Plataforma B2B real |
| **Backend** | Node.js Express (SQLite, in-memory) | Node.js Express + TypeScript + Prisma + PostgreSQL + Redis |
| **Frontend** | React + JavaScript + Vite | React 18 + TypeScript + Vite + Tailwind + Leaflet + TomTom |
| **Auth** | No (solo cupón) | JWT + httpOnly cookies, roles ADMIN/MANAGER |
| **Multi-tenant** | No | Sí — filtro `organizationId` en todos los handlers |
| **Puertos** | Backend 3001, Frontend 5173 | Backend 9998, Frontend 5174 |
| **Inicio** | `.\scripts\iniciar_fullstack.ps1` | `.\iniciar.ps1` |
| **Persistencia** | In-memory + SQLite básico | PostgreSQL + Redis |

**Regla de oro:** el módulo DobackSoft en `artificial-word` es una puerta de entrada y demo de marketing. El producto real vive en `dobackv2`.

---

## 3. DobackSoft en Artificial World (demo)

### 3.1 Qué hace

El módulo demo en `artificial-word` tiene tres componentes:

**Acceso por cupón (`DobackSoft.jsx`)**
- El usuario introduce el cupón `FUNDADOR1000` o `DEMO`
- El backend valida y devuelve un código de acceso único (`DOBACK-XXXX-XXXX`)
- Los primeros 1000 usuarios pagan €9.99/mes en lugar de €29/mes
- El código se guarda en `localStorage`

**Fire Simulator (`FireSimulator.jsx`)**
- Minijuego canvas 2D: conduces un camión de bomberos
- Tráfico, semáforos, peatones, edificios generados proceduralmente
- Telemetría simulada: velocidad, combustible, temperatura, agua, sirena
- 5 niveles con dificultad creciente
- Climatología: lluvia, niebla, tormenta

**Visor de rutas (`VisorRuta2D.jsx`)**
- Canvas 2D que visualiza trayectos GPS
- Proyección Mercator simplificada
- Colores por evento (azul = ruta, naranja = incidente)
- Datos mock cuando no hay backend conectado

**Subida de archivos (`SubidaManualLite.jsx`)**
- Formulario para subir CSV/GPX de estabilidad, GPS y rotativo
- Límite 50 MB por archivo
- Crea sesión en el backend mock

### 3.2 API en `artificial-word`

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/dobacksoft/stats` | Ciudadanos registrados, plazas restantes, precios |
| `POST` | `/api/dobacksoft/coupon/validate` | Validar cupón → código de acceso |
| `POST` | `/api/dobacksoft/citizens` | Registrar ciudadano fundador |
| `GET` | `/api/dobacksoft/trailer` | Video MP4 del trailer |
| `POST` | `/api/dobacksoft/upload` | Subir archivos CSV/GPX |
| `GET` | `/api/dobacksoft/sessions` | Listar sesiones subidas |
| `GET` | `/api/dobacksoft/session-route/:id` | Ruta GPS de una sesión |

### 3.3 Configuración

| Variable | Valor por defecto | Descripción |
|----------|------------------|-------------|
| `DOBACKSOFT_COUPON_CODE` | `FUNDADOR1000` | Cupón válido para early adopters |
| `dobacksoft_access_code` (localStorage) | — | Código guardado en el navegador |

### 3.4 Estado real

| Componente | Estado | Nota |
|------------|--------|------|
| Cupón + código de acceso | ✅ Funcional | `DEMO` o `FUNDADOR1000` |
| Fire Simulator | ✅ Funcional | Canvas 2D, WASD, 5 niveles |
| Visor de rutas 2D | ✅ Funcional | Con datos mock siempre disponible |
| Subida de archivos | ✅ Funcional | Mock — no procesa datos reales |
| Persistencia ciudadanos | ⚠️ In-memory | Se pierde al reiniciar el backend |
| Trailer de video | ⚠️ Opcional | 404 si no existe el MP4 |
| FireSimulator líneas | ⚠️ 936 líneas | Viola límite de 300 (AGENTS.md) |
| Datos telemetría | Demo | No conecta con dispositivo real |

---

## 4. DobackSoft v2 — StabilSafe V3 (producto)

### 4.1 Qué es

**StabilSafe V3** es la plataforma B2B completa. Multi-tenant, con autenticación real, procesamiento de archivos, cálculo de KPIs, visualización de mapas, exportación PDF y módulo de IA.

### 4.2 Los módulos del menú oficial V3

| Módulo | Ruta | Descripción |
|--------|------|-------------|
| Panel de Control | `/dashboard` | KPIs estratégicos, modo TV Wall, tendencias |
| Estabilidad | `/estabilidad` | Métricas conducción, eventos críticos, comparador, PDF |
| Telemetría | `/telemetry` | CAN en tiempo real, mapa GPS, alarmas, comparador |
| Inteligencia Artificial | `/ai` | Chat IA, patrones detectados, recomendaciones |
| Geofences | `/geofences` | CRUD zonas, eventos entrada/salida, alertas |
| Operaciones | `/operations` | Eventos, alertas, mantenimiento |
| Reportes | `/reports` | PDF en 1 clic, programados, comparativos |
| Administración | `/admin` | Solo ADMIN — usuarios, organizaciones, config |
| Base de Conocimiento | `/knowledge-base` | Solo ADMIN — documentación interna |
| Mi Cuenta | `/profile` | Perfil del usuario activo |

### 4.3 Stack técnico

**Backend (`dobackv2/backend/`)**

```
Node.js + TypeScript
Express.js
Prisma ORM → PostgreSQL
Redis + BullMQ (colas de procesamiento)
JWT + httpOnly cookies
Multer (subida de archivos)
Helmet, CORS, rate limiting
```

**Frontend (`dobackv2/frontend/`)**

```
React 18 + TypeScript
Vite 5
Tailwind CSS
Leaflet + TomTom (mapas)
Recharts (gráficas)
i18n (internacionalización)
```

**Infraestructura**

```
Docker + docker-compose
PostgreSQL (base de datos principal)
Redis (caché + colas BullMQ)
OSRM (cálculo de rutas)
```

### 4.4 Roles y permisos

| Rol | Acceso |
|-----|--------|
| `ADMIN` | Acceso total — todas las organizaciones, todos los módulos, configuración global |
| `MANAGER` | Solo su organización — todos los módulos excepto Administración y Base de Conocimiento |

**Multi-tenant:** cada handler usa `req.orgId` (asignado por el middleware `requireOrg`). Prohibido leer `req.query.organizationId` en handlers.

### 4.5 Flujo de datos principal

```
SUBIDA
  └── POST /api/upload (CSV de estabilidad, GPS, CAN, rotativo)
        └── BullMQ (cola de procesamiento)
              └── UnifiedFileProcessor
                    ├── Parser CSV → puntos GPS, mediciones CAN
                    ├── Calculador de KPIs (AdvancedVehicleKPI)
                    ├── Detección de eventos (frenazos, excesos velocidad)
                    └── Almacenamiento PostgreSQL

VISUALIZACIÓN
  ├── Panel de Control → KPIs agregados por organización/flota
  ├── Estabilidad → métricas por sesión, comparador, PDF
  ├── Telemetría → mapa GPS, datos CAN, alarmas
  └── Reportes → PDF en 1 clic (métricas + gráficas + análisis IA)
```

### 4.6 Cómo iniciar

**Requisitos:** Docker Desktop, Node.js 18+, PowerShell

```powershell
cd "C:\Users\Cosigein SL\Desktop\dobackv2"
.\iniciar.ps1
```

El script:
1. Libera puertos 9998 y 5174
2. Levanta PostgreSQL y Redis con Docker
3. Inicia backend en 9998
4. Inicia frontend en 5174
5. Abre el navegador automáticamente

**Credenciales de demo:**
- URL: `http://localhost:5174`
- Email: `antoniohermoso92@manager.com`
- Password: `password123`

### 4.7 Comandos de desarrollo

```powershell
# Backend
cd dobackv2/backend
npm install
npm run dev        # desarrollo con hot-reload
npm run build      # compilar TypeScript
npm test           # tests

# Frontend
cd dobackv2/frontend
npm install
npm run dev        # desarrollo Vite
npm run build      # build producción

# Prisma
npx prisma generate --schema=prisma/schema.prisma   # generar cliente
npx prisma migrate status --schema=prisma/schema.prisma  # estado migraciones
```

---

## 5. Base de datos

### 5.1 PostgreSQL (dobackv2)

Schema Prisma con ~40 modelos. Los principales:

| Modelo | Descripción |
|--------|-------------|
| `Organization` | Organización (parque, empresa) — raíz del multi-tenant |
| `User` | Usuarios con roles ADMIN/MANAGER |
| `Vehicle` | Vehículos de la flota |
| `Session` | Sesión de conducción (archivo subido) |
| `GpsPoint` | Punto GPS con lat, lng, velocidad, timestamp |
| `CanMeasurement` | Medición CAN (rpm, velocidad, temperatura, frenos...) |
| `AdvancedVehicleKPI` | KPIs calculados por vehículo/día |
| `StabilityEvent` | Eventos de estabilidad (frenazo, aceleración brusca...) |
| `Geofence` | Geocercas con geometría GeoJSON |
| `Alert` | Alertas con severidad y reglas configurables |
| `Maintenance` | Mantenimiento preventivo/correctivo/predictivo |

### 5.2 SQLite (artificial-word)

| Base de datos | Uso |
|---------------|-----|
| `mundo_artificial.db` | Motor Python — persistencia agentes |
| `audit_simulacion.db` | Node — event store |

### 5.3 Redis (dobackv2)

- Caché de KPIs y respuestas frecuentes
- Colas BullMQ para procesamiento asíncrono de archivos

---

## 6. Arquitectura técnica

### 6.1 Diagrama completo

```
┌─────────────────────────────────────────────────────────────────┐
│                     DOBACKSOFT COMPLETO                          │
│                                                                  │
│  DISPOSITIVO           ARTIFICIAL-WORD          DOBACKV2        │
│  Doback (HW)           (demo/marketing)         (producto)      │
│       │                       │                      │          │
│       │                 Landing Page           Login/Auth        │
│       │                 Hub → Emergencias       Dashboard        │
│       │                 Fire Simulator          Estabilidad      │
│       │                 VisorRuta2D             Telemetría       │
│       │                 Cupón FUNDADOR          IA / Chat        │
│       │                       │                Geofences        │
│       │                 Backend 3001            Operaciones      │
│       │                 SQLite/memory           Reportes PDF     │
│       │                                              │          │
│       └──────────────── ingesta CSV/GPS ─────────── Backend 9998│
│                                                      │          │
│                                               PostgreSQL + Redis │
│                                               BullMQ workers    │
│                                               PDF export        │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Auth flow (dobackv2)

```
POST /api/auth/login
  → JWT (accessToken 15min + refreshToken 7d)
  → httpOnly cookies
  → Frontend: authenticate middleware verifica JWT
  → requireOrg: asigna req.orgId según rol
    ├── ADMIN: puede ver cualquier org (override via body/query)
    └── MANAGER: solo su org (fijo)
```

### 6.3 Pipeline de procesamiento

```
POST /api/upload (multipart/form-data)
  → Multer recibe archivos
  → Validación: tipo, tamaño, vehicleId
  → BullMQ: encola job de procesamiento
  → Worker: UnifiedFileProcessor
      ├── Parsear CSV (ESTABILIDAD, GPS, CAN, ROTATIVO)
      ├── Detectar eventos (umbrales configurables)
      ├── Calcular AdvancedVehicleKPI por día
      └── Persistir en PostgreSQL
  → WebSocket: notificar al frontend cuando termina
```

---

## 7. Flujos principales

### 7.1 Flujo fundador (artificial-word)

```
1. Usuario llega al Hub de Artificial World
2. Hace clic en "Emergencias"
3. Introduce cupón: DEMO o FUNDADOR1000
4. Recibe código de acceso: DOBACK-XXXX-XXXX
5. Puede jugar Fire Simulator (WASD, 5 niveles)
6. Puede ver rutas en VisorRuta2D
7. Puede subir archivos CSV/GPX de prueba
```

### 7.2 Flujo operador (dobackv2)

```
1. Login con email/password → JWT
2. Panel de Control → ver KPIs de su flota
3. Estabilidad → seleccionar vehículo/fecha → ver métricas
4. Telemetría → ver mapa GPS + datos CAN en tiempo real
5. Exportar PDF con 1 clic
6. Configurar alertas y geofences
7. Ver recomendaciones de la IA
```

### 7.3 Flujo de subida de datos

```
1. Conductor termina servicio
2. Dispositivo Doback → archivos CSV (ESTABILIDAD, GPS, CAN)
3. Upload manual o automático a DobackSoft
4. BullMQ procesa en segundo plano
5. KPIs calculados y disponibles en panel
6. Alertas automáticas si se detectan anomalías
```

---

## 8. Estado real hoy

### artificial-word (módulo demo)

| Componente | Estado | Evidencia |
|------------|--------|-----------|
| Cupón + acceso | ✅ Real | `backend/src/dobacksoft/store.js` |
| Fire Simulator | ✅ Real | `frontend/src/components/FireSimulator.jsx` |
| VisorRuta2D | ✅ Real | `frontend/src/components/DobackSoft/VisorRuta2D.jsx` |
| SubidaManualLite | ✅ Real | `frontend/src/components/DobackSoft/SubidaManualLite.jsx` |
| API mock | ✅ Real | `backend/src/routes/dobacksoft.js` |
| Datos reales | ❌ No | Todo es mock/simulado |
| Persistencia | ⚠️ In-memory | Se pierde al reiniciar |
| Integración HW | ❌ No | Roadmap |

### dobackv2 (producto)

| Componente | Estado | Evidencia |
|------------|--------|-----------|
| Auth JWT multi-tenant | ✅ Real | `backend/src/middleware/authenticate.ts` |
| Ingesta CSV | ✅ Real | `UnifiedFileProcessor` |
| KPIs calculados | ✅ Real | `AdvancedVehicleKPI` model |
| Mapa GPS (Leaflet) | ✅ Real | `frontend/src/pages/` |
| Panel de Control | ✅ Real | `Dashboard.tsx` |
| Exportación PDF | ✅ Real | `pdfExport.ts` |
| Chat IA | ✅ Real | `AIController.ts`, Ollama |
| Geofences | ✅ Real | `GeofencesManager.tsx` |
| Reportes programados | ✅ Real | `AutomatedReportsController.ts` |
| BullMQ workers | ✅ Real | `workers/` |
| Integración dispositivo HW | ⚠️ Parcial | Depende de dispositivo físico |

---

## 9. Roadmap

### Corto plazo (1-2 semanas)

| Tarea | Repo | Prioridad |
|-------|------|-----------|
| Refactorizar `FireSimulator.jsx` (<300 líneas) | artificial-word | Alta |
| Persistir ciudadanos en SQLite | artificial-word | Media |
| Corregir URL hardcodeada en `aiCore.js` | artificial-word | Alta |
| Migrar rutas legacy `requireAuth` → `authenticate+requireOrg` | dobackv2 | Alta |

### Medio plazo (1-3 meses)

| Tarea | Repo | Prioridad |
|-------|------|-----------|
| Enlace Hub → DobackSoft v2 (producto real) | artificial-word | Alta |
| Panel de Control TV Wall completo | dobackv2 | Alta |
| Módulo Formación y conductores | dobackv2 | Media |
| Tests E2E flujo subida → KPIs | dobackv2 | Alta |

### Largo plazo (3-6 meses)

| Tarea | Descripción |
|-------|-------------|
| Integración dispositivo Doback | Hardware → ingesta automática |
| Sinergia narrativa | Refugio Artificial World = destino de misión Fire Simulator |
| Componentes compartidos | Extraer visor de rutas como librería npm |
| App móvil | React Native para conductores |

---

## 10. Cómo contribuir

### Reglas comunes (ambos repos)

- **Nunca** `console.log` → usar `logger`
- **Nunca** URLs hardcodeadas → usar `config/api.ts`
- **Nunca** cambiar puertos (3001/5173 en AW, 9998/5174 en dobackv2)
- **Nunca** crear módulos fuera del menú oficial V3
- **Siempre** filtro `organizationId` en todos los datos

### artificial-word

```powershell
# Iniciar
.\scripts\iniciar_fullstack.ps1

# Tests Python
$env:SDL_VIDEODRIVER="dummy"; $env:SDL_AUDIODRIVER="dummy"
python pruebas/run_tests_produccion.py

# Auditoría Chess (independiente)
docker compose -f docker/docker-compose.full.yml --profile audit up
```

### dobackv2

```powershell
# Iniciar (único método oficial)
.\iniciar.ps1

# Tests backend
cd backend && npm test

# Auditoría BBDD
.\scripts\ejecutar-auditoria-bbdd.ps1

# Definition of Done
# 1. tsc sin errores
# 2. No secrets hardcodeados
# 3. GET /health → 200
# 4. Migraciones Prisma limpias
```

---

## Referencias cruzadas

| Documento | Ubicación | Para quién |
|-----------|-----------|------------|
| `docs/AUDITORIA_DOBACKSOFT_ARTIFICIAL_WORLD.md` | artificial-word | Técnicos |
| `docs/AUDITORIA_DOBACKV2_PROFUNDA.md` | artificial-word | Técnicos |
| `docs/PLAN_INTEGRACION_DOBACKSOFT_ARTIFICIAL_WORLD.md` | artificial-word | Estrategia |
| `docs/OWNERSHIP_ESTRATEGICO.md` | artificial-word | Fundadores |
| `AGENTS.md` | dobackv2 | Devs |
| `docs/00-GENERAL/PROYECTO-REVISION-100.md` | dobackv2 | Devs |
| `docs/INFRAESTRUCTURA/INSTALACION-LOCAL-DOCKER.md` | dobackv2 | Devs |
| `docs/ACCESO_TESTERS.md` | artificial-word | Testers |

---

*DobackSoft — Cada vehículo de emergencia tiene una historia. DobackSoft la cuenta.*
