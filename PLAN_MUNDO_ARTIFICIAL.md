# PLAN MUNDO_ARTIFICIAL

Documento maestro del proyecto. Fuente de verdad para arquitectura, implementación y progreso.

---

## A. Resumen ejecutivo

**MUNDO_ARTIFICIAL** es una simulación social multiagente en 2D donde entidades autónomas existen dentro de un espacio compartido, tienen estado interno, perciben el entorno, recuerdan experiencias, desarrollan relaciones, toman decisiones y generan comportamiento emergente.

No es un videojuego tradicional, ni un sandbox vacío, ni un proyecto centrado en LLM. Es un sistema artificial de comportamiento, interacción y organización emergente, diseñado desde el inicio para soportar una capa de intención externa interpretable sin destruir la agencia propia de cada entidad.

---

## B. Principios fundamentales

1. **Simulación autónoma**: Las entidades viven por sí mismas — perciben, se mueven, buscan recursos, descansan, recuerdan, reaccionan y deciden.
2. **Capa de intención externa interpretable**: Una entidad externa puede emitir intenciones (explorar, evitar, cooperar, volver al refugio, etc.), pero las entidades **interpretan**, no ejecutan ciegamente. Pueden aceptar, aplazar, reinterpretar o rechazar.
3. **Entidades heterogéneas**: No todo son agentes iguales. Existen entidades sociales y el gato como entidad no humana con función sistémica real.
4. **Gato como entidad diferenciada**: El gato no es decorativo ni un skin. Tiene lógica propia, prioridades distintas, patrones distintos y respuesta distinta a directivas.
5. **Modularidad**: Arquitectura desacoplada, preparada para crecer.
6. **Interpretabilidad**: Decisiones trazables, pesos explícitos, debug rico.
7. **Observabilidad obligatoria**: Logs, paneles, selección de entidad, métricas.

---

## C. Arquitectura general

### Capas del sistema

| Nivel | Contenido |
|------|-----------|
| A | Infraestructura del mundo: mapa, celdas, recursos, refugios, zonas |
| B | Entidades: base, sociales, gato |
| C | Estado interno: hambre, energía, salud, inventario |
| D | Inteligencia local: percepción, memoria, relaciones, decisión |
| E | Acción: ejecución, resultados, consecuencias |
| F | Coordinación global: ticks, simulación, eventos, regeneración, métricas |
| G | Observación externa: render, paneles, selección, directivas |

### Flujo del tick

1. Avanzar contador de tick
2. Regenerar recursos del mundo
3. Procesar entradas / directivas nuevas
4. Para cada entidad: actualizar estado → percibir → actualizar memoria → actualizar directivas → decidir acción → ejecutar → emitir eventos
5. Actualizar métricas y logs
6. Renderizar

---

## D. Arquitectura interna

### Estructura de carpetas

```
mundo_artificial/
  principal.py
  configuracion.py

  tipos/
    enums.py
    modelos.py

  nucleo/
    simulacion.py
    gestor_ticks.py
    bus_eventos.py
    contexto.py
    constantes.py

  mundo/
    mapa.py
    celda.py
    generador_mundo.py
    recurso.py
    refugio.py
    terreno.py
    zona.py

  entidades/
    entidad_base.py
    entidad_social.py
    entidad_gato.py
    fabrica_entidades.py

  agentes/
    estado_interno.py
    inventario.py
    rasgos.py
    memoria.py
    relaciones.py
    percepcion.py
    motor_decision.py
    directivas.py
    pesos_utilidad.py

  acciones/
    accion_base.py
    accion_mover.py
    accion_explorar.py
    accion_recoger_comida.py
    accion_recoger_material.py
    accion_comer.py
    accion_descansar.py
    accion_ir_refugio.py
    accion_compartir.py
    accion_robar.py
    accion_huir.py
    accion_evitar.py
    accion_seguir.py

  sistemas/
    sistema_logs.py
    sistema_metricas.py
    sistema_persistencia.py
    sistema_regeneracion.py

  interfaz/
    renderizador.py
    panel_principal.py
    panel_eventos.py
    panel_entidad.py
    manejador_entrada.py
    seleccion.py
    superposiciones.py
    camara.py

  utilidades/
    geometria.py
    azar.py
    conversores.py

  pruebas/
```

