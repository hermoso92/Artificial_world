# DobackSoft — Onboarding para desarrolladores

> Guía de inicio desde 0. Para un dev nuevo que nunca ha visto el proyecto.  
> Tiempo estimado: **30-45 minutos** para tener ambos entornos funcionando.

---

## Qué vas a encontrar

DobackSoft vive en **dos repositorios**:

| Repo | Ruta local | Qué es |
|------|-----------|--------|
| `artificial-word` | `C:\Users\...\Desktop\artificial word` | Demo Fire Simulator + cupón + laboratorio |
| `dobackv2` | `C:\Users\...\Desktop\dobackv2` | Producto B2B completo (StabilSafe V3) |

Empieza con `artificial-word` (más simple). Luego `dobackv2`.

---

## Paso 1 — Requisitos

Instala esto antes de empezar:

| Herramienta | Versión mínima | Para qué |
|-------------|---------------|----------|
| Node.js | 18+ | Backend y frontend |
| Python | 3.11+ | Motor de simulación |
| Docker Desktop | Cualquiera reciente | PostgreSQL + Redis (dobackv2) |
| Git | Cualquiera | Control de versiones |
| PowerShell | 5+ | Scripts de inicio (Windows) |

**Verificar:**
```powershell
node --version    # v18+
python --version  # 3.11+
docker --version  # cualquiera
```

---

## Paso 2 — artificial-word

### 2.1 Instalar dependencias

```powershell
cd "C:\Users\[tu_usuario]\Desktop\artificial word"

# Backend
cd backend
npm install
cd ..

# Frontend
cd frontend
npm install
cd ..

# Python
pip install -r requirements.txt
```

### 2.2 Variables de entorno

Copia el `.env` de ejemplo si no existe:
```powershell
# Verifica que existe
type .env
```

Variables clave:
```env
DOBACKSOFT_COUPON_CODE=FUNDADOR1000
OLLAMA_BASE_URL=http://localhost:11434
```

### 2.3 Arrancar el sistema

```powershell
# Método único y oficial
.\iniciar.ps1

# O el script fullstack
.\scripts\iniciar_fullstack.ps1
```

Esto arranca:
- **Backend** en `http://localhost:3001`
- **Frontend** en `http://localhost:5173`

### 2.4 Verificar que funciona

```powershell
# Health check backend
Invoke-WebRequest http://localhost:3001/health | Select-Object StatusCode

# Stats DobackSoft
Invoke-WebRequest http://localhost:3001/api/dobacksoft/stats | Select-Object Content
```

### 2.5 Navegar por la app

1. Abre `http://localhost:5173`
2. Clic en "Crear mundo" → elige semilla → nombre → refugio
3. Desde el Hub, clic en "Emergencias" → introduce cupón `DEMO` → explora Fire Simulator

### 2.6 Ejecutar tests

```powershell
# Python (motor de simulación)
$env:SDL_VIDEODRIVER="dummy"; $env:SDL_AUDIODRIVER="dummy"
python pruebas/run_tests_produccion.py

# Backend Node
cd backend; npm test

# Auditoría Chess (agentes independientes)
docker compose -f docker/docker-compose.full.yml --profile audit up
```

---

## Paso 3 — dobackv2 (StabilSafe V3)

### 3.1 Requisitos específicos

- Docker Desktop **corriendo** (necesario para PostgreSQL y Redis)
- El archivo `.env` configurado

### 3.2 Variables de entorno

```powershell
cd "C:\Users\[tu_usuario]\Desktop\dobackv2"
copy .env.example .env
```

Variables mínimas para desarrollo local:
```env
DATABASE_URL=postgresql://dobacksoft:dobacksoft@localhost:5432/dobacksoft
REDIS_URL=redis://localhost:6379
JWT_SECRET=desarrollo-local-secreto
NODE_ENV=development
```

### 3.3 Arrancar el sistema

```powershell
# Método único y oficial — libera puertos, levanta Docker, inicia todo
.\iniciar.ps1
```

El script hace:
1. Mata procesos en puertos 9998 y 5174
2. `docker compose up -d` (PostgreSQL + Redis)
3. `npx prisma migrate deploy` (aplica migraciones pendientes)
4. Inicia backend en 9998
5. Inicia frontend en 5174
6. Abre `http://localhost:5174`

### 3.4 Primer login

- URL: `http://localhost:5174`
- Email: `antoniohermoso92@manager.com`
- Password: `password123`

### 3.5 Estructura del proyecto

