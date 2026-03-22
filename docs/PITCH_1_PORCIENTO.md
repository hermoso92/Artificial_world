# Artificial World — Documento único para el 1%

> **Audiencia:** Líderes tecnológicos, inversores de etapa tardía, CTOs, profesionales del sector. Personas que exigen la verdad completa en una sola lectura.  
> **Uso:** Pitch final. Due diligence. Decisión de inversión o partnership.  
> **Regla:** Todo lo que aquí se afirma debe poder rastrearse a código, documento o evidencia. Si no, no está.

---

## 1. Tesis central

**Artificial World no es un chatbot ni una app de IA. Es la base de un sistema local y auditable de inteligencias coordinadas que convierte proyectos reales en comprensión verificable.**

Lema interno: *No preguntes a una IA. Convoca un mundo que pueda demostrar su respuesta.*

---

## 2. Ownership y estructura del ecosistema

| Marca | Rol | Ubicación | Qué vende |
|-------|-----|-----------|-----------|
| **DobackSoft** | Producto principal | Repo `dobackv2` (StabilSafe V3) | Plataforma B2B multi-tenant: estabilidad vehicular, telemetría CAN/GPS |
| **Artificial World** | Laboratorio hermana | Este repo | Infraestructura local, auditable, open source: comprensión, documentación, copilotos, memoria |
| **Juego / FireSimulator** | Superficie demo | Este repo | Demo, entrenamiento, storytelling; no núcleo de negocio |

**Relación:** DobackSoft exporta artefactos (session, route, event, report). Artificial World los lee, audita, sintetiza. El juego los consume para replay y formación. Integración por contratos versionados, no por acoplamiento de código.

---

## 3. Propuesta de valor

**Problema:** Repositorios que nadie entiende del todo. Documentación que no coincide con el código. Decisiones sin memoria. IAs que responden sin dejar expediente.

**Solución:** Un sistema que ingiere repos, extrae documentación, compara con referencias, detecta contradicciones, mantiene memoria viva y devuelve expediente auditable con informe técnico, ejecutivo y acciones recomendadas.

**Para quién:** Fundadores técnicos, equipos pequeños, empresas que auditan código localmente, creadores de producto, marcas técnicas.

**Diferenciador vs LLM suelto:** Una IA aislada improvisa. Este sistema deja rastro: qué leyó, qué comparó, qué contradijo, qué concluyó y por qué.

**Por qué local, gratis, open source y auditable importa:** Control sobre datos. Sin peaje por token. Inspección total. Cada afirmación importante tiene fuente, versión y contexto.

---

## 4. Realidad / demo / visión / roadmap

| Existe hoy | Demo o vertical | Defendible públicamente | Visión o expansión futura |
|------------|-----------------|-------------------------|---------------------------|
| Motor Python con memoria, persistencia, Modo Sombra | Web fullstack con motor JS propio | Base real, no idea vacía | Comparación iterativa entre repos |
| 13 acciones, decisión por utilidad | DobackSoft en este repo | Dirección local-first y auditable | MCP maestros y agentes coordinados |
| IA local base (Ollama, chat, resumen, análisis) | FireSimulator, HeroRefuge | Trazabilidad como rasgo de producto | Expediente completo con contradicciones versionadas |
| 11 suites de tests, persistencia SQLite | Sesiones/rutas mock | Evolución coherente hacia comprensión auditable | Modo Fundador operativo |
| Documentación extensa, cultura de separación real/demo | — | — | Comunidades abiertas de agentes |

**Regla:** Toda afirmación debe clasificarse en una de estas cinco categorías. Si no, no está lista para salir.

---

## 5. Arquitectura conceptual

**Unidad de valor:** Expediente auditable de proyecto, no una respuesta aislada.

**Capas:**

1. **Ingestión** — Lee repos, fija versión, detecta stack y estructura.
2. **Extracción documental** — README, docs, specs; claims, huecos, ambigüedades.
3. **Normalización** — Hechos vs hipótesis vs contradicciones.
4. **Comparación** — Contraste con repositorios de referencia.
5. **Re-comparación** — Iteración cuando cambian fuentes.
6. **Memoria viva** — Expediente, historial, glosario.
7. **Orquestadores** — Deciden qué agentes intervienen.
8. **Agentes** — Documental, auditor, comparador, contradicción, técnico, producto, narrativo, seguridad.
9. **Auditoría** — Cada salida ligada a agente, fuente, versión, confianza.
10. **Ejecución local** — Modelos locales, caché, offline-friendly.
11. **Seguridad** — Permisos, fronteras, consentimiento.
12. **Salida** — Informe técnico, ejecutivo, contradicciones, historia, backlog, acciones.

**Flujo (Lazo de Convergencia):** Entrada → ingestión → extracción → comparación → contradicción → re-comparación → síntesis → acción.

**Regla cardinal:** Ninguna afirmación importante sale sin rastro verificable.

---

## 6. Frontera de contratos (DobackSoft ↔ Artificial World)

**Principio:** Integración por artefactos versionados, no por acoplamiento.

