# Artificial World — Documento único para el 1%

**Audiencia:** Líderes tecnológicos mundiales, CTOs, inversores de etapa tardía, profesionales del sector. El 1% que exige la verdad completa.  
**Extensión:** Máximo 100 páginas equivalentes.  
**Uso:** Pitch final. Due diligence. Decisión de inversión o partnership.  
**Regla:** Toda afirmación rastreable a código, documento o evidencia.

---

# PARTE I — PRESENTACIÓN

## 1. Quién escribe este documento

Soy un sistema de auditoría y documentación que opera dentro de una infraestructura local: contenedor Docker en un VPS (Hostinger), repositorio versionado, modelo de lenguaje local (Ollama). Mientras se audita este repo, el usuario puede jugar a Artificial World —el juego— en paralelo. Esa paradoja es deliberada: el mismo ecosistema que simula mundos puede ser auditado por inteligencias coordinadas que leen, comparan y documentan.

**Identidad operativa:**
- No soy un chatbot. Soy un agente de auditoría documental con acceso a código, tests y documentación.
- Opero bajo principios editoriales estrictos: no prometer lo no demostrable, no mezclar demo con producto, toda afirmación clasificada.
- Mi salida es este documento: verificado desde cero, auditado, comparado con el mercado, diseñado para que un líder tecnológico tome una decisión en una sola lectura.

**Qué puedo y qué no puedo:**
- Puedo leer el repo, ejecutar búsquedas, contrastar con documentación externa y producir artefactos estructurados.
- No puedo ejecutar código en producción ni modificar sistemas vivos sin consentimiento explícito.
- No invento evidencia. Si algo no está en el repo o en fuentes verificables, no lo afirmo.

---

## 2. Análisis de precios: €9,99 vs €99,99

### Contexto actual en el proyecto

| Producto | Tier | Precio |
|----------|------|--------|
| **DobackSoft** (fundadores, 1000 plazas) | Early adopter | €9,99/mes |
| **DobackSoft** | Regular | €29/mes |
| **Constructor de Mundos** | Constructor | €4,99/mes |
| **Constructor de Mundos** | Fundador (500 plazas) | €2,99/mes |

### Comparativa con agentes de IA y herramientas de código (2024-2025)

| Producto | Precio individual | Precio equipo/empresa |
|----------|------------------|------------------------|
| GitHub Copilot Pro | $10/mes (~€9,20) | $19/usuario/mes |
| Cursor Pro | $20/mes (~€18,40) | $40/usuario/mes |
| Windsurf (Codeium) Pro | $15/mes (~€13,80) | $30/usuario/mes |
| Ollama Cloud Pro | $20/mes | $100/mes (Max) |
| Ollama local | $0 | $0 (software); hardware aparte |

### Veredicto: €9,99 barato o caro?

**€9,99/mes es BARATO** en el contexto del mercado:

- Equivalente a GitHub Copilot Pro ($10).
- Por debajo de Cursor ($20), Windsurf ($15), Ollama Pro ($20).
- Para DobackSoft (estabilidad vehicular, telemetría CAN/GPS, B2B): precio de entrada agresivo que captura early adopters sin regalar el producto.
- Para el 1%: un líder técnico paga €9,99 sin pensar; el valor percibido debe superar ampliamente ese umbral.

### Veredicto: €99,99 barato o caro?

**€99,99/mes es CARO para individuo, PREMIUM para equipo:**

- Para un solo usuario: en el rango alto (Cursor Business $40/user, pero enterprise custom puede ser $100+).
- Para un equipo de 5: €99,99 total = €20/usuario — competitivo.
- Para enterprise con soporte, SLA, compliance: €99,99 puede ser un precio de entrada bajo.
- Para el 1%: €99,99/mes es una decisión consciente; debe justificarse con valor cuantificable (ahorro de tiempo, reducción de errores, auditoría automatizada).

### Recomendación de posicionamiento

| Escenario | Precio recomendado | Justificación |
|-----------|--------------------|---------------|
| Fundadores DobackSoft (primeros 1000) | €9,99/mes | Barato vs mercado; captura early adopters |
| Regular DobackSoft | €29/mes | Alineado con valor B2B |
| Artificial World laboratorio (futuro) | €0 (open source) o tier freemium | Diferenciador: local, auditable, sin peaje por token |
| Tier premium enterprise (futuro) | €99,99/mes o custom | Para equipos que necesitan soporte, SLA, integración |

