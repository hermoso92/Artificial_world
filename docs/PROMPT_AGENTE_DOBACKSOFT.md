# Prompt completo para agente Cursor — DobackSoft

> **Uso:** Copia y pega este texto al iniciar una sesión con un agente de Cursor en el proyecto DobackSoft. Incluye contexto desde cero, reglas, estructura y **todos los problemas encontrados** en auditorías recientes para que el agente los conozca y pueda documentarlos o corregirlos.

---

## Texto para pegar al agente

```
Hola. Voy a trabajar en DobackSoft (StabilSafe V3). Aquí tienes todo el contexto desde cero: qué es el proyecto, reglas, estructura, y **todos los problemas encontrados** en auditorías recientes. Documenta y ten en cuenta estos problemas al trabajar.

---

## QUÉ ES DOBACKSOFT

DobackSoft es una plataforma B2B multi-tenant de análisis de estabilidad y telemetría vehicular (CAN/GPS). El dispositivo Doback recoge datos; DobackSoft muestra paneles, reportes y KPIs.

**Core vendible:** flota por organización, ingesta de archivos (sesiones/eventos), KPIs operativos, estabilidad, telemetría CAN/GPS, geofences, reportes programados y exportación PDF en 1 clic.

**Módulos oficiales (NO añadir otros):** Panel de Control, Estabilidad, Telemetría, IA, Geofences, Operaciones, Reportes, Administración, Base de Conocimiento, Mi Cuenta.

---

## UBICACIÓN Y ESTRUCTURA

- **Repositorio:** DobackSoft v2 — `C:\Users\Cosigein SL\Desktop\dobackv2` (o la ruta donde esté clonado)
- **Backend:** Node.js + Express + Prisma + PostgreSQL + Redis (puerto 9998)
- **Frontend:** React 18 + TypeScript + Vite + Tailwind + Leaflet + TomTom (puerto 5174)
- **Inicio único:** `.\iniciar.ps1` — NUNCA iniciar backend/frontend manualmente

**Estructura:** backend/src/routes/, controllers/, services/, middleware/, utils/ — frontend/src/pages/, components/, config/api.ts — prisma/schema.prisma (80+ modelos).

---

## REGLAS CRÍTICAS (NO VIOLAR)

1. **NUNCA iniciar backend/frontend** — usar siempre `iniciar.ps1`
2. **NUNCA hardcodear URLs** — usar `frontend/src/config/api.ts`
3. **NUNCA usar console.log** — usar `logger` de `utils/logger`
4. **NUNCA cambiar puertos** — 9998 (backend), 5174 (frontend)
5. **NUNCA crear módulos fuera del menú oficial**
6. **NUNCA exponer datos entre organizaciones** — siempre filtrar por `organizationId`
7. **NUNCA crear archivos .md en la raíz** — usar carpetas de `docs/`
8. **NUNCA dejar scripts temporales en la raíz** — usar `scripts/`

---

## MULTI-TENANT Y AUTH

- **Handlers:** usar solo `req.orgId` (asignado por `requireOrg`). Prohibido leer `req.query.organizationId` o `req.body.organizationId` en lógica de negocio.
- **Rutas protegidas:** `router.use(authenticate); router.use(requireOrg);` — usar `authenticate` + `requireOrg`, no el legacy `requireAuth`.
- **Roles:** ADMIN (acceso total), MANAGER (solo su organización).
- **ADMIN override:** solo en el middleware `requireOrg` puede fijarse `req.orgId` desde query/body para usuarios ADMIN.

---

## PROBLEMAS ENCONTRADOS (auditorías recientes)

**Importante:** Estos son los problemas conocidos. Al trabajar en código relacionado, documenta si los corriges o si encuentras más.

### 1. Rutas sin requireOrg (riesgo multi-tenant)

Algunas rutas usan solo `authenticate` sin `requireOrg`. Un MANAGER podría acceder a datos de otra organización si no se filtra correctamente.

| Ámbito | Rutas afectadas | Acción |
|--------|-----------------|--------|
| Telemetría | telemetry-v2, mapRoutes | Añadir `requireOrg` según PROYECTO-REVISION-100 |
| Upload | sessionsUpload | Añadir `requireOrg` |
| Otras | Revisar routes/index.ts | Migrar legacy `requireAuth` → `authenticate` + `requireOrg` |

**Referencia:** docs/00-GENERAL/PROYECTO-REVISION-100.md

### 2. Uso de console.log en scripts

AGENTS.md indica estado **PARCIAL**: algunos scripts de BD/CLI aún usan `console.log` en lugar de `logger`.

- **Acción:** Sustituir por `logger` de `utils/logger` en scripts de producto.
- **Dónde buscar:** scripts/, backend/src/scripts/, cualquier archivo que haga logging.

### 3. Endpoint mock con organizationId en query

Un endpoint mock deprecado en `routes/index.ts` sigue usando `req.query.organizationId` sin validación. AGENTS.md lo marca como **ROTA** (considerar eliminar o corregir).

- **Acción:** Localizar y eliminar/corregir para usar solo `req.orgId`.

### 4. Componentes frontend >300 líneas

Posible refactor de páginas que superan 300 líneas (límite recomendado en convenciones).

- **Acción:** Extraer subcomponentes o custom hooks para reducir tamaño.

### 5. OpenAPI / Swagger desactualizado

Swagger en `/api-docs/` — el spec puede estar desincronizado con las rutas actuales.

- **Acción:** Revisar `openapi.json` y sincronizar con rutas reales.

### 6. Dependencias y vulnerabilidades

- Ejecutar `npm audit` en backend y frontend.
- Revisar `.snyk` si existe.
- Actualizar dependencias con vulnerabilidades conocidas.

### 7. Estado PARCIAL de reglas (AGENTS.md)

| Regla | Estado | Notas |
|-------|--------|-------|
| Logging con logger | PARCIAL | Scripts BD/CLI aún usan console.log |
| Auth: authenticate + requireOrg | PARCIAL | Rutas telemetry, mapRoutes, sessionsUpload pendientes |
| Handlers solo req.orgId | PARCIAL | Endpoint mock deprecado usa req.query.organizationId |

---

## CONVENCIONES DE CÓDIGO

- **Un archivo por turno** — nunca múltiples archivos simultáneamente
- **Un diff agrupado** — todas las modificaciones en un bloque
- **Antes de editar** — leer contexto cercano (imports, funciones relacionadas)
- **TypeScript estricto** — no `any` sin justificación
- **PRs atómicos** — un objetivo claro por PR

---

## DOCUMENTACIÓN

- **Estructura:** `docs/00-INICIO/`, `docs/00-GENERAL/`, `docs/MODULOS/[modulo]/`, `docs/BACKEND/`, `docs/FRONTEND/`, `docs/INFRAESTRUCTURA/`, `docs/API/`, `docs/CALIDAD/`
- **Scripts:** `scripts/analisis/`, `scripts/testing/`, `scripts/setup/`, `scripts/utils/`
- **Documentar solo al cierre de fase** — no documentar hasta cierre
- **Problemas:** Si corriges un problema de la lista anterior, documenta el cambio en el PR o en docs/CALIDAD/.

---

## COMANDOS

- **Iniciar todo:** `.\iniciar.ps1`
- **Backend:** `cd backend && npm run dev` (o usar iniciar.ps1)
- **Frontend:** `cd frontend && npm run dev` (o usar iniciar.ps1)
- **Prisma generate:** `cd backend && npm run prisma:generate`
- **Prisma migrate:** `cd backend && npm run prisma:migrate`
- **Tests:** `cd backend && npm test`
- **Auditoría BBDD:** `.\scripts\ejecutar-auditoria-bbdd.ps1`

---

## DEFINITION OF DONE (antes de cerrar un cambio)

1. `tsc` sin errores en backend y/o frontend
2. No commitear claves, tokens ni URLs sensibles
3. Health check: `curl http://localhost:9998/health` → 200
4. Migraciones: `npx prisma migrate status --schema=prisma/schema.prisma` limpio
5. Si tocaste rutas: verificar que usen `authenticate` + `requireOrg` y `req.orgId`

