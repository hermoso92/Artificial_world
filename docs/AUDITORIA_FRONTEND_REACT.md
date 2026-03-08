# Auditoría Frontend React — Artificial Word

**Fecha:** 8 de marzo de 2025  
**Stack:** React 18 + Vite + Recharts  
**Alcance:** `frontend/src/` (JSX, sin TypeScript)

---

## Resumen

| Categoría | Estado |
|-----------|--------|
| **Patrones React** | ⚠️ Varias violaciones (useEffect, derived state, key) |
| **Gestión de estado** | ⚠️ Prop drilling, sin separación server/client state |
| **Componentes >300 líneas** | ❌ 2 componentes exceden el límite (AGENTS.md) |
| **console.log** | ❌ 1 uso directo (debe usar logger) |
| **Colores hex hardcodeados** | ⚠️ Múltiples en style/className |
| **Imports y estructura** | ✅ Correcta |

**Veredicto:** STATUS: FAILED — Requiere correcciones antes de merge.

---

## Issues Críticos

### 1. `console.warn` en lugar de logger (AGENTS.md)

| Archivo | Línea | Descripción |
|---------|-------|-------------|
| `SimulationView.jsx` | 239 | `console.warn('[DBG-cc0b57] isOwnedRefuge=...')` — código de debug activo |

**Acción:** Sustituir por `logger.debug()` o eliminar en producción.

---

### 2. URLs hardcodeadas (AGENTS.md)

| Archivo | Líneas | Descripción |
|---------|--------|-------------|
| `SimulationCanvas.jsx` | 114, 122 | `fetch('http://127.0.0.1:7420/ingest/...')` — endpoint de telemetría/debug hardcodeado |

**Acción:** Mover a `config/api.js` o variables de entorno; o eliminar si es código de debug temporal.

---

### 3. Bloques `catch` vacíos (AGENTS.md)

| Archivo | Líneas | Descripción |
|---------|--------|-------------|
| `SimulationView.jsx` | 64 | `catch {}` en `api.selectRefuge` |
| `SimulationView.jsx` | 253 | `catch {}` en `api.tickPets` / `fetchData` |

**Acción:** Añadir `logger.warn()` o manejo explícito del error.

---

### 4. `key={index}` en listas dinámicas

| Archivo | Línea | Uso | Riesgo |
|---------|-------|-----|--------|
| `LogPanel.jsx` | 10 | `key={i}` en logs | Alto — logs pueden reordenarse |
| `GlobalMapPanel.jsx` | 40 | `key={i}` en grid de refugios | Medio — grid fijo, pero mejor usar id estable |
| `DetectionBanner.jsx` | 58 | `key={i}` en issues | Medio |
| `WorldDetailModal.jsx` | 90 | `key={i}` en history | Medio |
| `HeroRefugePanel.jsx` | 174 | `key={i}` en memories | Medio |
| `MCOverview.jsx` | 224 | `key={r.id ?? i}` | Bajo — fallback cuando `r.id` es null |
| `MCActivityFeed.jsx` | 78 | `key={\`${item.tick}-${item.message}-${i}\`}` | Bajo — compuesto con i para desambiguar |

**Acción:** Usar IDs estables (`log.id`, `issue.code`, etc.) cuando existan. Para grids estáticos, `key={i}` es aceptable.

---

### 5. useEffect para derived state

| Archivo | Líneas | Patrón | Problema |
|---------|--------|--------|----------|
| `GeneticAssemblerPanel.jsx` | 30-34 | `useEffect` que sincroniza `selectedBlueprintId` con `blueprints[0]` | Estado derivado — puede calcularse en render o con patrón "initialization" |

```javascript
// Actual (derived state en useEffect)
useEffect(() => {
  if (blueprints?.length && !selectedBlueprintId) {
    setSelectedBlueprintId(blueprints[0]?.id ?? null);
  }
}, [blueprints, selectedBlueprintId]);

// Preferible: inicialización o derived durante render
```

---

### 6. Múltiples useEffect para refs (SimulationCanvas)

| Archivo | Líneas | Descripción |
|---------|--------|-------------|
| `SimulationCanvas.jsx` | 81-87 | 7 `useEffect` separados solo para `ref.current = value` |

**Impacto:** Funciona, pero es verboso. Alternativa: asignar en el cuerpo del componente (antes del return) o usar un custom hook `useLatestRef`.

---

## Issues Altos

### 1. Componentes >300 líneas (AGENTS.md)

| Archivo | Líneas | Límite |
|---------|--------|--------|
| `SimulationCanvas.jsx` | **408** | 300 |
| `SimulationView.jsx` | **330** | 300 |

**Recomendación:**
- **SimulationCanvas:** Extraer `StatBar`, lógica de canvas a `useCanvasRender`, controles de zoom/edición a subcomponentes.
- **SimulationView:** Extraer header, sidebar izquierdo/derecho, y handlers a custom hooks (`useSimulationData`, `useSimulationHandlers`).

---

### 2. Colores hexadecimales hardcodeados

AGENTS.md: *"Se usan colores hexadecimales hardcodeados en className → usar clases Tailwind"*

