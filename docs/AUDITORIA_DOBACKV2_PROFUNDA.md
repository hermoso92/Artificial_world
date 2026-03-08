# Auditoría en profundidad — DobackSoft v2 (StabilSafe V3)

> **Documento de auditoría técnica** del repositorio DobackSoft v2 clonado en local.  
> **Ubicación:** `C:\Users\Cosigein SL\Desktop\dobackv2`  
> **Fecha:** Marzo 2025  
> **Referencia:** [AUDITORIA_DOBACKSOFT_ARTIFICIAL_WORLD.md](AUDITORIA_DOBACKSOFT_ARTIFICIAL_WORLD.md)

---

## 1. Resumen ejecutivo

| Aspecto | Estado | Notas |
|---------|--------|-------|
| **Proyecto** | ✅ Completo y funcional | 388 commits, 5050+ archivos |
| **Stack** | Node.js + Express + Prisma + PostgreSQL + Redis | TypeScript backend, React 18 + TS frontend |
| **Seguridad** | ✅ Helmet, rate limiting, CORS configurado | JWT httpOnly, multi-tenant |
| **Tests** | ✅ Unitarios y de integración | cross-org.test.ts, KPIs, etc. |
| **Documentación** | ✅ Extensa | docs/ con 00-INICIO, MODULOS, BACKEND, etc. |
| **Inicio** | ✅ `iniciar.ps1` | Puertos 9998, 5174 |

---

## 2. Estructura del proyecto

### 2.1 Árbol principal

```
dobackv2/
├── backend/           # API Express + Prisma (762 TS, 166 Python, 158 JS)
├── frontend/          # React 18 + TypeScript + Vite (405 TSX, 292 TS)
├── prisma/            # Schema Prisma (80+ modelos)
├── docs/              # 1,479 archivos (1,260 Markdown)
├── scripts/           # 448 archivos (PowerShell, TS, JS)
├── database/          # Migraciones SQL, PostGIS
├── config/            # Configuración Python/YAML
├── tests/             # Playwright, integración
├── migrations/        # Alembic
└── iniciar.ps1       # Script oficial de inicio
```

### 2.2 Backend — Organización

| Carpeta | Contenido |
|---------|-----------|
| `backend/src/routes/` | 50+ archivos de rutas (auth, vehicles, telemetry, upload, etc.) |
| `backend/src/controllers/` | Controladores por dominio |
| `backend/src/services/` | Lógica de negocio, parsers, caché |
| `backend/src/middleware/` | auth, requireOrg, rateLimit, cors, error |
| `backend/src/utils/` | logger, validators, report builders |
| `backend/src/workers/` | BullMQ (reportWorker) |
| `backend/src/websocket/` | alertWebSocket |

### 2.3 Frontend — Organización

| Carpeta | Contenido |
|---------|-----------|
| `frontend/src/pages/` | Páginas por módulo (UnifiedDashboard, UnifiedEstabilidad, etc.) |
| `frontend/src/components/` | Componentes reutilizables |
| `frontend/src/contexts/` | AuthContext, AppModeContext, TrainingAuthContext |
| `frontend/src/config/api.ts` | URLs centralizadas (sin hardcodear) |
| `frontend/src/routes.tsx` | Rutas React con lazy loading |

---

## 3. Base de datos (Prisma + PostgreSQL)

### 3.1 Modelos principales (80+)

| Dominio | Modelos clave |
|---------|---------------|
| **Core** | Organization, User, Vehicle, Park |
| **Sesiones** | Session, GpsMeasurement, CanMeasurement, RotativoMeasurement |
| **Estabilidad** | StabilityMeasurement, stability_events, SpeedViolation |
| **Geofences** | Geofence, GeofenceEvent, GeofenceRule |
| **Operaciones** | Event, Alert, AlertRule, MaintenanceRecord |
| **Reportes** | Report, InformeGenerado, ScheduledReport |
| **KPIs** | AdvancedVehicleKPI, VehicleKPI, daily_kpi |
| **Formación** | TrainingUser, TrainingRoute, TrainingKiosk, conductores |
| **Ingesta** | ArchivoSubido, IngestionJob, ProcessingEvent |

### 3.2 Extensions

- **PostGIS** para datos geoespaciales (GPS, geofences).

