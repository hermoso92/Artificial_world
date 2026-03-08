# Artificial World
## Un motor de civilizaciones emergentes

*Cosigein SL · 2026-03-08 · Semilla 42 · 200 ticks · 8 agentes*

---

> *"Empieza con un refugio. Elige una semilla. Mira nacer tu civilización."*

---

## Antes de empezar: lo que existe y lo que no

Este documento tiene una regla. Cada vez que se diga que algo "existe" o "funciona", existe y funciona de verdad, verificable con el código. Cuando algo es visión futura, se dice explícitamente.

| Estado | Qué significa |
|--------|---------------|
| **Real** | Testeado, reproducible, en producción |
| **Demo** | Funciona, pero no es el motor principal |
| **Parcial** | Existe con funcionalidad incompleta |
| **Roadmap** | Diseñado. No implementado todavía. |

Motor Python: **Real.** Capa web: **Demo.** Runtime 3D: **Roadmap.**

Si lees esto y quieres verificarlo, el comando es:

```bash
python cronica_fundacional.py --seed 42 --ticks 200 \
  --founder "Tryndamere" --refuge "Refugio Fundador"
```

Obtendrás exactamente los mismos resultados que describe este documento.

---

## El problema que resuelve

Los sistemas de vida artificial clásicos, desde el Game of Life de Conway (1970) hasta los Boids de Reynolds (1987), son elegantes. Pero priorizan la simplicidad de las reglas sobre la riqueza del estado interno. El agente no *recuerda*. No tiene razones. Emerge, pero no *decide*.

Los sistemas más complejos — Dwarf Fortress, RimWorld, Creatures — van más lejos. Pero el mecanismo de decisión tiende a ocultarse bajo capas de abstracción. No puedes auditarlo desde fuera. El enano de Dwarf Fortress tiene pensamientos verificables en la UI pero opacos en el código.

Artificial World busca un punto diferente: **estado interno rico y decisión completamente transparente.**

La función que gobierna cada decisión de cada agente en cada tick es pública, parametrizada y reproducible. No hay magia invisible. El ruido es determinista por semilla. Si el agente Bruno decidió seguir a Eva en el tick 147, puedes reconstruir exactamente por qué.

---

## La arquitectura en una página

El sistema tiene tres capas independientes que comparten un modelo conceptual pero no se integran en tiempo real. Esto es una decisión deliberada, no un trabajo pendiente.

```
┌─────────────────────────────────────────────────────┐
│            MODELO CONCEPTUAL COMPARTIDO             │
│  World · CivilizationSeed · Refuge · Hero           │
│  Community · MemoryEntry · HistoricalRecord         │
└──────────────────┬────────────────┬─────────────────┘
                   │                │
    ┌──────────────▼──────┐   ┌─────▼────────────────┐
    │  MOTOR PYTHON       │   │  CAPA WEB (DEMO)      │
    │  Real. 68+ tests.   │   │  Node + React.        │
    │  principal.py       │   │  HeroRefuge, 7 seeds  │
    │  13 acciones        │   │  IA local (Ollama)    │
    │  SQLite persistente │   │                       │
    └─────────────────────┘   └───────────────────────┘
                                       
    ┌──────────────────────────────────────────────────┐
    │  SISTEMA CHESS (AUDITORÍA)                       │
    │  6 agentes Docker · red aislada · read-only      │
    │  Sin acceso al equipo que construye              │
    └──────────────────────────────────────────────────┘
```

La separación Python/Web no es un error. Es la decisión correcta documentada en `docs/DECISION_PUENTE_PYTHON_JS.md`: cada motor está optimizado para su contexto. Construir un puente en tiempo real en esta fase costaría más de lo que aportaría.

---

## Cómo decide un agente

Cada agente, en cada tick, ejecuta este ciclo:

```
actualizar_estado_interno()   ← hambre sube, energía baja
percibir_entorno()            ← ve el radio local, mide amenaza
actualizar_memoria()          ← registra recursos y refugios visibles
actualizar_directivas()       ← expira instrucciones caducadas
construir_contexto()          ← empaqueta todo en ContextoDecision
decidir_accion()              ← función de utilidad → acción ganadora
ejecutar_accion()             ← aplica efectos en el mundo
```

La función de utilidad es:

$$U(a, i, t) = U_{\text{base}}(a) + \sum_{k=1}^{9} \delta_k(a, i, t) + \epsilon(i,t)$$

