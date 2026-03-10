# Artificial World — Preprint Tecnico Corto

**Estado:** borrador utilizable  
**Fecha:** 2026-03-09  
**Posicionamiento recomendado:** `preprint tecnico / whitepaper fundacional con baseline experimental reproducible`

## Titulo recomendado

**Artificial World: Arquitectura de un Sistema de Simulacion Multiagente Trazable y Reproducible para Civilizaciones Emergentes**

Subtitulo opcional:

**Preprint tecnico con baseline experimental, taxonomia de evidencia y separacion explicita entre motor real y capa demo**

## Abstract

Presentamos `Artificial World`, un sistema de simulacion multiagente orientado a civilizaciones emergentes, disenado alrededor de tres propiedades de primer orden: trazabilidad, reproducibilidad y honestidad tecnica. El sistema combina un motor principal en Python con decision por utilidad, memoria espacial y social, persistencia SQLite y mecanismos de auditoria verificable, junto con una capa web separada que funciona como demo operativa con modelo conceptual compartido, pero sin integracion tecnica forzada con el motor principal.

Como baseline reproducible, documentamos una sesion canonica con semilla fija, 8 agentes y 200 ticks. En esta ejecucion se observan patrones consistentes de cohesion grupal bajo escasez, agotamiento zonal y divergencia individual exitosa. No presentamos esta sesion como validacion experimental exhaustiva, sino como una linea base verificable para futuras comparaciones controladas.

La contribucion principal del trabajo no es solo la simulacion en si, sino una metodologia de construccion y comunicacion para sistemas complejos: cada claim relevante debe clasificarse como `REAL`, `DEMO`, `PARCIAL` o `ROADMAP`, y debe poder rastrearse a codigo, tests, logs o artefactos observables. Defendemos que esta trazabilidad radical no es una caracteristica accesoria, sino una propiedad de diseno central para sistemas de IA y simulacion que aspiren a ser auditables.

## 1. Introduccion

Los sistemas de IA y simulacion suelen sufrir un problema recurrente: cuanto mas ambiciosa es su narrativa, mas dificil resulta distinguir entre lo que esta implementado, lo que funciona de forma parcial y lo que solo existe como vision futura. `Artificial World` parte de una premisa opuesta: un sistema complejo debe poder explicar sus decisiones, exponer sus limites y permitir verificacion externa.

En lugar de optimizar la presentacion por encima de la evidencia, el proyecto prioriza tres principios:

- reproducibilidad por semilla fija
- decision explicable mediante una funcion de utilidad publica
- separacion explicita entre nucleo real, demo funcional y roadmap

Esta orientacion posiciona a `Artificial World` mas cerca de un sistema experimental auditable que de una demo narrativa cerrada. El objetivo de este documento no es afirmar que el proyecto haya alcanzado una simulacion social completa, sino presentar una base tecnica defendible y una metodologia de trazabilidad aplicable a sistemas multiagente.

## 2. Propuesta del sistema

`Artificial World` modela agentes autonomos que perciben su entorno, actualizan memoria, puntuan acciones y ejecutan decisiones dentro de un mundo persistente. Su arquitectura actual separa con claridad dos capas:

- `motor Python (real)`: simulacion principal, persistencia, Modo Sombra, watchdog y pruebas
- `capa web (demo funcional)`: experiencia navegable, flujo fundador y modulos visuales con motor JavaScript propio

Esta separacion no se presenta como una deuda encubierta, sino como una decision arquitectonica explicita: cada capa tiene un proposito distinto y su grado de realidad debe comunicarse sin ambiguedad.

## 3. Arquitectura y mecanismos clave

El motor principal implementa un ciclo de simulacion por ticks en el que cada agente:

1. actualiza su estado interno
2. percibe amenazas, recursos y entidades cercanas
3. consulta memoria espacial y social
4. construye un contexto de decision
5. puntua acciones candidatas mediante una funcion de utilidad
6. ejecuta la accion ganadora

La funcion de utilidad combina:

- utilidad base por accion
- modificadores fisiologicos y contextuales
- memoria espacial
- relaciones inter-agente
- directivas externas
- una capa de autonomia de emergencia
- ruido determinista por semilla

Este enfoque favorece explicabilidad y depuracion. La decision no depende de un componente opaco, sino de una puntuacion reconstruible a partir del estado del agente y del tick actual.

