# AGENTS.md — DobackSoft (StabilSafe V3)

Formato abierto [agents.md](https://agents.md/). README para agentes de código: contexto e instrucciones para trabajar en el proyecto.

---

## Qué es DobackSoft

DobackSoft (StabilSafe V3) es una plataforma multi-tenant de análisis de estabilidad y telemetría vehicular (CAN/GPS), con panel de control, eventos, alertas, geocercas, reportes y exportación PDF. **Core vendible:** flota de vehículos por organización, ingesta y procesamiento de archivos (sesiones/eventos), KPIs operativos, estabilidad, telemetría CAN/GPS, geofences, reportes programados y exportación PDF en 1 clic. El resto (IA, diagnósticos, observabilidad) es valor añadido o interno.

---

## Reglas StabilSafe V3 (estado en repo)

| Regla | Estado | Notas |
|-------|--------|--------|
| Inicio único con `iniciar.ps1` (no arrancar backend/frontend a mano) | **OK** | Script libera puertos 9998/5174 e inicia ambos |
| URLs/API desde `frontend/src/config/api.ts` (nunca hardcodear) | **OK** | API_BASE_URL, endpoints, timeouts centralizados |
| Logging con `logger` (nunca `console.log` en código de producto) | **PARCIAL** | Algunos scripts de BD/CLI aún usan `console.log` |
| Puertos fijos: backend 9998, frontend 5174 | **OK** | No cambiar |
| Menú oficial V3 (módulos fijos; no añadir módulos fuera) | **OK** | Panel, Estabilidad, Telemetría, IA, Geofences, Operaciones, Reportes, Admin, Base Conocimiento, Mi Cuenta |
| Roles ADMIN / MANAGER; filtro por organización | **OK** | MANAGER solo su org; ADMIN acceso total |
| Auth: usar `authenticate` + `requireOrg` (no `requireAuth` legacy) | **PARCIAL** | Mayoría de rutas usan `authenticate`+`requireOrg`; `zones` migrado (2026-03-05). Pendientes: rutas solo authenticate (telemetry, mapRoutes, sessionsUpload, etc.). Ver [PROYECTO-REVISION-100.md](docs/00-GENERAL/PROYECTO-REVISION-100.md). |
| Handlers usan solo `req.orgId`; prohibido `req.query.organizationId` en handlers | **PARCIAL** | Un endpoint mock deprecado en `routes/index.ts` sigue usando `req.query.organizationId` sin validación → considerar **ROTA**; resto usa `req.orgId` |
| Flujo Subida → Procesamiento → Visualización → Comparación → Exportación PDF | **OK** | — |
| Documentar solo al cierre de fase (no documentar hasta cierre) | **OK** | Convención de proyecto |

Si algo no consta en repo o en esta tabla: **DESCONOCIDO**.

---

## Multi-tenant

- **Handlers:** usar **solo** `req.orgId` (asignado por el middleware `requireOrg`). Prohibido leer `req.query.organizationId` o `req.body.organizationId` en lógica de negocio salvo que exista un **ADMIN override** explícito y documentado en middleware.
- **ADMIN override:** el único lugar donde se permite leer `organizationId` de query/body es el middleware `requireOrg` (`backend/src/middleware/requireOrg.ts`), que para usuarios ADMIN puede fijar `req.orgId` desde `req.query.organizationId` o `req.body.organizationId`. Cualquier otro uso de query/body para organización en handlers se considera prohibido.

---

## Auth

- Usar **`authenticate`** (JWT/cookie) y **`requireOrg`** (asigna `req.orgId`) en rutas protegidas. No usar el legacy **`requireAuth`** en rutas nuevas; migrar las que aún lo usan a `authenticate` + `requireOrg`.
- Orden en rutas: `router.use(authenticate); router.use(requireOrg);` (o por ruta: `authenticate, requireOrg`).

---

## Seguridad

- **Endpoints públicos permitidos (sin auth):** `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/refresh-token` (o equivalente refresh), `GET /health`, `GET /api/health`. Todo lo demás debe estar detrás de autenticación.
- Rate limiting en `/api/auth` (login y register). Resto de `/api` con límite general.

---

## Administración y Sistema

Rutas y componentes del área "Administración y Sistema" (menú y Directorio):

| Ítem en UI | Ruta | Componente | Permiso |
|------------|------|------------|---------|
| Administración | `/administration` | ManagerAdministration | ADMIN |
| Config. Sistema | `/admin` | UnifiedAdmin | ADMIN (menú) |
| Observabilidad | `/observability` | ObservabilityPage | ADMIN (ruta y menú) |
| Base de Conocimiento | `/knowledge-base` | KnowledgeBase | ADMIN (permiso KNOWLEDGE_BASE_VIEW) |

- **Administración** (`/administration`): gestión de parques, vehículos, geocercas, zonas, usuarios MANAGER de la org y notificaciones. Una sola página con pestañas.
- **Config. Sistema** (`/admin`): panel con datos reales de usuarios y organizaciones (vía AdminAPI) y reportes automatizados.
- **Backend:** usuarios en `GET/POST/PUT/DELETE /api/users`; organizaciones en `GET/POST/PUT/DELETE /api/organizations`. AdminAPI en frontend usa `/api/users` y `/api/organizations` (no `/api/admin/users` ni `/api/admin/organizations`).

---

## Convención de trabajo

- **PRs atómicos:** un objetivo claro por PR; cambios agrupados por archivo en un solo diff cuando sea posible.
- **Checklist de verificación:** antes de merge, pasar checklist del proyecto (modularidad, menú V3, `config/api.ts`, `logger`, `organizationId`, `iniciar.ps1`). Ver también `.cursor/skills/dobacksoft-stabilsafe/` y `reference.md`.
- **Documentación:** no documentar hasta cierre de fase; un documento final por fase (ver `docs/AGENTS.md`).

---

## Comandos de proyecto

| Ámbito | Setup | Dev | Build | Test |
|--------|--------|-----|-------|------|
| **Backend** | `cd backend && npm install` | `npm run dev` (o usar `iniciar.ps1` desde raíz) | `npm run build` (tsc) | `npm test` |
| **Frontend** | `cd frontend && npm install` | `npm run dev` (o usar `iniciar.ps1`) | `npm run build` | `npm test` |
| **Raíz** | — | **`.\iniciar.ps1`** (método oficial; libera puertos, inicia backend + frontend) | — | — |

---

## Prisma / migraciones

- **Nunca** cerrar un PR con migración pendiente (schema o migraciones sin aplicar/revisar).
- Comandos desde **raíz** (schema en `prisma/schema.prisma`):  
  - Generar cliente: `cd backend && npm run prisma:generate` (o `npx prisma generate --schema=../prisma/schema.prisma`).  
  - Estado: `npx prisma migrate status --schema=prisma/schema.prisma`.  
  - Aplicar en dev: `cd backend && npm run prisma:migrate` (o equivalente `prisma migrate dev` apuntando al schema).

---

## Auditoría BBDD (pre-producción, subida masiva)

- **Skill usada:** `supabase-postgres-best-practices` (`.agents/skills/`) para FKs sin índice, VACUUM/ANALYZE, índices.
- **Ejecutar todo:** `.\scripts\ejecutar-auditoria-bbdd.ps1`
- **ANALYZE tablas con stats antiguas:** `npm run maintenance:analyze-stale` (tras subida masiva o cuando la auditoría lo indique)
- **Comandos individuales** (desde `backend`): `audit:bbdd-completa`, `audit:schema-consistency`, `audit:case-studies-org`
- **Tras subida masiva:** `npm run validate:post-upload`
- **Informe:** `docs/04-auditorias/AUDITORIA-BBDD-PRE-PRODUCCION-2026-02-10.md`

---

## Puertos y scripts típicos

- **Backend:** 9998. Health: `GET /health` y `GET /api/health` (mismo contrato).
- **Frontend:** 5174 (Vite).
- **Inicio completo:** `.\iniciar.ps1` (PowerShell, Windows). Libera 9998 y 5174, inicia backend y frontend, abre navegador.

---

## DoD universal (Definition of Done)

Antes de dar por cerrado un cambio/PR:

1. **`tsc`** sin errores en backend y/o frontend según lo tocado.
2. **Grep de secretos:** no commitear claves, tokens ni URLs sensibles hardcodeadas.
3. **Health:** `curl -s -o Nul -w "%{http_code}" http://localhost:9998/health` → 200 (o 503 solo si backend está unhealthy por diseño).
4. **Migraciones:** `npx prisma migrate status --schema=prisma/schema.prisma` limpio (sin migraciones pendientes sin aplicar, salvo que el PR sea precisamente para añadir/aplicar una).

---

## Cómo usar estos agentes

- **Frontend (UI, rutas, menú, permisos):** leer `frontend/AGENTS.md` y `docs/agents/uiagents.md`.
- **Auth, tenant, roles, endpoints públicos:** leer `docs/agents/authagents.md` (y si tocas backend auth) `backend/AGENTS.md`.
- **Pipeline (ingesta, procesamiento, jobs):** leer `docs/agents/pipelineagents.md` y `docs/agents/dbagents.md`.
- **API Express, rutas, DTOs, errores:** leer `docs/agents/apiagents.md` y `backend/AGENTS.md`.
- **Base de datos, Prisma, migraciones:** leer `docs/agents/dbagents.md` y `backend/AGENTS.md`.

**Prioridad:** el archivo AGENTS.md **más cercano** al archivo que se está editando gana sobre los demás; las instrucciones del usuario en el chat prevalecen sobre todo.
