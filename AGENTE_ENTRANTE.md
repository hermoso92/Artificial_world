# MUNDO_ARTIFICIAL — Documentación completa para agente entrante

**Estado:** Activo, en desarrollo iterativo  
**Última sesión relevante:** [Watchdog + Shadow Mode](fcdee6f4-8864-4082-9b16-b90e18a2aac8)  
**Proyecto path:** `c:\Users\Cosigein SL\Desktop\artificial word`

---

## 1. QUÉ ES EL PROYECTO

**MUNDO_ARTIFICIAL** es una simulación de vida artificial 2D con agentes autónomos sobre un grid. Las entidades viven en el mundo, toman decisiones basadas en utilidad (hambre, energía, rasgos, directivas externas) y reaccionan al entorno.

El usuario puede:
- Observar la simulación en tiempo real (pygame)
- Dar órdenes a entidades mediante directivas
- Tomar control manual total de una entidad ("Modo Sombra" — juego por turnos)
- Ver alertas del sistema watchdog en tiempo real
- Guardar/cargar el estado en SQLite

---

## 2. ESTRUCTURA DE CARPETAS (completa y real)

```
artificial word/
├── principal.py              ← punto de entrada
├── configuracion.py          ← todos los parámetros (dataclass)
├── debug_runner.py           ← runner headless para tests manuales
├── diagnostico.py            ← herramienta de diagnóstico
├── diagnostico_utilidades.py
├── analizar_debug.py
├── verificar_estado.py
├── test_directivas.py
│
├── acciones/                 ← 12 acciones independientes
│   ├── accion_base.py        ← clase abstracta base
│   ├── accion_mover.py
│   ├── accion_explorar.py
│   ├── accion_comer.py
│   ├── accion_descansar.py
│   ├── accion_ir_refugio.py
│   ├── accion_recoger_comida.py
│   ├── accion_recoger_material.py
│   ├── accion_huir.py
│   ├── accion_evitar.py
│   ├── accion_compartir.py   ← esqueleto (ejecutar devuelve NO_APLICA)
│   ├── accion_robar.py       ← es_viable() OK; ejecutar() esqueleto
│   └── accion_seguir.py      ← esqueleto (ejecutar devuelve NO_APLICA)
│
├── agentes/
│   ├── estado_interno.py     ← hambre, energía, salud, inventario, accion_actual
│   ├── inventario.py         ← comida y material, métodos agregar/quitar/tiene
│   ├── memoria.py            ← recuerdos espaciales (cap.20) y sociales (cap.15)
│   ├── motor_decision.py     ← núcleo IA: generar → puntuar → seleccionar
│   ├── pesos_utilidad.py     ← tabla de pesos base + modificadores por estado
│   ├── rasgos.py             ← modificadores por rasgo de personalidad
│   ├── directivas.py         ← GestorDirectivas: cola de directivas externas
│   ├── percepcion.py         ← SistemaPercepcion: construye PercepcionLocal
│   └── relaciones.py         ← GestorRelaciones: confianza/miedo/hostilidad
│
├── entidades/
│   ├── entidad_base.py       ← clase base: ciclo completo + control_total
│   ├── entidad_social.py     ← hereda base + rasgo social + relaciones
│   ├── entidad_gato.py       ← hereda base + rasgo gato
│   └── fabrica_entidades.py  ← crea entidades iniciales (Ana→Félix + Amiguisimo)
│
├── mundo/
│   ├── mapa.py               ← grid 2D: celdas, colocación, búsqueda en radio
│   ├── celda.py              ← unidad espacial: recurso + refugio + entidades
│   ├── generador_mundo.py    ← genera mapa y distribuye recursos/refugios
│   ├── recurso.py            ← Recurso: tipo, cantidad, consumir()
│   ├── refugio.py            ← Refugio: bonus descanso 0.08
│   ├── terreno.py            ← TipoTerreno: NORMAL, AGUA, OBSTÁCULO (todo NORMAL)
│   └── zona.py               ← Zona: no usada activamente
│
├── nucleo/
│   ├── simulacion.py         ← ORQUESTADOR CENTRAL (ver sección 5)
│   ├── bus_eventos.py        ← cola desacoplada de EventoSistema
│   ├── gestor_ticks.py       ← contador tick_actual, avanzar(), reiniciar()
│   ├── contexto.py           ← ContextoDecision + ContextoSimulacion (dataclasses)
│   └── constantes.py         ← DEFAULT_ANCHO_MAPA=60, DEFAULT_FPS=30 (sin uso activo)
│
├── sistemas/
│   ├── sistema_logs.py       ← SistemaLogs: buffer UI + logger archivo simulacion.log
│   ├── sistema_metricas.py   ← contadores por entidad y globales
│   ├── sistema_regeneracion.py ← repone recursos cada 30 ticks
│   ├── sistema_persistencia.py ← SQLite (mundo_artificial.db) + JSON; auto-guardado 20t
│   └── sistema_watchdog.py   ← monitor de anomalías (ver sección 7)
│
├── interfaz/
│   ├── renderizador.py       ← dibuja mapa, entidades, barra inferior, panel
│   ├── panel_control.py      ← 6 pestañas: CONTROL, ORDENES, ENTIDADES, EVENTOS, WATCHDOG, ARCHIVO
│   ├── estado_panel.py       ← EstadoPanel dataclass: estado de toda la UI
│   ├── camara.py
│   ├── manejador_entrada.py
│   ├── panel_entidad.py
│   ├── panel_eventos.py
│   ├── panel_principal.py
│   ├── seleccion.py
│   └── superposiciones.py
│
├── tipos/
│   ├── enums.py              ← TipoEntidad, TipoRecurso, TipoAccion (12), TipoDirectiva (12), etc.
│   └── modelos.py            ← Posicion, DirectivaExterna, PercepcionLocal, AccionPuntuada, etc.
│
├── utilidades/
│   ├── azar.py               ← obtener_semilla(cfg)
│   ├── geometria.py          ← distancia_manhattan wrapper
│   └── conversores.py        ← vacío
│
├── pruebas/
│   ├── test_core.py          ← 22 tests del motor, pesos, directivas, watchdog
│   ├── test_modo_sombra.py   ← 7 tests del modo sombra (turnos)
│   ├── test_bug_robar.py     ← regresión: AccionRobar.es_viable sin víctima
│   ├── test_watchdog_fixes.py ← 4 tests de los 3 fixes del watchdog (puntos ciegos)
│   └── test_arranque_limpio.py ← arranque sin DB + 10 ticks sin excepción
│
├── simulacion.log            ← log principal (append, toda la historia)
├── app_diagnostico.log       ← log de arranque de principal.py
├── amiguisimo_debug.log      ← log de acciones manuales de Amiguisimo en modo sombra
└── mundo_artificial.db       ← SQLite de persistencia (puede no existir)
```