---

## E. Definición de entidades

### Entidades sociales
- Identidad, rasgo, estado interno, inventario, memoria, relaciones
- Capacidades: explorar, recoger, comer, descansar, refugios, compartir, robar, huir, evitar, seguir
- Rasgos: COOPERATIVO, NEUTRAL, AGRESIVO, EXPLORADOR, OPORTUNISTA

### El gato
- Entidad no humana autónoma con función sistémica real
- Rasgos: CURIOSO, APEGADO, INDEPENDIENTE, TERRITORIAL, OPORTUNISTA
- Valora más: curiosidad, confort, apego, independencia, territorialidad, seguridad local, novedad espacial
- No comparte exactamente las mismas tablas de peso que entidades sociales

---

## F. Motor de utilidad

Fórmula conceptual:

```
utilidad_final =
    utilidad_base
  + modificador_estado_interno
  + modificador_rasgo
  + modificador_memoria
  + modificador_relaciones
  + modificador_entorno
  + modificador_directivas
  + modificador_autonomia
```

Escala: base 0.0–0.40, modificadores ±0.35, final −1.0 a +1.50.

Pesos centralizados en `agentes/pesos_utilidad.py`.

---

## G. Sistema de directivas externas

Directivas no se ejecutan ciegamente. Modifican utilidades. Pueden ser aceptadas, aplazadas, reinterpretadas o rechazadas.

Mínimas MVP: `EXPLORAR_ZONA`, `VOLVER_A_REFUGIO`.

Preparadas: `EVITAR_ENTIDAD`, `COOPERAR_CON_ENTIDAD`, `SEGUIR_ENTIDAD`, `PRIORIZAR_SUPERVIVENCIA`, `RECOGER_EN_ZONA`, `PROTEGER_ZONA`, `ACERCARSE_A_ENTIDAD`, `INVESTIGAR_OBJETIVO`.

---

## H. Alcance del MVP

### MVP serio (no mínimo ridículo)

- Mundo 2D visible, recursos, refugios
- 3–5 entidades sociales + gato
- Hambre, energía, inventario
- Memoria espacial mínima
- Relaciones mínimas
- Motor utility-based
- Al menos una directiva funcional
- Trazabilidad, panel de entidad, logs

### NO entra todavía

- LLM, RL, 3D
- Combate complejo, economía compleja
- UI sofisticada innecesaria

---

## I. Roadmap por fases

| Fase | Nombre | Objetivo |
|------|--------|----------|
| 0 | Estructura base | Carpetas, .md maestro, config, enums, modelos, clases base vacías |
| 1 | Mundo visible | Mapa, celdas, recursos, refugios, render básico, loop |
| 2 | Entidades | Entidad base, sociales, gato, fábrica, aparición y movimiento |
| 3 | Supervivencia | Hambre, energía, inventario, recoger, comer, descansar, refugios |
| 4 | Inteligencia local | Percepción, memoria espacial, motor utility-based, rasgos |
| 5 | Relaciones | Relaciones mínimas, miedo, hostilidad, confianza, impacto en evitar/seguir |
| 6 | Directivas externas | Estructura, integración en utilidades, aceptación/aplazamiento/rechazo |
| 7 | Observabilidad seria | Paneles, selección, logs enriquecidos, métricas |

---

## J. Checklist técnico por subfases

### Fase 0 — Estructura base
- [x] Crear estructura de carpetas
- [x] Crear `configuracion.py`
- [x] Crear `tipos/enums.py`
- [x] Crear `tipos/modelos.py`
- [x] Crear clases base vacías en todos los módulos
- [x] Crear `principal.py` y `requirements.txt`
- [x] Crear todos los `__init__.py`

### Fase 1 — Mundo visible
- [x] Implementar `Celda`, `Recurso`, `Refugio`
- [x] Implementar `Mapa` y `GeneradorMundo`
- [x] Implementar `Renderizador` básico
- [x] Implementar loop de simulación
- [x] Crear entidades iniciales y mostrarlas

