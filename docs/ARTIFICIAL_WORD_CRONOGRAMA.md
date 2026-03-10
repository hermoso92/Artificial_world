# Artificial Word — Cronograma real y motor creador de mundos

> Documento maestro que aclara el cronograma verificable, GitHub, todo lo que estamos creando y el camino hacia un motor compacto creador de mundos.

---

## 1. Nombres y alcance

| Término | Significado |
|---------|-------------|
| **Artificial Word** | Nombre del repositorio y del proyecto en GitHub |
| **Artificial World** | Marca y tesis de producto: base para civilizaciones vivas |
| **Motor creador de mundos** | Objetivo final: compactar todo en un núcleo reutilizable |

**Tesis:** *Empieza con un refugio. Elige una semilla. Mira nacer tu civilización.*

---

## 2. Cronograma real (verificado)

### Fase actual — Lo que existe hoy

| Hito | Estado | Evidencia | Fecha aproximada |
|------|--------|-----------|------------------|
| Motor Python 2D | ✅ Real | `principal.py`, 13 acciones, persistencia | Base |
| Modo Sombra | ✅ Real | `gestor_modo_sombra.py`, tests | Base |
| Persistencia SQLite | ✅ Real | `mundo_artificial.db`, `sistema_persistencia.py` | Base |
| Web fullstack | ✅ Demo | Backend 3001, Frontend 5173 | Base |
| HeroRefuge | ✅ Parcial | Semillas, mundos ligeros, companion IA | Base |
| CivilizationSeed | ✅ Parcial | 9 semillas en `civilizationSeeds.js` | Base |
| Panel Administrador | ✅ Real | `AdminPanel.jsx`, ruta `#admin` | Base |
| DobackSoft demo | ✅ Demo | `DobackSoft.jsx`, FireSimulator | Base |
| IA local base | ✅ Parcial | `aiCore.js`, `/api/ai/*`, Ollama | Base |
| CI GitHub | ✅ Real | `ci-completo.yml`, `pipeline.yml` | Base |
| 11 suites Python | ✅ Real | `run_tests_produccion.py` | Base |
| Deploy Pages + VPS | ✅ Configurado | `pipeline.yml` | Base |

### Próximos hitos (orden sugerido)

| Hito | Prioridad | Dependencias | Entregable |
|------|-----------|--------------|------------|
| Consolidar flujo fundador | P0 | — | Semilla → refugio → mundo en < 5 min |
| Enriquecer Refuge, Community, Hero | P1 | Flujo fundador | Más estado y memoria |
| Eventos → memoria e historia | P1 | Enriquecimiento | Crónica viva |
| Puente Python/JS (opcional) | P2 | Decisión arquitectónica | API o WASM |
| 3D como capa futura | P3 | Contrato, no implementación | Diseño y narrativa |

### No hacer todavía

- Motor 3D runtime
- Multiagente universal
- Fusión total Python/JS
- Claims de civilización completa sin subsistemas

---

## 3. GitHub — Workflows y CI

### Workflows activos

| Archivo | Disparadores | Jobs |
|---------|--------------|------|
| `ci-completo.yml` | push, PR, cron cada 6h, manual | tests-nativo (Python 3.11/3.12), tests-docker, ci-redis |
| `pipeline.yml` | push main, PR | test → deploy Pages → deploy VPS → upload |

### Flujo en push a main

```
push main
  → test (run_tests_produccion, verificar_todo)
  → deploy Pages (docs/ a GitHub Pages)
  → deploy VPS (rsync + docker compose)
  → upload artefactos (verificacion_completa.json, reporte_produccion.log)
```

### Secrets requeridos

| Secret | Uso |
|--------|-----|
| `SSH_HOST` | IP o dominio del VPS |
| `SSH_USER` | Usuario SSH |
| `SSH_PRIVATE_KEY` | Clave privada SSH |
| `REMOTE_PATH` | (opcional) Ruta en VPS, default `/opt/constructor-de-mundos` |
| `PAGES_TOKEN` | (opcional) PAT para GitHub Pages |

### Artefactos generados

- `verificacion_completa.json` — Resultado de `verificar_todo.py`
- `pruebas/reporte_produccion.log` — Log de las 11 suites

---

## 4. Todo lo que estamos creando

### Capa Python (motor real)