---

## 3. ENTIDADES DEL MUNDO

### Entidades iniciales (creadas por `FabricaEntidades`)
| Nombre | Tipo | Rasgo |
|---|---|---|
| Ana | EntidadSocial | COOPERATIVO |
| Bruno | EntidadSocial | NEUTRAL |
| Clara | EntidadSocial | AGRESIVO |
| David | EntidadSocial | EXPLORADOR |
| Eva | EntidadSocial | OPORTUNISTA |
| Félix | EntidadSocial | COOPERATIVO |
| **Amiguisimo** | **EntidadGato** | **CURIOSO** |

**Importante:** "Amiguisimo" es el gato, entidad controlable por el usuario. Si la DB SQLite contiene un estado guardado con el nombre anterior ("Michi"), el nuevo nombre no aparecerá. Solución: borrar `mundo_artificial.db`.

### Estado interno de cada entidad
- `hambre ∈ [0,1]` — sube `+0.02` por tick; hambre crítica ≥ 0.90
- `energía ∈ [0,1]` — baja `−0.03` al moverse; crítica ≤ 0.15
- `salud ∈ [0,1]`
- `riesgo_percibido ∈ [0,1]`
- `inventario` — comida y material
- `accion_actual: TipoAccion | None`

---

## 4. MOTOR DE DECISIÓN (nucleo de la IA)

