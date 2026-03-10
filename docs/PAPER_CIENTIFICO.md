# Artificial World: Sistema de Simulacion Multiagente Reproducible con Decision por Utilidad y Baseline Experimental Inicial

**Autor:** Cosigein SL  
**Fecha:** 2026-03-09  
**Repositorio:** `artificial-word`  
**Estado del documento:** version cientifica corta alineada con el estado real del sistema

---

## Abstract

Presentamos **Artificial World**, un sistema de simulacion multiagente orientado a civilizaciones emergentes, en el que cada agente selecciona acciones mediante una funcion de utilidad explicita que integra estado fisiologico, rasgos conductuales, memoria espacial y social, relaciones inter-agente y reglas de autonomia de supervivencia. El sistema se implementa en un motor principal Python con persistencia SQLite, Modo Sombra para evaluacion contrafactual y generacion de cronica reproducible.

Como baseline experimental inicial, documentamos una sesion canonica reproducible con semilla fija, 8 agentes y 200 ticks sobre un mapa de 60 x 60 celdas. En esta corrida observamos dominancia de acciones de seguimiento, concentracion espacial en zonas degradadas y una divergencia individual asociada a mejor resultado relativo de supervivencia. Estos hallazgos se presentan como observaciones iniciales sobre una linea base verificable, no como validacion estadistica exhaustiva.

La contribucion principal del trabajo es doble: una arquitectura de decision multiagente explicable y una metodologia de trazabilidad que permite vincular claims del sistema a codigo, tests, logs y artefactos observables. Argumentamos que esta combinacion constituye una base tecnica defendible para el estudio incremental de comportamiento emergente en simulaciones auditables.

**Palabras clave:** vida artificial, agentes autonomos, funcion de utilidad, simulacion 2D, comportamiento emergente, memoria social, reproducibilidad.

---

## 1. Introduccion

Los sistemas de vida artificial suelen oscilar entre dos modelos. Algunos priorizan reglas locales simples y maximizan emergencia a partir de interacciones minimas. Otros incorporan agentes con estado interno rico, pero a costa de volver menos transparente la logica de decision. `Artificial World` adopta una tercera postura practica: agentes con estado interno relevante, pero gobernados por una funcion de utilidad publica, depurable y reproducible.

El objetivo del sistema no es optimizar una metrica global unica, sino producir condiciones para historia emergente verificable: secuencias de decisiones, interacciones y estados que puedan reconstruirse externamente. En esta etapa, el trabajo se centra en documentar la arquitectura del motor y una baseline experimental reproducible.

Este documento cubre:

1. arquitectura del sistema y del motor de decision
2. baseline experimental con semilla fija
3. observaciones iniciales de comportamiento emergente
4. limites actuales del sistema

---

## 2. Trabajo relacionado

`Artificial World` se ubica dentro de la tradicion de simulaciones multiagente con estado interno. Frente a sistemas de reglas locales como `Boids`, y frente a simulaciones mas ricas pero menos auditables como `Dwarf Fortress`, aqui se prioriza una formulacion de decision explicita basada en utilidad.

La arquitectura se relaciona con enfoques inspirados en `BDI`, pero reemplaza la seleccion simbolica de intenciones por una puntuacion continua sobre acciones candidatas. Esta simplificacion reduce complejidad de implementacion y favorece inspeccion directa del proceso de decision, aunque limita por ahora la modelizacion de objetivos persistentes de largo plazo.

---

## 3. Arquitectura del sistema

El nucleo experimental del proyecto reside en el motor Python. El repositorio contiene tambien una capa web separada, pero esta no constituye la base experimental de este documento.

### 3.1 Nucleo experimental

El motor principal implementa:

- simulacion por ticks
- funcion de utilidad para seleccion de acciones
- memoria espacial y social
- persistencia SQLite
- `Modo Sombra` para simulacion contrafactual
- `Watchdog` para alertas estructuradas
- cronica reproducible en artefactos legibles

### 3.2 Ciclo por tick

En cada tick, cada entidad:

1. actualiza su estado interno
2. percibe recursos, amenazas y agentes cercanos
3. actualiza memoria relevante
4. construye contexto de decision
5. genera y puntua acciones candidatas
6. ejecuta la accion de mayor puntuacion

### 3.3 Funcion de utilidad

La puntuacion de una accion `a` para el agente `i` en el tick `t` sigue la forma:

```text
U(a, i, t) = U_base(a) + sum(delta_k(a, i, t)) + epsilon(i, t)
```

donde:

- `U_base(a)` es la utilidad intrinseca de la accion
- `delta_k` son modificadores contextuales
- `epsilon(i, t)` es ruido determinista por semilla

Los modificadores principales son:

| Modificador | Funcion |
|---|---|
| `hambre` | eleva el valor de acciones de subsistencia |
| `energia` | favorece descanso en estados de fatiga |
| `riesgo` | aumenta evitacion o huida |
| `rasgo` | ajusta preferencias segun arquetipo conductual |
| `anti_oscilacion` | penaliza retorno inmediato a la posicion previa |
| `memoria` | bonifica movimiento hacia recursos recordados |
| `relaciones` | modula acciones sociales por confianza, hostilidad y miedo |
| `directivas` | incorpora instrucciones externas experimentales |
| `autonomia` | impone correcciones de supervivencia en estados criticos |

Esta formulacion hace posible reconstruir la decision a partir del estado del sistema, sin depender de un componente opaco.

### 3.4 Memoria y autonomia