### Fase 2 — Entidades
- [x] Implementar `EntidadBase` completa
- [x] Implementar `EntidadSocial` y `EntidadGato`
- [x] Implementar `FabricaEntidades`
- [x] Estado interno, movimiento real, identidad básica

### Fase 3 — Supervivencia
- [x] Hambre, energía, inventario
- [x] Acciones: recoger_comida, recoger_material, comer, descansar, ir_refugio

### Fase 4 — Inteligencia local
- [x] SistemaPercepcion
- [x] MemoriaEntidad
- [x] MotorDecision utility-based
- [x] Diferencias por rasgo

### Fase 5 — Relaciones
- [ ] GestorRelaciones
- [ ] Actualización por eventos
- [ ] Impacto en evitar, seguir, compartir, robar

### Fase 6 — Directivas externas
- [ ] GestorDirectivas
- [ ] Integración en utilidades
- [ ] Aceptación / aplazamiento / rechazo

### Fase 7 — Observabilidad
- [ ] Panel de entidad
- [ ] Panel de eventos
- [ ] Selección de entidad
- [ ] Logs enriquecidos
- [ ] SistemaMetricas

---

## K. Estado del progreso

### Completado
- Fase 0: Estructura base (carpetas, config, enums, modelos, clases base, principal.py, requirements.txt)
- Fase 1: Mundo visible (Renderizador Pygame, loop principal, mapa, recursos, refugios, entidades)
- Fase 2: Entidades completas (flujo percibir→memoria→directivas→decidir→ejecutar, AccionMover real, motor utility-based)
- Fase 3: Supervivencia (hambre, energía, inventario, recoger_comida/material, comer, descansar, ir_refugio)
- Fase 4: Inteligencia local (modificadores por rasgo social/gato, memoria para movimiento hacia recursos/refugios, riesgo_percibido)

### Extras implementados (post-auditoría)
- Panel de control avanzado (pestañas Control/Órdenes/Entidades/Archivo)
- Control de velocidad (0.25x–4x), modos de visualización (calor energía/hambre)
- Sistema de órdenes a entidades (directivas desde UI)
- Persistencia JSON (guardar/cargar estado)
- Anti-oscilación (penalizar volver a celda anterior)
- Nombres y acciones visibles sobre entidades

### Parcial / pendiente de completar
- PanelPrincipal, PanelEventos, PanelEntidad: esqueletos (sustituidos por PanelControl)

### Cerrado (gaps fases 1–4)
- SistemaRegeneracion: implementado — regenera comida y material cada N ticks
- SistemaMetricas: registrar_evento y obtener_resumen implementados
- Acciones emiten EventoSistema: comer, recoger_comida, recoger_material, descansar, ir_refugio, huir, evitar
- AccionIrRefugio: posicion_anterior añadido
- AccionHuir, AccionEvitar, AccionExplorar: implementadas con movimiento real; motor las genera según riesgo/energía/hambre

### Pendiente
- Fases 5–7

### Bloqueos
- Ninguno

### Próximo paso
- Fase 5: Relaciones (GestorRelaciones, impacto en evitar, seguir, compartir, robar)

### Documentación
- Ver `AUDITORIA_FASES_1-4.md` para revisión detallada de lo implementado y lo faltante.

---

## L. Reglas que no pueden romperse

1. No sacrificar arquitectura por velocidad
2. No convertir entidades en marionetas
3. No olvidar que el gato debe comportarse distinto
4. No hacer que las directivas dominen por completo
5. No meter sistemas prematuros (LLM, RL, 3D)
6. No hacer memoria o relaciones decorativas
7. No dejar la trazabilidad para más tarde

---

## M. Tecnología obligatoria

- **Lenguaje**: Python 3.11+
- **Visualización**: Pygame
- **Mundo**: Grid 2D
- **Simulación**: Ticks discretos
- **Aplicación**: Local, no web
- **No usar**: Unity, Godot, Unreal, LLM, RL, embeddings, bases vectoriales, frontend web, microservicios
