# 🚗 DobackSoft - StabilSafe V3

Sistema profesional de análisis de estabilidad vehicular para flotas profesionales.

[![CI - Build y Tests](https://github.com/hermoso92/DobackSoft/actions/workflows/ci.yml/badge.svg)](https://github.com/hermoso92/DobackSoft/actions/workflows/ci.yml) [![PR Validation](https://github.com/hermoso92/DobackSoft/actions/workflows/pr-validation.yml/badge.svg)](https://github.com/hermoso92/DobackSoft/actions/workflows/pr-validation.yml)

> **Documentación para agentes (IA/Cursor):** [AGENTS.md](./AGENTS.md). Reglas, multi-tenant, auth, DoD y rutas por ámbito.

---

## 📦 INSTALACIÓN Y CONFIGURACIÓN

### **¿Primera vez instalando DobackSoft?**

- **Desarrollo local (Node + DB):** [Instalación con Docker (Dev/Prod)](./docs/INFRAESTRUCTURA/INSTALACION-LOCAL-DOCKER.md) — DB y Redis en Docker, backend y frontend con `iniciar.ps1`.
- **Solo Docker (comercial):** [LEEME.txt](./LEEME.txt) — instrucciones rápidas con `INICIAR_DOBACKSOFT_COMERCIAL.ps1` y `.env`.
- **Local vs producción, Redis, migraciones y datos:** [Guía desde cero](./docs/00-INICIO/GUIA-DESDE-CERO-LOCAL-Y-PRODUCCION.md) — qué hace cada cosa, backup y actualización de producción.

Incluye: configuración de PostgreSQL/Redis, variables de entorno, verificación del stack y solución de problemas.

---

## 🚀 INICIO RÁPIDO

### **Iniciar Sistema Completo**
```powershell
.\iniciar.ps1
```

Este script único:
- ✅ Libera puertos 9998 (backend) y 5174 (frontend)
- ✅ Verifica archivos necesarios
- ✅ Inicia backend y frontend en ventanas separadas
- ✅ Abre navegador automáticamente
- ✅ Muestra credenciales de acceso

### **Acceso**
- **URL:** http://localhost:5174
- **Usuario:** antoniohermoso92@manager.com
- **Password:** password123

### **Instalación / despliegue con Docker (Windows y Ubuntu)**

- **Dev:** db + redis en Docker, backend y frontend en local con `iniciar.ps1`. Ver [docs/INFRAESTRUCTURA/INSTALACION-LOCAL-DOCKER.md](docs/INFRAESTRUCTURA/INSTALACION-LOCAL-DOCKER.md).
- **Prod/Comercial:** todo el stack en docker-compose (db, redis, backend, frontend). Resumen: copiar `.env.docker.example` a `.env`, (opcional) restaurar backup con `scripts/backup/restore-backup-en-docker.ps1` o `.sh`, luego `docker compose up -d`. Verificación del stack: `.\scripts\verify-docker-stack.ps1` (ver [INSTALACION-LOCAL-DOCKER](docs/INFRAESTRUCTURA/INSTALACION-LOCAL-DOCKER.md)).

---

## 📚 DOCUMENTACIÓN ORGANIZADA

Toda la documentación está en `docs/`:

| Carpeta | Contenido |
|--------|-----------|
| **00-INICIO** | Guías de inicio, instalación y configuración |
| **00-GENERAL** | Arquitectura, estado del sistema, convenciones |
| **MODULOS** | Documentación por módulo (dashboard, estabilidad, telemetría, IA, geofences, operaciones, reportes, administración, upload, autenticación, etc.) |
| **BACKEND** | API, Prisma, servicios, pipeline |
| **FRONTEND** | UI, rutas, componentes |
| **INFRAESTRUCTURA** | Docker, CI/CD, despliegue |
| **API** | Contratos y especificación de APIs |
| **DESARROLLO** | Guías de desarrollo y planes |
| **CALIDAD** | Auditorías, checklists, testing |
| **04-auditorias** | Informes de auditoría recientes |
| **HISTORICO** | Entregas anteriores y legacy |

- **🚀 [Despliegue: Windows → Ubuntu VPS](./docs/INFRAESTRUCTURA/DESPLIEGUE_WINDOWS_A_UBUNTU_VPS.md)** — GitHub Actions, SSH/SCP, Docker Compose.
- **📋 [Acciones GitHub, scripts e ingesta (local/producción)](./docs/00-INICIO/ACCIONES-Y-SCRIPTS-PRODUCCION.md)** — qué hace cada workflow, iniciar.ps1 vs iniciar-dobacksoft.sh, cron de ingesta, Redis y deploy.
- **Agentes:** [docs/agents/](./docs/agents/) — uiagents, authagents, apiagents, pipelineagents, dbagents.

---

## 🎯 MÓDULOS PRINCIPALES

### **🏠 Panel de Control**
- KPIs estratégicos en tiempo real
- Modo TV Wall automático
- Bloques de mantenimiento y alertas

### **📊 Estabilidad**
- Métricas de conducción
- Eventos críticos detectados
- Comparador de sesiones
- Exportación PDF

### **📡 Telemetría**
- Datos CAN en tiempo real
- Mapa GPS interactivo
- Alarmas configurables
- Comparador CAN/GPS

### **🤖 Inteligencia Artificial**
- Chat IA especializado
- Patrones detectados
- Recomendaciones automáticas

### **🗺️ Geofences**
- CRUD completo de zonas
- Eventos de entrada/salida
- Alertas automáticas

### **🔧 Operaciones**
- Eventos del sistema
- Alertas configurables
- Gestión de mantenimiento

### **📈 Reportes**
- Generación automática de PDF
- Reportes personalizables
- Análisis comparativos

### **⚙️ Administración** (Solo ADMIN)
- Gestión de organizaciones
- Usuarios y roles
- Configuración global

---

## 🛠️ STACK TECNOLÓGICO

### **Backend**
- Node.js + Express
- PostgreSQL + Prisma ORM
- JWT + httpOnly cookies
- AWS S3 (archivos)

### **Frontend**
- React 18 + TypeScript
- Tailwind CSS
- Leaflet + TomTom (mapas)
- Recharts (gráficas)

### **Puertos Fijos**
- Backend: **9998** (no cambiar)
- Frontend: **5174** (no cambiar)

---

## 📦 ESTRUCTURA DEL PROYECTO

```
DobackSoft/
├── backend/           # API y lógica de negocio (Node.js + Express + Prisma)
├── frontend/          # Interfaz React (Vite + TypeScript + Tailwind)
├── prisma/            # Schema y migraciones (raíz; backend usa --schema=../prisma/schema.prisma)
├── docs/              # Documentación
│   ├── 00-INICIO/     # Guías de inicio e instalación
│   ├── 00-GENERAL/    # Arquitectura y estado del sistema
│   ├── MODULOS/       # Por módulo (dashboard, estabilidad, telemetría, etc.)
│   ├── BACKEND/       # Documentación técnica backend
│   ├── INFRAESTRUCTURA/ # Docker, CI/CD, despliegue
│   ├── agents/        # Guías para agentes (uiagents, authagents, apiagents, …)
│   └── …
├── scripts/           # Scripts (analisis, testing, setup, utils, backup)
├── database/          # Scripts SQL adicionales
├── tests/             # Tests (Playwright, integración, unitarios)
├── .github/           # GitHub Actions (CI, PR validation, scheduled)
└── iniciar.ps1        # ⭐ Inicio único (libera 9998/5174, inicia backend + frontend)
```

---

## 🔐 SEGURIDAD

- Autenticación JWT con cookies httpOnly
- Protección CSRF implementada
- Cifrado S3 (SSE-KMS)
- Aislamiento por organización
- Roles ADMIN/MANAGER

---

## 📋 ROLES Y PERMISOS

### **ADMIN**
- Acceso total al sistema
- Gestión de organizaciones
- Configuración global
- Base de conocimiento

### **MANAGER**
- Acceso a su organización
- Gestión de su flota
- Reportes y análisis
- Panel de control

---

## 🚨 REGLAS CRÍTICAS

1. **NUNCA iniciar backend/frontend manualmente** → usar `iniciar.ps1`
2. **NUNCA cambiar puertos** → 9998 (backend), 5174 (frontend)
3. **NUNCA hardcodear URLs** → usar `frontend/src/config/api.ts`
4. **NUNCA usar console.log** → usar `logger` de `utils/logger`
5. **SIEMPRE filtrar por organizationId** en requests

---

## 📞 SOPORTE Y CONTRIBUCIÓN

- Documentación: `docs/` (por módulo en `docs/MODULOS/`, infra en `docs/INFRAESTRUCTURA/`).
- Contribución: [CONTRIBUTING.md](CONTRIBUTING.md) — PRs con [plantilla](.github/PULL_REQUEST_TEMPLATE.md) y checklist DobackSoft (logger, config/api.ts, organizationId, iniciar.ps1).
- Seguridad: [SECURITY.md](SECURITY.md) — reporte de vulnerabilidades.

---

**DobackSoft © 2025 - Sistema Profesional de Análisis de Estabilidad Vehicular**