## 4. Contribucion principal

La aportacion mas fuerte del sistema no es afirmar una novedad absoluta en vida artificial, sino proponer una forma mas auditable de construir y presentar un sistema multiagente complejo.

Las contribuciones defendibles hoy son estas:

1. **Arquitectura dual explicitada**: separacion documentada entre motor principal y capa demo.
2. **Decision reproducible**: agentes gobernados por funcion de utilidad publica con ruido determinista.
3. **Memoria persistente y social**: los agentes no reaccionan solo al instante presente, sino tambien a rastros del pasado.
4. **Taxonomia de evidencia**: cada componente puede etiquetarse como `REAL`, `DEMO`, `PARCIAL` o `ROADMAP`.
5. **Trazabilidad radical**: los claims del sistema deben apuntar a codigo, tests, logs o artefactos verificables.

## 5. Baseline experimental reproducible

Como punto de partida experimental, el proyecto documenta una sesion canonica con:

- semilla fija `42`
- `8` agentes iniciales
- `200` ticks
- mapa `60x60`

En esta corrida se observaron tres patrones relevantes:

1. **cohesion grupal bajo escasez**: una fraccion dominante de acciones de seguimiento
2. **agotamiento zonal**: concentracion de agentes en zonas con recursos degradados
3. **divergencia individual exitosa**: al menos un agente mejora su resultado al alejarse del grupo

Estos resultados son interesantes porque emergen de la interaccion de reglas explicitas y no de un guion hardcodeado. Sin embargo, esta baseline debe interpretarse con prudencia: sirve como demostracion reproducible y como base de comparacion, no como validacion estadistica amplia.

## 6. Alcance real del trabajo

La lectura correcta del proyecto exige separar con rigor las capas del sistema:

| Estado | Significado |
|---|---|
| `REAL` | Implementado, reproducible y verificable |
| `DEMO` | Funcional, pero no parte del nucleo principal |
| `PARCIAL` | Implementado de forma incompleta o con alcance limitado |
| `ROADMAP` | Disenado o deseado, pero no implementado |

Aplicado a `Artificial World`, esto implica:

- el motor Python y su baseline experimental pertenecen a la zona `REAL`
- la capa web es `DEMO` o `PARCIAL` segun el subsistema
- la integracion total Python/JS y la capa 3D permanecen en `ROADMAP`

Esta taxonomia no es un detalle editorial. Es parte central de la metodologia del proyecto: evitar que la ambicion narrativa sobrepase a la evidencia disponible.

## 7. Limitaciones

El trabajo tiene limites claros que deben declararse sin rodeos:

1. La baseline presentada usa una sola sesion pequena y no permite generalizacion fuerte.
2. Faltan multiples semillas, corridas mas largas y agregacion estadistica.
3. No se incluyen aun comparaciones sistematicas con baselines simples.
4. La capa web y otras superficies del repo pueden distraer si se confunden con el nucleo experimental.
5. La novedad del proyecto es mas metodologica y arquitectonica que empirica en su estado actual.

## 8. Trabajo futuro

Las siguientes lineas reforzarian el valor cientifico del sistema sin traicionar su identidad:

1. ejecutar multiples semillas y longitudes de corrida
2. comparar contra variantes sin memoria, sin relaciones o sin override de autonomia
3. medir supervivencia, dispersion, cohesion y consumo de recursos
4. separar una version academica corta de una version fundacional extensa
5. mantener la taxonomia `REAL / DEMO / PARCIAL / ROADMAP` como contrato editorial permanente

## 9. Conclusiones

`Artificial World` no debe defenderse hoy como un paper cientifico endurecido por evidencia extensa. Debe defenderse como un preprint tecnico serio que presenta una arquitectura reproducible de simulacion multiagente y una metodologia de trazabilidad radical.

Su principal valor actual no reside en la amplitud de sus resultados experimentales, sino en haber construido un sistema que obliga a distinguir entre evidencia, demo, parcialidad y vision futura. Esa disciplina metodologica, unida a una baseline verificable, constituye ya una aportacion defendible para el diseno de sistemas complejos auditables.

## Frase publica recomendada

**Artificial World es un preprint tecnico serio sobre simulacion multiagente trazable y reproducible, con una baseline experimental inicial y una metodologia explicita para distinguir entre lo real, lo demo, lo parcial y lo futuro.**