### Pipeline por tick (en `simulacion.actualizar_entidad`)
```
1. actualizar_estado_interno  → hambre sube
2. percibir_entorno           → PercepcionLocal (radio=5): recursos, refugios, entidades, vecinos
3. actualizar_memoria         → registra visto, limpia expirado
4. actualizar_directivas      → filtra expiradas
5. decidir_accion             → MotorDecision.decidir()
   a. generar_acciones_candidatas → filtra por es_viable()
   b. puntuar_acciones         → 9 modificadores (ver abajo)
   c. seleccionar_mejor_accion → max(puntuacion_final)
6. ejecutar_accion            → modifica mundo, emite evento al bus
```

### 9 modificadores de utilidad (en `motor_decision.puntuar_acciones`)
1. **Pesos base** — tabla en `pesos_utilidad.py` (comer=0.65, explorar=0.50, mover=0.30...)
2. **Hambre** — hambre alta: bonus comer/recoger, penaliza explorar/descansar
3. **Energía** — energía baja: bonus descansar/ir_refugio, penaliza mover/explorar
4. **Riesgo** — riesgo alto: bonus huir/evitar/ir_refugio, penaliza explorar/mover
5. **Rasgo** — EXPLORADOR: +0.35 mover/explorar; AGRESIVO: +0.30 robar; COOPERATIVO: +0.25 compartir...
6. **Anti-oscilación** — penaliza −0.40 volver a posicion_anterior
7. **Memoria** — bonus si hay recurso recordado en zona actual
8. **Relaciones** — afecta acciones sociales (compartir/robar/huir)
9. **Directivas externas** — IR_A_POSICION: +1.5×intensidad al movimiento que acerca; QUEDARSE_AQUI: −2.0×intensidad al mover/explorar
10. **Autonomía** — hambre >0.85 penaliza mover/explorar; energía <0.15 penaliza mover/robar

### Directivas disponibles (`TipoDirectiva`)
```
EXPLORAR_ZONA, VOLVER_A_REFUGIO, IR_A_POSICION, QUEDARSE_AQUI,
PRIORIZAR_SUPERVIVENCIA, EVITAR_ZONA, BUSCAR_ALIADO,
PROTEGER_ZONA, LIDERAR_GRUPO, SEGUIR_ENTIDAD,
DESCANSAR_INMEDIATO, RECOGER_RECURSOS
```

---

## 5. ORQUESTADOR: `nucleo/simulacion.py`

### Bucle principal (`ejecutar_bucle_principal`)
```python
inicializar()
cargar_estado_si_existe() o crear_mundo() + crear_entidades_iniciales()

while ejecutando:
    try:
        ejecutando = procesar_entrada()   # pygame events
        
        if modo_sombra y hay_entidad_con_control_total:
            # MODO SOMBRA (turn-based): solo avanza si Amiguisimo actúa
            if sombra_tiene_accion_pendiente:
                _ejecutar_tick_completo()
            # else: renderiza pero NO avanza ticks (mundo congelado)
        
        elif no pausado:
            # MODO NORMAL: velocidad configurable
            acum_velocidad += velocidad
            while acum_velocidad >= 1.0:
                _ejecutar_tick_completo()
                acum_velocidad -= 1.0
        
        elif paso_manual:
            _ejecutar_tick_completo()
        
        renderizar()
        reloj.tick(fps)
    
    except Exception:
        logger.critical(...)  # SIEMPRE se loguea; nunca se pierde
        raise
```

