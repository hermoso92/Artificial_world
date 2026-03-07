# Reglas de Code Review — Artificial Word

## Referencias
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
- URLs hardcodeadas como `http://localhost:9998` o similares → usar `config/api.ts` o variables de entorno
- Requests a la API sin incluir `organizationId` en headers o body
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
- Se cambian los puertos 9998 (backend) o 5174 (frontend)
- Se propone un script de inicio distinto a `iniciar.ps1`

---

## Formato de Respuesta

La PRIMERA LÍNEA debe ser exactamente:
STATUS: PASSED
o
STATUS: FAILED

Si FAILED, listar: `archivo:linea - regla violada - descripción del problema`