| Componente | Descripción |
|------------|-------------|
| `principal.py` | Entrada principal |
| `nucleo/simulacion.py` | Orquestador de ticks |
| `agentes/motor_decision.py` | Decisión por utilidad |
| `acciones/` | 13 tipos de acción |
| `sistemas/` | Persistencia, Modo Sombra, watchdog |
| `systems/memory/` | Memoria espacial y social |
| `mundo/` | Mapa, celdas, recursos, refugios |
| `entidades/` | Entidad base, gato, social |
| `interfaz/` | Panel control, renderizador pygame |

### Capa web (demo funcional)

| Componente | Descripción |
|------------|-------------|
| `backend/src/` | Express, WebSocket, rutas |
| `frontend/src/` | React, Vite, Hub |
| `Landing.jsx` | Entrada, flujo fundador |
| `HeroRefugePanel.jsx` | Refugios, mundos, companion IA |
| `AdminPanel.jsx` | Panel administrador (modo dios) |
| `DobackSoft.jsx` | Vertical demo |
| `FireSimulator.jsx` | Simulador de ruta |
| `MissionControl.jsx` | Control de simulación |

### Semillas y mundos

| Componente | Descripción |
|------------|-------------|
| `civilizationSeeds.js` | 9 semillas (tribu, tecnócrata, espiritual, guerrero, comerciante, paranoica, decadente, tryndamere, síntesis) |
| `heroRefuge.js` | HeroRefuge, mundos ligeros, companion |
| `createFoundingWorldState` | Crea mundo inicial con semilla |

### IA local

| Componente | Descripción |
|------------|-------------|
| `aiCore.js` | health, chat, summarize, analyzeTestFailure, analyzeSession |
| `llmService.mjs` | Adaptador Ollama para HeroRefuge |
| `/api/ai/*` | Endpoints REST |

### Infraestructura

| Componente | Descripción |
|------------|-------------|
| `Dockerfile.ci` | Imagen para tests |
| `docker-compose.prod.yml` | Fullstack Node+React |
| `iniciar.ps1` | Bootstrap, doctor, launcher |
| `scripts/capture-screenshots.js` | Capturas web |
| `scripts/generar-pdf-evidencias.js` | PDF con evidencias |

---

## 5. Camino hacia el motor creador de mundos

### Objetivo

Compactar todo en un **motor creador de mundos** reutilizable:

- Entrada: semilla + nombre constructor + nombre refugio
- Salida: mundo persistente con civilización naciente
- Capas: 2D (verdad) + 3D futura (encarnación)

### Fases de compactación

```
Fase 1 (actual)
  Motor Python + Web demo separados
  → Dos motores, dos verdades

Fase 2 (consolidación)
  Flujo fundador único verificable
  → Una narrativa, una puerta de entrada

Fase 3 (compactación)
  Contratos comunes: World, Refuge, Hero, Community, Memory
  → Mismo modelo conceptual en Python y JS

Fase 4 (motor único)
  API Python o WASM
  → Un solo núcleo de simulación, múltiples frontends
```

### Contratos del motor creador de mundos

| Contrato | Descripción |
|----------|-------------|
| `World` | Identidad, tick, recursos, crónica |
| `CivilizationSeed` | Valores, tensiones, arquetipo |
| `Refuge` | Nombre, recursos, seguridad, moral |
| `Hero` | Nombre, rol, arquetipo, lealtades |
| `Community` | Cultura, normas, cohesión |
| `MemoryEntry` | Tipo, alcance, resumen |
| `HistoricalRecord` | Evento, título, significancia |

---

## 6. Regla de foco

Cada cambio debe responder:

**¿Fortalece o distrae de "crear un refugio inicial y ver nacer una civilización"?**

Si distrae → posponer.

---

## 7. Referencias rápidas

| Documento | Uso |
|-----------|-----|
| `docs/DOCUMENTO_UNICO.md` | Documento único para cualquiera |
| `docs/GOLDEN_PATH.md` | Cómo probar en 3 minutos |
| `docs/VISION_CIVILIZACIONES_VIVAS.md` | Tesis y modelo conceptual |
| `docs/CI_PIPELINE.md` | Detalle de GitHub Actions |
| `docs/EVIDENCIAS_ARTIFICIAL_WORLD.pdf` | PDF con evidencias |
| `AGENTS.md` | Reglas de code review |

---

*Artificial Word — El repositorio. Artificial World — La tesis. Motor creador de mundos — El destino.*
