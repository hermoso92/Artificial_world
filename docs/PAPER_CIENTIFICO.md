# Artificial World: Un Motor de Simulación de Civilizaciones Emergentes con Agentes Autónomos Basados en Utilidad

**Autor:** Cosigein SL  
**Fecha:** 2026-03-08  
**Repositorio:** `artificial-word`  
**Versión del experimento:** Sesión fundacional, semilla 42, 200 ticks

---

## Abstract

Presentamos **Artificial World**, un motor de simulación de vida artificial 2D orientado a la generación de civilizaciones emergentes con memoria, héroes, refugios y comunidades. El sistema implementa agentes autónomos cuya toma de decisiones se fundamenta en una función de utilidad multidimensional que integra estado fisiológico, rasgos de personalidad, memoria espacial y social, relaciones inter-agente, directivas externas y reglas de autonomía de supervivencia. Describimos la arquitectura del motor de decisión, la estructura del entorno simulado, el protocolo de sesión fundacional reproducible y los resultados observados en una sesión canónica de 200 ticks con 8 entidades sobre un mapa de 60×60 celdas. Los resultados muestran un estado de tensión sostenida con supervivencia total de la población pero con hambre crítica en el 87.5% de los agentes al final del experimento, lo que evidencia la presión evolutiva del entorno y la insuficiencia del mecanismo de búsqueda de recursos en condiciones de escasez prolongada. El sistema es reproducible mediante semilla fija y está disponible como motor Python open source con persistencia SQLite.

**Palabras clave:** vida artificial, agentes autónomos, función de utilidad, civilizaciones emergentes, simulación 2D, comportamiento emergente, memoria social, modo sombra.

---

## 1. Introducción

La simulación de sistemas de vida artificial ha sido un campo fértil desde los trabajos fundacionales de Conway (1970) con el Juego de la Vida y los ecosistemas de Reynolds (1987) con Boids. Sin embargo, la mayoría de los sistemas clásicos priorizan la simplicidad de las reglas locales sobre la riqueza del estado interno de los agentes. Artificial World parte de una premisa distinta: **los agentes deben tener estado interno complejo, memoria persistente y capacidad de decidir mediante ponderación de utilidades**, de forma que el comportamiento colectivo emergente sea consecuencia de decisiones individualmente racionales bajo restricción.

El objetivo del sistema no es la optimización de una métrica global, sino la generación de **historia emergente**: secuencias de eventos que den lugar a crónicas, memorias y finalmente a civilizaciones con identidad propia. La unidad fundamental no es el agente individual sino el **refugio** — un nodo de supervivencia colectiva alrededor del cual se organiza la comunidad.

Este trabajo documenta:

1. La arquitectura del motor de decisión basado en utilidad
2. El entorno simulado y sus parámetros
3. El protocolo de sesión fundacional reproducible
4. Los resultados de la sesión canónica (semilla 42, 200 ticks)
5. El análisis de comportamiento emergente observado
6. Las limitaciones actuales y líneas de trabajo futuro

---

## 2. Trabajo Relacionado

### 2.1 Vida Artificial y Agentes Autónomos

Los sistemas de vida artificial basados en agentes (Langton, 1989; Alife) se dividen típicamente en dos familias: **sistemas de reglas locales simples** (autómatas celulares, Boids) y **sistemas de agentes con estado interno** (Creatures, The Sims, Dwarf Fortress). Artificial World pertenece a la segunda familia, con énfasis especial en la **arquitectura de decisión por utilidad** y en la **persistencia de memoria individual**.

### 2.2 Utilidad en Agentes Deliberativos

La teoría de la utilidad esperada (Von Neumann & Morgenstern, 1944) ha sido adaptada extensamente para sistemas multiagente. La arquitectura de Artificial World se inspira en los sistemas **BDI** (Belief-Desire-Intention) (Rao & Georgeff, 1991) pero reemplaza la selección de intenciones por una función de puntuación continua que permite graduación natural entre opciones.

### 2.3 Sistemas de Refugio y Comunidad

La noción de refugio como unidad de organización social tiene antecedentes en Dwarf Fortress (Adams, 2006), RimWorld (Tynan Sylvester, 2013) y Caves of Qud. Artificial World formaliza el refugio como **entidad de primer orden** con estado propio (recursos, seguridad, moral, memoria local), en lugar de tratarlo como mero artefacto del mapa.