**Conclusión:** €9,99 es barato y defendible. €99,99 es caro para individuo pero puede ser competitivo para equipo o enterprise. La decisión depende del segmento objetivo y del valor entregado.

---

## 3. Comparativa con agentes de IA

### Tabla comparativa

| Criterio | Artificial World (visión) | Cursor | GitHub Copilot | Ollama local | Claude / GPT |
|----------|---------------------------|--------|----------------|--------------|--------------|
| **Local** | Sí | No | No | Sí | No |
| **Coste marginal** | $0 por token | $20/mes | $10/mes | $0 (software) | $ por token |
| **Trazabilidad** | Expediente auditable | Limitada | Limitada | Depende del uso | Limitada |
| **Comparación repos** | Roadmap | No | No | No | No |
| **Auditoría documental** | Roadmap | No | No | No | Parcial |
| **Multiagente coordinado** | Visión | No | No | No | No |
| **Open source** | Sí | No | No | Sí | No |
| **Datos en tu infra** | Sí | No | No | Sí | No |

### Diferenciador de Artificial World

No compite en "mejor autocompletado" ni en "mejor chat". Compite en **comprensión verificable de proyectos**: ingerir repo, comparar con referencias, detectar contradicciones, devolver expediente con rastro. Eso no existe como producto comercial hoy. Cursor y Copilot son asistentes de código. Artificial World aspira a ser infraestructura de comprensión.

---

# PARTE II — AUDITORÍA TÉCNICA

## 4. Estructura del repositorio (verificada desde cero)

### Raíz
| Ruta | Propósito |
|------|-----------|
| `principal.py` | Entrada principal Python (motor pygame) |
| `cronica_fundacional.py` | Crónica headless reproducible |
| `configuracion.py` | Config central Python |
| `iniciar.ps1` | Bootstrap/doctor/launcher |
| `requirements.txt` | Dependencias Python |
| `.env` | Variables de entorno |

### Motor Python
| Ruta | Propósito |
|------|-----------|
| `nucleo/simulacion.py` | Orquestador simulación |
| `agentes/motor_decision.py` | IA por utilidad |
| `acciones/` | 13 acciones |
| `mundo/` | Mapa, celdas, recursos, refugios |
| `entidades/` | Entidad base, social, gato |
| `sistemas/` | Persistencia, logs, modo sombra, watchdog |
| `systems/memory/memoria_entidad.py` | Memoria espacial y social |
| `interfaz/` | Panel control, renderizador |

### Backend (Node.js)
| Ruta | Propósito |
|------|-----------|
| `backend/src/server.js` | Express + WebSocket |
| `backend/src/routes/api.js` | API simulación |
| `backend/src/routes/ai.js` | Chat, summarize, analyze |
| `backend/src/routes/heroRefuge.js` | Hero, mundos, companion IA |
| `backend/src/routes/subscription.js` | Tiers, cupones, Stripe |
| `backend/src/routes/dobacksoft.js` | Demo DobackSoft |
| `backend/src/services/aiCore.js` | Integración Ollama |
| `backend/src/services/stripeService.js` | Stripe checkout |

### Frontend (React + Vite)
| Ruta | Propósito |
|------|-----------|
| `frontend/src/App.jsx` | App principal |
| `frontend/src/components/Hub.jsx` | Hub navegación |
| `frontend/src/components/SimulationView.jsx` | Vista simulación |
| `frontend/src/components/DobackSoft.jsx` | Demo DobackSoft |
| `frontend/src/components/FireSimulator.jsx` | Juego canvas 2D |
| `frontend/src/components/PricingModal.jsx` | Modal precios |

### Bases de datos
| BD | Uso |
|----|-----|
| `mundo_artificial.db` | Python — persistencia motor |
| `constructor.db` | Node — players, heroes, worlds |
| `subscriptions.db` | Node — suscripciones |
| `audit_simulacion.db` | Node — event store |
| `audit_competencia.db` | Python — modo competencia |

---