### `_ejecutar_tick_completo`
```python
gestor_ticks.avanzar()
for entidad in entidades:
    actualizar_entidad(entidad)
sistema_watchdog.registrar_tick(tick, entidades)
actualizar_mundo()      # sistema_regeneracion
despachar_eventos()     # bus → logs + métricas
_escribir_debug_si_activo()
sistema_persistencia.auto_guardar_si_procede(self)
```

### Controles de teclado en el bucle
| Tecla | Acción |
|---|---|
| `P` | Pausa/reanuda |
| `N` | Tick manual (mientras pausado) |
| `V` | Cicla velocidad (0.05×, 0.25×, 0.5×, 1×, 2×, 4×) |
| `M` | Cicla modo visualización |
| `G` | Guardar estado |
| `C` | Cargar estado |
| `WASD / flechas` | Mover entidad en control_total (Modo Sombra) |
| `ESPACIO` | Esperar turno (Modo Sombra) |
| `ESC` | Cancelar input de coordenadas |

---

## 6. MODO SOMBRA (control total por turnos)

### Qué es
Turn-based mode donde el jugador controla **Amiguisimo** directamente. El mundo se **congela** hasta que Amiguisimo actúa. Cuando actúa, todas las entidades avanzan exactamente 1 tick.

### Cómo activarlo
En la pestaña "ORDENES" del panel → botón "TOMAR CONTROL TOTAL" (se pone naranja-rojo).  
Al activarse: `control_total=True` en la entidad, `modo_sombra=True` en `EstadoPanel`.

### Flags relevantes en `entidad_base.py`
```python
control_total: bool = False
control_total_pendiente: Posicion | None = None  # destino de movimiento manual
sombra_accion_pendiente: str | None = None       # "esperar" cuando se pulsa ESPACIO
```

### Flujo en `decidir_accion` cuando `control_total=True`
```python
if sombra_accion_pendiente == "esperar":
    return AccionDescansar(motivo="SOMBRA_ESPERAR")
elif control_total_pendiente is not None:
    return AccionMover(destino=control_total_pendiente, motivo="SOMBRA_MOVER")
else:
    return None  # mundo congelado, espera input del jugador
```

### Visual
- Amiguisimo: doble anillo naranja pulsante + prefijo `[TU]` + nombre naranja + label "CTRL"
- Barra inferior: fondo naranja con "TU TURNO – WASD=mover ESPACIO=esperar"

---

## 7. SISTEMA WATCHDOG (`sistemas/sistema_watchdog.py`)

### Propósito
Detecta automáticamente problemas en la simulación. Se ejecuta **cada 10 ticks**. Escribe al logger `"mundo_artificial.watchdog"` (hereda del padre `"mundo_artificial"` → `simulacion.log`).

### Detectores activos
| Código | Nivel | Condición |
|---|---|---|
| `TRAMPA_POSICION` | ERROR | misma posición en 12 ticks seguidos |
| `BUCLE_ACCION` | WARN | misma acción en 10 ticks (excluye explorar/mover) |
| `HAMBRE_CRITICA_SIN_RESPUESTA` | CRITICAL | hambre ≥ 0.90 en 8 ticks sin comer ni recoger_comida |
| `HAMBRE_SIN_COMIDA_DISPONIBLE` | WARN | hambre ≥ 0.90 en 15 ticks moviéndose sin encontrar comida |
| `ENERGIA_CRITICA_SIN_RESPUESTA` | CRITICAL | energía ≤ 0.15 en 8 ticks sin descansar ni ir_refugio |
| `DIRECTIVA_IGNORADA` | WARN | directiva EXPLORAR_ZONA activa pero no explora en 15 ticks |
| `SIN_VARIEDAD_GLOBAL` | ERROR | una acción (no explorar/mover) domina >85% global |
| `SOLO_MOVIMIENTO_GLOBAL` | WARN | explorar+mover >95% sin acciones de supervivencia |