---

## 3. Arquitectura del Sistema

### 3.1 Visión General

El sistema se compone de las siguientes capas:

```
principal.py
│
├── nucleo/simulacion.py       ← Orquestador de ticks
│   ├── agentes/motor_decision.py  ← Función de utilidad
│   ├── acciones/              ← 13 tipos de acción
│   ├── sistemas/              ← Persistencia, Modo Sombra, Watchdog
│   └── mundo/mapa.py          ← Grid 2D, celdas, recursos
│
├── sistemas/cronica_fundacional.py ← Generador de crónica (JSON + MD + PDF)
├── backend/src/               ← API Node.js, motor JS, HeroRefuge
├── frontend/src/              ← React + Tailwind, Landing, Hub, Admin
└── pruebas/                   ← 68+ tests, runner único
```

El sistema tiene dos motores independientes con objetivos distintos:

| Motor | Lenguaje | Rol | Persistencia |
|-------|----------|-----|-------------|
| Motor Python | Python 3.11+ / pygame | Simulación canónica, alta fidelidad | SQLite (`mundo_artificial.db`) |
| Motor JS | Node.js / Express | Demo web, HeroRefuge, API | SQLite (`audit_simulacion.db`) |

La simulación avanza por ticks discretos. En cada tick, cada entidad ejecuta el ciclo:

1. **Percepción** → construye `ContextoDecision` a partir del estado del entorno visible
2. **Generación de candidatos** → el `MotorDecision` produce el conjunto de acciones viables
3. **Puntuación** → cada candidata recibe una puntuación por la función de utilidad
4. **Selección** → se ejecuta la acción de mayor puntuación

### 3.2 Función de Utilidad

La puntuación de una acción \(a\) para el agente \(i\) en el tick \(t\) es:

$$U(a, i, t) = U_{\text{base}}(a) + \sum_{k} \delta_k(a, i, t) + \epsilon$$

donde:

- \(U_{\text{base}}(a)\) es la utilidad intrínseca de la acción (tabla fija por tipo)
- \(\delta_k\) son modificadores contextuales (ver Tabla 1)
- \(\epsilon \sim \mathcal{U}(-0.08, 0.08)\) es ruido determinista por semilla

**Tabla 2. Utilidades base por acción**

| Acción | \(U_{\text{base}}\) |
|--------|-------------------|
| `comer` | 0.65 |
| `recoger_comida` | 0.55 |
| `explorar` | 0.50 |
| `huir` | 0.40 |
| `descansar` | 0.30 |
| `mover` | 0.30 |
| `recoger_material` | 0.30 |
| `ir_refugio` | 0.25 |
| `compartir` | 0.20 |
| `robar` | 0.20 |
| `evitar` | 0.25 |
| `seguir` | 0.20 |
| `construir` | 0.18 |

> *`comer` tiene la máxima prioridad base (0.65) porque solo es candidato cuando hay comida en el inventario — condición de alta certeza de éxito.*

**Tabla 1. Modificadores de la función de utilidad**

| Modificador | Variable relevante | Efecto |
|-------------|-------------------|--------|
| `hambre` | `estado_interno.hambre` | Aumenta utilidad de comer/recoger cuando hambre > umbral |
| `energia` | `estado_interno.energia` | Aumenta utilidad de descansar cuando energía < 0.6 |
| `riesgo` | `estado_interno.riesgo_percibido` | Aumenta utilidad de huir/evitar cuando riesgo > 0.3 |
| `rasgo` | `rasgo_principal` | Modifica preferencias según arquetipo (cooperativo, agresivo, oportunista) |
| `oscilación` | `posicion_anterior` | Penaliza −0.40 el retorno a celda inmediatamente anterior |
| `memoria` | `memoria.recursos_recientes` | Bonus por acercarse a comida visible o recordada |
| `relaciones` | `relaciones.obtener_relacion()` | Confianza/hostilidad/miedo con agentes cercanos |
| `directivas` | `contexto.directivas_activas` | Órdenes externas con intensidad variable (prioridad alta) |
| `autonomia` | múltiple | Capa correctora: supervivencia anula directivas en estado crítico |