```
dobackv2/
├── backend/src/
│   ├── routes/          ← +80 rutas Express
│   ├── controllers/     ← lógica de negocio
│   ├── services/        ← procesamiento, IA, PDF
│   ├── middleware/       ← authenticate, requireOrg, errorHandler
│   ├── workers/         ← BullMQ jobs de procesamiento
│   └── app.ts           ← bootstrap Express
├── frontend/src/
│   ├── pages/           ← todas las páginas del menú
│   ├── components/      ← componentes reutilizables
│   ├── api/             ← cliente HTTP tipado
│   ├── config/api.ts    ← TODOS los endpoints centralizados aquí
│   └── App.tsx          ← rutas React
└── prisma/
    └── schema.prisma    ← ~40 modelos PostgreSQL
```

### 3.6 Tests

```powershell
cd backend
npm test              # Jest
npm run build         # tsc sin errores (obligatorio antes de PR)

cd ../frontend
npm test              # Vitest
npm run build         # build Vite
```

### 3.7 Prisma y migraciones

```powershell
# Ver estado de migraciones
npx prisma migrate status --schema=prisma/schema.prisma

# Generar cliente tras cambios de schema
cd backend
npm run prisma:generate

# Aplicar nueva migración en desarrollo
npm run prisma:migrate
```

---

## Paso 4 — Reglas que debes conocer

### Las más importantes (comunes a ambos repos)

```
1. NUNCA console.log → usa logger
2. NUNCA URLs hardcodeadas → usa config/api.ts (dobackv2) o config/api.js (AW)
3. NUNCA cambiar puertos (3001/5173 en AW, 9998/5174 en dobackv2)
4. NUNCA crear módulos fuera del menú oficial V3
5. SIEMPRE filtro organizationId en datos (dobackv2)
6. SIEMPRE usar .\iniciar.ps1 para iniciar, nunca a mano
```

### Auth en dobackv2

```typescript
// En rutas protegidas (la mayoría)
router.use(authenticate);   // verifica JWT
router.use(requireOrg);     // asigna req.orgId

// En handlers: usa req.orgId, NUNCA req.query.organizationId
const data = await db.where({ organizationId: req.orgId });
```

### Componentes React

- Máximo **300 líneas** por componente
- Si supera 300 → extraer subcomponentes
- Imports nombrados, no `* as React`
- No `any` en TypeScript sin justificación

---

## Paso 5 — Flujo de trabajo

### Para una nueva feature

```
1. Lee AGENTS.md del repo (siempre el más cercano al archivo que tocas)
2. Verifica que la feature está en el menú oficial V3
3. Crea rama: git checkout -b feat/nombre-feature
4. Implementa:
   - Backend: ruta → controlador → servicio → repositorio
   - Frontend: página en pages/ → componente → llamada via api/
5. Pasa el checklist:
   □ tsc sin errores
   □ No console.log
   □ No URLs hardcodeadas
   □ Filtro organizationId
   □ Componentes <300 líneas
6. PR con descripción clara
```

### Para un bug

```
1. Reproduce el bug localmente
2. Añade un test que lo cubra
3. Corrige
4. Verifica que el test pasa
5. PR
```

---

## Paso 6 — Documentos de referencia

| Documento | Dónde | Para qué |
|-----------|-------|----------|
| `AGENTS.md` (raíz) | ambos repos | Reglas del proyecto |
| `backend/AGENTS.md` | dobackv2 | Reglas específicas de backend |
| `frontend/AGENTS.md` | dobackv2 | Reglas específicas de frontend |
| `docs/agents/authagents.md` | dobackv2 | Auth, tenant, roles |
| `docs/agents/pipelineagents.md` | dobackv2 | Pipeline de procesamiento |
| `docs/agents/apiagents.md` | dobackv2 | API Express, rutas, DTOs |
| `docs/DOC_DOBACKSOFT_COMPLETA.md` | artificial-word | Visión completa |
| `docs/DOC_DOBACKSOFT_API.md` | artificial-word | Referencia API |

---

## Problemas comunes

### Puerto en uso

```powershell
# Liberar puerto (ejemplo: 3001)
netstat -ano | findstr :3001
taskkill /PID [pid] /F
# O simplemente: .\iniciar.ps1 (lo hace automáticamente)
```

### Docker no arranca

```powershell
# Verificar que Docker Desktop está corriendo
docker ps

# Levantar solo la infraestructura
docker compose up -d postgres redis
```

### Prisma client no generado

```powershell
cd dobackv2/backend
npm run prisma:generate
```

### Variables de entorno faltantes

```powershell
# Verificar
type .env
# Copiar desde ejemplo
copy .env.example .env
```

---

*DobackSoft Onboarding — artificial-word + dobackv2. 2026-03-08*