### Bug corregido (sesión anterior)
**Antes:** `"mover"` estaba en la lista de acciones válidas para `HAMBRE_CRITICA_SIN_RESPUESTA`. Una entidad con hambre=1.0 haciendo `mover` indefinidamente **nunca** generaba alerta.  
**Evidencia:** 0 alertas en sesión de 978 ticks (entidades siempre haciendo `mover`).  
**Fix:** quitado `"mover"` de la condición; añadidos detectores `HAMBRE_SIN_COMIDA_DISPONIBLE` y `SOLO_MOVIMIENTO_GLOBAL`.  
**Verificación:** 32 alertas en 100 ticks tras el fix (0 antes).

### Verificación manual del watchdog

Si se duda de que el watchdog funciona, seguir este procedimiento:

1. **Estado limpio:** Borrar `mundo_artificial.db` y `simulacion.log` para empezar sin datos previos.
2. **Ejecutar:** `ejecutar.bat` o `python principal.py`.
3. **Pausar:** Pulsar `P` en tick ~5.
4. **Avanzar manualmente:** Pulsar `N` unas 15 veces (tick manual). Si las entidades están bloqueadas o el mapa está vacío, permanecerán en la misma posición.
5. **Abrir pestaña WATCHDOG:** Hacer clic en la 5ª pestaña del panel derecho (etiqueta "WATC"). Si hay alertas, la pestaña se muestra en rojo.
6. **Comprobar UI:** Título "WATCHDOG [N detectados]" en rojo si N>0, lista de alertas con nivel y mensaje.
7. **Comprobar log:** Abrir `simulacion.log` en la raíz del proyecto y buscar líneas que contengan `WATCHDOG` y el código de alerta (ej. `TRAMPA_POSICION`).

**Causa frecuente de "no funciona":** El usuario no hace clic en la pestaña WATCHDOG. Por defecto está en CONTROL. El contenido de alertas solo se ve al seleccionar la pestaña.

**Test automatizado:**
```powershell
python pruebas/test_watchdog_integracion.py
```
Verifica: (1) alerta TRAMPA_POSICION con entidad fija, (2) escritura en log, (3) integración con Simulacion real.

---

## 8. PERSISTENCIA

- **Motor:** SQLite (`mundo_artificial.db`) por defecto; JSON como respaldo
- **Tabla:** `estado(id=1, tick INTEGER, datos TEXT, actualizado_at REAL)`
- **Auto-guardado:** cada 20 ticks
- **Al arrancar:** carga estado guardado si existe; si no, genera mundo nuevo
- **ADVERTENCIA CONOCIDA:** Si existe un `mundo_artificial.db` antiguo con el nombre "Michi" (nombre anterior del gato), se carga ese estado y el cambio a "Amiguisimo" no tiene efecto. Solución: `Remove-Item mundo_artificial.db -Force`

---

## 9. LOGGING

### Archivos de log
| Archivo | Logger | Contenido |
|---|---|---|
| `simulacion.log` | `"mundo_artificial"` | Todo: EVENTO, DECISION, DIRECTIVA, WATCHDOG, EXCEPCION |
| `app_diagnostico.log` | archivo directo | Arranque y errores de `principal.py` |
| `amiguisimo_debug.log` | `"amiguisimo_debug"` | Estado detallado de Amiguisimo en cada acción manual |

### Configuración del logger
`sistema_logs.py` configura `logging.getLogger("mundo_artificial")` con `FileHandler(simulacion.log, mode="a")` al importarse. El watchdog usa `logging.getLogger("mundo_artificial.watchdog")` que hereda el handler del padre (propagate=True por defecto en Python).

### Niveles de log en simulacion.log
- `INFO`: EVENTO tick=N ent=X tipo=Y desc=Z
- `DEBUG`: DECISION tick=N ent=X accion=Y score=Z (solo si directivas activas o log_decisiones_activo=True)
- `WARNING`: WATCHDOG, ENTIDAD_PILLADA, BUCLE TERMINA
- `ERROR`: WATCHDOG
- `CRITICAL`: WATCHDOG, EXCEPCION EN BUCLE

