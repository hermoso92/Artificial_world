# Auditoría de Documentación — Artificial Word

**Fecha:** 2026-03-08  
**Alcance:** docs/, README.md, AGENTS.md, AGENTE_ENTRANTE.md

---

## 1. Resumen Ejecutivo

La documentación del proyecto **Artificial Word** es **sólida en el núcleo Python/simulación** y **parcial en el fullstack**. El onboarding técnico (AGENTE_ENTRANTE.md) permite a un desarrollador nuevo arrancar el proyecto y entender el motor de decisión. Existen **gaps críticos** para ln-620 (tech_stack.md, principles.md) y documentación específica de backend/frontend. La consistencia de idioma (ES) y formato es buena; hay **inconsistencias menores** en puertos y referencias cruzadas.

| Área | Cobertura | Estado |
|-----|-----------|--------|
| Simulación Python | Alta | ✅ Bien documentada |
| Fullstack (backend/frontend) | Media | ⚠️ Parcial |
| ln-620 (tech_stack, principles) | Ausente | ❌ No existe |
| Onboarding | Alta | ✅ AGENTE_ENTRANTE completo |
| Consistencia | Media | ⚠️ Puertos y rutas dispersos |

---

## 2. Cobertura por Área

### 2.1 Simulación Python (nucleo, agentes, mundo, acciones)

| Documento | Contenido | Estado |
|-----------|-----------|--------|
| AGENTE_ENTRANTE.md | Estructura completa, motor decisión, modo sombra, watchdog, persistencia, tests | ✅ Actualizado |
| docs/architecture.md | Diagrama Mermaid, sistemas, flujo de ticks | ⚠️ Mezcla estructura `core/` y `mundo/` |
| docs/CORE_BOUNDARIES.md | Límites core vs periféricos | ✅ Útil |
| docs/ARTIFICIAL_WORD_ENGINE.md | Motor IA, pipeline decisión, integración | ✅ Técnico |
| docs/AGENT_SKILLS_*.md | Memoria, inventario, refugios, rasgos, compartir | ✅ Índice coherente |
| docs/MODOS_EJECUCION.md | Python vs Fullstack | ✅ Actualizado |
| docs/LOGGING_Y_DEBUG.md | Logs, reporte sesión | ✅ Operativo |
| docs/REVISION_LOGS.md | Revisión de logs 2026-03-07 | ✅ Histórico |

**Conclusión:** La simulación Python está bien cubierta. `architecture.md` describe una estructura `core/` que existe (reexportada por `mundo/`, `entidades/`), pero el diagrama de carpetas mezcla rutas `core/` con `mundo/` sin aclarar la relación.

### 2.2 Backend (Node.js/Express)

| Documento | Contenido | Estado |
|-----------|-----------|--------|
| docs/MODOS_EJECUCION.md | Backend `backend/src/`, rutas API, simulación | ✅ Resumen correcto |
| docs/refugio/ARQUITECTURA.md | Refuge interior, furniture, zones, pets, API | ✅ Coincide con api.js |
| docs/DEBUG_FULLSTACK.md | Script debug, comandos consola | ✅ Operativo |
| docs/TESTING.md | Vitest, Supertest, WebSocket | ✅ Comandos correctos |

**Gaps:**
- No existe `docs/backend/README.md` ni `docs/backend/API.md`
- Rutas `/api/hero/*` y `/api/dobacksoft/*` no están documentadas en un único índice
- Estructura `backend/src/` (simulation/, routes/, audit/, middleware/) no tiene doc dedicada

### 2.3 Frontend (React/Vite)

| Documento | Contenido | Estado |
|-----------|-----------|--------|
| docs/MODOS_EJECUCION.md | Frontend `frontend/src/`, componentes | ✅ Resumen |
| docs/refugio/ARQUITECTURA.md | SimulationCanvas, draw loop, interacción | ✅ Detallado |

**Gaps:**
- No existe `docs/frontend/README.md`
- Componentes Mission Control, Hub, HeroRefuge, DobackSoft no tienen docs específicos
- `docs/DESIGN_SCOPE_C_UI_UPGRADE.md` menciona puerto 9998 (DobackSoft) vs 3001 (Artificial Word) — confusión de productos

### 2.4 Despliegue y CI

