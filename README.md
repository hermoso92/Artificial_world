# Artificial World

Simulación de vida artificial 2D con agentes autónomos.

La línea de verdad de este repositorio es esta:

- `Artificial World` es, hoy, un **motor principal en Python + pygame**.
- La web fullstack es una **demo funcional con motor JavaScript propio**, no una interfaz del motor Python.
- `DobackSoft` dentro de este repo es una **vertical demo**; el producto completo de esa línea no vive aquí.

La tesis de producto más fuerte y defendible desde este repo es:

- `Artificial World` puede evolucionar hacia un **sistema de civilizaciones vivas con refugios, heroes y memoria**
- la capa **2D** debe seguir siendo la verdad estrategica del sistema
- la capa **3D** es, por ahora, solo una direccion de encarnacion futura; no existe runtime 3D verificable hoy

## Qué es

`Artificial World` modela entidades que perciben, recuerdan, puntúan acciones y actúan dentro de un mundo persistente.

La parte más verificable del proyecto está en el motor Python:

- 13 tipos de acción en `tipos/enums.py`
- memoria espacial/social en `systems/memory/memoria_entidad.py`
- persistencia SQLite en `sistemas/sistema_persistencia.py`
- Modo Sombra en `sistemas/gestor_modo_sombra.py`
- runner de pruebas en `pruebas/run_tests_produccion.py`

## Qué incluye este repo

| Componente | Estado | Qué es |
|------------|--------|--------|
| Motor Python (`principal.py`) | Real | Núcleo principal con persistencia, Modo Sombra, watchdog y pruebas |
| Web fullstack (`scripts/iniciar_fullstack.ps1`) | Demo funcional | Motor JavaScript independiente con REST + WebSocket |
| DobackSoft (`frontend/src/components/DobackSoft.jsx`) | Demo vertical | Landing, cupón, visor y ruta demo; no producto B2B completo |
| HeroRefuge | Mixto | Módulo web con persistencia parcial, refugios jugables 2D, companion IA y mundos ligeros |

## IA local y automatización

La base mínima compartida ya implementada en este repo incluye:

- `backend/src/services/aiCore.js` con `health`, `chat`, `summarize`, `analyzeTestFailure` y `analyzeSession`
- `backend/src/services/llmService.mjs` como adaptador de `HeroRefuge` sobre el `ai-core`
- memoria local versionada en `docs/ia-memory/`
- endpoints `/api/ai/*`
- `iniciar.ps1` como `bootstrap/doctor/launcher`

Documentación asociada:

- [docs/IMPLEMENTACION_AI_CORE_LOCAL.md](docs/IMPLEMENTACION_AI_CORE_LOCAL.md)
- [docs/IA_LOCAL_BASE.md](docs/IA_LOCAL_BASE.md)

## Qué existe hoy

- Un motor Python ejecutable localmente con persistencia en `mundo_artificial.db`
- Un modo web que arranca backend `3001` + frontend `5173`
- Un flujo web fundacional: elegir semilla, crear heroe, crear refugio y crear un primer mundo ligero
- Un runner de producción con **11 suites** en `pruebas/run_tests_produccion.py`
- Crónica fundacional headless: `python cronica_fundacional.py` o `python principal.py --cronica`
- Workflows CI en `.github/workflows/ci-completo.yml` y `.github/workflows/pipeline.yml`

## Qué es demo

- La simulación web usa un motor JavaScript distinto al motor Python
- `DobackSoft` en este repo usa almacenamiento en memoria y rutas mock en `backend/src/routes/dobacksoft.js`
- El modo “ruta real” del `FireSimulator` depende de datos entregados por el visor; no valida por sí solo una integración real con telemetría externa
- No hay evidencia de runtime 3D interactivo en frontend o backend

## Qué está en otro repositorio

- El `DobackSoft` comercial completo o `StabilSafe V3` no está implementado aquí como producto cerrado
- Este repo solo contiene una vertical demo relacionada con esa idea

