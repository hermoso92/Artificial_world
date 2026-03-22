# AGENTS.md

## Reglas de Code Review — Artificial Word

### Referencias
- Frontend: `frontend/src/`
- Backend: `backend/src/`

---

## TODOS LOS ARCHIVOS

REJECT si:
- Se usa `console.log` → usar siempre el `logger` de `utils/logger`
- Se usan credenciales o secrets hardcodeados
- Hay bloques `catch` vacíos o silenciosos sin manejo de error
- Se usa `any` en TypeScript sin justificación explícita con comentario

---

## JavaScript / TypeScript (frontend y backend)

REJECT si:
- URLs hardcodeadas como `http://localhost:3001` o similares → usar `config/api.js` o variables de entorno
- Se importa `* as React` → usar imports nombrados `{ useState, useEffect }`
- Componentes React superan 300 líneas
- Se usan colores hexadecimales hardcodeados en className → usar clases Tailwind
- `useMemo` o `useCallback` sin justificación
- `var` en lugar de `const` o `let`
- Funciones con más de 3 niveles de anidamiento sin refactorizar

PREFER:
- Exports nombrados sobre default exports
- Composición sobre herencia
- Nombres descriptivos en inglés o español consistente (no mezclar)

---

## Python

REJECT si:
- `print()` en lugar de `logger`
- Funciones públicas sin type hints
- `except:` sin excepción específica (bare except)
- Variables de una sola letra salvo en bucles cortos (`i`, `j`)

REQUIRE:
- Docstrings en clases y funciones públicas

---

## Seguridad

REJECT si:
- JWT o tokens expuestos en variables globales del frontend
- Datos de una organización accesibles sin filtro `organizationId`
- Inputs del usuario usados directamente en queries sin sanitizar

---

## Estructura y Módulos

REJECT si:
- Se crean módulos o rutas fuera del menú oficial del proyecto
- Se cambian los puertos 3001 (backend) o 5173 (frontend)
- Se propone un script de inicio distinto a `scripts\iniciar_fullstack.ps1`

---

## Formato de Respuesta

La PRIMERA LÍNEA debe ser exactamente:
STATUS: PASSED
o
STATUS: FAILED

Si FAILED, listar: `archivo:linea - regla violada - descripción del problema`

---

## Cursor Cloud / Proyecto

MUNDO_ARTIFICIAL es una simulación 2D de vida artificial con agentes autónomos (Python 3.11+ y pygame). Ver `AGENTE_ENTRANTE.md` para documentación técnica.

### Tests
```bash
SDL_VIDEODRIVER=dummy SDL_AUDIODRIVER=dummy python pruebas/test_core.py
SDL_VIDEODRIVER=dummy SDL_AUDIODRIVER=dummy python pruebas/test_modo_sombra_completo.py
SDL_VIDEODRIVER=dummy SDL_AUDIODRIVER=dummy python pruebas/test_interacciones_sociales.py
```

### Lint

No linting tools (flake8, pylint, mypy, ruff) are configured in this project. The CI pipeline (`pipeline.yml`) only runs tests. Use `python -m py_compile <file>` for basic syntax verification.

### Inicio
- Python: `python principal.py`
- Fullstack: `.\scripts\iniciar_fullstack.ps1` (backend 3001, frontend 5173)
- In Cloud VMs, use `DISPLAY=:1` (TigerVNC display) to run the app visually in the Desktop pane. Clean start: delete `mundo_artificial.db` before running if entities behave unexpectedly.

### entidades_visibles format

`PercepcionLocal.entidades_visibles` contains tuples `(Posicion, list[int])` from `mapa.obtener_entidades_en_radio()`. Code that iterates over this field must unpack tuples to extract entity IDs, then resolve actual entity objects from `contexto.entidades`. Some tests pass entity objects directly — any new code must handle both formats. See Bugs 5-7 in `AGENTE_ENTRANTE.md` for details.

### Documentación
- `docs/MODOS_EJECUCION.md` — Diferencias entre Python (pygame) y Fullstack (web)

### Dependencies

Only pip dependency: `pygame>=2.5.0` (from `requirements.txt`). System dependencies: `libsdl2-2.0-0`, `libsdl2-image-2.0-0`, `libsdl2-mixer-2.0-0`, `libsdl2-ttf-2.0-0`.