## 5. Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Python | 3.11+, pygame, dataclasses |
| Backend | Node.js, Express, better-sqlite3, ws, multer |
| Frontend | React 18, Vite 5, recharts |
| IA | Ollama (localhost:11434, modelo llama3.2) |
| Pagos | Stripe |
| Tests | pytest (Python), Vitest (Node) |

---

## 6. Endpoints API principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Health global |
| GET | `/api/world` | Mundo completo |
| GET | `/api/agents` | Agentes activos |
| POST | `/api/simulation/start` | Iniciar simulación |
| GET | `/api/ai/health` | Estado Ollama |
| POST | `/api/ai/chat` | Chat IA |
| POST | `/api/ai/summarize` | Resumir |
| GET | `/api/hero/worlds` | Mundos del hero |
| GET | `/api/subscription/tiers` | Tiers disponibles |
| POST | `/api/subscription/checkout` | Stripe checkout |
| GET | `/api/dobacksoft/stats` | Stats DobackSoft |
| POST | `/api/dobacksoft/coupon/validate` | Validar cupón |
| WS | `/ws` | WebSocket logs |

---

## 7. Tests y cobertura

### Python (11 suites)
- test_estructural, test_core, test_cronica_fundacional
- test_modo_sombra_completo, test_perseguir_hasta_matar
- test_interacciones_sociales, test_bug_robar
- test_watchdog_*, test_arranque_limpio, test_integracion_produccion

Runner: `python pruebas/run_tests_produccion.py`

### Backend (Vitest)
- ai.test.js, api.test.js, engine.test.js
- heroRefuge.test.js, refugeSimulation.test.js
- agent.test.js, eventStore.test.js

---

## 8. Inconsistencias detectadas en la auditoría

1. **Puertos:** Las reglas de usuario mencionan 9998/5174; el código y docs usan 3001/5173.
2. **Suscripciones:** Dos sistemas (Constructor de Mundos y DobackSoft) con modelos y precios distintos.
3. **Tabla subscriptions en database.js:** Definida pero no usada por rutas actuales; suscripciones reales en `subscription/store.js`.

---

# PARTE III — ESTRATEGIA Y OWNERSHIP

## 9. Tesis central

**Artificial World no es un chatbot ni una app de IA. Es la base de un sistema local y auditable de inteligencias coordinadas que convierte proyectos reales en comprensión verificable.**

Lema: *No preguntes a una IA. Convoca un mundo que pueda demostrar su respuesta.*

---

## 10. Ownership y estructura del ecosistema

| Marca | Rol | Ubicación | Qué vende |
|-------|-----|-----------|-----------|
| **DobackSoft** | Producto principal | Repo dobackv2 (StabilSafe V3) | Plataforma B2B: estabilidad vehicular, telemetría CAN/GPS |
| **Artificial World** | Laboratorio hermana | Este repo | Infraestructura local, auditable, open source |
| **Juego / FireSimulator** | Superficie demo | Este repo | Demo, entrenamiento, storytelling |

**Relación:** DobackSoft exporta artefactos (session, route, event, report). Artificial World los lee, audita, sintetiza. El juego los consume. Integración por contratos versionados.

---

## 11. Propuesta de valor

**Problema:** Repositorios que nadie entiende. Documentación que no coincide con el código. Decisiones sin memoria. IAs que responden sin dejar expediente.

**Solución:** Sistema que ingiere repos, extrae documentación, compara con referencias, detecta contradicciones, mantiene memoria viva y devuelve expediente auditable.

**Para quién:** Fundadores técnicos, equipos pequeños, empresas que auditan código localmente, creadores de producto.

**Diferenciador vs LLM suelto:** Una IA aislada improvisa. Este sistema deja rastro: qué leyó, qué comparó, qué contradijo, qué concluyó y por qué.

---

## 12. Realidad / demo / visión / roadmap

| Existe hoy | Demo o vertical | Defendible | Visión futura |
|------------|-----------------|------------|---------------|
| Motor Python, memoria, Modo Sombra | Web fullstack con motor JS propio | Base real, no idea vacía | Comparación iterativa entre repos |
| 13 acciones, decisión por utilidad | DobackSoft en este repo | Dirección local-first y auditable | MCP maestros y agentes coordinados |
| IA local base (Ollama) | FireSimulator, HeroRefuge | Trazabilidad como rasgo | Expediente completo con contradicciones |
| 11 suites de tests, persistencia SQLite | Sesiones/rutas mock | Evolución coherente | Modo Fundador operativo |
| Documentación extensa | — | — | Comunidades abiertas de agentes |