Donde $\epsilon(i,t) = \text{random.Random}(\text{id} \times 1000 + t).\text{uniform}(-0.08, 0.08)$.

El ruido es real pero determinista. Dado el mismo estado inicial, siempre toma la misma decisión.

### Las 13 acciones y sus utilidades base

| Acción | $U_\text{base}$ | Condición de viabilidad |
|--------|---------|------------------------|
| COMER | 0.65 | Comida en inventario > 0 |
| RECOGER_COMIDA | 0.55 | Celda actual tiene recurso COMIDA |
| EXPLORAR | 0.50 | Energía > 0.20 |
| HUIR | 0.40 | Riesgo > 0.3 |
| DESCANSAR | 0.30 | *(fallback garantizado — nunca falla)* |
| MOVER | 0.30 | Posición vecina disponible |
| RECOGER_MATERIAL | 0.30 | Celda actual tiene recurso MATERIAL |
| IR_REFUGIO | 0.25 | Refugio adyacente + (energía < 0.45 OR riesgo > 0.5) |
| EVITAR | 0.25 | Riesgo > 0.3 |
| COMPARTIR | 0.20 | Inventario ≥ 3 OR (cooperativo + inv ≥ 1 + hambre < 0.5) |
| ROBAR | 0.20 | Oportunista/agresivo + hambre ≥ 0.75 + sin comida |
| SEGUIR | 0.20 | Cooperativo/neutral + entidades cercanas visibles |
| ATACAR | 0.18 | Condición contextual agresiva |

COMER tiene la máxima prioridad base precisamente porque solo es candidato cuando hay comida en inventario — condición de alta certeza de éxito. Cuando no hay comida, desaparece del tablero de opciones.

### Los 9 modificadores que cambian todo

| # | Modificador | Efecto |
|---|-------------|--------|
| 1 | `mod_hambre` | Escala COMER/RECOGER proporcionalmente a la hambre actual |
| 2 | `mod_energia` | Aumenta DESCANSAR cuando energía < 0.6 |
| 3 | `mod_riesgo` | Activa HUIR/EVITAR cuando riesgo > 0.3 |
| 4 | `mod_rasgo` | Ajusta preferencias según arquetipo conductual del agente |
| 5 | `mod_anti_oscilacion` | Penaliza −0.40 si el destino MOVER es la celda anterior |
| 6 | `mod_memoria` | Bonus +0.15–0.25 hacia recursos recordados |
| 7 | `mod_relaciones` | Confianza → COMPARTIR/SEGUIR; hostilidad → HUIR/EVITAR |
| 8 | `mod_directivas` | Instrucciones externas del investigador con prioridad alta |
| 9 | `mod_autonomia` | **Override de emergencia: supervivencia anula directivas** |

El modificador 9 es el más importante del sistema. Si hambre > 0.85, penaliza EXPLORAR aunque haya una directiva que diga lo contrario. Si riesgo > 0.80, bonifica HUIR sobre cualquier orden recibida. **Ningún agente puede ser enviado a su muerte por un investigador descuidado.**

### Los 5 rasgos de los agentes sociales

| Rasgo | Qué potencia | Qué penaliza |
|-------|-------------|-------------|
| COOPERATIVO | COMPARTIR +0.25, SEGUIR levemente | ROBAR −0.25 |
| NEUTRAL | — | — |
| AGRESIVO | ROBAR +0.30 | COMPARTIR −0.20, HUIR −0.10 |
| EXPLORADOR | MOVER +0.35, EXPLORAR +0.35 | SEGUIR levemente |
| OPORTUNISTA | ROBAR +0.15, RECOGER_MATERIAL +0.08 | — |

Los gatos tienen sus propios 5 rasgos: Curioso, Apegado, Independiente, Territorial, Oportunista. Cada uno con una tabla de modificadores distinta.

---

## Lo que pasó en la sesión canónica

*Semilla 42. Mapa 60×60. 7 agentes sociales + 1 gato. 200 ticks.*

### El punto de partida

El héroe fundador se llama **Tryndamere**. Su refugio: **Refugio Fundador**. La semilla por defecto. Ocho entidades despiertan en el tick 0 con hambre y energía normales.

### El final, 200 ticks después

