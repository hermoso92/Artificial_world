# Artificial World — Documentación completa

> Fuente maestra de verdad del repositorio. Si una afirmación importante no puede apoyarse en código, tests, scripts o rutas reales, aquí se rebaja o se mueve a demo o roadmap.

---

## 1. Resumen ejecutivo

La tesis verificable de este repositorio es esta:

- `Artificial World` es, hoy, un **motor principal en Python + pygame** y **laboratorio local auditable**.
- La web fullstack es una **demo funcional con motor JavaScript propio**, no una interfaz del motor Python.
- `DobackSoft` dentro de este repo es una **vertical demo**; el producto comercial completo vive en dobackv2.
- **FireSimulator** y superficies jugables son **demo y entrenamiento**, no núcleo de negocio.

Documento maestro: [docs/OWNERSHIP_ESTRATEGICO.md](OWNERSHIP_ESTRATEGICO.md).

La tesis de producto elegida para ordenar el sistema es:

- `Artificial World` debe explicarse como una **base para civilizaciones vivas con refugios, heroes y memoria**
- la **2D** es la capa de verdad estrategica y sistemica
- la **3D** queda como capa futura de encarnacion visual, no como claim actual

El golden path recomendado para demostrar el proyecto es el **motor Python**, porque es la parte más consistente entre código, persistencia, tests y documentación.

---

## 2. Qué existe hoy

### Producto real verificable

- Un motor Python ejecutable por `python principal.py`
- Persistencia SQLite en `mundo_artificial.db`
- Modo Sombra, watchdog, logs y runner de pruebas
- Script para generar ejecutable en `build_exe.ps1`

### Demo funcional

- Un modo web que arranca con `.\scripts\iniciar_fullstack.ps1`
- Backend Express + WebSocket en `backend/src/`
- Frontend React/Vite en `frontend/src/`
- `DobackSoft` y `FireSimulator` como vertical demo dentro del hub web
- Un flujo fundador minimo en web: elegir semilla, crear heroe, crear refugio y fundar un primer mundo ligero

### Fuera de este repositorio

- El `DobackSoft` comercial completo o `StabilSafe V3`
- Cualquier claim de integración completa con telemetría operativa real
- Cualquier runtime 3D interactivo ya integrado

### Qué puede probar alguien hoy en 3 minutos

- **Vista rápida demo:** `.\scripts\iniciar_fullstack.ps1`
- **Ruta recomendada real:** seguir [docs/GOLDEN_PATH.md](GOLDEN_PATH.md)

---

## 3. Qué es Artificial World

`Artificial World` modela entidades que perciben, recuerdan, puntúan acciones y actúan dentro de un mundo persistente.

La analogía más útil sigue siendo esta: es un pueblo pequeño en pantalla donde cada entidad tiene memoria, necesidades y consecuencias. La diferencia con una demo puramente visual es que aquí hay estado, reglas y persistencia.

La formulacion de producto más potente y sostenible para este repo no es “creador de mapas”, sino esta:

**Empieza con un refugio. Elige una semilla. Mira nacer tu civilizacion.**

---

## 4. Evidencia técnica del núcleo real

| Capacidad | Evidencia | Dónde verlo |
|-----------|-----------|-------------|
| 13 tipos de acción | Enum `TipoAccion` | `tipos/enums.py` |
| Memoria espacial y social | Clase `MemoriaEntidad` | `systems/memory/memoria_entidad.py` |
| Persistencia SQLite | Guardado/carga de estado | `sistemas/sistema_persistencia.py` |
| Modo Sombra | Control manual por turnos | `sistemas/gestor_modo_sombra.py` |
| Decisión por utilidad | Puntuación y selección de acciones | `agentes/motor_decision.py` |
| Orquestación del bucle | Simulación y ticks | `nucleo/simulacion.py` |

### Sobre modelos locales

El motor de simulación **no usa LLMs** para decidir acciones.  
El módulo `HeroRefuge` de la capa web puede usar `Ollama` de forma opcional para conversación, pero eso no forma parte del núcleo del motor.

---

## 5. Golden path elegido

### Camino elegido

**Camino A**: centrar el repo en `motor Python + demo web`, dejando `DobackSoft` claramente como vertical demo.

### Por qué

- El motor Python está mejor respaldado por código, persistencia y pruebas.
- La web usa un motor independiente en JS.
- `DobackSoft` en este repo tiene UI funcional, pero backend mock para sesiones y rutas en `backend/src/routes/dobacksoft.js`.

### Demostración recomendada

1. `pip install -r requirements.txt`
2. `python principal.py`
3. Observar simulación, panel, entidades y Modo Sombra
4. Opcionalmente probar guardado/carga y luego leer [docs/GOLDEN_PATH.md](GOLDEN_PATH.md)

Esto demuestra el producto real del repo.  
La demo web se usa como puerta de entrada visual, no como prueba del mismo motor.

### Flujo fundador recomendado para la web

Si se enseña la capa web, el flujo correcto ya no es “crear cualquier mundo”, sino:

1. elegir una `CivilizationSeed`
2. nombrar al constructor
3. nombrar el refugio fundador
4. crear un primer mundo ligero con comunidad y cronica inicial

Ese flujo existe hoy de forma **parcial pero real** en la landing y en `HeroRefuge`.

---

## 6. Tabla final de estado

| Componente | Estado | Evidencia | Dónde verlo | Observaciones |
|-----------|--------|-----------|-------------|---------------|
| Motor Python | Real | `principal.py`, `nucleo/simulacion.py`, persistencia, tests | `python principal.py` | Núcleo más sólido del repo |
| Persistencia del mundo | Real | `sistemas/sistema_persistencia.py` | `mundo_artificial.db` | Asociada al motor Python |
| Modo Sombra | Real | `sistemas/gestor_modo_sombra.py`, tests | UI pygame | Parte del producto real |
| Runner de producción | Real | `pruebas/run_tests_produccion.py` | CLI | Ejecuta 10 suites |
| Web fullstack | Demo funcional | `scripts/iniciar_fullstack.ps1`, `backend/src/realtime/websocket.js` | `http://localhost:5173` | Motor JS propio |
| WebSocket web | Demo funcional | `/ws` en `backend/src/realtime/websocket.js` | Backend web | Estado de la demo web |
| DobackSoft en este repo | Demo vertical | `frontend/src/components/DobackSoft.jsx` | Hub web | No equivale al producto completo |
| Sesiones/rutas DobackSoft | Demo mock | `sessionsStore`, `MOCK_ROUTE` | `backend/src/routes/dobacksoft.js` | No es flujo real persistido |
| FireSimulator | Demo jugable | `frontend/src/components/FireSimulator.jsx` | Hub web | Superficie de demo/entrenamiento, no núcleo. Ver [docs/SUPERFICIE_JUEGO.md](SUPERFICIE_JUEGO.md) |
| HeroRefuge | Mixto | persistencia + LLM opcional + mundos ligeros | Web | Base parcial para refugios, heroes y semillas |
| CivilizationSeed web | Parcial pero real | `backend/src/simulation/civilizationSeeds.js`, landing y HeroRefuge | Web | Define tono fundacional, no una simulacion civilizatoria profunda |
| 3D runtime | No existe | No hay dependencias ni escenas 3D | N/A | Debe tratarse como futuro |
| Integración completa DobackSoft | Roadmap | `docs/PLAN_INTEGRACION_DOBACKSOFT_ARTIFICIAL_WORLD.md` | Documento | Estado de diseño, no de producto cerrado |

---

## 7. Evidencias verificables de pruebas

### Runner principal

`pruebas/run_tests_produccion.py` ejecuta **10 suites**:

| Suite | Parte validada | Ámbito |
|-------|----------------|--------|
| `test_estructural` | imports, config, módulos | Python real |
| `test_core` | motor, directivas, watchdog | Python real |
| `test_modo_sombra_completo` | control manual y cola | Python real |
| `test_perseguir_hasta_matar` | persecución/combate | Python real |
| `test_interacciones_sociales` | relaciones e interacción | Python real |
| `test_bug_robar` | regresión de robo | Python real |
| `test_watchdog_fixes` | fixes del watchdog | Python real |
| `test_watchdog_integracion` | watchdog integrado | Python real |
| `test_arranque_limpio` | inicio sin estado previo | Python real |
| `test_integracion_produccion` | flujo integrado y guardado/carga | Python real |

### Otras pruebas presentes en el repo

Hay tests adicionales fuera del runner principal, por ejemplo:

- `pruebas/test_browser_e2e.py`
- `pruebas/test_html_modo_sombra.py`
- `pruebas/test_modo_sombra.py`
- `pruebas/test_integral_control_total.py`

Estas existen en el repo, pero el bloque más defendible para auditoría sigue siendo el runner principal de 10 suites.

### CI verificable

Hay workflows versionados en:

- `.github/workflows/ci-completo.yml`
- `.github/workflows/pipeline.yml`

No se afirma aquí robustez total ni cobertura completa; solo que el repo sí contiene automatización CI real.

---

## 8. Producto, demo y roadmap

### Producto real

- Motor Python
- Persistencia SQLite del mundo
- Modo Sombra
- Watchdog
- Runner de pruebas y CI

### Demo

- Web fullstack con motor JS propio
- Hub, `DobackSoft`, `FireSimulator`
- WebSocket del backend web
- Landing HTML
- Flujo fundador web con semilla de civilizacion

### Roadmap o no verificado

- DobackSoft como MVP real con sesión persistida y ruta real dentro de este repo
- Integración completa con telemetría real
- API oficial del motor Python para la web
- Unificación de motores Python y JS
- Capa 3D encarnada para heroes, refugios y eventos
- Benchmarks formales de latencia, escala o rendimiento

---

## 9. Claims rebajados o eliminados

Estos claims no deben tratarse como hechos del repo sin evidencia adicional:

- `< 1 ms`
- `miles de agentes`
- `enterprise`
- `producto completo`
- `telemetría real`
- `robustez total`
- `escalado masivo`

