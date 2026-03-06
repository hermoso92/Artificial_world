# Revisión y tests — MUNDO_ARTIFICIAL

## Resumen de la auditoría

Se realizó una auditoría completa del proyecto. Principales hallazgos:

| Componente        | Estado | Notas                                      |
|-------------------|--------|--------------------------------------------|
| Motor de decisión | OK     | Lógica correcta; se corrigieron pesos     |
| Acciones          | OK     | Descansar siempre viable                   |
| Simulación        | OK     | Loop y flujo correctos                     |
| Renderizador       | OK     | Dibuja mapa, entidades, panel              |
| Panel de control  | Corregido | Hitboxes desalineados 22px → corregido |
| Pesos utilidad    | Corregido | Modificadores hambre conflictivos → corregido |
| Fábrica entidades | Corregido | Posiciones duplicadas → corregido       |
| Tests             | Añadidos | 10 tests en `pruebas/test_core.py`      |

---

## Correcciones aplicadas

### 1. Panel de control — hitboxes desalineados (P0)

**Problema:** Los botones (Pausar, Velocidad, Modo, Guardar, Cargar, Órdenes) estaban dibujados 22px por debajo de su zona de clic.

**Solución:** Se añadió `OFFSET_TITULO = 22` y se aplicó en `_procesar_click_control`, `_procesar_click_archivo`, `_procesar_click_entidades` y `_procesar_click_ordenes`.

**Archivo:** `interfaz/panel_control.py`

### 2. Pesos de utilidad — modificadores hambre conflictivos (P1)

**Problema:** En `calcular_modificador_hambre` para `explorar`/`mover` había dos bloques: uno con bonificaciones (+0.45, +0.25) y otro con penalizaciones (-0.20, -0.05). El segundo sobrescribía al primero.

**Solución:** Se eliminó el bloque incorrecto y se mantuvo solo la penalización cuando hay hambre alta (priorizar supervivencia).

**Archivo:** `agentes/pesos_utilidad.py`

### 3. Fábrica de entidades — posiciones duplicadas (P2)

**Problema:** `_posicion_aleatoria_valida` podía devolver la misma celda para varias entidades.

**Solución:** Se pasa un conjunto `posiciones_ocupadas` y se excluyen al elegir nuevas posiciones.

**Archivo:** `entidades/fabrica_entidades.py`

### 4. Suite de tests (P2)

**Añadido:** `pruebas/test_core.py` con 10 tests que validan:

- Configuración
- Enums y modelos
- Posición (hashable, distancia)
- Inicialización de simulación
- Posiciones distintas de entidades
- Motor de decisión genera acción viable
- Pesos hambre (penaliza explorar, bonifica comer)
- Descansar siempre viable
- Sistema de métricas

---

## Comandos para ejecutar

### Debug físico (para que el agente pueda comprobar en tiempo real)

```powershell
# 1. Ejecutar simulación headless y escribir estado a archivo
python debug_runner.py 50

# 2. Verificar que el estado es correcto
python verificar_estado.py

# 3. Leer salida detallada
# debug_output.json — estado completo en JSON
# debug_log.txt — log por tick
```

### Ejecutar la aplicación con ventana

```powershell
cd "c:\Users\Cosigein SL\Desktop\artificial word"
python principal.py
```

Para que el agente pueda inspeccionar mientras la app corre, en `configuracion.py` poner:
`debug_archivo_activo: bool = True`
Así se escribe `debug_live.json` cada 5 ticks.

**Atajos de teclado:**
- `P` — Pausar/Reanudar
- `V` — Cambiar velocidad
- `M` — Cambiar modo visualización (normal, calor energía, calor hambre)
- `G` — Guardar estado
- `C` — Cargar estado

**Panel de control:** Clic en las pestañas (CONT, ORDE, ENTI, ARCH) y en los botones. Tras la corrección, los clics deben coincidir con los botones visibles.

### Ejecutar tests

```powershell
cd "c:\Users\Cosigein SL\Desktop\artificial word"
python pruebas/test_core.py
```

Salida esperada: `10/10 tests pasaron`

### Ejecutar diagnóstico (sin ventana gráfica)

```powershell
cd "c:\Users\Cosigein SL\Desktop\artificial word"
python diagnostico.py
```

### Test rápido de imports (sin display)

```powershell
cd "c:\Users\Cosigein SL\Desktop\artificial word"
$env:SDL_VIDEODRIVER="dummy"
python -c "
from configuracion import Configuracion
from nucleo.simulacion import Simulacion
c = Configuracion()
s = Simulacion(c)
s.inicializar()
s.crear_mundo()
s.crear_entidades_iniciales()
print('OK: mapa', s.mapa.ancho, 'x', s.mapa.alto, 'entidades:', len(s.entidades))
"
```

---

## Si el problema persiste

### Entidades "pilladas"

Si las entidades no se mueven:

1. **Comprobar que Descansar es viable:** Ya está corregido (`es_viable` devuelve `True` siempre).
2. **Comprobar que el motor genera acciones:** El test `test_motor_decide_accion` lo valida.
3. **Activar debug:** En `configuracion.py` poner `debug_entidades_pilladas: bool = True` y revisar logs cuando una entidad no recibe acción.

### Panel no responde a clics

Tras la corrección de hitboxes, los clics deberían funcionar. Si no:

- Verificar que el clic es dentro del panel (a la derecha del mapa).
- Comprobar que la pestaña correcta está activa.

### Ventana no se abre

- Pygame requiere un display. En entornos sin ventana (SSH, CI) usar `SDL_VIDEODRIVER=dummy`.
- En Windows, ejecutar desde una sesión con escritorio gráfico.

---

## Próximos pasos recomendados

1. **Añadir pytest** a `requirements.txt` para ejecutar tests con `pytest pruebas/ -v`.
2. **Más tests** para acciones concretas (mover, comer, recoger) y flujo de ejecución.
3. **Logging de diagnóstico** cuando `decidir_accion` devuelve `None` (ya preparado con `debug_entidades_pilladas`).