La capa de autonomía actúa como **override de emergencia**: si `hambre > 0.85`, se penaliza exploración y movimiento libre; si `energia < 0.15`, se penaliza movimiento y robo; si `riesgo > 0.8`, se potencia la huida sobre cualquier directiva activa.

### 3.3 Catálogo de Acciones (13 tipos)

| Acción | Condición de viabilidad |
|--------|------------------------|
| `COMER` | Comida en inventario > 0 |
| `RECOGER_COMIDA` | Celda actual tiene recurso COMIDA |
| `RECOGER_MATERIAL` | Celda actual tiene recurso MATERIAL |
| `DESCANSAR` | Energía < 0.60 |
| `EXPLORAR` | Energía > 0.20 |
| `MOVER` | Posición vecina disponible |
| `IR_REFUGIO` | Refugio adyacente + (energía < 0.45 o riesgo > 0.5) |
| `HUIR` | Riesgo percibido > 0.3 |
| `EVITAR` | Riesgo percibido > 0.3 |
| `SEGUIR` | Rasgo cooperativo/neutral + entidades visibles cercanas |
| `COMPARTIR` | Inventario ≥ 3 unidades, o cooperativo con inventario ≥ 1 y hambre < 0.5 |
| `ROBAR` | Rasgo oportunista/agresivo + hambre ≥ 0.75 + sin comida + energía > 0.30 |
| `ATACAR` | Implementado (condición según contexto) |

Si ninguna acción es viable, el sistema garantiza un fallback a `DESCANSAR`.

### 3.4 Rasgos de Agente

Los agentes sociales tienen 5 arquetipos de rasgo:

| Rasgo | Tendencia principal |
|-------|-------------------|
| `COOPERATIVO` | Bonus compartir (+0.25), penaliza robar (−0.25), leve bonus seguir |
| `NEUTRAL` | Sin modificadores — comportamiento base puro |
| `AGRESIVO` | Bonus robar (+0.30), penaliza compartir (−0.20) y huir (−0.10) |
| `EXPLORADOR` | Bonus mover y explorar (+0.35 cada uno), penaliza seguir (−0.05) |
| `OPORTUNISTA` | Bonus robar (+0.15), bonus recoger material (+0.08), leve bonus compartir |

Los agentes de tipo `gato` tienen su propia tabla de 5 rasgos:

| Rasgo | Tendencia principal |
|-------|-------------------|
| `CURIOSO` | Bonus explorar/mover (+0.35), bonus seguir leve |
| `APEGADO` | Penaliza mover/explorar (−0.05), bonus seguir (+0.25) |
| `INDEPENDIENTE` | Bonus mover/explorar (+0.20), penaliza seguir (−0.25) |
| `TERRITORIAL` | Bonus ir_refugio (+0.15), penaliza mover/explorar (−0.05) |
| `OPORTUNISTA` | Bonus mover/explorar/recoger_comida (+0.10), bonus seguir (+0.10) |

### 3.5 Memoria de Agente

Cada agente mantiene dos registros de memoria:

- **Memoria espacial**: posiciones de recursos (comida, refugios) observados recientemente
- **Memoria social**: relaciones con otros agentes, expresadas en tres dimensiones: `confianza`, `hostilidad`, `miedo`

La memoria espacial alimenta directamente el modificador `memoria` de la función de utilidad: un agente que recuerda una celda con comida recibe bonus de movimiento hacia esa celda proporcional a su nivel de hambre.

### 3.6 Modo Sombra

El sistema incluye un mecanismo denominado **Modo Sombra** (`gestor_modo_sombra.py`): una simulación especular que corre en paralelo al estado principal, permitiendo evaluar contrafácticos sin alterar el mundo observable. Este modo no se activa en la sesión fundacional estándar pero está verificado mediante suite de tests propia.

### 3.7 Watchdog

El subsistema `Watchdog` monitoriza en tiempo real condiciones anómalas y emite alertas estructuradas con nivel (`WARN`, `CRITICAL`), código semántico (`HAMBRE_CRITICA_SIN_RESPUESTA`, `HAMBRE_SIN_COMIDA_DISPONIBLE`), tick de emisión y entidad afectada. Estas alertas forman parte de la crónica fundacional.

---

## 4. Entorno Experimental

### 4.1 Parámetros de la Sesión Canónica

