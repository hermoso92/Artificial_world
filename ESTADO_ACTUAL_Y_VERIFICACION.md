# MUNDO ARTIFICIAL — Estado actual y verificación

**Proyecto:** artificial word  
**Filosofía:** Simulación de vida artificial 2D con agentes autónomos que toman decisiones por utilidad, reaccionan al entorno y pueden ser controlados por el jugador.

---

## 1. Fase / hito actual

| Fase | Descripción | Estado |
|------|-------------|--------|
| **FASE 1** | Dependencias fijadas | ✅ Completada |
| **FASE 2** | Manejo de errores y mensajes al usuario | ✅ Completada |
| **FASE 3** | Empaquetado PyInstaller (.exe) | ✅ Completada |
| **FASE 4** | CI (tests en cada commit) | ✅ Completada |
| **FASE 5** | Validación de configuración | ✅ Completada |

**Hito actual:** Desarrollo funcional estable. 68+ tests pasando. Listo para uso interno; pendiente pulido para usuarios finales (README, onboarding).

---

## 2. ¿Qué está verificado que funciona?

### 2.1 Persistencia real ✅

- **Motor:** SQLite (`mundo_artificial.db`) + JSON como respaldo
- **Auto-guardado:** cada 20 ticks
- **Teclas:** `G` = guardar, `C` = cargar
- **Tests:** `test_guardar_cargar_estado` (JSON) y verificación manual SQLite pasan
- **Al arrancar:** Si existe `mundo_artificial.db` con estado guardado, se carga automáticamente

**Verificación ejecutada:** Guardar/cargar con SQLite preserva tick, nombres, posiciones y estado interno (hambre, energía, inventario).

### 2.2 Toma de decisiones (motor de decisión) ✅

- **Pipeline:** percibir → generar candidatas → puntuar (9 modificadores) → seleccionar mejor
- **Modificadores:** hambre, energía, riesgo, rasgo, anti-oscilación, memoria, relaciones, directivas, autonomía
- **Tests:** `test_motor_decide_accion`, `test_pesos_hambre_*`, `test_directiva_supervivencia_prioriza_comer`, `test_variedad_acciones_minima`, `test_hambre_mejora_con_fix` (6/7 entidades con hambre < 0.90 tras 100 ticks)

**Verificación ejecutada:** El motor elige acciones con score > 0, prioriza comer con hambre alta, prioriza descansar con energía baja, y aplica directivas externas.

### 2.3 Modo Sombra (jugador como Amiguisimo) ✅

- **Entidad controlable:** **Amiguisimo** (el gato)
- **Activación:** Pestaña ORDENES → botón "TOMAR CONTROL TOTAL"
- **Controles:** WASD/flechas = mover, ESPACIO = esperar turno
- **Flujo:** El mundo se congela hasta que Amiguisimo actúa; cada acción del jugador avanza 1 tick para todas las entidades
- **Tests:** `test_modo_sombra_comandos_ejecutan`, `test_modo_sombra_completo` (22 tests)

---

## 3. Posibles causas de "no funciona" en uso real

| Síntoma | Causa probable | Solución |
|---------|----------------|----------|
| Persistencia no carga al iniciar | `mundo_artificial.db` antiguo con nombre "Michi" | Borrar `mundo_artificial.db` y reiniciar |
| Entidades solo se mueven, no comen | Mapa vacío o recursos lejos | Verificar generador de mundo; el fix de memoria (bonus por acercarse a comida) está aplicado |
| Modo Sombra no avanza | No se ha pulsado WASD ni ESPACIO | El mundo espera input; hay que actuar para avanzar |
| Watchdog no muestra alertas | Pestaña WATCHDOG no seleccionada | Clic en la 5ª pestaña del panel (WATC) |
| Cierre brusco sin mensaje | Excepción no capturada | Revisar `simulacion.log` y `app_diagnostico.log` |

---

## 4. Roles: tú como jugador, yo como asistente

| Rol | Nombre / identidad | Función |
|-----|--------------------|---------|
| **Tú (jugador)** | Controlas **Amiguisimo** | En Modo Sombra: mueves al gato, esperas turnos, das directivas a otras entidades |
| **Yo (asistente IA)** | Composer (Cursor) | Ayudo a programar, depurar y documentar el proyecto; no soy una entidad del mundo |
| **Amiguisimo** | El gato en el mundo | Entidad jugable; cuando tomas control total, eres tú quien decide sus acciones |

**¿Cómo te llamas?**  
- En el juego: **Amiguisimo** es el personaje que controlas.  
- Yo, como asistente: soy **Composer**, el asistente de programación de Cursor.

---

## 5. Resumen de verificación técnica

```
Tests producción: 9 suites OK
- test_estructural: 13 OK
- test_core: 22 OK
- test_modo_sombra_completo: 22 OK
- test_interacciones_sociales: 13 OK
- test_bug_robar: 4 OK
- test_watchdog_fixes: 4 OK
- test_watchdog_integracion: 3 OK
- test_arranque_limpio: 1 OK
- test_integracion_produccion: 5 OK (incl. guardar/cargar, 200 ticks, hambre)
```

**Conclusión:** Persistencia y toma de decisiones están implementadas y cubiertas por tests. Si en tu entorno algo falla, es probable que sea por estado corrupto (DB antigua), configuración o flujo de uso (p. ej. no activar Modo Sombra correctamente). Revisar logs y borrar `mundo_artificial.db` suele resolver la mayoría de casos.
