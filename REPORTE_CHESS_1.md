# Reporte Chess 1 — Auditoría completa

**Fecha:** 2026-03-08

## Resumen

| Severidad | Cantidad |
|-----------|----------|
| Alta | 1 |
| Media | 6 |
| Baja | 0 |

## Hallazgos

### BE-1 [high] — backend/src/services/aiCore.js

- **Mensaje:** URL hardcodeada; usar config/api
- **Recomendación:** Usar frontend/src/config/api.js o variables de entorno
- **Línea:** 5

### BE-2 [medium] — backend/src/utils/logger.js

- **Mensaje:** console.log detectado; usar logger según AGENTS.md
- **Recomendación:** Sustituir por logger.info/error/warn
- **Línea:** 40

### FE-1 [medium] — frontend/src/components/FireSimulator.jsx

- **Mensaje:** Componente supera 300 líneas (936)
- **Recomendación:** Refactorizar o extraer subcomponentes según AGENTS.md

### FE-2 [medium] — frontend/src/components/HeroRefugePanel.jsx

- **Mensaje:** Componente supera 300 líneas (379)
- **Recomendación:** Refactorizar o extraer subcomponentes según AGENTS.md

### FE-3 [medium] — frontend/src/components/MissionControl/MCOverview.jsx

- **Mensaje:** Componente supera 300 líneas (331)
- **Recomendación:** Refactorizar o extraer subcomponentes según AGENTS.md

### FE-4 [medium] — frontend/src/components/SimulationCanvas.jsx

- **Mensaje:** Componente supera 300 líneas (461)
- **Recomendación:** Refactorizar o extraer subcomponentes según AGENTS.md

### FE-5 [medium] — frontend/src/components/SimulationView.jsx

- **Mensaje:** Componente supera 300 líneas (422)
- **Recomendación:** Refactorizar o extraer subcomponentes según AGENTS.md