---

## 10. TESTS

### Ejecutar todos
```powershell
cd "c:\Users\Cosigein SL\Desktop\artificial word"
python pruebas/test_core.py
python pruebas/test_modo_sombra.py
python pruebas/test_bug_robar.py
python pruebas/test_watchdog_fixes.py
python pruebas/test_watchdog_integracion.py
python pruebas/test_arranque_limpio.py
```

### Estado actual verificado
| Test | Tests | Estado |
|---|---|---|
| `test_core.py` | 22/22 | ✅ PASAN |
| `test_modo_sombra.py` | 7/7 | ✅ PASAN |
| `test_bug_robar.py` | 3/3 | ✅ PASAN |
| `test_watchdog_fixes.py` | 4/4 | ✅ PASAN |
| `test_watchdog_integracion.py` | 3/3 | ✅ PASAN |
| `test_arranque_limpio.py` | 1/1 | ✅ PASA |

### Qué validan los tests (no son triviales)
- `test_motor_decide_accion` — el motor elige acción con score > 0
- `test_pesos_hambre_explorar_penaliza` — hambre alta da score menor a explorar
- `test_pesos_hambre_comer_bonifica` — hambre alta da score mayor a comer
- `test_directiva_supervivencia_prioriza_comer` — directiva sobreescribe comportamiento por defecto
- `test_variedad_acciones_minima` — en 30 ticks hay ≥2 acciones distintas
- `test_watchdog_detecta_trampa` — entidad atrapada genera alerta TRAMPA_POSICION
- `test_watchdog_fixes` — los 3 puntos ciegos corregidos funcionan
- `test_watchdog_integracion` — watchdog integrado con simulación real, alertas en log

### Filtro recomendado para ejecutar tests
```powershell
python pruebas/test_core.py 2>&1 | Select-String -NotMatch "pkg_resources|UserWarning|setuptools|Setuptools"
```

---

## 11. PROBLEMA PENDIENTE IDENTIFICADO (próximo bug a investigar)

### Descripción
En 100 ticks reales, las entidades Ana, Bruno, Eva y Amiguisimo llegan a `hambre=1.0` moviéndose sin encontrar/recoger comida. El watchdog lo detecta con `HAMBRE_SIN_COMIDA_DISPONIBLE` y `HAMBRE_CRITICA_SIN_RESPUESTA`.

### Hipótesis a verificar (en orden de probabilidad)
1. **Distribución de comida insuficiente:** el mapa genera 80 unidades en un grid 60×60 = 3600 celdas (2.2% de ocupación). Con radio de percepción 5, cada entidad ve ~100 celdas. La densidad puede ser demasiado baja.
2. **`AccionRecogerComida.es_viable()` no detecta comida en celda actual:** verificar si la entidad llega a la celda con comida pero no la recoge porque la lógica de viable falla.
3. **`AccionComer.es_viable()` requiere inventario con comida:** las entidades deben primero recoger y luego comer. Si no recogen, nunca comen.
4. **Percepción no registra correctamente en memoria:** `actualizar_memoria` podría no guardar la posición del recurso visto para que `AccionRecogerComida` lo use.

### Cómo reproducirlo
```powershell
python -c "
import os, sys; sys.path.insert(0,'.'); os.environ['SDL_VIDEODRIVER']='dummy'; os.environ['SDL_AUDIODRIVER']='dummy'
import logging; logging.disable(logging.CRITICAL)
from configuracion import Configuracion; from nucleo.simulacion import Simulacion
cfg = Configuracion(); sim = Simulacion(cfg); sim.inicializar(); sim.crear_mundo(); sim.crear_entidades_iniciales()
sim.sistema_persistencia = None
for _ in range(100): sim._ejecutar_tick_completo()
for e in sim.entidades: print(f'{e.nombre}: H={e.estado_interno.hambre:.2f} E={e.estado_interno.energia:.2f}')
print('Alertas:', sim.sistema_watchdog.problemas_detectados_total)
"
```