---

## ACCESO POR DEFECTO

- **URL:** http://localhost:5174
- **Usuario:** antoniohermoso92@manager.com
- **Password:** password123

---

## ARCHIVOS CLAVE

- **AGENTS.md** — Reglas completas, multi-tenant, auth, DoD
- **.cursorrules** — Reglas Cursor del proyecto
- **frontend/src/config/api.ts** — URLs y endpoints
- **backend/src/middleware/requireOrg.ts** — Lógica multi-tenant
- **prisma/schema.prisma** — Schema de base de datos
- **docs/00-GENERAL/PROYECTO-REVISION-100.md** — Plan de migración auth
- **docs/04-auditorias/** — Informes de auditoría recientes

---

## RELACIÓN CON ARTIFICIAL WORLD

Existe un proyecto hermano "Artificial World" que tiene un módulo DobackSoft demo (Fire Simulator). El producto comercial completo está en este repo (dobackv2). Puertos distintos: Artificial World usa 3001/5173; DobackSoft usa 9998/5174.

### Qué sí asumir

- `Artificial World` puede servir como **laboratorio local** para documentación, copilotos, memoria local, datasets demo y automatización.
- La integración local con `Ollama` y el patrón de agente de `HeroRefuge` pueden inspirar herramientas internas para DobackSoft.
- La documentación de `Artificial World` puede actuar como base metodológica para bootstrap, debugging y flujos guiados.

### Qué no asumir

- No asumir que `Artificial World` ya está integrado de extremo a extremo con DobackSoft real.
- No asumir que el módulo `DobackSoft` del repo Artificial World equivale al producto B2B.
- No asumir que una demo mock o un flujo visual en Artificial World valida datos reales, multitenancy o seguridad de DobackSoft.

### Enfoque recomendado de adopción

Si trabajas en DobackSoft y quieres aprovechar el ecosistema de Artificial World:

1. Usa Artificial World como **sandbox local** para probar ideas de copiloto, memoria, resúmenes y debugging.
2. Define contratos claros para artefactos compartibles: `session`, `route`, `event`, `severity`, `recommendation`, `report`.
3. Integra primero por **artefactos y export/import controlado**, no por acoplamiento interno prematuro.
4. Mantén a DobackSoft como producto multi-tenant serio y a Artificial World como laboratorio y entorno de entrenamiento.
5. Si necesitas una base inicial de contrato en este repo, parte de `docs/DOBACKSOFT_FUTURE_CONTRACTS.json` y trátala como borrador de interoperabilidad, no como integración viva.

---

Por favor, actúa como programador en pareja: explica qué vas a hacer antes de hacerlo, pide confirmación antes de ejecutar comandos, respeta todas las reglas anteriores, y ten en cuenta los problemas encontrados al trabajar en código relacionado. Si corriges alguno, documéntalo.
```

---

## Versión corta (para sesiones rápidas)

```
DobackSoft StabilSafe V3 — plataforma B2B multi-tenant estabilidad vehicular (CAN/GPS). Backend 9998, Frontend 5174. Inicio: iniciar.ps1. Reglas: nunca hardcodear URLs (config/api.ts), nunca console.log (logger), siempre req.orgId, authenticate+requireOrg. Problemas conocidos: rutas telemetry/mapRoutes/sessionsUpload sin requireOrg; scripts con console.log; endpoint mock con organizationId en query; OpenAPI desactualizado. Ver docs/00-INICIO/PROMPT_AGENTE_CURSOR.md para prompt completo.
```

---

## Referencias de auditoría

| Documento | Contenido |
|-----------|-----------|
| [AUDITORIA_DOBACKV2_PROFUNDA.md](AUDITORIA_DOBACKV2_PROFUNDA.md) | Auditoría técnica completa dobackv2 |
| [AUDITORIA_DOBACKSOFT_ARTIFICIAL_WORLD.md](AUDITORIA_DOBACKSOFT_ARTIFICIAL_WORLD.md) | Relación DobackSoft + Artificial World |

---

*Generado para onboarding de agentes Cursor en DobackSoft. Incluye problemas encontrados en auditorías de Marzo 2025.*