| Parámetro | Valor |
|-----------|-------|
| Semilla aleatoria | 42 |
| Dimensiones del mapa | 60 × 60 celdas |
| Número de entidades iniciales | 8 |
| Ticks ejecutados | 200 |
| Fundador | Tryndamere |
| Refugio fundador | Refugio Fundador |
| Semilla de civilización | default |
| Timestamp | 2026-03-08T12:53:48 |

### 4.2 Composición de la Población

| ID | Nombre | Tipo | Posición final | Hambre | Energía |
|----|--------|------|----------------|--------|---------|
| 1 | Ana | social | (47, 21) | 0.68 | 0.38 |
| 2 | Bruno | social | (0, 34) | 1.00 | 0.36 |
| 3 | Clara | social | (25, 5) | 1.00 | 0.26 |
| 4 | David | social | (10, 22) | 0.90 | 0.18 |
| 5 | Eva | social | (13, 5) | 1.00 | 0.40 |
| 6 | Félix | social | (0, 52) | 1.00 | 0.38 |
| 7 | Amiguisimo | gato | (12, 42) | 1.00 | 0.30 |
| 8 | Tryndamere | social | (2, 51) | 1.00 | 0.40 |

> *H = hambre normalizada [0,1] donde 0 = saciado, 1 = hambre crítica.*  
> *E = energía normalizada [0,1] donde 0 = agotado, 1 = pleno.*

La población incluye 7 entidades de tipo `social` y 1 de tipo `gato` (Amiguisimo). Todas las entidades mantienen `salud = 1.0` al final del experimento, indicando que ninguna alcanzó el estado de muerte.

---

## 5. Resultados

### 5.1 Métricas de Acción Agregadas

Durante los 200 ticks, el sistema registró las siguientes ejecuciones de acción:

| Acción | Ejecuciones | Proporción |
|--------|------------|------------|
| `SEGUIR` | 998 | 62.4% |
| `DESCANSAR` | 492 | 30.8% |
| `RECOGER_RECURSO` | 55 | 3.4% |
| `COMER` | 55 | 3.4% |
| **Total** | **1.600** | **100%** |

La dominancia de `SEGUIR` (62.4%) sobre cualquier otra acción revela un patrón de comportamiento emergente: ante la escasez de recursos, los agentes con rasgo social priorizan la cohesión de grupo sobre la búsqueda activa individual. Este resultado es consistente con la hipótesis de que el modificador de relaciones sociales supera al modificador de hambre en los estadios medios del experimento.

### 5.2 Estado Final de la Población

**Veredicto:** TENSIÓN  
**Entidades vivas:** 8/8 (supervivencia total)  
**Hambre máxima:** 1.00 (crítica)  
**Hambre promedio:** 0.9475  
**Energía mínima:** 0.18  
**Energía promedio:** 0.3325  
**Alertas totales emitidas:** 65

La distribución de hambre al tick 200 muestra que 7 de 8 entidades (87.5%) alcanzaron hambre ≥ 0.90, umbral de criticidad. Solo Ana (H=0.68) permanece por debajo del umbral crítico, posiblemente debido a su posición alejada del grupo (47,21) que le permitió acceso a recursos no compitidos.

### 5.3 Análisis de Alertas Watchdog

Las 65 alertas se distribuyen en dos códigos semánticos:

| Código | Nivel | Descripción |
|--------|-------|-------------|
| `HAMBRE_SIN_COMIDA_DISPONIBLE` | WARN | Agente en hambre crítica ≥ 15 ticks en movimiento sin encontrar comida |
| `HAMBRE_CRITICA_SIN_RESPUESTA` | CRITICAL | Agente con hambre ≥ 0.9 durante ≥ 8 ticks consecutivos sin acción de comer |

Las alertas se concentran en los ticks 189 y 199 — los dos únicos ticks registrados en la muestra de las últimas 20 alertas que el sistema conserva. Esto indica que la presión de hambre fue sostenida y crítica en la fase final de la simulación (ticks 180–200), aunque no es posible afirmar periodicidad con solo dos puntos temporales. Los agentes afectados en ambos ticks son: Tryndamere, Amiguisimo, Eva, Clara, Bruno y Félix — todos ubicados en la mitad izquierda del mapa (x < 15), zona con menor densidad de recursos en esta configuración de semilla.

### 5.4 Dispersión Espacial