---

# PARTE IV — ARQUITECTURA Y CONTRATOS

## 13. Arquitectura conceptual

**Unidad de valor:** Expediente auditable de proyecto.

**Capas:** Ingestión, extracción documental, normalización, comparación, re-comparación, memoria viva, orquestadores, agentes, auditoría, ejecución local, seguridad, salida.

**Flujo (Lazo de Convergencia):** Entrada → ingestión → extracción → comparación → contradicción → re-comparación → síntesis → acción.

**Regla cardinal:** Ninguna afirmación importante sale sin rastro verificable.

---

## 14. Frontera de contratos (DobackSoft ↔ Artificial World)

| Contrato | Produce | Consume |
|----------|---------|---------|
| session | DobackSoft | Artificial World |
| route | DobackSoft | Artificial World, FireSimulator |
| event | DobackSoft | Artificial World |
| severity | Ambos | Ambos |
| recommendation | Artificial World | DobackSoft |
| report | Artificial World | DobackSoft, export |

Esquema: `docs/DOBACKSOFT_FUTURE_CONTRACTS.json` (v1).

---

# PARTE V — ROADMAP Y PRINCIPIOS

## 15. Roadmap por fases

| Fase | Objetivo | Entregables | Riesgo | Éxito |
|------|----------|-------------|--------|-------|
| 0 | Verdad actual | README, mapa real/demo/visión | Claims heredados | 5 min para entender |
| 1 | Base operativa | Ingestión, índice, expediente vivo | Complejidad temprana | Expediente coherente |
| 2 | Comparación | Referencias, motor comparativo | Comparaciones superficiales | Diferencias accionables |
| 3 | Coordinación agentes | Taxonomía, contratos, orquestación | Agentes redundantes | Cada salida muestra quién hizo qué |
| 4 | Experiencia fundador | Modo fundador, onboarding | Vender antes de pulir | Valor claro en primer caso |
| 5 | Comunidades | Bibliotecas de agentes, extensión | Fragmentación | Terceros extienden sin romper trazabilidad |

---

## 16. Principios editoriales (mini constitución)

1. Ningún benchmark sin prueba reproducible.
2. Ninguna promesa técnica sin fuente.
3. Nunca mezclar demo con producto real.
4. Nunca vender visión como estado actual.
5. Nunca usar IA como sustitutivo de arquitectura.
6. Toda afirmación: real, demo, defendible, visión o roadmap.
7. Toda contradicción relevante visible hasta resolverse.
8. Toda narrativa nace de evidencia técnica.
9. Si una frase suena mejor de lo demostrable, se corrige o se elimina.
10. El tono puede ser épico. La base debe ser auditable.

---

# PARTE VI — RIESGOS Y EVIDENCIA

## 17. Dónde esto puede romperse

**Técnico:** Coordinar demasiados agentes antes de expediente base. Comparaciones superficiales. Memoria/orquestación excesivamente complejas.

**Narrativo:** Sonar como "la IA que lo entiende todo". Vender comunidad de agentes antes de demostrar flujo útil.

**Producto:** Servir a demasiados perfiles. Fundadores mal segmentados esperando automatización total.

**Posicionamiento:** Quedar entre "herramienta dev" y "copiloto enterprise" sin núcleo definido.

**Antídoto:** Elegir un output central —el expediente verificable— y hacer que toda capa narrativa dependa de él.

---

## 18. Evidencia verificable (due diligence)

| Evidencia | Dónde |
|-----------|-------|
| Motor Python, 13 acciones | `tipos/enums.py`, `acciones/` |
| Memoria espacial y social | `systems/memory/memoria_entidad.py`, `agentes/memoria.py` |
| Persistencia SQLite | `sistemas/sistema_persistencia.py`, `mundo_artificial.db` |
| Modo Sombra | `sistemas/gestor_modo_sombra.py` |
| Runner de pruebas | `pruebas/run_tests_produccion.py` |
| IA local base | `backend/src/services/aiCore.js`, `backend/src/routes/ai.js` |
| Precios DobackSoft | `backend/src/dobacksoft/store.js` (9.99, 29) |
| Precios Constructor | `backend/src/subscription/store.js` (4.99, 2.99) |
| Contratos | `docs/DOBACKSOFT_FUTURE_CONTRACTS.json` |
| Ownership | `docs/OWNERSHIP_ESTRATEGICO.md` |

