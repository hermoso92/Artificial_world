# Narrativa maestra — Artificial World

> Documento interno para redactar el paquete. Extrae del repositorio la historia técnica, comercial y filosófica que sostiene el relato.

---

## 1. Motor core (realidad técnica)

### Qué es

**Artificial World** es un motor de simulación 2D con agentes autónomos que perciben, recuerdan, puntúan opciones y actúan. El estado del mundo se guarda y se recupera. No es una demo visual: es un sistema persistente con memoria, relaciones y decisión por utilidad.

### Evidencia en el código

| Componente | Archivo | Qué demuestra |
|------------|---------|---------------|
| Memoria espacial y social | `systems/memory/memoria_entidad.py` | Recuerdos de recursos, refugios, entidades, eventos con capacidad configurable |
| Persistencia SQLite | `sistemas/sistema_persistencia.py` | Tabla `estado`, auto-guardado cada 20 ticks, carga al arrancar |
| Decisión por utilidad | `agentes/motor_decision.py` | 9+ modificadores (hambre, energía, riesgo, rasgo, memoria, relaciones, directivas) |
| Modo Sombra | `sistemas/gestor_modo_sombra.py` | Control manual por turnos, cola de comandos, modo AUTONOMO/DIRIGIDO/POSEIDO |
| Orchestrador | `nucleo/simulacion.py` | Carga estado guardado, tick loop, watchdog, persistencia |
| 13 acciones | `acciones/` | mover, comer, compartir, robar, huir, atacar, explorar, etc. |

### Tests que verifican

- `pruebas/test_integracion_produccion.py` — 200 ticks sin crash, guardar/cargar, modo sombra
- `pruebas/test_core.py` — 22 tests del motor, pesos, directivas, watchdog
- `pruebas/test_modo_sombra_completo.py` — 22 tests de control manual
- `pruebas/test_interacciones_sociales.py` — seguir, compartir, huir
- `pruebas/test_watchdog_integracion.py` — alertas de anomalías detectadas

### Mensaje clave

El valor no está en ser 2D. Está en ser **persistente, explicable, reproducible y barato de operar**. Sin LLMs, sin coste por decisión, sin latencia de API.

---

## 2. Demo web (capa de demostración)

### Qué es

Versión web con backend Node.js + Express y frontend React + Vite. Motor de simulación **independiente** en JavaScript. API REST y WebSocket. Pensado para demo sin instalación, compartir por URL, integración con módulos DobackSoft y HeroRefuge.

### Diferencias vs Python

| Aspecto | Python | Web |
|---------|--------|-----|
| Persistencia | SQLite | En memoria (salvo HeroRefuge) |
| Modo Sombra | Sí | No |
| Relaciones sociales | Sí | No |
| Memoria espacial | Sí | Sí (básica) |
| Interfaz | Pygame | Web |

### Mensaje clave

- Python = motor principal, producto completo.
- Web = demo, puerta de entrada, base para verticales.

---

## 3. Relación con DobackSoft

### Qué es DobackSoft

- **En este repo:** Módulo web integrado en el Hub: Fire Simulator, cupón fundadores, landing teaser. Backend con sesiones y rutas (mock para visor 2D).
- **DobackSoft v2 / StabilSafe V3:** Producto B2B completo de telemetría y estabilidad vehicular en **repositorio separado** (dobackv2). Puertos 9998/5174.

### Flujo objetivo (plan de integración)

- Subir archivos → procesar → ver ruta → jugar sobre ruta real.
- DobackSoft aporta: subida, rutas GPS, telemetría.
- Artificial World aporta: motor de simulación, gamificación, emergencias.

### Mensaje clave

- Artificial World = motor y filosofía.
- DobackSoft = vertical aplicada: entrenamiento, visualización de rutas, emergencias.

---

## 4. Nombres y consistencia

- **Artificial World** — Nombre principal del producto.
- **Artificial Word** — Usado en algunos docs (ej. ARTIFICIAL_WORD_ENGINE.md); puede confundir. Usar **Artificial World** en el relato.
- **MUNDO_ARTIFICIAL** — Nombre interno del proyecto en AGENTE_ENTRANTE.
- **DobackSoft** — Nombre separado; producto B2B de telemetría/estabilidad.

---

## 5. Pruebas técnicas cortas (para citar)

1. **Guardar y cargar mundo** — `sistema_persistencia.py` crea tabla `estado`, serializa mapa+entidades.
2. **Memoria por entidad** — `memoria_entidad.py`: recuerdos espaciales (20), sociales (15), eventos (20).
3. **Decisión trazable** — `motor_decision.py`: puntuación explícita por acción con modificadores.
4. **Control manual** — `gestor_modo_sombra.py`: modo turn-based, cola de comandos.
5. **Auditoría** — `backend/src/audit/eventStore.js`: cadena de hashes append-only.
6. **Tests** — 68+ tests pasando, runner único `run_tests_produccion.py`.

---

## 6. Lo que no prometer

- Conciencia artificial.
- IA generativa.
- Telemetría real integrada en este repo.
- Escala masiva probada.
- Latencia submilisegundo garantizada.
- Producto B2B cerrado en este repo.

---

## 7. Lo que sí prometer

- Motor de simulación 2D con memoria y persistencia.
- Decisiones trazables, control del diseñador.
- Demo web + ejecutable + núcleo Python completo.
- Aplicable a NPCs, entrenamiento, visualización.
- Producto demo integrado y vertical comercial separada.