Los vectores de posición final revelan fragmentación del grupo en tres clusters aproximados:

- **Cluster NW** (x < 15, y > 40): Tryndamere (2,51), Félix (0,52), Amiguisimo (12,42)
- **Cluster SW** (x < 30, y < 25): David (10,22), Eva (13,5), Clara (25,5)
- **Posición aislada**: Bruno (0,34), Ana (47,21)

La fragmentación espacial es notable: el fundador (Tryndamere) y el compañero no-humano (Amiguisimo) comparten el cluster más cercano al borde oeste, la zona de menor recursos.

---

## 6. Discusión

### 6.1 Emergencia del Comportamiento Social Bajo Presión

El resultado más significativo es la dominancia de `SEGUIR` (62.4%) en un contexto de escasez severa. Este comportamiento no fue codificado directamente como respuesta a la escasez, sino que emerge de la interacción entre:

1. El modificador de relaciones (confianza alta → bonus SEGUIR)
2. La penalización de autonomía sobre exploración cuando `hambre > 0.85`
3. La ausencia de comida que hace que `COMER` y `RECOGER` no sean viables la mayor parte del tiempo

Esto produce una trampa dinámica: los agentes cohesionados en grupo mantienen relaciones de alta confianza que refuerzan el seguimiento mutuo, pero esto reduce la exploración individual necesaria para encontrar recursos. El grupo se mueve unido hacia zonas que ya han sido agotadas.

### 6.2 El Problema del Agotamiento Zonal

La concentración de alertas en el cluster oeste (ticks 189 y 199, fase final del experimento) sugiere que la semilla 42 genera un mapa con gradiente de recursos que desfavorece las zonas de borde oeste. Los agentes que terminan allí (Tryndamere, Félix, Amiguisimo) sufren hambre crítica crónica no por fallo del algoritmo de decisión sino por **agotamiento zonal**: han consumido los recursos locales y el modificador anti-oscilación (−0.40 sobre el retorno a la celda inmediatamente anterior) dificulta el retroceso eficiente, aunque no lo bloquea completamente.

### 6.3 El Caso Anómalo: Ana

Ana es la única entidad con hambre sub-crítica al final (H=0.68), ubicada en (47,21) — la posición más alejada de todos los demás agentes. Su aislamiento espacial, aunque no fue una estrategia intencionada sino resultado de la exploración individual, resultó adaptativo: al no estar en el grupo principal, no agotó las mismas zonas y tuvo acceso exclusivo a recursos del cuadrante NE del mapa.

Este resultado sugiere que bajo presión de escasez, la **divergencia individual de la cohesión grupal** puede ser una estrategia emergentemente superior, aunque el sistema no la codifica como tal.

### 6.4 Reproducibilidad

La sesión es completamente reproducible mediante:

```powershell
python cronica_fundacional.py --seed 42 --ticks 200 --founder "Tryndamere" --refuge "Refugio Fundador"
```

El uso de semilla fija en el generador de ruido (`random.Random(entidad.id_entidad * 1000 + contexto.tick_actual)`) garantiza que cada ejecución produzca exactamente el mismo conjunto de decisiones dado el mismo estado inicial.

---

## 7. Arquitectura Conceptual de Civilizaciones Vivas

Más allá de la sesión experimental, Artificial World propone un **modelo conceptual de civilizaciones vivas** con las siguientes entidades de dominio:

### 7.1 Modelo de Dominio

| Entidad | Rol | Estado mínimo |
|---------|-----|---------------|
| `World` | Contenedor global | identidad, recursos, tick, crónica, semilla, refugio fundador |
| `CivilizationSeed` | Arquetipo fundacional | valores, tensiones, arquetipo, tono 2D, héroe probable |
| `Refuge` | Unidad base de supervivencia | nombre, recursos, seguridad, moral, amenazas, memoria local |
| `Hero` | Agente histórico | nombre, rol, arquetipo, lealtades, presencia 2D |
| `Community` | Agrupación viva | cultura, tensiones, normas, cohesión, liderazgo |
| `MemoryEntry` | Registro de memoria | tipo, alcance, resumen, fecha |
| `HistoricalRecord` | Evento histórico | tipo, título, resumen, significancia, fecha |
| `Territory` | Lectura estratégica 2D | refugio central, radio de influencia, rutas, fronteras |