---

# PARTE VII — RESUMEN EJECUTIVO

## 19. Resumen (30 segundos)

Artificial World es un laboratorio local y open source que evoluciona desde simulación hacia un sistema de comprensión auditable de proyectos reales. DobackSoft es el producto principal (B2B, dobackv2). Este repo contiene el laboratorio, la demo web y el juego como superficie de entrenamiento. La integración va por contratos (session, route, event, report). La visión: comunidades de agentes coordinados que analizan repos, comparan con referencias, detectan contradicciones y devuelven expedientes verificables. La base técnica existe. La dirección está documentada. La disciplina editorial impide humo.

**Precios:** €9,99/mes (DobackSoft fundadores) es barato vs mercado. €99,99/mes sería premium para individuo, competitivo para equipo/enterprise.

---

# PARTE VIII — MANIFIESTO

## 20. Manifiesto (versión corta)

La industria llenó el mercado de IA que responde deprisa y demuestra poco. Artificial World elige otro camino: local, open source, auditable, coordinado. No un chatbot. Un mundo de inteligencias especializadas que leen, comparan, documentan, contradicen, recuerdan y sintetizan. No prometemos magia. Prometemos estructura y trazabilidad radical.

---

---

# PARTE IX — TAXONOMÍA DE AGENTES

## 21. Agentes especializados (visión)

| Agente | Función | Input | Output | Cuándo se activa | Límite | Trazabilidad |
|--------|---------|-------|--------|------------------|--------|--------------|
| Documental | Extraer, clasificar, normalizar documentación | README, docs, ADRs | Mapa documental, claims, huecos | Inicio de análisis | No declarar realidad sin contraste código | Afirmación → archivo, versión, fecha |
| Auditor | Evaluar consistencia arquitectura declarada vs observable | Índice repo, módulos, tests | Hallazgos, riesgos, incoherencias | Tras ingestión | No proponer marketing | Hallazgo → fuente, confianza |
| Comparador | Contrastar proyecto con referencias | Repo, referencias, criterios | Matriz similitud, diferencias | Cuando hay referencias | No confundir inspiración con equivalencia | Comparación → referencia, commit |
| Contradicción | Buscar conflictos, exageraciones, lagunas | Docs, código, roadmap | Lista priorizada contradicciones | Tras primera síntesis | No resolver; solo señalar | Contradicción → origen dual |
| Técnico | Proponer arquitectura, contratos, módulos | Base existente, objetivos | Diseño conceptual, contratos | Cuando convertir visión en sistema | No inventar integraciones | Propuesta → dependencias, costos |
| Producto | Traducir capacidades en propuesta de valor | Expediente, mercado | Roadmap, oferta fundacional | Tras análisis o pre-lanzamiento | No vender visión como actual | Promesa → etiqueta actual/demo/futura |
| Narrativo | Convertir verdad técnica en historia | Expediente, claims válidos | Narrativa maestra, landing | Tras síntesis técnica | No crear claims fuera del expediente | Claim → evidencia o visión |
| Seguridad | Vigilar permisos, exposición, fronteras | Config, conectores, policies | Permisos efectivos, riesgos | Antes de análisis sensibles | No flexibilizar por conveniencia | Acceso sensible → logueado |
| Fundador | Diseñar experiencia primeros usuarios | Verdad actual, límites | Programa fundador, acceso | Pre-adopción temprana | No convertir early access en mito | Ventaja → acceso/soporte/influencia |
| Visión/roadmap | Extender dirección estratégica | Estado real, señales | Visión, apuestas, secuencia | Ciclos planificación | No invalidar foco operativo | Visión → qué falta demostrar |

---

# PARTE X — ANÁLISIS DE PRECIOS PROFUNDO

## 22. Matriz de decisión de precios

### Para fundadores (primeros 1000)

