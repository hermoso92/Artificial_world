# IA local base — Artificial World y puente futuro con DobackSoft

> Base mínima ya implementada y todavía acotada para una sola programadora.

---

## 1. Resumen ejecutivo

La propuesta defendible para este repo es:

- usar `Artificial World` como **laboratorio real y base común**
- mantener la web como **showcase funcional**
- mantener `DobackSoft` en este repo como **sandbox vertical demo**
- tratar `DobackSoft` real como **producto externo** hasta auditar su repositorio directamente

La prioridad no es construir una gran plataforma de agentes.  
La prioridad es cerrar un **núcleo mínimo de IA local** que sirva para:

- chat contextual limitado
- resumen de logs y reportes
- análisis de fallos de tests
- copiloto documental y de debugging
- análisis de sesiones

---

## 2. Piezas reales ya existentes

| Pieza | Estado | Evidencia | Uso potencial |
|------|--------|-----------|---------------|
| Runtime local por `Ollama` | Real | `backend/src/services/llmService.mjs` | Base de inferencia local |
| Agente con contexto y tools | Real | `backend/src/simulation/heroRefuge.js` | Primer cliente del núcleo IA |
| Runner de pruebas | Real | `pruebas/run_tests_produccion.py` | Análisis automático de fallos |
| CI y artefactos | Real | `.github/workflows/` | Automatización y trazabilidad |
| Launcher actual | Real pero limitado | `iniciar.ps1` | Base para bootstrap/doctor/launcher |
| Fuente maestra del repo | Real | `docs/DOCUMENTACION_COMPLETA.md` | Corpus documental inicial |

---

## 3. ai-core mínimo

## Objetivo

Crear y mantener un núcleo común pequeño, no una plataforma grande.

## Runtime por defecto

- `Ollama`

## Casos de uso iniciales

1. `chat_contextual`
2. `summarize_logs`
3. `analyze_test_failure`
4. `doc_copilot`
5. `analyze_session`

## Capacidades mínimas

| Capacidad | Descripción | Estado objetivo |
|-----------|-------------|-----------------|
| `health` | comprobar disponibilidad del runtime IA | Implementado |
| `chat` | respuesta en lenguaje natural con contexto acotado | Implementado |
| `summarize` | resumir logs, reportes y documentos | Implementado |
| `tool_call` | tools limitadas y versionadas para `HeroRefuge` | Implementado vía adaptador |
| `artifact_analysis` | leer resultados de tests o sesiones | Implementado |

## No incluir al inicio

- multiagente
- vector DB
- RAG complejo
- autonomía abierta
- planificación automática multi-step

---

## 4. Memoria local mínima

## Objetivo

Tener memoria versionada, simple y útil para trabajo real.

## Qué guardar

- decisiones técnicas
- prompts versionados
- hallazgos de auditoría
- errores frecuentes
- reportes y resúmenes
- glosario del dominio
- ejemplos de sesiones y rutas

## Implementación mínima

- archivos `json` y `md`
- estructura simple en `docs/ia-memory/`
- sin base vectorial al principio

## Regla

Primero memoria legible y trazable.  
Después, si hace falta, búsqueda semántica o indexación más avanzada.

---

## 5. Bootstrap + doctor + launcher

## Tesis

`iniciar.ps1` ya evoluciona de lanzador web a **bootstrap/doctor/launcher**.

## Flujo ideal

1. detectar entorno
2. verificar dependencias
3. mostrar advertencias
4. recomendar camino
5. ejecutar el camino elegido
6. generar artefactos de salida

## Caminos recomendados

| Opción | Qué hace | Estado |
|--------|----------|--------|
| Motor Python | producto real del repo | Implementado |
| Demo web | showcase funcional | Implementado |
| Debug | consola y diagnóstico | Implementado |
| Verificación | tests y checks | Implementado |
| IA local opcional | Ollama y endpoints `/api/ai/*` | Implementado |

## Artefactos recomendados

- `bootstrap_report.json`
- `bootstrap_next_steps.md`
- reutilización de `verificacion_completa.json`

---

## 6. Puente con DobackSoft real

## Regla base

No integrar por imaginación.  
No asumir integración real sin auditar `dobackv2`.

## Estrategia

Primero conectar por **artefactos y contratos**, no por acoplamiento interno.

## Contratos mínimos futuros

- `session`
- `route`
- `event`
- `severity`
- `recommendation`
- `report`

## Primeros usos sensatos

- resumir sesiones
- explicar incidencias
- preparar borradores de reporte
- generar documentación y casos de QA

## Qué no prometer

- telemetría real integrada en este repo
- sincronización multi-tenant completa
- copiloto autónomo de producción

---

## 7. Tabla final

| Área | Estado |
|------|--------|
| Motor Python | Real |
| Demo web | Demo funcional |
| HeroRefuge con Ollama | Real, pero acotado |
| ai-core común | Base mínima implementada |
| Memoria local versionada | Base mínima implementada |
| `iniciar.ps1` como bootstrap/doctor/launcher | Base mínima implementada |
| DobackSoft en este repo | Demo vertical |
| DobackSoft real | Externo hasta auditoría |
| Puente Artificial World -> DobackSoft real | Roadmap |

---

## 8. Riesgos abiertos

- querer convertir esto en plataforma total demasiado pronto
- mezclar producto, demo y laboratorio
- usar IA local como claim antes de cerrar casos reales
- abrir demasiadas líneas para una sola programadora

---

## 9. Criterio de éxito

Esto estará bien planteado si:

- una persona puede arrancar y entender el sistema con una sola entrada
- el núcleo IA local sirve para trabajo real, no solo para demo
- `Artificial World` aporta valor propio aunque `DobackSoft` real siga fuera
- el puente con `DobackSoft` se diseña sin sobreprometer ni duplicar producto

Documento operativo asociado:

- [docs/IMPLEMENTACION_AI_CORE_LOCAL.md](IMPLEMENTACION_AI_CORE_LOCAL.md)
