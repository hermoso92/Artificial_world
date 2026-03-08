# Artificial World — Documento único

> Un solo documento para entender, ejecutar, verificar y trabajar en el proyecto. Para dirección, inversores, familia, desarrolladores o cualquier persona.

---

## 1. Qué es Artificial World

**Artificial World** es una base para crear civilizaciones vivas con memoria, héroes, refugios y comunidades. La verdad estratégica vive en 2D; la encarnación 3D es capa futura.

**Mensaje corto:** *Empieza con un refugio. Elige una semilla. Mira nacer tu civilización.*

### Qué existe hoy (verificado)

| Capa | Estado | Evidencia |
|------|--------|-----------|
| **Motor Python** | Real | `principal.py`, 13 acciones, persistencia SQLite, Modo Sombra |
| **Web fullstack** | Demo funcional | Backend 3001, Frontend 5173, motor JS propio |
| **HeroRefuge** | Parcial | Refugios jugables, semillas, mundos ligeros, companion IA opcional |
| **DobackSoft** | Demo vertical | UI en hub; producto completo fuera del repo |
| **3D** | No existe | Roadmap, no implementado |

### Qué no existe hoy

- 3D runtime real
- Integración técnica motor Python + motor JS
- DobackSoft comercial completo en este repo
- Civilizaciones completas con diplomacia, linajes, guerras profundas

---

## 2. Cómo ejecutar (3 minutos)

### Opción A — Motor Python (recomendado, golden path)

```powershell
pip install -r requirements.txt
python principal.py
```

**Resultado:** Ventana pygame, entidades moviéndose, panel, Modo Sombra, guardar/cargar en `mundo_artificial.db`.

### Opción B — Demo web

```powershell
.\scripts\iniciar_fullstack.ps1
```

**Resultado:** Backend 3001, Frontend 5173, navegador abierto. Hub con HeroRefuge, DobackSoft, FireSimulator.

### Opción C — Crónica fundacional (headless)

```powershell
python cronica_fundacional.py --ticks 200
```

**Resultado:** `cronica_fundacional.json` y `cronica_fundacional.md`.

---

## 3. Tests y verificación

### Python

```powershell
$env:SDL_VIDEODRIVER="dummy"; $env:SDL_AUDIODRIVER="dummy"
python pruebas/run_tests_produccion.py
python pruebas/verificar_todo.py
```

**Suites Python (11):** estructural, core, crónica fundacional, modo sombra, combate, interacciones sociales, bug robar, watchdog fixes, watchdog integración, arranque limpio, integración producción.

### Backend y frontend

```powershell
cd backend; npm test
cd frontend; npm test
```

**Backend:** 39 tests (Vitest). **Frontend:** 6 tests (Vitest).

---

## 4. Estructura del proyecto

```
principal.py              ← entrada Python
nucleo/simulacion.py      ← orquestador
agentes/motor_decision.py ← decisión por utilidad
acciones/                 ← 13 acciones
sistemas/                 ← persistencia, modo sombra, watchdog
systems/memory/           ← memoria espacial y social
backend/src/              ← API + motor JS
frontend/src/             ← React (Hub, HeroRefuge, DobackSoft)
pruebas/                  ← run_tests_produccion.py, verificar_todo.py
docs/                     ← documentación
```

### Bases de datos

| BD | Uso |
|----|-----|
| `mundo_artificial.db` | Python — persistencia del mundo |
| `audit_simulacion.db` | Node — event store |
| `audit_competencia.db` | Python — modo competencia |

---

## 5. Modelo conceptual (civilizaciones vivas)

| Entidad | Descripción |
|---------|-------------|
| **World** | Contenedor: identidad, recursos, tick, crónica, semilla, refugio fundador |
| **CivilizationSeed** | Valores, tensiones, arquetipo, tono 2D/3D, héroe probable |
| **Refuge** | Unidad base: nombre, recursos, seguridad, moral, memoria local |
| **Hero** | Agente histórico: nombre, rol, arquetipo, lealtades |
| **Community** | Agrupación: cultura, tensiones, normas, cohesión, liderazgo |
| **MemoryEntry** | Registro: tipo, alcance, resumen, fecha |
| **HistoricalRecord** | Evento: tipo, título, resumen, significancia |

**Flujo fundador:** semilla → refugio → civilización naciente.

---

## 6. Regla 2D / 3D

| Capa | Significado | Hoy |
|------|-------------|-----|
| **2D** | Verdad sistémica: mapa, grid, rutas, nodos, recursos, refugios, influencia | Implementada |
| **3D** | Encarnación futura: héroes, refugios, eventos visuales | No implementada |

---

