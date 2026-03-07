# Plan de producción — MUNDO_ARTIFICIAL

**Objetivo:** Llevar el proyecto a estado listo para usuarios finales.  
**Estado actual:** Desarrollo funcional, tests OK, no listo para distribución.

---

## 1. Estado actual

### Lo que funciona
- 68 tests pasando (core, modo sombra, interacciones sociales, watchdog, arranque)
- Motor de decisión, directivas, control forzado (Modo Sombra)
- Acciones sociales reales (compartir, robar, seguir)
- Persistencia SQLite, logs, watchdog
- Documentación AGENTE_ENTRANTE.md

### Brechas para producción

| Brecha | Impacto | Prioridad |
|--------|---------|-----------|
| Dependencias sin fijar | Roturas con actualizaciones de pygame | Alta |
| Errores no manejados | Cierre brusco sin mensaje al usuario | Alta |
| Sin empaquetado | Usuario necesita Python instalado | Alta |
| Sin CI | Regresiones no detectadas antes de merge | Media |
| Config sin validación | Valores inválidos pueden romper la sim | Media |

---

## 2. Fases del plan

### FASE 1 — Dependencias fijadas

**Objetivo:** Reproducibilidad de builds.

**Archivo:** `requirements.txt`

**Cambios:**
```
# MUNDO_ARTIFICIAL - Dependencias (versiones fijas para producción)
# Python 3.11+

pygame==2.6.1
```

**Verificación:** `pip install -r requirements.txt` en entorno limpio; ejecutar `python principal.py`.

**Criterio de éxito:** La app arranca con las versiones indicadas.

---

### FASE 2 — Manejo de errores y mensajes al usuario

**Objetivo:** Errores controlados y mensajes claros en lugar de cierre brusco.

**Archivos a modificar:**
- `principal.py` — envolver `main()` en try/except, mostrar mensaje en ventana o diálogo
- `nucleo/simulacion.py` — en `ejecutar_bucle_principal`, capturar excepciones del tick y mostrar feedback en UI en lugar de solo loguear y relanzar

**Cambios concretos:**

1. **principal.py**
   - En el `except` final: además de `_log()` y `raise`, ofrecer mensaje al usuario (p. ej. `tkinter.messagebox` o ventana pygame con el error).
   - Opción mínima: escribir a `error_critico.txt` con instrucciones para el usuario.

2. **nucleo/simulacion.py** (bucle principal, ~línea 673)
   - En lugar de `raise` directo: mostrar mensaje en `estado_panel.mensaje_feedback` o similar.
   - Registrar en log y permitir reintentar o salir de forma controlada.

3. **Puntos críticos sin try/except:**
   - `inicializar()` — fallos al crear ventana/renderizador
   - `crear_mundo()` / `crear_entidades_iniciales()` — fallos de generación
   - Carga/guardado de persistencia — fallos de disco/permisos

**Criterio de éxito:** Ante un error típico (p. ej. falta pygame), el usuario ve un mensaje claro en lugar de una ventana que se cierra sin explicación.

---

### FASE 3 — Empaquetado con PyInstaller

**Objetivo:** Ejecutable `.exe` (Windows) para usuarios sin Python.

**Dependencia:** `pip install pyinstaller`

**Comando base:**
```powershell
pyinstaller --onefile --windowed --name "MundoArtificial" principal.py
```

**Consideraciones:**
- Incluir `configuracion.py`, `tipos/`, `agentes/`, `acciones/`, `entidades/`, `mundo/`, `nucleo/`, `sistemas/`, `interfaz/`, `utilidades/` como datos o módulos.
- PyInstaller suele detectar imports; verificar con `--log-level DEBUG` si algo falta.
- Probar el `.exe` en una máquina sin Python.

**Archivo opcional:** `build.spec` para configuración reproducible.

**Criterio de éxito:** El `.exe` generado arranca la simulación en Windows sin tener Python instalado.

---

### FASE 4 — CI (tests en cada commit)

**Objetivo:** Ejecutar tests automáticamente en cada push/PR.

**Plataforma:** GitHub Actions (si el repo está en GitHub).

**Archivo:** `.github/workflows/tests.yml`

**Contenido:**
```yaml
name: Tests

on:
  push:
    branches: [main, feature/*]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: pip install -r requirements.txt
      - name: Run tests (produccion)
        env:
          SDL_VIDEODRIVER: dummy
          SDL_AUDIODRIVER: dummy
        run: python pruebas/run_tests_produccion.py
```

**Runner único:** `run_tests_produccion.py` ejecuta 9 suites (estructurales, core, modo sombra, interacciones, bug robar, watchdog fixes/integración, arranque, integración producción) y genera `pruebas/reporte_produccion.log` con control total.

**Criterio de éxito:** Cada push a `main` o `feature/*` ejecuta los tests y el resultado aparece en la pestaña Actions.

---

### FASE 5 — Validación de configuración (opcional)

**Objetivo:** Evitar fallos por valores de configuración inválidos.

**Archivo:** `configuracion.py`

**Cambios:**
- Añadir `__post_init__` al dataclass que valide rangos (p. ej. `ancho_mapa >= 2`, `fps_objetivo > 0`).
- Lanzar `ValueError` con mensaje claro si hay valores inválidos.

**Criterio de éxito:** Valores como `ancho_mapa=0` producen un error explícito al crear la configuración.

---

## 3. Orden de ejecución recomendado

```
FASE 1 (dependencias)  →  FASE 2 (errores)  →  FASE 4 (CI)  →  FASE 3 (empaquetado)
```

- **FASE 1:** Rápida, bajo riesgo.
- **FASE 2:** Mejora la experiencia ante fallos.
- **FASE 4:** Protege contra regresiones antes de empaquetar.
- **FASE 3:** Depende de que los tests pasen de forma estable.
- **FASE 5:** Se puede hacer en paralelo con 2 o 3.

---

## 4. Checklist de producción

Antes de considerar el proyecto listo para usuarios finales:

- [x] `requirements.txt` con versiones fijas
- [x] Errores críticos manejados con mensaje al usuario
- [x] CI ejecutando tests en cada commit (`.github/workflows/tests.yml`)
- [x] Ejecutable `.exe` generado y probado (`dist\MundoArtificial.exe` ~30 MB)
- [ ] README con instrucciones de instalación/ejecución
- [x] Documentación de configuración (variables en `configuracion.py` + validación)

---

## 5. Referencias

- PyInstaller: https://pyinstaller.org/
- GitHub Actions: https://docs.github.com/en/actions
- pygame: https://www.pygame.org/