## Qué puede probar alguien hoy en 3 minutos

### Vista rápida de la demo web

```powershell
.\scripts\iniciar_fullstack.ps1
```

Resultado esperado:

- se abre `http://localhost:5173`
- puedes navegar el hub y ver la demo web
- esto demuestra la **capa demo web**, no el motor principal Python

### Golden path recomendado

Para probar la parte más real del proyecto, sigue [docs/GOLDEN_PATH.md](docs/GOLDEN_PATH.md).

Resumen corto:

```powershell
pip install -r requirements.txt
python principal.py
```

Eso demuestra el motor principal: simulación, persistencia, Modo Sombra y flujo core.

### Crónica fundacional (headless reproducible)

```powershell
python cronica_fundacional.py --seed 42 --ticks 200
```

Genera `cronica_fundacional.json` y `cronica_fundacional.md` con hitos, entidades finales, alertas y veredicto de supervivencia.

## Ejecución

### Motor principal (Python)

```powershell
pip install -r requirements.txt
python principal.py
```

### Demo web fullstack

```powershell
.\scripts\iniciar_fullstack.ps1
```

### Crónica fundacional (headless)

```powershell
python cronica_fundacional.py
python principal.py --cronica
```

### Landing HTML

```powershell
python principal.py --web
```

### Generar ejecutable Windows

```powershell
.\build_exe.ps1
```

El script existe en el repo. La disponibilidad del binario final depende de ejecutarlo localmente.

## Evidencias verificables

- `tipos/enums.py` enumera **13** tipos de acción
- `pruebas/run_tests_produccion.py` ejecuta **11 suites**
- `backend/src/realtime/websocket.js` expone `/ws` para la demo web
- `backend/src/routes/dobacksoft.js` deja explícito que sesiones y rutas son mock

## Qué no afirmar con este repo

No conviene presentar como hecho, sin más evidencia, lo siguiente:

- latencia `< 1 ms`
- miles de agentes
- telemetría real integrada
- producto `enterprise`
- DobackSoft completo en este mismo repo
- robustez total o escalado masivo

Si algo de eso se quiere defender, debe apoyarse en benchmarks, pruebas o integración real versionada.

## Documentación por audiencia

- Técnica: [docs/ESENCIAL.md](docs/ESENCIAL.md), [AGENTE_ENTRANTE.md](AGENTE_ENTRANTE.md)
- Producto / dirección: [docs/DOCUMENTACION_COMPLETA.md](docs/DOCUMENTACION_COMPLETA.md)
- Visión de producto: [docs/VISION_CIVILIZACIONES_VIVAS.md](docs/VISION_CIVILIZACIONES_VIVAS.md)
- Inversor / partner: [docs/PAQUETE_RELATO/DOCUMENTO_2_BRIEF_INVERSION.md](docs/PAQUETE_RELATO/DOCUMENTO_2_BRIEF_INVERSION.md)
- Exploración general: [docs/CONOCE_ARTIFICIAL_WORLD.md](docs/CONOCE_ARTIFICIAL_WORLD.md)
- Ruta recomendada de prueba: [docs/GOLDEN_PATH.md](docs/GOLDEN_PATH.md)
- IA local y automatización: [docs/IA_LOCAL_BASE.md](docs/IA_LOCAL_BASE.md)

## Documentación adicional

- [docs/MODOS_EJECUCION.md](docs/MODOS_EJECUCION.md) — diferencia entre Python y fullstack
- [docs/ESTRATEGIA_PRODUCTO.md](docs/ESTRATEGIA_PRODUCTO.md) — decisión de foco del repo
- [docs/tutorial/TUTORIAL.md](docs/tutorial/TUTORIAL.md) — recorrido visual de la demo web
- [docs/INFOGRAFIA_ARTIFICIAL_WORLD.md](docs/INFOGRAFIA_ARTIFICIAL_WORLD.md) — versión divulgativa
