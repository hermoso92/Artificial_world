# Documento 1 — Qué has construido realmente

**Dossier ejecutivo para dirección, familia y público no técnico**

---

## Resumen en 30 segundos

**Artificial World** es un motor de mundos virtuales 2D donde los personajes piensan, recuerdan y se relacionan. No usa ChatGPT ni APIs de pago: cada decisión se calcula en tu ordenador, es predecible y no cuesta nada por uso. El mundo se guarda y se recupera. Es como un emulador de mundos artificiales: creas un entorno, pones reglas, y los personajes viven en él con memoria y relaciones que cambian con el tiempo.

---

## El problema que resuelve

Muchos videojuegos y simulaciones tienen personajes que no recuerdan nada. Dicen lo mismo siempre, no evolucionan, no reaccionan a lo que hiciste. Las alternativas con IA generativa (ChatGPT, etc.) cuestan dinero por cada mensaje, tienen latencia y son impredecibles. Para mundos con muchos personajes, no escalan.

**Artificial World** ofrece otra vía: IA por utilidad, memoria espacial y social, relaciones que cambian con cada interacción. Determinista, trazable y gratuito.

---

## Analogía para cualquiera

Imagina un pueblo pequeño en pantalla. Cada vecino tiene su casa, su huerto y sus recuerdos.

- Si ayudas a uno, te guarda confianza. La próxima vez te tratará mejor.
- Si le robas, te tendrá miedo. Huirá cuando te vea.
- Si no comes, te debilitas. Si no descansas, te cansas.

**Artificial World es ese pueblo**, pero controlado por reglas que el ordenador ejecuta. Los vecinos no son aleatorios: cada acción tiene una razón (hambre, miedo, amistad). Y el pueblo se guarda: puedes cerrar el programa, volver más tarde, y todo sigue donde lo dejaste.

---

## Qué hace de verdad (evidencia técnica)

| Característica | Qué significa | Dónde está en el código |
|----------------|---------------|-------------------------|
| **13 acciones** | Mover, comer, compartir, robar, huir, atacar, explorar, descansar, ir al refugio... | `acciones/` |
| **Memoria** | Cada personaje recuerda recursos, refugios y entidades vistas | `systems/memory/memoria_entidad.py` |
| **Relaciones** | Confianza, miedo, hostilidad que evolucionan con cada interacción | `agentes/relaciones.py` |
| **Persistencia** | El mundo se guarda en SQLite y se carga al reiniciar | `sistemas/sistema_persistencia.py` |
| **Modo Sombra** | Puedes tomar el control de un personaje y jugar por turnos | `sistemas/gestor_modo_sombra.py` |
| **Decisión trazable** | Cada elección tiene un motivo calculable (hambre, energía, relaciones) | `agentes/motor_decision.py` |

---

## Modelos locales (Ollama)

El motor de simulación **no usa LLMs**: cada decisión es local, calculada y gratuita. El módulo HeroRefuge (compañero IA en la web) puede usar **Ollama** opcional para conversación; si no está instalado, funciona con respuestas mock. El núcleo de agentes funciona siempre sin modelos externos.

---

## Flujos verificados

1. **Simulación** — Cada tick, cada personaje percibe su entorno, actualiza su memoria, puntúa acciones posibles y ejecuta la mejor. Sin LLMs.
2. **Guardar y cargar** — El estado del mapa, las entidades y sus recuerdos se guardan automáticamente cada 20 ticks en `mundo_artificial.db`.
3. **Modo Sombra** — El usuario puede dar órdenes a un personaje o controlarlo directamente con teclado (WASD). El mundo avanza solo cuando ese personaje actúa.
4. **Watchdog** — El sistema detecta anomalías (personaje atrapado, hambre crítica sin respuesta) y las registra.

---

## Pruebas que lo demuestran

- **68+ tests** pasando, incluidos tests de integración que simulan 200 ticks, guardar/cargar y modo sombra.
- **Runner único** `run_tests_produccion.py` ejecuta todas las suites y genera un reporte.
- **CI** — Los tests se ejecutan en cada push/PR.

---

## Cómo ejecutarlo

| Modo | Comando | Para quién |
|------|---------|------------|
| **Demo web** | `.\scripts\iniciar_fullstack.ps1` | Probar sin instalar |
| **Versión completa** | `python principal.py` | Motor completo, Modo Sombra |
| **Ejecutable Windows** | `.\build_exe.ps1` → `dist\MundoArtificial.exe` | Usuarios sin Python |

---

## Relación con DobackSoft

**DobackSoft** es una vertical aplicada: simulación de emergencias, visualización de rutas y telemetría vehicular. En este proyecto aparece como módulo demo integrado en la web. El producto B2B completo de estabilidad y telemetría vive en un repositorio separado (StabilSafe V3).

**Artificial World** aporta el motor y la filosofía de simulación. **DobackSoft** muestra cómo esa filosofía puede aplicarse a entrenamiento, rutas y emergencias.

---

## Utilidad para la empresa

- **Producto demostrable** — Ejecutable, demo web, documentación.
- **Motor reutilizable** — Para NPCs, simulaciones, formación.
- **Coste cero por decisión** — No depende de APIs de pago.
- **Trazabilidad** — Cada decisión es explicable (útil para auditoría, educación, investigación).

---

## Frase de cierre

> **No persigas la IA. Construye un mundo que la necesite.**

Artificial World no compite con ChatGPT. Ofrece un camino distinto: mundos persistentes, personajes con memoria y decisiones que puedes entender y controlar.