| Documento | Contenido | Estado |
|-----------|-----------|--------|
| docs/DEPLOY_VPS_APLICACION.md | Docker, noVNC, Pygame en VPS | ✅ Completo |
| docs/DEPLOY_GITHUB_PAGES.md | Landing en Pages | — |
| docs/DEPLOYMENT_HOSTINGER.md | Hostinger Horizons | — |
| docs/CI_PIPELINE.md | GitHub Actions, Docker, tests | ✅ Actualizado |

---

## 3. Actualidad vs Código

| Aspecto | Documentación | Código | Veredicto |
|---------|---------------|--------|-----------|
| Estructura carpetas Python | AGENTE_ENTRANTE: `mundo/`, `entidades/` | Reexportan desde `core/` | ⚠️ Doc no menciona `core/` |
| Tests Python | `test_modo_sombra.py` + `test_modo_sombra_completo.py` | Ambos existen | ✅ Correcto |
| API refuge | `/api/refuge/furniture/*`, `/api/refuge/pet/*` | Montadas en api.js | ✅ Correcto |
| Puertos | README/AGENTS: 3001, 5173 | server.js: 3001, vite: 5173 | ✅ Correcto |
| .cursorrules | 9998, 5174 | DobackSoft (otro producto) | ⚠️ Confusión si se lee como Artificial Word |
| test-all.ps1 | docs/TESTING.md lo menciona | No verificado | — |
| debug_fullstack.ps1 | docs/DEBUG_FULLSTACK.md | Script existe | ✅ |

**Desactualizaciones menores:**
- `architecture.md` lista `core/simulation/tick_runner.py` — existe y es usado por `nucleo/simulacion.py`
- `CORE_BOUNDARIES.md` lista `utilidades/paths.py` — existe
- `utilidades/arranque.py` mencionado en architecture.md — existe

---

## 4. Estructura ln-620 (Codebase Auditor)

El skill **ln-620-codebase-auditor** requiere:

| Archivo | Requerido | Existe |
|---------|-----------|--------|
| `docs/project/tech_stack.md` | Sí | ❌ No existe |
| `docs/principles.md` | Sí | ❌ No existe |
| Package manifests | Sí | ✅ requirements.txt, package.json |
| `docs/tasks/kanban_board.md` | Opcional (Team ID) | No verificado |

**Impacto:** Sin `tech_stack.md` y `principles.md`, el auditor ln-620 no puede ejecutar su flujo de discovery ni pasar principios de calidad a los workers.

---

## 5. Onboarding (AGENTE_ENTRANTE.md)

| Criterio | Cumple |
|----------|--------|
| Qué es el proyecto | ✅ |
| Estructura de carpetas completa | ✅ |
| Cómo ejecutar (Python + Fullstack) | ✅ |
| Motor de decisión (pipeline, modificadores) | ✅ |
| Modo Sombra | ✅ |
| Watchdog | ✅ |
| Persistencia | ✅ |
| Tests (comandos, suites) | ✅ |
| Reglas de trabajo (puertos, logger, etc.) | ✅ |
| Cómo añadir acción/directiva | ✅ |
| Historial de bugs | ✅ |

**Conclusión:** Un desarrollador nuevo puede arrancar el proyecto siguiendo AGENTE_ENTRANTE.md. Falta solo un enlace explícito a `docs/MODOS_EJECUCION.md` para el fullstack (está en README y AGENTS).

---

## 6. Consistencia

### 6.1 Idioma
- **Mayoría ES:** AGENTE_ENTRANTE, docs/architecture, MODOS_EJECUCION, CORE_BOUNDARIES, etc.
- **Algunos EN:** docs/outreach_emails.md, landing_content.md (contenido marketing)
- **Internos API:** Comentarios en inglés (api.js), errores user-facing en español

**Veredicto:** Consistente para docs técnicos (ES).

### 6.2 Nomenclatura
- "Artificial World" vs "artificial word" vs "MUNDO_ARTIFICIAL" — usados de forma intercambiable
- README: "MUNDO_ARTIFICIAL"; docs: "Artificial World"
- Recomendación: fijar nombre oficial en un glosario

### 6.3 Puertos
- **Artificial Word:** backend 3001, frontend 5173 (README, AGENTS, iniciar_fullstack.ps1, server.js, vite.config)
- **DobackSoft (user rules):** 9998, 5174 — distinto producto en el mismo repo
- Recomendación: aclarar en docs que DobackSoft usa puertos distintos