---

## 12. REGLAS DE TRABAJO (obligatorias)

### Proceso de debugging
1. Nunca asumir que algo funciona sin ejecutarlo
2. Antes de modificar: leer el archivo completo
3. Un archivo por turno, un diff agrupado
4. Verificar con `py_compile` antes de declarar sintaxis correcta
5. Máximo 3 intentos por error antes de pedir ayuda al usuario

### Reglas técnicas
- **NUNCA hardcodear URLs** — usar `frontend/src/config/api.ts`
- **NUNCA usar `console.log` / `print`** — usar `logger` de `utils/logger`
- **NUNCA iniciar el servidor** — el usuario usa `iniciar.ps1`
- **Siempre TypeScript estricto** (en partes TS del proyecto)
- **Componentes < 300 líneas**

### Puertos fijos
- Backend: **9998**
- Frontend: **5174**

### Inicio del sistema
```powershell
.\iniciar.ps1
```

### Comandos de shell (Windows PowerShell)
- **No usar `&&`** en PowerShell — usar `;` o comandos separados
- **Usar `Select-String -NotMatch "pkg_resources|UserWarning"` para filtrar warnings pygame**
- **Variables de entorno headless para tests:**
  ```powershell
  $env:SDL_VIDEODRIVER="dummy"; $env:SDL_AUDIODRIVER="dummy"
  ```

---

## 13. ACCIONES IMPLEMENTADAS vs. ESQUELETO

| Acción | `es_viable()` | `ejecutar()` | Estado |
|---|---|---|---|
| `AccionMover` | ✅ | ✅ | Completa |
| `AccionExplorar` | ✅ | ✅ | Completa |
| `AccionComer` | ✅ | ✅ | Completa |
| `AccionDescansar` | ✅ | ✅ | Completa |
| `AccionIrRefugio` | ✅ | ✅ | Completa |
| `AccionRecogerComida` | ✅ | ✅ | Completa |
| `AccionRecogerMaterial` | ✅ | ✅ | Completa |
| `AccionHuir` | ✅ | ✅ | Completa |
| `AccionEvitar` | ✅ | ✅ | Completa |
| `AccionRobar` | ✅ | ❌ NO_APLICA | Esqueleto |
| `AccionCompartir` | ✅ | ❌ NO_APLICA | Esqueleto |
| `AccionSeguir` | ✅ | ❌ NO_APLICA | Esqueleto |

---

## 14. DIAGRAMA DE DEPENDENCIAS

```
tipos/ (enums, modelos)
  └── sin dependencias internas

configuracion.py
  └── sin dependencias internas

mundo/ (mapa, celda, recurso, refugio, generador)
  └── tipos/

agentes/ (estado_interno, inventario, percepcion, memoria, relaciones, directivas, pesos_utilidad, rasgos)
  └── tipos/, mundo/

acciones/
  └── tipos/, mundo/, agentes.inventario, nucleo.bus_eventos

entidades/
  └── tipos/, agentes/, acciones/

nucleo/ (gestor_ticks, bus_eventos, contexto)
  └── tipos/, mundo/

sistemas/
  └── tipos/, nucleo/, entidades/, mundo/

interfaz/
  └── tipos/, nucleo/, entidades/, sistemas/, configuracion/

nucleo/simulacion.py (orquestador)
  └── TODO lo anterior
```

---

## 15. HISTORIAL DE BUGS RESUELTOS

### Bug 1: "Michi" en lugar de "Amiguisimo" al arrancar
- **Causa:** `mundo_artificial.db` tenía estado guardado con nombre antiguo "Michi". Al cargar, sobreescribía el código.
- **Fix:** borrar `mundo_artificial.db`.
- **Prevención:** los tests de arranque limpio siempre borran la DB o la ignoran.

