# Frontera de contratos — DobackSoft ↔ Artificial World

> **Documento maestro.** Define la frontera oficial de interoperabilidad entre DobackSoft (producto) y Artificial World (laboratorio). La integración debe ir por artefactos y contratos, no por acoplamiento interno.

---

## Principio

La integración entre ambos mundos se hace por **export/import de artefactos** que respetan esquemas versionados. No por acoplamiento de código ni por llamadas directas entre repositorios.

---

## Contratos versionados

**Versión actual:** 1  
**Esquema:** [docs/DOBACKSOFT_FUTURE_CONTRACTS.json](DOBACKSOFT_FUTURE_CONTRACTS.json)

| Contrato | Descripción | Quién produce | Quién consume |
|----------|-------------|---------------|---------------|
| **session** | Sesión de conducción o análisis | DobackSoft | Artificial World (auditoría, resumen, juego) |
| **route** | Puntos GPS de una ruta | DobackSoft | Artificial World (visor, FireSimulator, replay) |
| **event** | Evento de estabilidad o telemetría | DobackSoft | Artificial World (análisis, recomendaciones) |
| **severity** | Niveles de severidad normalizados | Ambos | Ambos |
| **recommendation** | Recomendación con evidencia | Artificial World (ai-core) | DobackSoft (reportes) |
| **report** | Informe generado | Artificial World | DobackSoft (o export) |

---

## Flujo de datos

```
DobackSoft (producto)
    │
    │ exporta session, route, event
    ▼
┌─────────────────────┐
│  Contratos (JSON)   │  ← frontera oficial
└─────────────────────┘
    │
    │ importa / lee / audita
    ▼
Artificial World (laboratorio)
    │
    ├── Auditoría documental
    ├── Resúmenes (ai-core)
    ├── FireSimulator (replay, demo)
    └── Genera recommendation, report
    │
    │ exporta recommendation, report
    ▼
DobackSoft (opcional)
```

---

## Reglas de uso

1. **No acoplar** código entre repos sin pasar por estos contratos.
2. **No inventar** campos fuera del esquema sin versionar el contrato.
3. **No asumir** integración real sin evidencia de export/import funcionando.
4. **Sí usar** estos contratos como frontera para proxy, export, import o artefactos compartidos.

---

## Estado por contrato

| Contrato | Estado | Notas |
|----------|--------|-------|
| session | Definido | Esquema en JSON; implementación parcial en demo |
| route | Definido | Usado por FireSimulator con datos mock |
| event | Definido | Severidad normalizada |
| severity | Definido | Niveles: info, low, medium, high, critical |
| recommendation | Definido | Para salidas de ai-core |
| report | Definido | Para informes generados |

---

## Referencias

- [docs/DOBACKSOFT_FUTURE_CONTRACTS.json](DOBACKSOFT_FUTURE_CONTRACTS.json) — Esquema técnico
- [docs/OWNERSHIP_ESTRATEGICO.md](OWNERSHIP_ESTRATEGICO.md) — Quién es qué
- [docs/PLAN_INTEGRACION_DOBACKSOFT_ARTIFICIAL_WORLD.md](PLAN_INTEGRACION_DOBACKSOFT_ARTIFICIAL_WORLD.md) — Plan de implementación
- [docs/IA_LOCAL_BASE.md](IA_LOCAL_BASE.md) — Puente por artefactos