| Nombre | Tipo | Posición final | Hambre | Energía |
|--------|------|----------------|--------|---------|
| Ana | social | (47, 21) | 0.68 | 0.38 |
| Bruno | social | (0, 34) | 1.00 | 0.36 |
| Clara | social | (25, 5) | 1.00 | 0.26 |
| David | social | (10, 22) | 0.90 | 0.18 |
| Eva | social | (13, 5) | 1.00 | 0.40 |
| Félix | social | (0, 52) | 1.00 | 0.38 |
| Amiguisimo | gato | (12, 42) | 1.00 | 0.30 |
| Tryndamere | social | (2, 51) | 1.00 | 0.40 |

*Hambre: 0 = saciado, 1 = crítico. Salud = 1.0 para todos. Ninguno murió.*

Veredicto del sistema: **TENSIÓN.**

65 alertas emitidas: 30 WARN y 35 CRITICAL, concentradas en los ticks 180–200.

### Lo que hicieron durante 200 ticks

| Acción | Veces | Proporción |
|--------|-------|------------|
| SEGUIR | 998 | 62.4% |
| DESCANSAR | 492 | 30.8% |
| RECOGER_RECURSO | 55 | 3.4% |
| COMER | 55 | 3.4% |
| **Total** | **1.600** | **100%** |

Esto es lo que más llama la atención: en 200 ticks, bajo hambre crítica generalizada, el 62.4% de las acciones fue **SEGUIR**. Seguirse los unos a los otros.

---

## Tres cosas que nadie programó

### 1. La trampa dinámica de la cohesión

SEGUIR dominando al 62.4% bajo escasez severa no fue programado como respuesta a la escasez. Es el resultado de tres mecanismos interactuando:

**Primero:** `mod_relaciones`. Los agentes que han convivido tienen confianza alta entre sí. Confianza alta → bonus SEGUIR. No importa que no haya comida.

**Segundo:** `mod_autonomia`. Con hambre > 0.85, el modificador de autonomía *penaliza* EXPLORAR. El agente hambriento no puede explorar agresivamente aunque quiera.

**Tercero:** ausencia de recursos. COMER y RECOGER no son viables la mayor parte del tiempo porque las celdas están vacías.

El resultado: los agentes cohesionados se mueven juntos hacia zonas que el propio grupo ha agotado. La confianza social supera la señal de hambre. Es el mismo mecanismo que los economistas del comportamiento llaman *information cascade*: se imita al grupo incluso cuando esa imitación es colectivamente subóptima.

**El grupo sobrevive, pero hambriento.**

### 2. El agotamiento zonal del cuadrante oeste

Las 65 alertas no se distribuyen uniformemente. Se concentran en el cluster noroeste del mapa (x < 15, y > 40): Tryndamere en (2,51), Félix en (0,52), Amiguisimo en (12,42).

No es que el algoritmo falle. Es que la semilla 42 genera un gradiente de recursos que desfavorece el borde oeste. Y hay un efecto lateral del modificador 5:

`mod_anti_oscilacion` penaliza −0.40 regresar a la celda anterior. Fue diseñado para evitar el "ping-pong" entre dos celdas. Funciona. Pero en condiciones de agotamiento zonal total, ese mismo modificador *dificulta* que el agente retroceda hacia zonas con recursos. Una regla diseñada para mejorar el comportamiento promedio crea un caso extremo patológico.

**El agente camina hacia adelante incluso cuando hacia adelante no hay nada.**

### 3. Ana: la divergencia que nadie ordenó

Ana es la única entidad con hambre sub-crítica al final: 0.68. Está en (47, 21), la posición más alejada del grupo — a ~38 unidades del centroide.

Nadie la envió ahí. No hay directiva de exploración individual. Es el resultado acumulado de decisiones propias que la llevaron progresivamente al cuadrante noreste, donde la densidad de recursos es superior y el grupo nunca llegó.

Lo que esto implica es teóricamente relevante: **la divergencia individual de la cohesión grupal puede ser una estrategia emergentemente superior bajo presión de escasez**, aunque el sistema no la codifica como tal. Un agente con rasgo EXPLORADOR reproduce el patrón de Ana con más probabilidad por diseño. Un COOPERATIVO tiende a quedar atrapado en la trampa de la cohesión.

La simulación no lo planificó. Sucedió.

---

## Tabla de fenómenos emergentes