### 7.2 Relaciones entre Entidades

```
CivilizationSeed → condiciona → World
World → nace alrededor de → Refuge
Community → se organiza alrededor de → Refuge(s)
Hero → puede fundar / liderar / fracturar → Community
Event → genera → MemoryEntry
MemoryEntry(s) → alimentan → HistoricalRecord
Territory + Route → explican → la lectura 2D del poder y expansión
```

### 7.3 Flujo Fundador

El flujo mínimo viable para la creación de una civilización es:

```
Semilla → Refugio → Civilización naciente
```

1. El usuario elige una `CivilizationSeed`
2. Nombra al constructor (héroe fundador)
3. Nombra el refugio fundador
4. El sistema crea: héroe, refugio, mundo inicial, comunidad fundadora, crónica fundacional
5. La simulación avanza produciendo eventos que alimentan memoria e historia

---

## 8. Estrategia 2D / 3D

Un principio arquitectónico fundamental del sistema es la separación estricta entre las capas 2D y 3D:

| Capa | Rol | Estado actual |
|------|-----|---------------|
| **2D** | Verdad sistémica: mapa, grid, rutas, nodos, recursos, refugios, influencia, fronteras | Implementada |
| **3D** | Encarnación futura: héroes de gran presencia, refugios encarnados, eventos históricos visuales | Roadmap |

La 3D no existe hoy como runtime. Su correcta conceptualización es como **capa de presencia**, subordinada a la verdad sistémica 2D, no como funcionalidad paralela. Esta separación evita la confusión frecuente en simulaciones de vida artificial entre la lógica del sistema (donde vive la verdad) y su representación visual.

---

## 9. Verificación y Tests

El sistema cuenta con 11 suites de tests Python y 45 tests en backend (Node/Vitest), con un total verificado de **68+ tests pasando** en CI en cada push:

| Suite | Ámbito |
|-------|--------|
| Estructural | Integridad del árbol de módulos |
| Core | Ciclo tick, acciones, decisión |
| Crónica fundacional | Generación y serialización |
| Modo Sombra | Simulación especular |
| Combate | Lógica de ataque |
| Interacciones sociales | Compartir, robar, seguir |
| Bug robar | Regresión específica |
| Watchdog fixes | Corrección de alertas |
| Watchdog integración | Integración completa |
| Arranque limpio | Inicialización sin estado previo |
| Integración producción | Flujo completo end-to-end |

Para ejecutar:

```powershell
$env:SDL_VIDEODRIVER="dummy"; $env:SDL_AUDIODRIVER="dummy"
python pruebas/run_tests_produccion.py
```

---

## 10. Limitaciones y Trabajo Futuro

### 10.1 Limitaciones Actuales

1. **Ausencia de integración Python/JS**: el motor Python y el motor web son sistemas independientes sin comunicación en tiempo real. La verdad sistémica vive en el motor Python; la web tiene su propio motor JavaScript más ligero.

2. **Escasez de hitos narrativos**: la sesión de 200 ticks produjo solo 2 hitos (inicio y cierre). Eventos intermedios como `comio`, `compartio`, `robo` no fueron registrados en esta sesión, posiblemente porque las acciones de intercambio de recursos fueron marginales (solo 55 ejecuciones de `COMER`).

3. **Comunidad no simulada**: el concepto de `Community` existe como contrato de datos pero no como simulación social rica. Las relaciones inter-agente son diádicas, no hay dinámicas grupales emergentes de normas, liderazgo o cohesión cultural.

4. **Diplomacia y linajes no implementados**: civilizaciones completas con diplomacia, guerras, migraciones y linajes permanecen en roadmap.

5. **3D no implementada**: la capa de encarnación 3D no existe como runtime.

6. **Capturas visuales no integradas en la crónica**: el sistema genera la crónica en JSON y Markdown pero aún no incluye screenshots automáticos del estado del mundo en ticks clave (en desarrollo activo).

7. **Log de sesión sin historial persistente entre sesiones**: cada ejecución produce su propia crónica pero el sistema aún no agrega historial comparativo entre sesiones distintas.

### 10.2 Líneas de Trabajo Futuro

1. **Enriquecimiento de `Refuge` y `Community`**: implementar fases de crecimiento del refugio, normas sociales emergentes y dinámica de liderazgo.

