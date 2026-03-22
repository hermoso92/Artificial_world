# Guía de contribución — Artificial World

> Cómo trabajar en este repositorio. Para colaboradores nuevos y veteranos.

---

## Antes de empezar

Lee estos documentos en orden:

1. `AGENTS.md` (raíz) — reglas del proyecto, prohibiciones absolutas
2. `docs/ESENCIAL.md` — qué es el proyecto en 2 páginas
3. `docs/DOCUMENTO_FINAL.md` — estado real hoy
4. `docs/ROADMAP.md` — hacia dónde vamos

---

## Setup del entorno

```powershell
# 1. Instalar dependencias
cd backend; npm install; cd ..
cd frontend; npm install; cd ..
pip install -r requirements.txt

# 2. Variables de entorno (verificar que existe .env)
type .env

# 3. Arrancar (único método válido)
.\iniciar.ps1
# o
.\scripts\iniciar_fullstack.ps1
```

**Puertos fijos — no cambiar nunca:**
- Backend: `3001`
- Frontend: `5173`

---

## Flujo de trabajo

### 1. Crear rama

```powershell
git checkout -b feat/nombre-descriptivo   # nueva funcionalidad
git checkout -b fix/nombre-del-bug        # corrección de bug
git checkout -b docs/lo-que-documenta     # solo documentación
git checkout -b refactor/lo-que-refactors # refactorización
```

### 2. Implementar

Antes de tocar un archivo:
- Lee el bloque de imports y las funciones relacionadas
- Verifica que no exista ya algo similar en el repo
- Comprueba que la feature está en el **menú oficial** (si aplica)

### 3. Verificar antes de commit

```powershell
# Checklist obligatoria:

# ¿console.log? → debe ser cero
grep -r "console\.log" backend/src frontend/src

# ¿URLs hardcodeadas?
grep -r "http://localhost" frontend/src

# ¿Componentes >300 líneas?
# (el agente Chess lo detectará automáticamente)

# Tests Python
$env:SDL_VIDEODRIVER="dummy"; $env:SDL_AUDIODRIVER="dummy"
python pruebas/run_tests_produccion.py

# Tests Node
cd backend; npm test

# Auditoría Chess (si quieres el informe completo)
docker compose -f docker/docker-compose.full.yml --profile audit up
```

### 4. Commit

```powershell
git add [archivos específicos, no git add .]
git commit -m "feat: descripción clara en presente"
```

**Prefijos válidos:**
| Prefijo | Cuándo |
|---------|--------|
| `feat:` | Nueva funcionalidad |
| `fix:` | Corrección de bug |
| `refactor:` | Reestructuración sin cambio funcional |
| `docs:` | Solo documentación |
| `test:` | Solo tests |
| `chore:` | Mantenimiento, dependencias, CI |

**Reglas de commit:**
- Un objetivo claro por commit
- Mensaje en presente, no pasado ("añade" no "añadí")
- No commitear archivos `.env`, `.db`, `__pycache__`, `node_modules`
- No commitear más de 3 archivos no relacionados en el mismo commit

### 5. Pull Request

```powershell
git push -u origin feat/nombre-descriptivo
```

El PR debe incluir:
- **Qué hace** — una línea
- **Por qué** — contexto
- **Cómo probarlo** — pasos concretos
- **Checklist** — los puntos de la sección anterior marcados

---

## Reglas absolutas (de AGENTS.md)

```
NUNCA:
  - console.log → usar logger
  - URLs hardcodeadas → usar config/api.js
  - Componentes React >300 líneas
  - Cambiar puertos (3001/5173)
  - Crear módulos fuera del proyecto sin justificación
  - Secrets o tokens en el código

SIEMPRE:
  - Type hints en funciones Python públicas
  - Docstrings en clases y funciones públicas Python
  - Manejo de errores en catch (no catch vacíos)
  - Exports nombrados en JS/TS (no default exports salvo en componentes)
```

---

## Estructura del proyecto

```
artificial-word/
├── principal.py              ← entrada motor Python
├── nucleo/                   ← orquestador
├── agentes/                  ← IA por utilidad
├── acciones/                 ← 13 tipos de acción
├── sistemas/                 ← persistencia, watchdog, modo sombra
├── backend/src/
│   ├── routes/               ← endpoints Express
│   ├── simulation/           ← motor JS (engine, heroRefuge)
│   ├── services/             ← aiCore, aiMemory, llmService
│   ├── dobacksoft/           ← store cupones + ciudadanos
│   ├── middleware/           ← errorHandler, asyncHandler, validate
│   ├── utils/logger.js       ← el único logger permitido
│   └── config.js             ← URLs y config centralizada
├── frontend/src/
│   ├── components/           ← componentes React
│   ├── services/api.js       ← cliente HTTP (único punto de API)
│   ├── config/api.js         ← endpoints centralizados
│   └── utils/logger.js       ← logger frontend
├── pruebas/                  ← 18 archivos de tests Python
├── docker/
│   ├── docker-compose.full.yml  ← 3 entornos (tests/prod/audit)
│   └── agents/               ← 6 agentes Chess
├── scripts/
│   └── populate-docs.js      ← análisis de documentación
└── docs/                     ← toda la documentación
```

---

## Añadir un nuevo endpoint

1. Crear en `backend/src/routes/mi-modulo.js`
2. Registrar en `backend/src/server.js`
3. Añadir al cliente en `frontend/src/services/api.js`
4. Añadir la URL en `frontend/src/config/api.js`
5. Documentar en `docs/API_INDEX.md`
6. Añadir test en `backend/src/routes/mi-modulo.test.js`

---

## Añadir un nuevo componente React

1. Crear en `frontend/src/components/NombreComponente.jsx`
2. Máximo 300 líneas — si crece, extraer subcomponentes desde el inicio
3. Usar imports nombrados: `import { useState } from 'react'`
4. Usar `logger` de `../utils/logger.js`, nunca `console.log`
5. Usar `api` de `../services/api.js` para llamadas HTTP

---

## Añadir una acción Python

1. Crear `acciones/accion_nueva.py` siguiendo el patrón de las existentes
2. Registrar en `acciones/__init__.py`
3. Añadir al motor en `agentes/motor_decision.py`
4. Crear test en `pruebas/test_accion_nueva.py`
5. Ejecutar suite completa para verificar que no rompe nada

---

## Sistema de auditoría Chess

Antes de cualquier PR significativo puedes lanzar la auditoría independiente:

```powershell
docker compose -f docker/docker-compose.full.yml --profile audit up --build
type docker\chess-output\REPORTE_CHESS_1.md
```

Los 6 agentes analizan el repo en modo read-only y el coordinator genera un informe. **Un HIGH bloquea el merge.**

---

## Documentación

- No documentar durante el desarrollo de una feature
- Documentar **al cerrar** cada fase o cuando el cambio es significativo
- Los documentos viven en `docs/`
- El índice general está en `docs/INDEX_DOCUMENTACION.md`
- El CHANGELOG se actualiza en `docs/CHANGELOG.md`

---

## Contacto y dudas

Si tienes dudas sobre si algo viola las reglas:
1. Lee `AGENTS.md`
2. Lanza el Chess y mira el reporte
3. Si el Chess no lo detecta y AGENTS.md no lo prohíbe explícitamente → adelante

---

*Artificial World — artificial-word. Guía de contribución. 2026-03-08*
