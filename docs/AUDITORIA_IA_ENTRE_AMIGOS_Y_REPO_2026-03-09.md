# Auditoría IA-Entre-Amigos-main y Repositorio Artificial Word

**Fecha:** 2026-03-09  
**Referencia:** `docs/DOCUMENTO_UNIFICADO_AW.md`  
**Alcance:** IA-Entre-Amigos-main + repositorio artificial word completo  
**Prueba:** Real y final desde cero

---

## 1. Resumen ejecutivo

| Aspecto | Resultado |
|---------|-----------|
| **IA-Entre-Amigos-main** | EXTERNO — No forma parte del ecosistema Artificial World |
| **Motor Python** | REAL — Verificado |
| **Export público** | REAL — Verificado |
| **Coherencia con DOCUMENTO_UNIFICADO** | PARCIAL — IA-Entre-Amigos ausente en la taxonomía |
| **Checklist operativo** | 14/18 ítems verificados |

---

## 2. IA-Entre-Amigos-main: Clasificación

### 2.1 Qué es

**IA-Entre-Amigos-main** es un **workshop educativo** sobre inteligencia artificial:

- **Stack:** Astro 5.x
- **Contenido:** 33 diapositivas (Fundamentos, Arquitecturas, Uso práctico, Agentes, Realidad del ingeniero)
- **Origen:** Clon de `github.com/686f6c61/IA-Entre-Amigos`
- **Propósito:** "Workshop de inteligencia artificial de ingenieros para ingenieros" (Marzo 2026)

### 2.2 Relación con Artificial World

| Criterio | Resultado |
|----------|-----------|
| ¿Aparece en `ecosystemRoutes.js`? | No |
| ¿Aparece en `App.jsx`? | No |
| ¿Aparece en DOCUMENTO_UNIFICADO_AW.md? | No |
| ¿Integrado en Hub o Landing? | No |
| ¿Referenciado en docs AW? | No |

### 2.3 Clasificación taxonómica

**Categoría: EXTERNO**

- Vive fuera del ecosistema técnico auditado de Artificial World.
- Es un proyecto independiente que existe en el repo como copia/clon.
- No debe presentarse como parte de AW.
- Si se quiere incluir en la narrativa, debe declararse explícitamente como **recurso externo** o **material complementario**.

### 2.4 Recomendación

1. **Opción A (mantener):** Documentar en README o DOCUMENTO_UNIFICADO que `IA-Entre-Amigos-main` es material externo/educativo incluido en el repo.
2. **Opción B (mover):** Extraer a submodule o repositorio separado si no se considera parte del producto.
3. **Obligatorio:** No venderlo como superficie REAL, DEMO o PARCIAL de AW.

---

## 3. Checklist operativo (DOCUMENTO_UNIFICADO §11)

### 3.1 Export

| Ítem | Estado | Evidencia |
|------|--------|-----------|
| El router coincide con las rutas visibles | ✅ | `ecosystemRoutes.js`, `App.jsx`, `VALID_ROUTES` |
| `/` es la entrada pública principal | ✅ | `LandingPublic` en `home` |
| `/hub` funciona como mapa del ecosistema | ✅ | `Hub.jsx`, secciones Core/Control/Experiences/Lab |
| 3 en Raya es jugable | ✅ | `TicTacToe.jsx`, `MinigamesLobby.jsx` |
| Damas es jugable | ✅ | `Checkers.jsx`, `MinigamesLobby.jsx` |
| Ajedrez no se vende como implementado | ✅ | Locales: "Ajedrez (próximamente)", badge "coming soon" |
| FireSimulator aparece como demo | ✅ | `LandingPublic.jsx`, `ecosystemRoutes.js` |
| Mission Control no se vende como real si no tiene flujo visible | ⚠️ | Locales sugieren "observatorio"; implementación es UI operativa |
| Hero Refuge no se vende como implementado si no existe en build | ✅ | No se vende explícitamente como pleno |
| DobackSoft no se presenta como suite enterprise completa | ⚠️ | Revisar Horizons export para evitar claims enterprise |
| Paper se presenta como resumen/contexto | ✅ | `PAPER_FINAL.md`, sección paper web |
| Repositorio apunta a destino real | ✅ | Enlaces verificables |

### 3.2 Motor principal