| Archivo | Ejemplos |
|---------|----------|
| `SimulationCanvas.jsx` | `#00d4ff`, `#00e676`, `#ffb74d`, `#0a0b0d`, etc. en `style={{}}` |
| `HeroRefuge/constants.js` | Paleta completa en hex (tema dinámico — aceptable) |
| `HeroRefugePanel.jsx` | `#0a0a0f`, `#fff` en gradients |
| `Hub.jsx` | `#00d4ff`, `#7c3aed` en PILLARS |
| `index.css` | Variables CSS — correcto |
| `main.jsx` | `#ff5252` en mensaje de error |

**Recomendación:** Usar variables CSS (`var(--color-primary)`) o clases Tailwind. Los colores en `constants.js` para temas dinámicos pueden mantenerse si se documenta.

---

### 3. Prop drilling

`SimulationView` pasa muchas props en cadena:
- `world`, `loading`, `fetchData`, handlers a `ControlPanel`, `GlobalMapPanel`, `RefugeManagementPanel`, etc.
- `selectedAgentId`, `onSelectAgent` a varios hijos.

**Recomendación:** Valorar Context para estado de simulación (`SimulationContext`) o composición con render props/children.

---

### 4. Mutación de array local (estilo)

| Archivo | Línea | Código |
|---------|-------|--------|
| `DetectionBanner.jsx` | 35 | `issues.unshift({...})` sobre array recién creado |

**Recomendación:** Enfoque inmutable:
```javascript
const issues = wsConnected === false && diagnostics.health !== 'error'
  ? [{ code: 'WS_OFFLINE', ... }, ...(diagnostics.issues ?? [])]
  : [...(diagnostics.issues ?? [])];
```

---

### 5. Dependencia en useEffect (HeroRefugePanel)

```javascript
useEffect(() => {
  fetchHero();
  tickRef.current = setInterval(async () => { ... }, 3000);
  return () => clearInterval(tickRef.current);
}, [fetchHero, worlds.length]);  // worlds.length puede cambiar sin cambiar identidad
```

**Riesgo:** El intervalo se recrea cuando cambia `worlds.length`. Si `worlds` se reemplaza con mismo length, no hay problema; si cambia length, el efecto se re-ejecuta. Revisar si la intención es correr solo cuando hay mundos.

---

## Recomendaciones

### Arquitectura

1. **Server state:** Introducir TanStack Query (React Query) para `getWorld`, `getAgents`, `getLogs`, etc. Evitar copiar datos del servidor a `useState` y sincronizar con `useEffect`.
2. **Context:** Crear `SimulationContext` para `world`, `agents`, `loading`, `fetchData` y reducir prop drilling.
3. **Custom hooks:** Extraer `useSimulationData`, `useSimulationHandlers` de `SimulationView`.

### Código

1. **Logger:** Reemplazar todo `console.*` por `logger.debug/info/warn/error`.
2. **Config:** Centralizar URLs en `config/api.js` (incluida la de telemetría si se mantiene).
3. **Keys:** Preferir `key={item.id}` o IDs compuestos estables frente a `key={i}` en listas dinámicas.
4. **TypeScript:** Plan de migración gradual para mejorar type safety.

### Estilo

1. **Colores:** Usar `var(--color-*)` de `index.css` o Tailwind en lugar de hex inline.
2. **Exports:** Preferir named exports (ya se usa en la mayoría de componentes).

---

## Checklist de Mejoras

- [ ] Sustituir `console.warn` en `SimulationView.jsx` por `logger.debug` o eliminar
- [ ] Mover/eliminar URLs hardcodeadas en `SimulationCanvas.jsx`
- [ ] Añadir manejo de error en `catch {}` de `SimulationView.jsx`
- [ ] Refactorizar `SimulationCanvas.jsx` para reducir a &lt;300 líneas
- [ ] Refactorizar `SimulationView.jsx` para reducir a &lt;300 líneas
- [ ] Reemplazar `key={i}` por IDs estables en `LogPanel`, `DetectionBanner`, `WorldDetailModal`
- [ ] Refactorizar derived state en `GeneticAssemblerPanel` (useEffect → render o init)
- [ ] Sustituir colores hex inline por variables CSS o Tailwind
- [ ] Valorar TanStack Query para server state
- [ ] Valorar Context para estado de simulación
- [ ] Corregir mutación con `unshift` en `DetectionBanner.jsx`

---

## Archivos Revisados

| Archivo | Líneas | Estado |
|---------|--------|--------|
| App.jsx | 37 | ✅ |
| SimulationView.jsx | 330 | ❌ &gt;300 |
| SimulationCanvas.jsx | 408 | ❌ &gt;300 |
| HeroRefugePanel.jsx | 256 | ✅ |
| MCOverview.jsx | 292 | ✅ |
| DobackSoft.jsx | 216 | ✅ |
| Hub.jsx | 101 | ✅ |
| GeneticAssemblerPanel.jsx | 149 | ✅ |
| DetectionBanner.jsx | 84 | ✅ |
| LogPanel.jsx | 19 | ⚠️ key={i} |
| GlobalMapPanel.jsx | 52 | ⚠️ key={i} |
| main.jsx | 16 | ⚠️ hex en error |
| config/api.js | 17 | ✅ |
| utils/logger.js | 21 | ✅ |

---

*Auditoría realizada según AGENTS.md y skill typescript-react-reviewer.*
