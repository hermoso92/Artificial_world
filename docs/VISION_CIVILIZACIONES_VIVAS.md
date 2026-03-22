# Vision de civilizaciones vivas

> Tesis de producto, columna vertebral conceptual y foco minimo defendible para `Artificial World`.

---

## 1. Resumen ejecutivo

`Artificial World` es hoy dos cosas distintas que no deben mezclarse:

- un **motor real en Python + pygame** con memoria, decision por utilidad, persistencia y Modo Sombra
- una **capa web funcional** con motor JavaScript propio, `HeroRefuge`, refugios jugables 2D y mundos ligeros persistidos

La tesis correcta no es venderlo como editor de mapas ni como IA abstracta.

La formulacion defendible es esta:

**Artificial World es una base para crear civilizaciones vivas con memoria, heroes, refugios y comunidades, donde la verdad estrategica vive en 2D y la futura encarnacion 3D se trata como una capa de presencia, no como funcionalidad ya implementada.**

La funcionalidad fundadora a priorizar es:

**Crea tu primer refugio, elige una semilla de civilizacion y mira nacer tu historia.**

---

## 2. Que existe hoy y que no

### Real hoy

- motor Python 2D con agentes, memoria espacial/social, persistencia y Modo Sombra
- refugios jugables en la web con grid 2D, muebles, mascotas y recursos
- `HeroRefuge` con heroe persistido, companion IA opcional y mundos ligeros
- flujo de landing -> heroe -> refugio en frontend
- IA local minima para chat, resumen y analisis

### Parcial hoy

- “mundos” del `HeroRefuge`: existen, persisten y ahora admiten `CivilizationSeed`, pero siguen siendo ligeros
- historia: existe como cronica y registros simples, no como historiografia profunda
- comunidad: existe como contrato y estado inicial, no como simulacion social rica
- heroes historicos: existe un heroe fundador en metadata del mundo, no una poblacion de heroes sistemica

### No existe hoy

- 3D runtime real
- integracion tecnica entre motor Python y motor JS
- civilizaciones completas simuladas con diplomacia, linajes, guerras y migraciones profundas
- producto `DobackSoft` real dentro de este repo

---

## 3. Tesis de producto elegida

La mejor formulacion combinando potencia, precision y sostenibilidad es:

**Sistema de civilizaciones vivas con refugios, heroes y memoria.**

Por que esta y no otras:

- mejor que “creador de mundos”: obliga a comportamiento, no solo escenario
- mejor que “mundos artificiales pero reales”: es potente, pero demasiado amplia como mensaje principal
- mejor que “simulador de comunidades vivas”: no deja fuera al refugio ni al heroe
- mejor que “observatorio de historia emergente”: sirve como segunda capa narrativa, no como puerta de entrada

Mensaje corto recomendado:

**Empieza con un refugio. Elige una semilla. Mira nacer tu civilizacion.**

---

## 4. Arquitectura conceptual minima

### World

Contenedor de estado global. En web hoy incluye:

- identidad del mundo
- recursos
- tick
- cronica
- semilla de civilizacion
- refugio fundador
- comunidad fundadora
- heroes relevantes
- memoria e historial inicial

### CivilizationSeed

Contrato pequeno que define:

- valores
- tensiones
- arquetipo
- tono visual 2D
- tono visual 3D futuro
- heroe probable
- estilo de conflicto

### Refuge

Unidad base de supervivencia e identidad.

Estado minimo defendible:

- nombre
- recursos
- seguridad
- moral
- amenazas
- memoria local
- fase de crecimiento

### Hero

Agente historico relevante.

Estado minimo defendible:

- nombre
- rol
- arquetipo
- lealtades
- presencia 2D
- hook futuro para presencia 3D

### Community

Agrupacion viva ligada a un refugio o a varios.

Estado minimo defendible:

- nombre
- cultura
- tensiones
- normas
- cohesion
- liderazgo

### Event / HistoricalRecord