| Ítem | Estado | Evidencia |
|------|--------|-----------|
| El motor Python se puede ejecutar | ✅ | `principal.py`, `utilidades/arranque.py` |
| Existe persistencia verificable | ✅ | `mundo_artificial.db`, `sistemas/sistema_persistencia.py` |
| Existe baseline reproducible definida | ✅ | `cronica_fundacional.py`, `--cronica` |
| Existen artefactos de salida | ✅ | Artefactos JSON/MD |
| Existen tests ejecutables | ✅ | `pruebas/`, `AGENTS.md` |
| La documentación no contradice la ejecución real | ✅ | `MODOS_EJECUCION.md`, `AGENTS.md` |

### 3.3 Coherencia

| Ítem | Estado | Notas |
|------|--------|-------|
| La taxonomía se aplica con consistencia | ⚠️ | IA-Entre-Amigos no está en la matriz |
| Los claims públicos coinciden con la implementación | ✅ | Locales y badges alineados |
| No hay claims inflados o prohibidos | ⚠️ | Revisar Mission Control y DobackSoft en export |
| No se confunde el export con la plenitud del sistema | ✅ | DOCUMENTO_UNIFICADO lo establece claramente |

---

## 4. Matriz de evidencia actualizada

Añadiendo IA-Entre-Amigos-main a la matriz del DOCUMENTO_UNIFICADO:

| Superficie | Estado | Evidencia | Riesgo narrativo |
|------------|--------|-----------|------------------|
| **IA-Entre-Amigos** | EXTERNO | Workshop Astro, 33 slides, repo externo 686f6c61 | Bajo si se declara explícitamente como externo |

---

## 5. Hallazgos y recomendaciones

### 5.1 Críticos

1. **IA-Entre-Amigos-main:** Incluir en DOCUMENTO_UNIFICADO como EXTERNO o documentar su presencia en el repo.
2. **Mission Control:** Ajustar narrativa en locales para no vender "observatorio de civilización viva" si la implementación es UI operativa de agentes/runs.

### 5.2 Menores

1. **Inconsistencia de locales (Arena):** En `de`, `pt`, `fr` algunas entradas dicen "Damas (demnächst)" o "Dames (bientôt)" cuando Damas ya es jugable en `en`/`es`. Revisar para coherencia.
2. **Horizons export:** Verificar que DobackSoft no se presente como "producto comercial completo" en la build pública.

### 5.3 Positivos

- Motor Python, persistencia, crónica y tests están bien documentados y verificables.
- Hub, Arena (3 en Raya, Damas) y FireSimulator están correctamente clasificados.
- Ajedrez se declara explícitamente como roadmap.
- DOCUMENTO_UNIFICADO es la fuente de verdad coherente.

---

## 6. Veredicto final

| Criterio | Resultado |
|----------|-----------|
| **Repositorio auditado** | artificial word (incl. IA-Entre-Amigos-main) |
| **IA-Entre-Amigos-main** | EXTERNO — Workshop educativo, no parte de AW |
| **Conformidad con DOCUMENTO_UNIFICADO** | PARCIAL — Falta clasificar IA-Entre-Amigos |
| **Recomendación** | Actualizar DOCUMENTO_UNIFICADO con IA-Entre-Amigos como EXTERNO |

---

## 7. Cadena de evidencia (protocolo §10)

Para cada claim, la cadena `claim -> archivo -> ruta -> ejecución -> artefacto`:

| Claim | Archivo | Ruta/Componente | Ejecución | Artefacto |
|-------|---------|-----------------|-----------|-----------|
| Motor Python REAL | `principal.py` | CLI | `python principal.py` | Simulación pygame |
| Crónica REAL | `cronica_fundacional.py` | CLI | `python principal.py --cronica` | JSON/MD |
| Hub REAL | `Hub.jsx` | `#hub` | Navegación | UI montada |
| 3 en Raya REAL | `TicTacToe.jsx` | `#minigames` | Jugable | Partida |
| Damas REAL | `Checkers.jsx` | `#minigames` | Jugable | Partida |
| IA-Entre-Amigos EXTERNO | `IA-Entre-Amigos-main/` | N/A en AW | `npm run dev` (standalone) | Presentación Astro |

---

*Auditoría realizada según protocolo de DOCUMENTO_UNIFICADO_AW.md. Taxonomía: REAL / DEMO / PARCIAL / ROADMAP / EXTERNO.*
