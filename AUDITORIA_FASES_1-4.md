# Auditoría Fases 1–4 — MUNDO_ARTIFICIAL

Revisión desde cero del estado de implementación según `PLAN_MUNDO_ARTIFICIAL.md`.

---

## Fase 1 — Mundo visible

### Objetivo
Mapa, celdas, recursos, refugios, render básico, loop de simulación.

### Checklist del plan

| Ítem | Estado | Detalle |
|------|--------|---------|
| Implementar `Celda`, `Recurso`, `Refugio` | ✅ | `mundo/celda.py`, `recurso.py`, `refugio.py` completos |
| Implementar `Mapa` y `GeneradorMundo` | ✅ | `mapa.py` con grid, vecinos, recursos, refugios, entidades. `generador_mundo.py` con distribución |
| Implementar `Renderizador` básico | ✅ | Pygame, mapa, recursos, refugios, entidades, barra inferior |
| Implementar loop de simulación | ✅ | `nucleo/simulacion.py` con bucle principal |
| Crear entidades iniciales y mostrarlas | ✅ | `FabricaEntidades` + `crear_entidades_iniciales` |

### Extras implementados (no en plan original)
- Panel de control lateral con pestañas
- Modos de visualización (normal, calor energía, calor hambre)
- Nombres y acciones visibles sobre entidades

### Pendiente / mejoras
- `mundo/terreno.py`: solo enum, no se usa `AGUA` ni `OBSTACULO`
- `mundo/zona.py`: dataclass vacío, `GeneradorMundo.crear_zonas()` devuelve `[]`

### Cerrado (post-plan)
- `SistemaRegeneracion`: implementado — regenera comida y material cada N ticks en celdas vacías aleatorias

---

## Fase 2 — Entidades

### Objetivo
Entidad base, sociales, gato, fábrica, aparición y movimiento.

### Checklist del plan

| Ítem | Estado | Detalle |
|------|--------|---------|
| Implementar `EntidadBase` completa | ✅ | percibir, memoria, directivas, decidir, ejecutar |
| Implementar `EntidadSocial` y `EntidadGato` | ✅ | Rasgos, relaciones (social), lógica diferenciada (gato) |
| Implementar `FabricaEntidades` | ✅ | Crea 6 sociales + gato, coloca en mapa |
| Estado interno, movimiento real, identidad básica | ✅ | `EstadoInterno`, `Inventario`, `AccionMover` con movimiento real |

### Extras implementados
- `posicion_anterior` para anti-oscilación
- Penalización por volver a celda anterior en motor de decisión

### Pendiente / mejoras
- `AccionCompartir`, `AccionRobar`, `AccionSeguir`: esqueletos con `NO_APLICA`

### Cerrado (post-plan)
- `AccionExplorar`: implementado — movimiento a celda vecina menos visitada en memoria; motor la genera cuando energía > 0.5 y hambre < 0.4
- `AccionHuir`, `AccionEvitar`: implementados — movimiento real alejándose de amenaza; motor las genera cuando riesgo_percibido > 0.3

---

## Fase 3 — Supervivencia

### Objetivo
Hambre, energía, inventario, recoger, comer, descansar, refugios.

### Checklist del plan

| Ítem | Estado | Detalle |
|------|--------|---------|
| Hambre, energía, inventario | ✅ | `EstadoInterno` con hambre/energía/salud, `Inventario` comida/material |
| Acciones: recoger_comida, recoger_material | ✅ | Retiran recurso, añaden al inventario |
| Acciones: comer, descansar, ir_refugio | ✅ | Comer reduce hambre; descansar/refugio recuperan energía |

### Integración en motor
- `MotorDecision` genera y puntúa: recoger_comida, recoger_material, comer, descansar, ir_refugio, mover
- Modificadores por hambre y energía en `pesos_utilidad.py`
- Descansar penalizado cuando energía ≥ 0.95

### Cerrado (post-plan)
- `AccionIrRefugio`: actualiza `posicion_anterior` antes de mover (igual que `AccionMover`)
- Regeneración de recursos: implementada en `SistemaRegeneracion`

---

## Fase 4 — Inteligencia local

### Objetivo
Percepción, memoria espacial, motor utility-based, rasgos.

### Checklist del plan

| Ítem | Estado | Detalle |
|------|--------|---------|
| SistemaPercepcion | ✅ | recursos, refugios, entidades en radio, vecinos, amenaza_local |
| MemoriaEntidad | ✅ | recuerdos espaciales (recursos, refugios), sociales, eventos |
| MotorDecision utility-based | ✅ | generar, puntuar, seleccionar; modificadores hambre, energía, riesgo, rasgo, memoria, directivas, autonomía |
| Diferencias por rasgo | ✅ | `rasgos.py` con tablas social y gato; `obtener_modificador_rasgo_entidad` |