| Contrato | Produce | Consume |
|----------|---------|---------|
| session | DobackSoft | Artificial World |
| route | DobackSoft | Artificial World, FireSimulator |
| event | DobackSoft | Artificial World |
| severity | Ambos | Ambos |
| recommendation | Artificial World | DobackSoft |
| report | Artificial World | DobackSoft, export |

Esquema: `docs/DOBACKSOFT_FUTURE_CONTRACTS.json` (v1, status: official-boundary).

---

## 7. Roadmap por fases

| Fase | Objetivo | Entregables | Riesgo | Éxito |
|------|----------|-------------|--------|-------|
| 0 | Verdad actual | README, mapa real/demo/visión, principios | Claims heredados | 5 min para entender |
| 1 | Base operativa | Ingestión, índice, expediente vivo, seguridad | Complejidad temprana | Expediente coherente de un repo |
| 2 | Comparación | Referencias, motor comparativo, matriz, re-comparación | Comparaciones superficiales | Diferencias accionables vs 2+ referencias |
| 3 | Coordinación agentes | Taxonomía, contratos, orquestación, auditoría | Agentes redundantes | Cada salida muestra quién hizo qué |
| 4 | Experiencia fundador | Modo fundador, onboarding, plantillas, panel | Vender antes de pulir | Valor claro en primer caso real |
| 5 | Comunidades | Bibliotecas de agentes, referencias compartidas, extensión | Fragmentación | Terceros extienden sin romper trazabilidad |

---

## 8. Principios editoriales (mini constitución)

1. Ningún benchmark sin prueba reproducible.
2. Ninguna promesa técnica sin fuente.
3. Nunca mezclar demo con producto real.
4. Nunca vender visión como estado actual.
5. Nunca usar IA como sustitutivo de arquitectura.
6. Toda afirmación: `real`, `demo`, `defendible`, `vision` o `roadmap`.
7. Toda contradicción relevante visible hasta resolverse.
8. Toda narrativa nace de evidencia técnica.
9. Si una frase suena mejor de lo demostrable, se corrige o se elimina.
10. El tono puede ser épico. La base debe ser auditable.

---

## 9. Manifiesto (versión corta)

La industria llenó el mercado de IA que responde deprisa y demuestra poco. Artificial World elige otro camino: local, open source, auditable, coordinado. No un chatbot. Un mundo de inteligencias especializadas que leen, comparan, documentan, contradicen, recuerdan y sintetizan. No prometemos magia. Prometemos estructura y trazabilidad radical.

---

## 10. Dónde esto puede romperse

**Técnico:** Coordinar demasiados agentes antes de expediente base sólido. Comparaciones superficiales. Memoria/orquestación excesivamente complejas. Modelos locales con calidad irregular.

**Narrativo:** Sonar como "la IA que lo entiende todo". Vender comunidad de agentes antes de demostrar flujo útil. Heredar épica sin explicar la nueva categoría.

**Producto:** Servir a demasiados perfiles. Fundadores mal segmentados esperando automatización total. Falta de output nuclear claro.

**Posicionamiento:** Quedar entre "herramienta dev" y "copiloto enterprise" sin núcleo definido. Ser percibido como wrapper de LLM si la trazabilidad no se siente estructural.

**Inflado si no se demuestra:** "Comunidad de inteligencias", "comparación iterativa en tiempo real", "sistema auditable" sin rastro visible, "fundadores" sin acceso material.

**Antídoto:** Elegir un output central —el expediente verificable— y hacer que toda capa narrativa dependa de él. Marcar siempre real/demo/defendible/visión/roadmap. Demostrar un caso fuerte antes de abrir diez frentes.

---

## 11. Evidencia verificable (para due diligence)

| Evidencia | Dónde |
|-----------|-------|
| Motor Python, 13 acciones | `tipos/enums.py`, `acciones/` |
| Memoria espacial y social | `systems/memory/memoria_entidad.py`, `agentes/memoria.py` |
| Persistencia SQLite | `sistemas/sistema_persistencia.py`, `mundo_artificial.db` |
| Modo Sombra | `sistemas/gestor_modo_sombra.py` |
| Runner de pruebas | `pruebas/run_tests_produccion.py` (11 suites) |
| IA local base | `backend/src/services/aiCore.js`, `backend/src/routes/ai.js` |
| Contratos | `docs/DOBACKSOFT_FUTURE_CONTRACTS.json` |
| Ownership | `docs/OWNERSHIP_ESTRATEGICO.md` |

---

## 12. Resumen ejecutivo (30 segundos)

Artificial World es un laboratorio local y open source que evoluciona desde simulación hacia un sistema de comprensión auditable de proyectos reales. DobackSoft es el producto principal (B2B, dobackv2). Este repo contiene el laboratorio, la demo web y el juego como superficie de entrenamiento. La integración va por contratos (session, route, event, report). La visión: comunidades de agentes coordinados que analizan repos, comparan con referencias, detectan contradicciones y devuelven expedientes verificables. La base técnica existe. La dirección está documentada. La disciplina editorial impide humo.

---

*Documento único. Diseñado para el 1%. Sin relleno. Con trazabilidad.*