Cada agente mantiene:

- **memoria espacial**: posiciones de recursos y refugios observados
- **memoria social**: vectores de confianza, hostilidad y miedo hacia otros agentes

Ademas, el sistema incorpora una capa de autonomia de emergencia. Cuando el estado fisiologico o el riesgo alcanzan umbrales criticos, este mecanismo penaliza acciones incompatibles con la supervivencia y prioriza conductas de resguardo.

---

## 4. Entorno experimental

### 4.1 Baseline reproducible

La sesion canonica se ejecuta con los siguientes parametros:

| Parametro | Valor |
|---|---|
| Semilla | `42` |
| Mapa | `60 x 60` |
| Entidades iniciales | `8` |
| Ticks | `200` |
| Fundador | `Tryndamere` |
| Refugio fundador | `Refugio Fundador` |

### 4.2 Reproduccion

```powershell
python cronica_fundacional.py --seed 42 --ticks 200 --founder "Tryndamere" --refuge "Refugio Fundador"
```

La semilla fija y el uso de ruido determinista permiten regenerar el mismo conjunto de decisiones dado el mismo estado inicial.

---

## 5. Resultados

### 5.1 Distribucion agregada de acciones

| Accion | Ejecuciones | Proporcion |
|---|---|---|
| `SEGUIR` | 998 | 62.4% |
| `DESCANSAR` | 492 | 30.8% |
| `RECOGER_RECURSO` | 55 | 3.4% |
| `COMER` | 55 | 3.4% |
| **Total** | **1600** | **100%** |

### 5.2 Estado final resumido

- supervivencia total: `8/8`
- hambre critica en `7/8` entidades
- alertas watchdog emitidas: `65`
- veredicto global de sesion: `TENSION`

### 5.3 Observaciones iniciales

Los datos de la baseline sugieren tres fenomenos:

1. **cohesion grupal bajo escasez**: la dominancia de `SEGUIR` indica fuerte peso de las relaciones sociales sobre la exploracion individual.
2. **agotamiento zonal**: varios agentes terminan agrupados en zonas con presion sostenida de hambre.
3. **divergencia individual exitosa**: una entidad aislada finaliza con hambre sub-critica respecto al resto.

Estas observaciones son compatibles con la hipotesis de que la interaccion entre relaciones sociales, autonomia y distribucion espacial de recursos puede generar patrones colectivos no codificados de forma directa. Sin embargo, deben entenderse como inferencias iniciales sobre una sola corrida reproducible.

---

## 6. Discusion

La principal fortaleza del sistema en su estado actual es su capacidad de producir una corrida explicable y reconstruible. Las decisiones de los agentes no se presentan como emergencias incognoscibles, sino como resultados de una funcion de utilidad inspeccionable.

La principal debilidad experimental es la escala de evidencia: una sola sesion con 8 agentes y 200 ticks no basta para sostener generalizaciones fuertes. La baseline actual sirve como punto de partida verificable, no como validacion estadistica robusta.

En ese sentido, el valor cientifico inmediato del trabajo no reside solo en los resultados observados, sino en el hecho de ofrecer un sistema donde los resultados pueden reexaminarse, repetirse y contrastarse en futuras iteraciones.

---

## 7. Limitaciones

1. La evidencia experimental actual se basa en una sola corrida.
2. No hay aun comparacion sistematica con baselines simplificados.
3. Faltan multiples semillas, corridas mas largas y medidas agregadas.
4. `Community` existe mas como contrato y estado inicial que como simulacion social rica.
5. La integracion Python/JS no forma parte del nucleo experimental actual.

---

## 8. Trabajo futuro

Las extensiones mas relevantes para reforzar el valor cientifico del sistema son:

1. ejecutar multiples semillas y longitudes de corrida
2. comparar variantes sin memoria, sin relaciones o sin override de autonomia
3. medir supervivencia, dispersion, cohesion y consumo de recursos
4. enriquecer normas emergentes, historia y dinamica comunitaria
5. mantener la reproducibilidad como criterio editorial y experimental central

---

## 9. Conclusiones

`Artificial World` presenta una base tecnica defendible para simulacion multiagente reproducible con decision por utilidad. La baseline experimental documentada no prueba todavia robustez estadistica amplia, pero si demuestra que el sistema puede generar patrones observables y verificables a partir de reglas explicitas, memoria y relaciones sociales.

La aportacion mas clara del trabajo en su estado actual es la combinacion de:

- una arquitectura de decision explicable
- una baseline reproducible
- una disciplina de trazabilidad sobre el comportamiento del sistema

Esa combinacion constituye una base solida para iteraciones experimentales futuras mas amplias.

---

## Referencias

- Adams, T. (2006). *Dwarf Fortress*. Bay 12 Games.
- Conway, J. H. (1970). The Game of Life. *Scientific American*, 223(4), 4-10.
- Langton, C. G. (1989). Artificial Life. *Artificial Life*, SFI Studies in the Sciences of Complexity, 1-47.
- Rao, A. S., & Georgeff, M. P. (1991). Modeling Rational Agents within a BDI-Architecture. *KR*, 91, 473-484.
- Reynolds, C. W. (1987). Flocks, Herds, and Schools: A Distributed Behavioral Model. *SIGGRAPH Computer Graphics*, 21(4), 25-34.
- Sylvester, T. (2013). *RimWorld*. Ludeon Studios.
- Von Neumann, J., & Morgenstern, O. (1944). *Theory of Games and Economic Behavior*. Princeton University Press.
