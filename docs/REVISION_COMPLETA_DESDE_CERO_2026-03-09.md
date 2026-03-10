# Revisión completa desde cero

**Fecha:** 9 de marzo de 2026  
**Alcance:** Artificial World + 4 repositorios en `Repositorios para auditar`  
**Metodología:** Inspección directa, sin depender de auditorías previas

---

# PARTE A — Artificial World (repo principal)

## A.1 Qué es realmente

Artificial World es un proyecto con dos núcleos técnicos distintos:

1. **Motor Python (pygame)** — Simulación 2D de agentes autónomos con función de utilidad, 13 tipos de acción, memoria espacial/social, persistencia SQLite, Modo Sombra y crónica fundacional headless.
2. **Demo web (Node + React)** — Fullstack independiente con motor de simulación en JavaScript, Mission Control, HeroRefuge, FireSimulator, DobackSoft demo y IA local.

No hay integración en tiempo real entre el motor Python y la web. Son dos sistemas separados que comparten narrativa y modelo conceptual.

## A.2 Verificación directa (inspección de archivos)

| Elemento | Existe | Evidencia |
|----------|--------|-----------|
| `principal.py` | Sí | Punto de entrada; `--web`, `--cronica` |
| `cronica_fundacional.py` | Sí | Headless con `--seed`, `--ticks` |
| `pruebas/run_tests_produccion.py` | Sí | 11 suites definidas |
| `tipos/enums.py` | Sí | TipoAccion, TipoDirectiva, etc. |
| `sistemas/sistema_persistencia.py` | Sí | SQLite `mundo_artificial.db` |
| `backend/src/server.js` | Sí | Express, puerto 3001 |
| `frontend/src/App.jsx` | Sí | React + Vite |
| `frontend/src/config/api.js` | Sí | `VITE_BACKEND_PORT`, `VITE_API_BASE_URL`; sin localhost hardcodeado |
| `scripts/iniciar_fullstack.ps1` | Sí | Libera 3001/5173, inicia backend + frontend |
| `console.log` en frontend | No | 0 ocurrencias |
| `console.log` en backend | No | 0 ocurrencias |

## A.3 Estructura verificada

```
artificial word/
├── principal.py, cronica_fundacional.py
├── nucleo/, sistemas/, acciones/, agentes/, entidades/, mundo/, core/, interfaz/, tipos/, utilidades/
├── backend/src/          # 58 archivos .js (server, routes, simulation, missionControl, etc.)
├── frontend/src/         # 77 archivos .jsx (Hub, SimulationView, MissionControl, HeroRefuge, etc.)
├── scripts/              # iniciar_fullstack.ps1, run_chess_audit.ps1
├── pruebas/              # 11 suites en run_tests_produccion.py
├── docs/                 # 129+ MD
├── IA-Entre-Amigos-main/ # Presentación Astro
├── horizons-export-*/     # Export Vite React
└── Repositorios para auditar/
    ├── DobackSoft/
    ├── alfred-dev-main/
    ├── Xcom-mac-silicon-main/
    └── chrome-search-engine-converter-main/
```

## A.4 Coherencia README vs realidad

El README declara correctamente:
- Motor Python = núcleo principal
- Web = demo con motor JS propio
- DobackSoft = vertical demo, no producto completo
- Mission Control operativo con runtime seed
- Golden path: `python principal.py` y `.\scripts\iniciar_fullstack.ps1`

No hay sobrepromesa en el README principal. La separación real/demo/visión está explícita.

## A.5 Riesgos identificados

1. **Estructura dual Python:** `nucleo`/`mundo` vs `core` — redundante pero funcional.
2. **Uso de `print()` en tests:** AGENTS.md exige `logger`; en pruebas Python se usa `print` (aceptable en tests).
3. **Dispersión documental:** Varios "documentos definitivos" pueden generar confusión.
4. **DobackSoft demo:** `sessionsStore` en memoria, rutas mock; no representa el producto B2B completo.

## A.6 Veredicto Artificial World

**Técnicamente sólido.** El motor Python es verificable, tiene 11 suites de tests y puntos de entrada claros. La web es una demo funcional con Mission Control, HeroRefuge y simulación JS. El README no confunde presente con visión. Cumple `config/api.js` y ausencia de `console.log`.

---

# PARTE B — Repositorios para auditar

## B.1 DobackSoft

**Qué es:** Sistema B2B de estabilidad vehicular (telemetría CAN/GPS, geofences, reportes). Stack declarado: Node + Express, PostgreSQL + Prisma, React + TypeScript.

**En esta copia:** No hay `backend/` ni `frontend/` con código del producto. Hay scripts de guardrails, `iniciar.ps1`, `docker-compose`, `AGENTS.md`, `.cursor`, `.agents`. El `package.json` raíz es `DobackSoft-scripts`.

**Brecha:** La narrativa describe un full-stack completo; la evidencia técnica central no está presente. No auditable como producto.

