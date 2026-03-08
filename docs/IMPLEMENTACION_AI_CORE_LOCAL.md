# Implementacion minima de ai-core local

> Estado: base mínima implementada en este repositorio. Todo lo que no esté verificado por código se rebaja a `demo`, `externo` o `roadmap`.

---

## 1. Resumen ejecutivo

Se ha implementado una base mínima de `ai-core` local para el backend web de `Artificial World` con cinco operaciones:

- `health`
- `chat`
- `summarize`
- `analyzeTestFailure`
- `analyzeSession`

La solución:

- reutiliza `Ollama` como runtime local
- convierte `HeroRefuge` en cliente del `ai-core` a través de `backend/src/services/llmService.mjs`
- añade memoria local simple y versionada en `docs/ia-memory/`
- expone endpoints mínimos en `/api/ai/*`
- deja contratos futuros para `DobackSoft` real sin fingir integración
- rediseña `iniciar.ps1` como `bootstrap/doctor/launcher`

---

## 2. Hallazgos del repo

Hallazgos verificados durante la auditoría:

- `backend/src/services/llmService.mjs` ya hacía inferencia local con `Ollama`, pero solo para `HeroRefuge`
- `backend/src/simulation/heroRefuge.js` ya disponía de contexto, memoria reciente y herramientas limitadas
- `backend/src/routes/` no tenía una familia de endpoints dedicada a IA reutilizable
- `backend/src/utils/logger.js` ya proporcionaba logging estructurado suficiente para trazas mínimas
- `pruebas/run_tests_produccion.py` ya ofrecía un flujo real para análisis de fallos de tests
- `iniciar.ps1` solo lanzaba la demo web; no diagnosticaba ni recomendaba caminos
- la documentación principal ya separaba motor Python, demo web y `DobackSoft` demo, pero la base de IA local seguía formulada como propuesta

Conclusión:

- había materia prima real para un `ai-core`
- faltaba una capa compartida pequeña y sostenible
- no hacía falta introducir bases vectoriales, multiagentes ni integrar `dobackv2`

---

## 3. Propuesta e implementación del ai-core

### Runtime y límites

- runtime por defecto: `Ollama`
- proveedor actual: `local-only`
- fallback: respuesta local controlada cuando el runtime no responde
- sin multiagente
- sin vector DB
- sin RAG complejo

### Archivos de implementación

- `backend/src/services/aiCore.js`
- `backend/src/services/llmService.mjs`
- `backend/src/routes/ai.js`
- `backend/src/server.js`

### Contrato mínimo operativo

```json
{
  "success": true,
  "data": {
    "text": "string",
    "operation": "chat"
  },
  "meta": {
    "operation": "chat",
    "provider": "ollama",
    "model": "llama3.2",
    "durationMs": 123,
    "success": true,
    "fallback": false
  }
}
```

### Operaciones disponibles

- `health`: comprueba disponibilidad del runtime y publica catálogo de memoria
- `chat`: conversación local con `systemPrompt`, `context` y `memoryKeys`
- `summarize`: resumen de texto, logs o documentos
- `analyzeTestFailure`: análisis acotado de fallos de test
- `analyzeSession`: análisis de sesión/ruta/eventos de demo o debugging

---

## 4. Memoria local

La memoria local queda implementada como archivos planos versionados en `docs/ia-memory/`.

Estructura:

- `docs/ia-memory/README.md`
- `docs/ia-memory/technical-decisions.md`
- `docs/ia-memory/prompts.json`
- `docs/ia-memory/frequent-failures.json`
- `docs/ia-memory/glossary.md`
- `docs/ia-memory/reports/README.md`
- `docs/ia-memory/session-examples/demo-session-route.json`

Objetivo práctico:

- decisiones técnicas
- prompts
- fallos frecuentes
- reportes
- glosario
- sesiones y rutas de ejemplo

No se ha añadido indexación semántica persistente ni almacenamiento vectorial.

---

## 5. Endpoints y contratos JSON

### `GET /api/ai/health`

Respuesta:

```json
{
  "success": true,
  "data": {
    "provider": "ollama",
    "host": "http://localhost:11434",
    "model": "llama3.2",
    "available": true,
    "installedModels": [],
    "memoryCatalog": []
  },
  "meta": {
    "operation": "health",
    "durationMs": 45,
    "success": true,
    "fallback": false
  }
}
```

### `POST /api/ai/chat`

Request:

```json
{
  "prompt": "Resume el estado actual del proyecto",
  "systemPrompt": "Habla en español",
  "context": {
    "source": "docs"
  },
  "memoryKeys": ["technicalDecisions", "glossary"]
}
```

### `POST /api/ai/summarize`

Request:

```json
{
  "input": "contenido a resumir",
  "context": {
    "artifact": "reporte_produccion.log"
  },
  "memoryKeys": ["technicalDecisions", "reports"]
}
```

### `POST /api/ai/analyze-test-failure`

Request:

```json
{
  "suite": "test_core",
  "output": "stacktrace o salida del runner",
  "context": {
    "runner": "pruebas/run_tests_produccion.py"
  }
}
```

### `POST /api/ai/analyze-session`

Request:

```json
{
  "session": {
    "id": "demo-session-001",
    "source": "dobacksoft-demo"
  },
  "route": [],
  "events": [],
  "context": {
    "mode": "demo"
  }
}
```

### Trazas mínimas

Cada operación registra:

- operación
- modelo
- duración
- éxito o error
- `fallback` si hubo salida mock controlada

---

## 6. Especificación implementada de `iniciar.ps1`

`iniciar.ps1` ya no es solo un lanzador web. Ahora actúa como:

- `doctor`
- instalación mínima por camino
- recomendación de camino
- launcher del camino elegido

### Caminos soportados

- `python`: instala dependencias Python y ejecuta `principal.py`
- `web`: instala dependencias web y delega en `scripts\iniciar_fullstack.ps1`
- `debug`: ejecuta `pruebas\test_core.py`
- `verify`: ejecuta `pruebas\run_tests_produccion.py`
- `ai`: revisa `Ollama`, prepara dependencias web y deja listo el uso de `/api/ai/*`

### Artefactos generados

- `bootstrap_report.json`
- `bootstrap_next_steps.md`

### Regla de verdad

Aunque `iniciar.ps1` soporte varios caminos, el recomendado sigue siendo `python` cuando el entorno lo permite.

---

## 7. Matriz de casos de uso

| Caso | Estado | Entrada | Salida | Criterio de éxito |
|------|--------|---------|--------|-------------------|
| HeroRefuge | Implementado | query + contexto de héroe | respuesta o tool call | `HeroRefuge` consume `ai-core` vía `llmService` |
| Resumen de logs/reportes | Implementado | texto/log | resumen corto | `POST /api/ai/summarize` responde con contrato común |
| Análisis de fallos de tests | Implementado | suite + salida | diagnóstico inicial | `POST /api/ai/analyze-test-failure` funciona con fallback |
| Copiloto documental | Implementado en forma mínima | prompt + `memoryKeys` | respuesta contextual | `POST /api/ai/chat` puede cargar memoria local |
| Análisis de sesiones demo | Implementado | session + route + events | resumen y límites | `POST /api/ai/analyze-session` acepta artefactos demo |

---

## 8. Puente futuro con DobackSoft

El puente futuro se deja en contratos y artefactos, no en integración viva.

Archivo:

- `docs/DOBACKSOFT_FUTURE_CONTRACTS.json`

Contratos preparados:

- `session`
- `route`
- `event`
- `severity`
- `recommendation`
- `report`

Reglas:

- no se inventa conexión con `dobackv2`
- no se convierte la demo mock en producto
- el intercambio futuro debe hacerse por export/import o APIs controladas cuando exista evidencia real

---

## 9. Lista de archivos cambiados

Implementación:

- `backend/src/services/aiMemory.js`
- `backend/src/services/aiCore.js`
- `backend/src/services/llmService.mjs`
- `backend/src/routes/ai.js`
- `backend/src/routes/ai.test.js`
- `backend/src/server.js`
- `iniciar.ps1`

Memoria y contratos:

- `docs/ia-memory/README.md`
- `docs/ia-memory/technical-decisions.md`
- `docs/ia-memory/prompts.json`
- `docs/ia-memory/frequent-failures.json`
- `docs/ia-memory/glossary.md`
- `docs/ia-memory/reports/README.md`
- `docs/ia-memory/session-examples/demo-session-route.json`
- `docs/DOBACKSOFT_FUTURE_CONTRACTS.json`

Documentación:

- `README.md`
- `docs/IA_LOCAL_BASE.md`
- `docs/DOCUMENTACION_COMPLETA.md`
- `docs/MODOS_EJECUCION.md`
- `docs/GOLDEN_PATH.md`
- `docs/PROMPT_AGENTE_DOBACKSOFT.md`

---

## 10. Riesgos abiertos

- el `ai-core` depende de `Ollama`; sin runtime activo opera en fallback
- la operación `ai` de `iniciar.ps1` no valida por sí sola que el backend esté arrancado
- el análisis de sesión sigue siendo útil sobre artefactos demo, no sobre telemetría real
- el golden path del producto sigue siendo Python; no conviene presentar el `ai-core` web como núcleo del proyecto
- el contrato futuro con `DobackSoft` solo es de diseño hasta auditar e integrar el repo externo