### 3.3 Migraciones

- `database/migrations/` — 38 archivos SQL.
- `prisma migrate` para schema evolutivo.

---

## 4. API y rutas

### 4.1 Rutas principales (registradas en routes/index.ts)

| Ámbito | Rutas | Auth |
|--------|-------|------|
| **Auth** | login, register, refresh-token | Público (rate limited) |
| **Dashboard** | metrics, vehicles, alarms | authenticate + requireOrg |
| **Estabilidad** | sessions, events, regenerate | authenticate + requireOrg |
| **Telemetría** | sessions, points, route, geofences | authenticate |
| **Upload** | upload, multiple, files | authenticate |
| **Reportes** | generate-pdf, download-pdf | authenticate |
| **Geofences** | CRUD zones | authenticate + requireOrg |
| **Vehicles** | CRUD, telemetry, maintenance | authenticate + requireOrg |
| **Users** | CRUD, roles, permissions | authorize(ADMIN/MANAGER) |
| **Organizations** | CRUD | authorize(ADMIN) |
| **Training** | kiosk, student, instructor | trainingAuth |

### 4.2 Endpoints públicos (sin auth)

- `GET /health`, `GET /api/health`
- `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/refresh-token`
- `POST /api/training/auth/start` (kioskCode), `POST /api/training/auth/rfid`

### 4.3 Configuración API (frontend)

- **api.ts**: `API_BASE_URL` desde `VITE_API_URL` o `http://localhost:9998`.
- Endpoints por módulo: DASHBOARD_ENDPOINTS, STABILITY_ENDPOINTS, REPORTS_ENDPOINTS, etc.
- Timeout configurable: `VITE_API_TIMEOUT` (default 30s).

---

## 5. Seguridad

### 5.1 Middleware de seguridad

| Middleware | Ubicación | Descripción |
|------------|-----------|-------------|
| **Helmet** | server.ts, security.ts | Cabeceras de seguridad |
| **Rate limiting** | rateLimiter.ts, rateLimit.ts | General, auth, training, upload |
| **CORS** | cors.ts, config/env.ts | Orígenes permitidos (CORS_ORIGIN) |
| **authenticate** | auth.ts | JWT desde cookie httpOnly |
| **requireOrg** | requireOrg.ts | Filtro multi-tenant por `req.orgId` |
| **authorize** | users.ts | Roles ADMIN, MANAGER |

### 5.2 Multi-tenant

- **requireOrg**: ADMIN puede acceder a cualquier org (con override); MANAGER solo su org.
- **Handlers**: usar solo `req.orgId`; prohibido `req.query.organizationId` en lógica.
- **Tests**: `cross-org.test.ts` valida que MANAGER no acceda a datos de otra org.

### 5.3 Autenticación

- JWT en cookies httpOnly.
- Passport configurado.
- CSRF implementado (según AGENTS.md).

### 5.4 Variables de entorno sensibles

- `DATABASE_URL`, `JWT_SECRET`, `REDIS_URL`, `AWS_*` (S3).
- `.env.example` sin valores reales.

---

## 6. Módulos y funcionalidad

### 6.1 Módulos StabilSafe V3

| Módulo | Ruta frontend | Backend |
|--------|---------------|---------|
| Panel de Control | `/` (UnifiedDashboard) | dashboard, panel |
| Estabilidad | `/estabilidad` | stability, stabilityEvents |
| Telemetría | `/telemetria` | telemetry-v2, mapRoutes |
| IA | `/ia` | ai |
| Geofences | `/geofences` | geofences, zones |
| Operaciones | `/operaciones` | operations, alerts |
| Reportes | `/reportes` | reports, pdfExport |
| Administración | `/administration` | admin, users, organizations |
| Subida | `/upload` | upload, uploads, sessionsUpload |

### 6.2 Módulo Formación (Training)

- Rutas bajo `/training/*`: Kiosk, Student, Instructor, Admin.
- Auth: kioskCode, RFID, dev-login.
- Roles: ALUMNO, INSTRUCTOR, ADMIN_TRAINING.

### 6.3 Servicios auxiliares

- **Redis**: caché, colas BullMQ (reportes).
- **WebSocket**: alertas en tiempo real.
- **Cron**: ingesta automática, verificaciones.
- **S3**: archivos, reportes PDF.