### Bug 2: `SyntaxError` en `nucleo/simulacion.py`
- **Causa:** El bloque `try...except` en `ejecutar_bucle_principal` tenía el cuerpo del `while` fuera del `try`, causando error de sintaxis.
- **Fix:** reindentación completa del cuerpo del bucle dentro del `try`.
- **Verificación:** `py_compile nucleo/simulacion.py` pasa sin error.

### Bug 3: Watchdog ciego a entidades moviéndose con hambre crítica
- **Causa:** `"mover"` estaba en la lista de acciones válidas de `_detectar_hambre_sin_respuesta`. El watchdog nunca alertaba si la entidad hacía `mover`.
- **Fix:**
  1. Quitado `"mover"` de la condición de `HAMBRE_CRITICA_SIN_RESPUESTA`
  2. Añadido detector `HAMBRE_SIN_COMIDA_DISPONIBLE`: hambre ≥ 0.90 en 15 ticks moviéndose sin comer
  3. Añadido detector `SOLO_MOVIMIENTO_GLOBAL`: >95% explorar+mover sin acciones de supervivencia
- **Evidencia antes:** 0 alertas en sesión de 978 ticks
- **Evidencia después:** 32 alertas en 100 ticks

### Bug 4: `AccionRobar` en bucle infinito
- **Causa:** `es_viable()` devolvía `True` aunque no hubiera entidades cercanas con comida.
- **Fix:** `es_viable()` ahora verifica que haya al menos una entidad cercana con `inventario.comida > 0`.
- **Test:** `test_bug_robar.py` — 3/3 pasan.

---

## 16. CÓMO AÑADIR UNA NUEVA ACCIÓN (patrón)

```python
# acciones/accion_nueva.py
from acciones.accion_base import AccionBase
from tipos.enums import TipoAccion, ResultadoAccion

class AccionNueva(AccionBase):
    def __init__(self, id_entidad: int):
        super().__init__(TipoAccion.NUEVA, id_entidad)

    def es_viable(self, entidad, contexto) -> bool:
        # Condición para que la acción sea candidata
        return entidad.estado_interno.energia > 0.2

    def calcular_utilidad_base(self) -> float:
        from agentes.pesos_utilidad import obtener_utilidad_base
        return obtener_utilidad_base(self.tipo_accion)

    def ejecutar(self, entidad, contexto) -> ResultadoAccion:
        # Modificar estado, emitir evento al bus
        from tipos.enums import TipoEvento
        from tipos.modelos import EventoSistema
        evento = EventoSistema(
            tick=contexto.tick_actual,
            tipo=TipoEvento.COMIO,  # usar el tipo apropiado
            id_origen=entidad.id_entidad,
            descripcion=f"{entidad.nombre} hizo algo"
        )
        contexto.bus_eventos.emitir(evento)
        return ResultadoAccion.EXITO
```

Luego:
1. Añadir `NUEVA` a `TipoAccion` en `tipos/enums.py`
2. Añadir peso base en `agentes/pesos_utilidad.py` → `PESOS_BASE_ACCIONES`
3. Registrar la acción en `motor_decision.generar_acciones_candidatas()`

---

## 17. CÓMO AÑADIR UNA NUEVA DIRECTIVA (patrón)

```python
# En tipos/enums.py:
class TipoDirectiva(Enum):
    ...
    NUEVA_DIRECTIVA = "nueva_directiva"

# En agentes/motor_decision.py → aplicar_modificadores_por_directivas:
if d.tipo_directiva == TipoDirectiva.NUEVA_DIRECTIVA:
    if accion.tipo_accion == TipoAccion.EXPLORAR:
        modificador += 1.5 * d.intensidad  # ejemplo: incentiva explorar

# En interfaz/panel_control.py → _procesar_click_ordenes:
# Añadir botón que llame a self.crear_directiva(id_ent, TipoDirectiva.NUEVA_DIRECTIVA, tick)

# En sistemas/sistema_watchdog.py → _detectar_directiva_ignorada:
# Añadir case para la nueva directiva si necesitas monitorearla
```