Sustitución recomendada:

- “motor local con decisión por utilidad”
- “demo web funcional”
- “vertical demo”
- “roadmap” o “no verificado”

---

## 10. Relación con DobackSoft

La formulación defendible es esta:

- `Artificial World` aporta el motor y la tesis del proyecto.
- La web muestra una demo funcional del concepto.
- `DobackSoft` dentro de este repo es una vertical demo.
- El producto completo de esa línea no debe presentarse como cerrado aquí.

Eso evita confundir:

- motor real,
- demo visual,
- y producto B2B externo.

---

## 11. Evidencia visual

### Evidencia utilizable hoy

- El repo contiene una landing y una demo web navegable.
- `backend/src/routes/dobacksoft.js` espera un trailer en `assets/dobacksoft/fire_truck_trailer.mp4`.
- Hay evidencia visual real de 2D interactivo en la simulacion web y en el visor de rutas.

### Lo que falta como evidencia estable

No hay todavía, en esta fuente maestra, una carpeta clara y versionada de capturas enlazadas como prueba documental estable del golden path.

Tampoco hay evidencia de runtime 3D integrado o jugable.

Recomendación futura, sin ampliar alcance ahora:

- `docs/assets/golden-path/01_python_inicio.png`
- `docs/assets/golden-path/02_modo_sombra.png`
- `docs/assets/golden-path/03_demo_web.png`

---

## 12. Propuesta mínima de IA local y automatización

### ai-core mínimo

La base mínima ya implementada para este repo es un núcleo pequeño basado en `Ollama` para:

- chat contextual limitado
- resumen de logs y reportes
- análisis de fallos de tests
- copiloto documental y de debugging
- análisis de sesiones

Base real reutilizable y ahora conectada:

- `backend/src/services/aiCore.js`
- `backend/src/services/llmService.mjs`
- `backend/src/routes/ai.js`
- `backend/src/simulation/heroRefuge.js`
- `docs/ia-memory/`
- `pruebas/run_tests_produccion.py`
- `.github/workflows/`

### Memoria local

La memoria mínima ya materializada es simple y versionada:

- decisiones técnicas
- prompts
- fallos frecuentes
- reportes
- glosario
- ejemplos de sesiones y rutas

Sin vector DB ni multiagente al principio.

### Bootstrap + doctor + launcher

`iniciar.ps1` ya evoluciona hacia:

- detectar entorno
- verificar dependencias
- recomendar camino
- lanzar producto real, demo, debug, verificación o IA local opcional
- generar artefactos de salida reutilizables

### Puente con DobackSoft real

La integración futura debe ir por:

- artefactos
- contratos estables
- export/import controlado

No por acoplamiento prematuro entre repositorios.

Detalle ampliado en:

- [docs/IA_LOCAL_BASE.md](IA_LOCAL_BASE.md)
- [docs/IMPLEMENTACION_AI_CORE_LOCAL.md](IMPLEMENTACION_AI_CORE_LOCAL.md)

---

## 13. Documentos que deben seguir esta verdad

- `README.md`
- `docs/OWNERSHIP_ESTRATEGICO.md` — DobackSoft = producto; Artificial World = laboratorio; juego = demo
- `docs/ESTRATEGIA_PRODUCTO.md`
- `docs/MODOS_EJECUCION.md`
- `docs/IA_LOCAL_BASE.md`
- `docs/VISION_CIVILIZACIONES_VIVAS.md`
- `docs/CONOCE_ARTIFICIAL_WORLD.md`
- `docs/INFOGRAFIA_ARTIFICIAL_WORLD.md`
- `docs/PAQUETE_RELATO/`

No hace falta convertirlos en clones; sí hace falta que no contradigan esta fuente.

---

## 14. Referencias

| Documento | Uso |
|-----------|-----|
| [README.md](../README.md) | Puerta de entrada del repo |
| [docs/OWNERSHIP_ESTRATEGICO.md](OWNERSHIP_ESTRATEGICO.md) | Ownership: DobackSoft, Artificial World, juego |
| [docs/GOLDEN_PATH.md](GOLDEN_PATH.md) | Recorrido recomendado y defendible |
| [docs/VISION_CIVILIZACIONES_VIVAS.md](VISION_CIVILIZACIONES_VIVAS.md) | Tesis de producto y foco del sistema |
| [docs/IA_LOCAL_BASE.md](IA_LOCAL_BASE.md) | Propuesta mínima de IA local, memoria y automatización |
| [docs/ESENCIAL.md](ESENCIAL.md) | Guía técnica corta |
| [AGENTE_ENTRANTE.md](../AGENTE_ENTRANTE.md) | Detalle técnico del motor Python |
| [docs/MODOS_EJECUCION.md](MODOS_EJECUCION.md) | Python vs web |
| [docs/ESTRATEGIA_PRODUCTO.md](ESTRATEGIA_PRODUCTO.md) | Decisión de foco |

---

> Constrúyelo. Habítalo. Haz que crezca.