**Nota:** 4,5/10 como portfolio en esta copia.

---

## B.2 alfred-dev-main

**Qué es:** Plugin de Claude Code con 15 agentes, memoria SQLite, quality gates, dashboard y flujos de ingeniería. Stack: Python (core, memoria, hooks), Markdown (comandos/agentes), MCP, Astro (landing).

**En esta copia:** Hay `core/orchestrator.py`, `core/memory.py`, `gui/server.py`, tests pytest, docs de arquitectura, instaladores. Implementación real verificable.

**Fortaleza:** Posicionamiento claro, arquitectura tangible, documentación muy por encima de la media.

**Nota:** 7,5/10 como portfolio. Mejor pieza de los 4.

---

## B.3 Xcom-mac-silicon-main

**Qué es:** Cliente no oficial de X para macOS con Tauri + Rust. WebView carga x.com; multicuenta, Keychain, cifrado AES-256-GCM.

**En esta copia:** Código completo, tests de crypto, README y CHANGELOG cuidados, script `build-dmg.sh`. Dependencia frágil del DOM de X.com.

**Fortaleza:** Foco claro, stack con personalidad (Rust/Tauri), documentación superior.

**Nota:** 6,5/10 como portfolio.

---

## B.4 chrome-search-engine-converter-main

**Qué es:** Extensión Manifest V3 que convierte búsquedas entre 33 motores. Sin dependencias externas, permisos mínimos, CI con tests.

**En esta copia:** Código completo, `engines.js` como SSOT, 57 tests, screenshots, política de privacidad. Pendiente de publicación en Chrome Web Store.

**Fortaleza:** Alcance nítido, coherencia interna, buena documentación.

**Nota:** 6/10 como portfolio.

---

# PARTE C — Valor para Artificial World

## C.1 Funcionalidades que aportan valor a AW

| Origen | Funcionalidad | Valor | Cómo aplicarlo |
|--------|---------------|------|----------------|
| alfred-dev-main | Sanitización de secretos antes de persistir | Alto | `memory.py` tiene `sanitize_content()` con regex; usar en `ia-memory` y logs Mission Control |
| alfred-dev-main | Quality gates automáticos + manuales | Alto | Mission Control ya tiene approvals; añadir gate automático previo (tests verdes) |
| alfred-dev-main | Memoria persistente estructurada | Medio | Trazabilidad problema→decisión→commit; capa de "decisiones del sistema" para Mission Control |
| DobackSoft | Guardrails automatizados (scanners) | Medio | Adaptar scanners de `console.log`, URLs hardcodeadas a AW |
| DobackSoft | Geofences / eventos entrada-salida | Medio | Reactivar `core/world/zona.py` con lógica de entrada/salida para refugios |
| Xcom-mac-silicon | Empaquetado Tauri para macOS | Bajo | Si se quiere app macOS nativa; AW tiene `build_exe.ps1` para Windows |
| chrome-search-engine-converter | — | Nulo | No relevante para AW |

## C.2 Prioridad de adopción

1. Sanitización de secretos (alfred) — Rápida, reduce riesgo.
2. Quality gates automáticos (alfred) — Refuerza Mission Control.
3. Guardrails automatizados (DobackSoft) — Escáneres adaptados a AW.
4. Zonas con eventos (DobackSoft) — Reactivar `Zona` con geofences.
5. Memoria de decisiones (alfred) — Mayor esfuerzo, mayor valor a largo plazo.

---

# PARTE D — Síntesis ejecutiva

## Estado actual

| Área | Estado | Nota |
|------|--------|------|
| **Artificial World (motor Python)** | Sólido | Ejecutable, 11 suites, README honesto |
| **Artificial World (web)** | Demo funcional | Mission Control, HeroRefuge, simulación JS; sin motor Python |
| **DobackSoft (en Repositorios)** | Narrativa sin código core | No auditable como producto |
| **alfred-dev-main** | Mejor pieza de portfolio | Arquitectura real, docs, packaging |
| **Xcom-mac-silicon** | Utility macOS completa | Dependencia frágil de X.com |
| **chrome-search-engine-converter** | Extensión bien acabada | Falta publicación en store |

## Coherencia global

- **AW:** README alineado con realidad. No sobrepromete.
- **Repos auditados:** alfred-dev y chrome-extension son coherentes; DobackSoft tiene brecha narrativa-evidencia; Xcom tiene dependencia externa documentada.

## Recomendaciones

1. **AW:** Mantener separación real/demo/visión. Considerar adoptar sanitización de secretos y quality gates de alfred.
2. **DobackSoft (en Repositorios):** Incluir versión verificable del producto o declarar explícitamente que es solo scripts/docs.
3. **alfred-dev:** Unificar convención de comandos y añadir CI visible.
4. **chrome-extension:** Publicar en Chrome Web Store; alinear versionado.

---

*Revisión realizada por inspección directa de archivos. Sin ejecución de sistemas.*