2. **Historia profunda**: que más eventos del runtime alimenten `MemoryEntry` e `HistoricalRecord`, generando crónicas más ricas y verificables.

3. **Mecanismo de migración**: cuando una zona está agotada, los agentes deberían tener un mecanismo de migración grupal hacia zonas con recursos — lo que transformaría la trampa dinámica identificada en la sección 6.1 en comportamiento adaptativo.

4. **Semillas de civilización**: implementar las 7 arquetipos de `CivilizationSeed` completos (tribu, tecnócrata, espiritual, guerrero, comerciante, paranoica, decadente) con tensiones y valores que condicionan efectivamente el comportamiento de los agentes.

5. **Integración Python/JS**: definir un protocolo de puente que permita que el motor Python sea el backend de verdad sistémica y el motor JS sea la capa de presentación web en tiempo real.

---

## 11. Conclusiones

Artificial World demuestra que un motor de simulación relativamente compacto (arquitectura Python 2D, ~13 tipos de acción, función de utilidad con 9 modificadores) es capaz de producir comportamientos emergentes no triviales y verificables. La sesión canónica (semilla 42, 200 ticks) revela:

- **Supervivencia total** bajo presión de escasez severa
- **Emergencia de cohesión social como respuesta a la escasez**, con el efecto paradójico de reducir la exploración individual
- **Divergencia individual exitosa** como estrategia no codificada (caso Ana)
- **Agotamiento zonal** como causa primaria de hambre crítica, no fallo algorítmico
- **Reproducibilidad completa** mediante semilla fija y protocolo documentado

El sistema establece las bases para un motor creador de mundos compacto y reutilizable. La tesis de producto — **civilizaciones vivas con refugios, héroes y memoria** — es técnicamente defendible en su estado actual en la dimensión 2D, con la capa de encarnación 3D explícitamente marcada como roadmap.

> *"Empieza con un refugio. Elige una semilla. Mira nacer tu civilización."*

---

## Referencias

- Adams, T. (2006). *Dwarf Fortress*. Bay 12 Games.
- Conway, J. H. (1970). The Game of Life. *Scientific American*, 223(4), 4–10.
- Langton, C. G. (1989). Artificial Life. *Artificial Life*, SFI Studies in the Sciences of Complexity, 1–47.
- Rao, A. S., & Georgeff, M. P. (1991). Modeling Rational Agents within a BDI-Architecture. *KR*, 91, 473–484.
- Reynolds, C. W. (1987). Flocks, Herds, and Schools: A Distributed Behavioral Model. *SIGGRAPH Computer Graphics*, 21(4), 25–34.
- Sylvester, T. (2013). *RimWorld*. Ludeon Studios.
- Von Neumann, J., & Morgenstern, O. (1944). *Theory of Games and Economic Behavior*. Princeton University Press.

---

## Apéndice A: Estructura del JSON de Crónica Fundacional

```json
{
  "version": 1,
  "timestamp": "2026-03-08T12:53:48.770554",
  "metadata": {
    "semilla": 42,
    "nombre_fundador": "Tryndamere",
    "nombre_refugio": "Refugio Fundador",
    "semilla_civilizacion": "default",
    "alertas_total": 65,
    "ticks_ejecutados": 200
  },
  "estado_inicial": { "entidades_iniciales": 8, "mapa": "60x60" },
  "hitos": [ ... ],
  "entidades_finales": [ ... ],
  "alertas_watchdog": [ ... ],
  "metricas": {
    "siguio": 998,
    "descanso": 492,
    "recogio_recurso": 55,
    "comio": 55
  },
  "veredicto": "tension",
  "resumen": "Supervivencia en tensión. 8 entidades vivas. ..."
}
```

## Apéndice B: Comando de Reproducción

```powershell
# Instalar dependencias
pip install -r requirements.txt

# Ejecutar sesión reproducible
$env:SDL_VIDEODRIVER="dummy"
$env:SDL_AUDIODRIVER="dummy"
python cronica_fundacional.py --seed 42 --ticks 200 --founder "Tryndamere" --refuge "Refugio Fundador"

# Artefactos generados:
# cronica_fundacional.json  ← datos completos
# cronica_fundacional.md    ← resumen legible
```

---

*Artificial World — El repositorio. Artificial World — La tesis. Motor creador de mundos — El destino.*
