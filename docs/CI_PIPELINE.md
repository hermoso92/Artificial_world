# Pipeline CI - artificial word

Tests automáticos en tiempo real con contenedores, GitHub Actions, Redis y Hostinger Horizons.

---

## 1. Resumen

| Componente | Uso |
|------------|-----|
| **GitHub Actions** | Tests en push, PR, cada 6h (cron) y manual |
| **Docker** | Entorno reproducible para tests |
| **Redis** | Servicio auxiliar (cache, futuras integraciones) |
| **Horizons** | Despliegue de landing (Hostinger) |

---

## 2. Ejecución local

### Tests nativos (sin Docker)

```powershell
cd "c:\Users\Cosigein SL\Desktop\artificial word"
$env:SDL_VIDEODRIVER="dummy"
$env:SDL_AUDIODRIVER="dummy"
python pruebas/run_tests_produccion.py
python pruebas/verificar_todo.py
```

Para incluir tests E2E del navegador (artificial-world.html):

```powershell
pip install playwright
playwright install chromium
python pruebas/verificar_todo.py
```

### Tests en Docker

```powershell
# Build y ejecutar (incluye Playwright Chromium)
docker build -f Dockerfile.ci -t artificial-word-ci .
docker run --rm artificial-word-ci
```

### Tests con docker-compose (incluye Redis)

```powershell
docker-compose -f docker-compose.ci.yml run --rm tests
```

---

## 3. GitHub Actions

### Workflows

- **`.github/workflows/pipeline.yml`** – **Pipeline principal**: Test → Deploy → Upload
  - En **PR**: ejecuta tests y sube artefactos
  - En **push a main** (tras merge): tests → deploy a GitHub Pages → upload
- **`.github/workflows/tests.yml`** – Tests básicos (legacy)
- **`.github/workflows/ci-completo.yml`** – Pipeline completo (matrix, Docker, Redis):
  - `tests-nativo`: Python 3.11 y 3.12, matrix
  - `tests-docker`: Build imagen y ejecuta verificación
  - `ci-redis`: Tests con Redis como servicio

### Playwright en CI

Antes de ejecutar `verificar_todo.py`, los workflows instalan Playwright y Chromium:

```yaml
- name: Instalar Playwright Chromium
  run: playwright install chromium
```

Con esto, el test `browser_e2e` se ejecuta en CI. Si Playwright no está instalado, `verificar_todo.py` omite ese test sin fallar.

### Disparadores

- **push** a `main` o `feature/*`
- **pull_request** a `main`
- **schedule**: cada 6 horas (`0 */6 * * *`)
- **workflow_dispatch**: ejecución manual

### Artifacts

Tras cada run se suben:
- `verificacion_completa.json`
- `pruebas/reporte_produccion.log`

---

## 4. Redis

Redis está disponible como servicio auxiliar. Los tests **no lo requieren**; funcionan sin él.

Uso futuro posible:
- Cache de resultados de verificación entre runs
- API con sesiones (si se añade backend web)
- Cola de tareas para tests paralelos

---

## 5. Hostinger Horizons

Para desplegar la landing de artificial.world:

1. Ver `docs/PROMPT_HOSTINGER_HORIZONS.md` – prompt para crear la web en Horizons
2. GitHub Pages: `docs/index.html` se puede desplegar con `.github/workflows/pages.yml`
3. Dominio: artificial.world (comprar en Hostinger)

Horizons es un constructor con IA; no requiere CI para el contenido estático. El CI valida el código del motor/simulación.

---

## 6. Verificaciones incluidas

`verificar_todo.py` ejecuta 8 comprobaciones:

1. **Sintaxis** – Todos los `.py` compilan
2. **Tests producción** – 9 suites (estructural, core, modo sombra, etc.)
3. **Modo Competencia** – Registro y integridad
4. **Simulación completa** – 50 ticks, guardar, cargar, reporte
5. **Modo Sombra** – Activar, comando, desactivar
6. **Logs cierre** – Cierre limpio en app_diagnostico.log
7. **Reporte sesión** – Validez de reporte_sesion.json
8. **Browser E2E** – Tests de artificial-world.html con Playwright (se omite si no está instalado)

---

## 7. OpenClaw (referencia)

[OpenClaw](https://docs.openclaw.ai) es un framework de IA para asistentes con tests E2E. No se usa en artificial word (motor de NPCs en Python/pygame). Si en el futuro se añade una API o interfaz web con agentes, OpenClaw podría integrarse para tests de conversación.