---

## 7. Calidad y testing

### 7.1 Tests existentes

| Tipo | Ubicación | Ejemplo |
|------|-----------|---------|
| Unitarios | `backend/src/tests/` | cross-org.test.ts, KPIsServices.test.ts |
| Integración | `backend/src/tests/integration/` | DataProcessing, VehicleMonitoring |
| E2E | Playwright | `playwright.e2e.config.ts` |
| Frontend | `frontend/src/test/` | routes.test.tsx |

### 7.2 CI/CD

- GitHub Actions: `ci.yml`, `pr-validation.yml`.
- Badges en README.

---

## 8. Hallazgos y recomendaciones

### 8.1 Fortalezas

- ✅ Arquitectura clara: rutas → controladores → servicios.
- ✅ Multi-tenant bien implementado (requireOrg, tests cross-org).
- ✅ Configuración centralizada (api.ts, env).
- ✅ Documentación extensa en docs/.
- ✅ Helmet, rate limiting, CORS configurados.
- ✅ Lazy loading en frontend.
- ✅ Prisma + migraciones para evolución de schema.

### 8.2 Áreas de mejora

| Área | Observación | Recomendación |
|------|-------------|---------------|
| **Rutas legacy** | Algunas rutas usan solo `authenticate` sin `requireOrg` (telemetry, mapRoutes, sessionsUpload) | Migrar a `authenticate` + `requireOrg` según PROYECTO-REVISION-100 |
| **console.log** | Scripts de BD/CLI aún usan console.log (AGENTS.md: PARCIAL) | Sustituir por logger |
| **Componentes grandes** | Posible refactor de páginas >300 líneas | Extraer subcomponentes |
| **OpenAPI** | Swagger en /api-docs/ — spec puede estar desactualizado | Revisar y sincronizar con rutas |

### 8.3 Dependencias

- Backend: Express, Prisma, BullMQ, Passport, etc.
- Frontend: React, MUI, Leaflet, TomTom, Recharts.
- Revisar vulnerabilidades: `npm audit`, Snyk (`.snyk` presente).

---

## 9. Relación con Artificial World

| Aspecto | Artificial World | DobackSoft v2 |
|---------|------------------|---------------|
| Propósito | Simulación vida artificial, demo | Plataforma B2B estabilidad vehicular |
| Fire Simulator | Demo integrado (canvas 2D) | No incluido (formación tiene simulador) |
| Puertos | 3001, 5173 | 9998, 5174 |
| Persistencia | SQLite, in-memory | PostgreSQL, Redis |
| Auth | Cupón (DobackSoft demo) | JWT, ADMIN/MANAGER |

**Sinergias posibles:** Enlace desde Hub Artificial World → DobackSoft v2 (producto completo). Fire Simulator en Artificial World como teaser.

---

## 10. Comandos útiles

```powershell
# Iniciar DobackSoft v2
cd "C:\Users\Cosigein SL\Desktop\dobackv2"
.\iniciar.ps1

# Backend (manual)
cd dobackv2\backend; npm run dev

# Frontend (manual)
cd dobackv2\frontend; npm run dev

# Prisma
cd dobackv2\backend; npm run prisma:generate
npx prisma migrate status --schema=../prisma/schema.prisma

# Tests
cd dobackv2\backend; npm test
```

---

## 11. Referencias

| Documento | Ubicación |
|-----------|-----------|
| README, AGENTS.md | `dobackv2/` |
| AUDITORIA_PROYECTO.md | `dobackv2/AUDITORIA_PROYECTO.md` |
| Instalación Docker | `dobackv2/docs/INFRAESTRUCTURA/INSTALACION-LOCAL-DOCKER.md` |
| Guía desde cero | `dobackv2/docs/00-INICIO/GUIA-DESDE-CERO-LOCAL-Y-PRODUCCION.md` |
| Módulos | `dobackv2/docs/MODULOS/` |
| Auditoría integrada | `docs/AUDITORIA_DOBACKSOFT_ARTIFICIAL_WORLD.md` |

---

*Auditoría realizada sobre el repositorio clonado en `C:\Users\Cosigein SL\Desktop\dobackv2`.*