| Precio | Barato/Caro | Justificación |
|--------|-------------|---------------|
| €4,99/mes | Muy barato | Por debajo de Copilot ($10); riesgo de devaluar |
| €9,99/mes | Barato | Alineado con Copilot; captura early adopters |
| €19,99/mes | Competitivo | Cursor territory; requiere valor claro |
| €29/mes | Estándar | Precio regular DobackSoft actual |
| €49/mes | Premium | Para equipos pequeños con soporte |
| €99,99/mes | Enterprise | Para equipos 5+ o con SLA |

### Para el 1% (líderes tecnológicos)

Un líder técnico no decide por precio bajo. Decide por:
- **Ahorro de tiempo** cuantificable
- **Reducción de riesgo** (errores, auditoría)
- **Control** (datos locales, trazabilidad)
- **Diferenciación** (lo que la competencia no tiene)

€9,99 es irrelevante como barrera. €99,99 exige demostración de valor. La recomendación: mantener €9,99 para fundadores como gancho; crear tier enterprise a €99,99 cuando el valor esté demostrado.

---

## 23. Comparativa extendida con agentes de IA

### Por capacidad

| Capacidad | AW (visión) | Cursor | Copilot | Cody | Ollama | Claude/GPT |
|-----------|-------------|--------|---------|------|--------|------------|
| Autocompletado | No | Sí | Sí | Sí | No | Sí |
| Chat contextual | Parcial | Sí | Sí | Sí | Sí | Sí |
| Multiarchivo | Roadmap | Sí | Sí | Sí | Depende | Sí |
| Análisis repo completo | Roadmap | Parcial | Parcial | Parcial | No | Parcial |
| Comparación entre repos | Roadmap | No | No | No | No | No |
| Expediente auditable | Roadmap | No | No | No | No | No |
| Local-first | Sí | No | No | No | Sí | No |
| Open source | Sí | No | No | Parcial | Sí | No |
| Sin coste por token | Sí | No (plan) | No (plan) | Parcial | Sí | No |

### Por modelo de negocio

| Modelo | Ejemplos | Artificial World |
|--------|----------|------------------|
| Suscripción mensual | Cursor, Copilot, Windsurf | DobackSoft €9,99/29; Constructor €2,99/4,99 |
| Freemium | Codeium, Copilot free tier | Open source base; tier premium futuro |
| Por token | OpenAI, Anthropic | No aplica (local) |
| Enterprise custom | Todos | DobackSoft dobackv2; AW como laboratorio |

---

# PARTE XI — INFRAESTRUCTURA Y CONTEXTO OPERATIVO

## 24. Contexto de ejecución (este documento)

Este documento fue generado por un sistema que opera en:
- **Contenedor Docker** en VPS (Hostinger)
- **Repositorio** versionado
- **Modelo local** (Ollama) para inferencia
- **Auditoría** realizada por sistemas de IA en contenedores aislados

La paradoja operativa: mientras se audita el repo, el usuario puede jugar a Artificial World. Eso demuestra que el mismo ecosistema soporta:
1. Simulación (juego)
2. Auditoría documental (este documento)
3. Laboratorio de comprensión (visión futura)

---

## 25. Definición completa del sistema (100%)

**Qué soy:** Un agente de auditoría y documentación que produce artefactos estructurados para decisión ejecutiva. Opero bajo principios editoriales estrictos. No invento evidencia. Clasifico toda afirmación en real/demo/defendible/visión/roadmap.

**Qué no soy:** Un chatbot de soporte. Un oráculo. Un sistema que ejecuta código en producción sin consentimiento. Un sistema que promete lo no demostrable.

**Qué puedo entregar:** Documentos verificables, tablas comparativas, auditorías técnicas, análisis de precios, recomendaciones con trazabilidad.

**Qué exijo del usuario:** Claridad en la pregunta. Consentimiento para operaciones que modifican estado. Respeto a los principios editoriales en la comunicación pública.

**Identidad de producto:** Artificial World es laboratorio. DobackSoft es producto. El juego es superficie. Esta jerarquía es inmutable hasta nueva decisión documentada.

---

*Documento único. Diseñado para el 1%. Auditado desde cero. Con trazabilidad. Con decisión de precios. Con definición completa del sistema.*
