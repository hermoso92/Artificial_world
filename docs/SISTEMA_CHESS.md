# Sistema Chess — Auditoría Independiente

> Creadores que se auditan con otro contenedor totalmente independiente.  
> Un grupo de agentes de IA, cada uno local y dockerizado, que no confían en los creadores.

---

## Filosofía

**El problema:** Los creadores no pueden auditarse a sí mismos con objetividad.  
**La solución:** Un sistema separado, aislado, sin acceso de escritura, que analiza el mismo repositorio desde fuera.

**Principio clave:** Los agentes montan el repo en modo `READ-ONLY`. No pueden modificar nada. Solo observan, reportan y escalan al coordinator.

---

## Los 3 entornos en paralelo

```
┌─────────────────────────────────────────────────────────────────┐
│                     ARTIFICIAL WORLD                            │
│                                                                 │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────────────┐  │
│  │   TESTS      │   │  PRODUCCIÓN  │   │  AUDITORÍA (Chess)  │  │
│  │             │   │             │   │                     │  │
│  │ python-tests│   │ backend-prod│   │ agent-docs          │  │
│  │ backend-    │   │ frontend-   │   │ agent-backend       │  │
│  │ tests       │   │ prod        │   │ agent-frontend      │  │
│  │             │   │             │   │ agent-bd            │  │
│  │ Red: tests  │   │ Red: prod   │   │ agent-tests         │  │
│  │ Puerto 3002 │   │ Puerto 3001 │   │ agent-marketing     │  │
│  └─────────────┘   └─────────────┘   │ ↓                   │  │
│                                       │ coordinator         │  │
│                                       │ → REPORTE_CHESS_1.md│  │
│                                       │ Red: audit          │  │
│                                       └─────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Comandos

### Lanzar entorno de tests
```powershell
docker compose -f docker/docker-compose.full.yml --profile tests up
```

### Lanzar producción
```powershell
docker compose -f docker/docker-compose.full.yml --profile prod up
```

### Lanzar auditoría independiente
```powershell
docker compose -f docker/docker-compose.full.yml --profile audit up
```

### Lanzar los 3 en paralelo (flujo completo)
```powershell
docker compose -f docker/docker-compose.full.yml --profile tests --profile prod --profile audit up
```

### Ver el reporte generado
```powershell
cat docker/chess-output/REPORTE_CHESS_1.md
```

---

## Los 6 agentes

| Agente | Especialidad | Qué detecta |
|--------|-------------|-------------|
| `agent-docs` | Documentación | Claims prohibidos, enlaces rotos, README faltantes |
| `agent-backend` | API y seguridad | `console.log`, URLs hardcodeadas, catches vacíos |
| `agent-frontend` | React | Componentes >300 líneas, `console.log`, imágenes sin `alt` |
| `agent-bd` | Base de datos | `CREATE TABLE` sin `IF NOT EXISTS`, SQL injection, `SELECT *` |
| `agent-tests` | Cobertura | Tests sin assertions, TODOs, ratio cobertura <30% |
| `agent-marketing` | Narrativa | Overselling, falta SEO/OG tags, claims sin evidencia |

### El coordinator

Espera a que los 6 agentes terminen con éxito. Luego:
1. Lee todos los `reporte-*.json` de `/output`
2. Ordena los hallazgos por severidad (high → medium → low)
3. Genera `reporte-completo.json`
4. Genera `REPORTE_CHESS_1.md` legible

---

## Flujo de 3 días

```
DÍA 1 — POBLAR DOCUMENTACIÓN
─────────────────────────────
  node scripts/populate-docs.js          # Analiza estado actual
  node scripts/populate-docs.js --fix    # Crea READMEs faltantes
  → Genera: docs/ia-memory/reports/DOC_ESTADO_<fecha>.md

DÍA 2 — IMPLEMENTAR + DAR ACCESO TESTERS
──────────────────────────────────────────
  .\iniciar.ps1                          # Backend 3001, Frontend 5173
  → Entornos tests y prod corriendo en paralelo
  → Testers reciben: docs/ACCESO_TESTERS.md

DÍA 3 — AUDITORÍA INDEPENDIENTE
────────────────────────────────
  docker compose -f docker/docker-compose.full.yml --profile audit up
  → 6 agentes dockerizados analizan el repo
  → coordinator genera REPORTE_CHESS_1.md
  → Revisión del reporte con el equipo
```

---

## Aislamiento de red

Cada entorno tiene su propia red Docker:
- `prod-net` — solo backend-prod y frontend-prod
- `tests-net` — solo servicios de tests
- `audit-net` — solo agentes Chess y coordinator

**Los auditores no pueden comunicarse con producción ni tests.**  
**Los agentes no pueden modificar el repositorio (`:ro`).**

---

## Variables de entorno

| Variable | Valor por defecto | Descripción |
|----------|------------------|-------------|
| `OLLAMA_BASE_URL` | `http://host.docker.internal:11434` | IA local Ollama |
| `REPO_PATH` | `/repo` | Ruta del repo en el contenedor |
| `OUTPUT_PATH` | `/output` | Ruta de salida de reportes |
| `NODE_ENV` | `production` / `test` | Entorno Node |

---

## Severidades del reporte

| Severidad | Descripción | Acción |
|-----------|-------------|--------|
| `high` | Bloquea o compromete seguridad | Corregir antes de merge |
| `medium` | Viola reglas del proyecto | Corregir en próximo sprint |
| `low` | Mejora recomendada | Backlog |

---

## Archivos del sistema

```
docker/
├── docker-compose.full.yml          ← Orquestación completa (3 entornos)
├── docker-compose.agents.yml        ← Solo agentes (uso legacy)
├── chess-output/                    ← Reportes generados (gitignored)
│   ├── reporte-docs.json
│   ├── reporte-backend.json
│   ├── reporte-frontend.json
│   ├── reporte-bd.json
│   ├── reporte-tests.json
│   ├── reporte-marketing.json
│   ├── reporte-completo.json
│   └── REPORTE_CHESS_1.md
├── agents/
│   ├── agent-docs/
│   ├── agent-backend/
│   ├── agent-frontend/
│   ├── agent-bd/
│   ├── agent-tests/
│   └── agent-marketing/
└── coordinator/

scripts/
└── populate-docs.js                 ← Pobla y sincroniza documentación

docs/
├── SISTEMA_CHESS.md                 ← Este documento
└── ACCESO_TESTERS.md                ← Para el grupo de testers
```

---

## Principio de autoauditoria

**Los creadores construyen. Los auditores observan. Nadie audita su propio trabajo.**

Este principio es la base del sistema Chess:
- Los agentes son contenedores desechables
- No tienen estado entre ejecuciones
- No confían en el estado anterior del repo
- Cada ejecución es desde cero

*"Un espejo que no puede mentir."*

---

*Artificial World — artificial-word. Sistema Chess v1.0*