Un evento deja memoria. Un conjunto de memorias crea historia.

Estado minimo defendible:

- tipo
- titulo
- resumen
- significancia
- fecha

### MemoryEntry

Registro legible y acumulable.

Estado minimo defendible:

- id
- tipo
- alcance
- resumen
- fecha

### Territory / Route

Lectura estrategica del mundo en 2D.

Estado minimo defendible:

- refugio central
- radio de influencia
- estado de frontera
- rutas

---

## 5. Relaciones

- una `CivilizationSeed` condiciona el tono del `World`
- un `World` nace alrededor de un `Refuge`
- una `Community` se organiza alrededor de uno o varios `Refuge`
- un `Hero` puede fundar, liderar, abandonar o fracturar una `Community`
- un `Event` genera un `MemoryEntry`
- varios `MemoryEntry` alimentan `HistoricalRecord`
- `Territory` y `Route` explican la lectura 2D del poder, recursos y expansion

---

## 6. Estrategia 2D y 3D

### 2D = verdad del sistema

La 2D debe seguir representando:

- mapa
- grid
- rutas
- nodos
- recursos
- refugios
- ocupacion
- influencia
- frontera
- estados y cambios

### 3D = presencia y momentos historicos

La 3D no existe hoy como runtime, pero la arquitectura futura correcta es:

- heroes de gran presencia
- refugios encarnados
- eventos historicos clave
- lectura visual de escala, amenaza y poder
- ocupacion espacial mayor que 1x1 para entidades relevantes

No debe presentarse como implementado. Debe presentarse como:

- capa futura de encarnacion
- subordinada a la verdad sistemica 2D

---

## 7. Funcionalidad fundadora

### Flujo ideal

1. El usuario entra por la landing
2. Elige una `CivilizationSeed`
3. Nombra al constructor
4. Nombra el refugio fundador
5. Se crea:
   - heroe
   - refugio
   - mundo inicial
   - comunidad fundadora
   - cronica fundacional
6. El usuario entra al mundo y puede observar, habitar y expandir

### Inputs

- nombre del constructor
- nombre del refugio
- semilla elegida

### Outputs

- mundo inicial persistido
- refugio fundador
- comunidad fundadora
- heroe fundador
- memoria fundacional
- cronica inicial

### Criterio de exito

- una persona nueva entiende en menos de 5 minutos que no esta “haciendo un mapa”, sino fundando una civilizacion
- el flujo crea estado verificable
- la narrativa coincide con lo que el sistema realmente devuelve

### Estado actual

- **ya implementado de forma minima en la web**: la landing puede crear heroe, refugio y un primer mundo con semilla
- **aun parcial**: la evolucion de comunidad, heroes historicos y territorio sigue siendo ligera

---

## 8. Plan tecnico minimo

Orden correcto para una sola programadora:

1. consolidar el flujo fundador
2. enriquecer `Refuge`, `Community`, `Hero` e `HistoricalRecord` sin abrir un mega-engine
3. hacer que mas eventos del runtime alimenten memoria e historia
4. decidir mas adelante si alguna parte migra o conversa con Python
5. mantener la 3D como contrato de encarnacion futura

No hacer todavia:

- motor 3D
- multiagente universal
- fusion total Python/JS
- claims de civilizacion completa si siguen faltando subsistemas

---

## 9. Nicho inicial recomendado

El nicho inicial mas sensato no es “todo el mundo”.

El mejor encaje hoy es:

- fans de simulacion emergente
- storytellers sistemicos
- jugadores creativos que disfrutan fundar, observar y deformar sistemas
- devs curiosos por mundos vivos y memoria local

No intentaria venderlo de entrada como:

- sandbox infinito
- juego 3D
- plataforma total

---

## 10. Regla de foco

Cada cambio futuro debe responder a esta pregunta:

**Fortalece o distrae de “crear un refugio inicial y ver nacer una civilizacion”?**

Si distrae, se pospone.