### Modificadores implementados
- **Hambre**: comer, recoger_comida, mover/explorar
- **Energía**: descansar, ir_refugio, explorar
- **Riesgo**: huir, evitar, ir_refugio vs mover, explorar, compartir
- **Rasgo**: tablas completas social (5 rasgos) y gato (5 rasgos)
- **Memoria**: bonus mover hacia comida/refugio según recuerdos
- **Directivas**: PRIORIZAR_SUPERVIVENCIA, VOLVER_A_REFUGIO, EXPLORAR_ZONA, RECOGER_EN_ZONA
- **Autonomía**: penaliza mover/explorar cuando hambre/energía/riesgo críticos
- **Anti-oscilación**: penaliza volver a celda anterior

### Pendiente / mejoras
- `MemoriaEntidad.degradar_memoria`: vacío
- `MemoriaEntidad.limpiar_memoria_antigua`: usa `tick_caducidad` que no se establece al registrar
- `riesgo_percibido`: se usa en percepción (amenaza) pero relaciones iniciales son 0

---

## Componentes transversales

### Sistemas

| Sistema | Estado | Detalle |
|---------|--------|---------|
| SistemaLogs | ✅ | registrar_evento, registrar_debug_decision, obtener_eventos_recientes |
| SistemaMetricas | ✅ | registrar_evento con contadores por entidad y tipo; obtener_resumen |
| SistemaRegeneracion | ✅ | actualizar regenera comida y material cada N ticks |
| SistemaPersistencia | ✅ | guardar/cargar JSON (mapa, entidades, tick) |
| BusEventos | ✅ | emitir, obtener_eventos_pendientes |

### Acciones no usadas por el motor
- `AccionCompartir`, `AccionRobar`, `AccionSeguir`: esqueletos

### Cerrado (post-plan)
- `AccionExplorar`, `AccionHuir`, `AccionEvitar`: implementadas y generadas por el motor

### Interfaz

| Componente | Estado | Detalle |
|------------|--------|---------|
| Renderizador | ✅ | Mapa, recursos, refugios, entidades, modos, panel |
| PanelControl | ✅ | Pestañas Control/Órdenes/Entidades/Archivo, velocidad, órdenes |
| PanelPrincipal | ⚠️ | Clase vacía |
| PanelEventos | ⚠️ | Clase vacía |
| PanelEntidad | ⚠️ | Clase vacía |
| ManejadorEntrada | ⚠️ | Clase vacía (entrada en `simulacion.procesar_entrada`) |
| SistemaSeleccion | ⚠️ | Solo `id_entidad_seleccionada`; selección en `EstadoPanel` |
| Camara, Superposiciones | ❓ | No revisados |

### Directivas (preparación Fase 6)
- `GestorDirectivas`: agregar, filtrar expiradas, obtener activas, evaluar aceptación
- Modificadores por directivas en motor
- Panel permite enviar órdenes (PRIORIZAR_SUPERVIVENCIA, VOLVER_A_REFUGIO, etc.)

### Relaciones (preparación Fase 5)
- `GestorRelaciones`: estructura completa (confianza, miedo, hostilidad, utilidad)
- `EntidadSocial` tiene relaciones
- Percepción usa relaciones para `amenaza_local`
- Motor: `aplicar_modificadores_por_relaciones` devuelve 0 (sin impacto en evitar/seguir)

---

## Resumen ejecutivo

### Hecho
- Fases 1–4 funcionales: mundo visible, entidades, supervivencia, inteligencia local
- Flujo completo: percibir → memoria → directivas → decidir → ejecutar
- Panel de control con velocidad, modos, órdenes, persistencia
- Anti-oscilación, penalización de descansar con energía llena

### Parcial
- PanelPrincipal, PanelEventos, PanelEntidad: vacíos (sustituidos por PanelControl)

### Cerrado (post-plan)
- Regeneración de recursos: implementada en SistemaRegeneracion
- Métricas: registrar_evento y obtener_resumen implementados
- Emisión de eventos: comer, recoger_comida, recoger_material, descansar, ir_refugio, huir, evitar emiten EventoSistema

### Falta (según plan)
- Fase 5: Relaciones con impacto en evitar/seguir/compartir/robar
- Fase 6: Directivas con aceptación/aplazamiento/rechazo completo
- Fase 7: Observabilidad (paneles, selección, logs enriquecidos)

---

## Recomendaciones

1. ~~**Regeneración**~~: ✅ Implementado.
2. ~~**Eventos**~~: ✅ Acciones emiten EventoSistema.
3. ~~**Métricas**~~: ✅ registrar_evento implementado.
4. ~~**AccionIrRefugio**~~: ✅ posicion_anterior añadido.
5. **Memoria**: Asignar `tick_caducidad` al registrar recuerdos o ajustar `limpiar_memoria_antigua`.
6. **Documentar**: Mantener este auditoría alineado con el plan al avanzar fases.