### 6.4 Formato
- Markdown estándar, tablas, bloques de código
- Algunos docs usan mermaid (architecture, ROADMAP_TECNICO, AGENT_SKILLS_INDEX)

---

## 7. Gaps Críticos

1. **`docs/project/tech_stack.md`** — Requerido por ln-620. Debe listar: Python 3.11+, pygame, Node.js, Express, React, Vite, SQLite, etc.

2. **`docs/principles.md`** — Requerido por ln-620. Principios de calidad del proyecto (DRY, no console.log, organizationId, etc.).

3. **Índice de API backend** — Un único doc que liste todos los endpoints: `/api/*`, `/api/hero/*`, `/api/dobacksoft/*`.

4. **README backend/frontend** — Cada carpeta debería tener un README con estructura, scripts y dependencias.

5. **Documentación DobackSoft** — Módulo presente en backend/frontend pero sin doc central que explique su alcance y relación con Artificial Word.

6. **Referencias rotas** — README enlaza a PRODUCCION_PLAN.md, CAMINO_B_LISTO.md (existen en raíz). Verificar que docs/index.html no tenga enlaces rotos.

---

## 8. Recomendaciones

### Prioridad Alta
1. Crear `docs/project/tech_stack.md` con stack detectado.
2. Crear `docs/principles.md` extrayendo reglas de AGENTS.md y .cursorrules.
3. Crear `docs/backend/API.md` con índice de endpoints.

### Prioridad Media
4. Añadir `docs/backend/README.md` y `docs/frontend/README.md`.
5. Actualizar `architecture.md` para aclarar relación `core/` ↔ `mundo/`, `entidades/`.
6. Añadir sección "Productos en el repo" en README: Artificial Word (3001/5173) vs DobackSoft (9998/5174).

### Prioridad Baja
7. Crear glosario de nombres (Artificial World, MUNDO_ARTIFICIAL, artificial word).
8. Revisar docs operativos (landing_content, outreach_emails) y mover a `docs/marketing/` si procede.

---

## 9. Índice Sugerido de Documentación

```
docs/
├── README.md                    # Índice general (crear o actualizar)
├── project/
│   ├── tech_stack.md            # [CREAR] Stack para ln-620
│   └── principles.md            # [CREAR] O en docs/principles.md
├── architecture.md              # Arquitectura motor Python
├── MODOS_EJECUCION.md           # Python vs Fullstack
├── CORE_BOUNDARIES.md           # Límites core
├── ARTIFICIAL_WORD_ENGINE.md     # Motor IA
├── AGENT_SKILLS_INDEX.md        # Índice habilidades
├── AGENT_SKILLS_01..05.md
├── backend/
│   ├── README.md                # [CREAR] Estructura backend
│   └── API.md                   # [CREAR] Índice endpoints
├── frontend/
│   └── README.md                # [CREAR] Estructura frontend
├── refugio/
│   └── ARQUITECTURA.md          # Refuge interior
├── TESTING.md
├── DEBUG_FULLSTACK.md
├── LOGGING_Y_DEBUG.md
├── CI_PIPELINE.md
├── DEPLOY_VPS_APLICACION.md
├── DEPLOY_GITHUB_PAGES.md
├── DEPLOYMENT_HOSTINGER.md
├── ROADMAP_TECNICO.md
├── DESIGN_*.md
├── REVISION_LOGS.md
└── marketing/                   # [OPCIONAL]
    ├── landing_content.md
    └── outreach_emails.md

Raíz:
├── README.md
├── AGENTS.md
├── AGENTE_ENTRANTE.md
├── PRODUCCION_PLAN.md
└── CAMINO_B_LISTO.md
```

---

## 10. Checklist de Acción

- [ ] Crear `docs/project/tech_stack.md`
- [ ] Crear `docs/principles.md`
- [ ] Crear `docs/backend/API.md`
- [ ] Crear `docs/backend/README.md`
- [ ] Crear `docs/frontend/README.md`
- [ ] Actualizar `architecture.md` (core ↔ reexports)
- [ ] Añadir sección productos en README
- [x] ~~Verificar existencia `utilidades/arranque.py`, `utilidades/paths.py`~~ — existen
- [x] ~~Verificar `scripts/test-all.ps1` existe~~ — existe