| Fenómeno | Mecanismo generador | ¿Programado? |
|----------|---------------------|--------------|
| Cohesión bajo escasez | `mod_relaciones` > `mod_autonomia` en estadios medios | No |
| Agotamiento zonal | `mod_anti_oscilacion` + gradiente de recursos local | Parcial (efecto lateral) |
| Divergencia individual exitosa | rasgo_explorador + exploración no competida | No |
| Supervivencia total | `mod_autonomia` activa en estados críticos | Sí (diseñado) |
| Fragmentación en 3 clusters | dispersión exploratoria + gradiente de recursos | Parcial |

---

## Las herramientas que nadie ve pero importan

### Modo Sombra

Una simulación paralela que replica el estado del mundo principal pero acepta intervenciones sin modificar lo observable. Permite evaluar contrafácticos: *¿qué habría pasado si David hubiera tomado la decisión Y en el tick 147?*

También permite control manual con entrada WASD: el investigador toma el control de un agente, la IA cede el turno para ese agente específico.

No se activa en la sesión canónica estándar. Está completamente verificado con su propia suite de tests.

### Watchdog

Cada alerta del Watchdog tiene esta forma:

```json
{
  "nivel": "CRITICAL",
  "codigo": "HAMBRE_CRITICA_SIN_RESPUESTA",
  "tick": 189,
  "entidad_id": 2,
  "entidad_nombre": "Bruno",
  "descripcion": "Hambre >= 0.9 durante 8 ticks consecutivos sin acción COMER"
}
```

No es un log de errores. Es parte de la crónica. Las alertas son verificables contra el log de acciones del mismo período. Si el Watchdog dice que Bruno lleva 8 ticks sin comer, puedes comprobarlo en el log.

### Sistema Chess

El mismo equipo que construye no puede auditarse a sí mismo con objetividad. El Sistema Chess resuelve esto con 6 agentes dockerizados en red aislada, sin acceso de escritura, que analizan el repositorio desde fuera.

| Agente | Especialidad |
|--------|-------------|
| agent-docs | Claims prohibidos, inconsistencias README |
| agent-backend | console.log, URLs hardcodeadas, catch vacíos |
| agent-frontend | Componentes >300 líneas, imports incorrectos |
| agent-bd | SQL injection patterns, SELECT *, sin IF NOT EXISTS |
| agent-tests | Tests sin assertions, ratio cobertura <30% |
| agent-marketing | Claims sin evidencia, overselling |

Los agentes montan el repositorio en modo `:ro`. No tienen estado entre ejecuciones. No pueden comunicarse con producción. El coordinator agrega resultados por severidad y genera `REPORTE_CHESS_1.md`.

---

## Las 7 civilizaciones posibles

La capa web implementa 7 arquetipos fundacionales. Cada semilla no es solo un nombre — condiciona valores, tensiones internas, el tipo de héroe probable y el tono de la historia que emerge.

| Arquetipo | Valores centrales | Tensión principal | Héroe probable |
|-----------|-------------------|-------------------|----------------|
| **Tribu Fronteriza** | Adaptación, cooperación, resistencia | Clima hostil, escasez | Explorador/Guardián |
| **Refugio Tecnócrata** | Orden, eficiencia, conocimiento | Rigidez, elitismo | Ingeniero/Estratega |
| **Comunidad Espiritual** | Fe, vínculo, memoria | Dogma, miedo al cambio | Guardián/Profeta |
| **Reino Guerrero** | Honor, fuerza, jerarquía | Expansión, coste humano | Campeón/Conquistador |
| **Ciudad Mercante** | Intercambio, movilidad | Desigualdad, corrupción | Negociador/Explorador |
| **Colonia Paranoica** | Seguridad, vigilancia, autarquía | Sospecha, fractura interna | Vigía/Ingeniero |
| **Imperio Decadente** | Linaje, poder, apariencia | Declive, intriga | Heredero/Diplomático |

El flujo mínimo para crear una civilización: **elige semilla → nombra héroe → nombra refugio**. En menos de 2 minutos desde el onboarding hay un mundo activo con recursos, moral, memoria inicial y tensiones internas.

---

## Lo que el sistema no hace todavía

Esto también importa.

1. **Los dos motores no están integrados.** Python y la capa web comparten modelo conceptual pero no hablan en tiempo real. Es una decisión documentada, no un olvido.

2. **La Community existe como contrato de datos, no como simulación social rica.** Los grupos tienen tensiones declaradas pero no simuladas tick a tick.