## 7. Tabla real / demo / roadmap

| Componente | Estado | Dónde |
|------------|--------|-------|
| Motor Python | Real | `principal.py`, `nucleo/`, `agentes/`, `sistemas/` |
| Persistencia | Real | `mundo_artificial.db`, `sistema_persistencia.py` |
| Modo Sombra | Real | `gestor_modo_sombra.py` |
| Web fullstack | Demo | `scripts/iniciar_fullstack.ps1` |
| HeroRefuge | Parcial | `backend/src/simulation/heroRefuge.js`, `frontend/` |
| CivilizationSeed | Parcial | `backend/src/simulation/civilizationSeeds.js` |
| DobackSoft | Demo | `frontend/src/components/DobackSoft.jsx` |
| 3D | Roadmap | — |

---

## 8. Reglas obligatorias (AGENTS.md)

| Regla | Descripción |
|-------|-------------|
| Logger | `logger` siempre — nunca `console.log` |
| URLs | `config/api.js` — nunca hardcodear |
| Catch | No vacíos — siempre manejar error |
| Componentes React | Máx. 300 líneas |
| Puertos | 3001 backend, 5173 frontend |

---

## 9. Skill civilizaciones-vivas-guardrails

Ubicación: `.cursor/skills/civilizaciones-vivas-guardrails/`

**Propósito:** Auditar evidencia, clasificar claims (`real`, `parcial`, `demo`, `externo`, `roadmap`), proteger la tesis y el flujo fundador.

**Se activa cuando se trabaja en:** tesis de producto, HeroRefuge, CivilizationSeed, World, Refuge, Hero, Community, estrategia 2D/3D, docs que puedan sobreprometer.

---

## 10. API rápida (web)

| Endpoint | Uso |
|----------|-----|
| `GET /api/world` | Estado del mundo |
| `POST /api/simulation/start` | Iniciar simulación |
| `ws://localhost:3001/ws` | WebSocket tiempo real |
| `GET /api/ai/health` | Estado IA local |
| `POST /api/ai/chat` | Chat contextual |

---

## 11. Documentos adicionales

| Tema | Documento |
|------|-----------|
| **Documento final (definitivo)** | `docs/DOCUMENTO_FINAL.md` |
| Guía esencial (2 páginas) | `docs/ESENCIAL.md` |
| Golden path detallado | `docs/GOLDEN_PATH.md` |
| Python vs web | `docs/MODOS_EJECUCION.md` |
| Tesis civilizaciones vivas | `docs/VISION_CIVILIZACIONES_VIVAS.md` |
| Documentación ampliada | `docs/DOCUMENTACION_COMPLETA.md` |
| Arquitectura técnica | `AGENTE_ENTRANTE.md` |
| Estrategia producto | `docs/ESTRATEGIA_PRODUCTO.md` |
| **Cronograma real + GitHub + motor creador** | `docs/ARTIFICIAL_WORD_CRONOGRAMA.md` |
| Decisión puente Python/JS | `docs/DECISION_PUENTE_PYTHON_JS.md` |
| Demo de 2 minutos | `docs/DEMO_2_MINUTOS.md` |
| Índice de documentación | `docs/INDEX_DOCUMENTACION.md` |
| Relato dirección/inversores | `docs/PAQUETE_RELATO/` |
| **Sistema Chess** (auditoría por agentes) | `docs/SISTEMA_CHESS.md` |
| **Plan de acción** | `docs/PLAN_ACCION.md` |
| **PDF con evidencias** | `docs/EVIDENCIAS_ARTIFICIAL_WORLD.pdf` |

### Auditoría Chess

```powershell
.\scripts\run_chess_audit.ps1
```

Audita documentación, backend, frontend, BBDD, tests y marketing con agentes Docker independientes. Genera `REPORTE_CHESS_1.md`.

### Regenerar PDF con evidencias

```powershell
node scripts/generar-pdf-evidencias.js
```

Incluye: log de producción, verificación JSON, descripción Admin Panel y capturas (si existen en `docs/tutorial/screenshots/`). Para capturar nuevas pantallas: ejecuta `.\scripts\iniciar_fullstack.ps1` y luego `node scripts/capture-screenshots.js`.

### Regenerar PDF del plan de acción

```powershell
node scripts/generar-pdf-plan.js
```

Genera `docs/PLAN_ACCION.pdf` a partir de `docs/PLAN_ACCION.md`.

---

## 12. Criterio de éxito

Una persona nueva debe entender en menos de 5 minutos:

- qué es real
- qué es demo
- qué debe probar primero

---

*Artificial World — Constrúyelo. Habítalo. Haz que crezca.*