3. **No hay diplomacia entre civilizaciones.** Guerras, linajes, migraciones entre mundos: roadmap.

4. **El runtime 3D no existe.** La verdad sistémica vive en 2D. La encarnación visual con héroes de gran presencia, refugios encarnados y eventos históricos visuales es la capa futura.

5. **Las crónicas no incluyen capturas automáticas de ticks clave.** La historia se genera en texto y JSON, pero sin snapshots visuales del estado en los momentos críticos.

---

## Lo que el sistema sí demuestra

La sesión canónica — semilla 42, 200 ticks, 8 agentes — demuestra cinco cosas verificables:

**1. Supervivencia total bajo presión de escasez severa.** Los 8 agentes llegan al tick 200 vivos. El sistema de autonomía de emergencia funcionó.

**2. Comportamiento emergente no programado.** SEGUIR al 62.4% bajo hambre crítica es la consecuencia de tres mecanismos interactuando. Ninguno de ellos fue diseñado para producir ese resultado.

**3. Efectos laterales identificables.** El `mod_anti_oscilacion` tiene un caso extremo patológico en condiciones de agotamiento zonal. Está documentado. No está corregido todavía, pero está visto.

**4. Divergencia individual como ventaja.** Ana sobrevivió mejor que el grupo. Sin directiva. Sin diseño. Por exploración acumulada.

**5. Reproducibilidad completa.** Cualquier persona con el código y la semilla 42 obtiene exactamente estos resultados. Eso es la base de cualquier claim serio sobre el sistema.

---

## La convicción detrás del diseño

Hay un problema en el campo de la IA en este momento: nunca ha sido más fácil generar texto convincente sobre sistemas. Y nunca ha sido más difícil distinguir qué parte de un sistema existe de verdad de qué parte existe solo como afirmación.

Artificial World parte de la premisa contraria: **la trazabilidad radical es una propiedad de diseño de primer orden, no una característica opcional.**

Cada comportamiento de agente debe ser reproducible mediante semilla fija. Cada claim de capacidad debe apuntar a una línea de código. Cada crónica generada debe ser verificable contra el estado del sistema en el tick correspondiente.

El Sistema Chess institucionaliza esto al nivel de proceso. Los agentes auditores no pueden ser influenciados por el equipo que construye. El reporte es verificable, reproducible y fechado.

El manifiesto del proyecto lo expresa en una frase:

> *"Una respuesta sin rastro no es una base seria de decisión."*

---

## Para reproducir exactamente esto

```bash
# Clonar o tener el repositorio local
python cronica_fundacional.py --seed 42 --ticks 200 \
  --founder "Tryndamere" --refuge "Refugio Fundador"

# Tests completos
$env:SDL_VIDEODRIVER = "dummy"
$env:SDL_AUDIODRIVER = "dummy"
python pruebas/run_tests_produccion.py

# Web fullstack
.\scripts\iniciar_fullstack.ps1
```

El motor Python corre en cualquier máquina con Python 3.11+. La sesión canónica tarda menos de 30 segundos. La crónica se genera automáticamente en JSON, Markdown y PDF.

---

## Referencias

1. Adams, T. (2006). *Dwarf Fortress.* Bay 12 Games.
2. Conway, J. H. (1970). The Game of Life. *Scientific American*, 223(4), 4–10.
3. Langton, C. G. (1989). Artificial Life. *SFI Studies in the Sciences of Complexity*, 1–47.
4. Rao, A. S., & Georgeff, M. P. (1991). Modeling Rational Agents within a BDI-Architecture. *KR '91*, 473–484.
5. Reynolds, C. W. (1987). Flocks, Herds, and Schools: A Distributed Behavioral Model. *SIGGRAPH*, 21(4), 25–34.
6. Sylvester, T. (2013). *RimWorld.* Ludeon Studios.
7. Von Neumann, J., & Morgenstern, O. (1944). *Theory of Games and Economic Behavior.* Princeton University Press.
8. Bikhchandani, S., Hirshleifer, D., & Welch, I. (1992). A Theory of Fads, Fashion, Custom, and Cultural Change as Informational Cascades. *Journal of Political Economy*, 100(5), 992–1026.

---

*Artificial World · Motor Python + React · Agentes autónomos por utilidad · Sin LLMs en el núcleo*

*Repositorio: artificial-word · Versión: 1.0 fundacional · 2026-03-08*
