# Revision de logs — artificial word

**Fecha:** 2026-03-07

---

## 1. Resumen ejecutivo

| Log | Estado | Notas |
|-----|--------|-------|
| app_diagnostico.log | OK | Arranques y cierres normales. Error historico corregido. |
| simulacion.log | OK | Eventos y watchdog operativos. ~86k lineas. |
| reporte_produccion.log | OK | 9 suites, 0 fallos. |
| verificacion_completa.json | OK | 7/7 verificaciones OK. |
| reporte_sesion.json | ERROR | Excepcion: 'tuple' object has no attribute 'posicion' |
| amiguisimo_debug.log | OK | Debug modo sombra normal. |

---

## 2. Errores detectados

### 2.1 Bug corregido: AttributeError en BUCLE tick=474

**Archivo:** `reporte_sesion.json`  
**Error:** `'tuple' object has no attribute 'posicion'`  
**Contexto:** BUCLE tick=474

**Causa:** En `accion_seguir.py`, `accion_compartir.py` y `accion_robar.py`, `_obtener_cercanas()` devolvia `entidades_visibles` del mapa (`list[(Posicion, list[int])]`), pero el codigo trataba cada tupla como entidad.

**Solucion aplicada:** `_obtener_cercanas()` ahora detecta si el formato es (pos, ids) o list[Entidad] y convierte correctamente a entidades. Tests pasan.

### 2.2 Error historico (ya corregido)

**Archivo:** `app_diagnostico.log` (2026-03-07 02:22:50)  
**Error:** `SyntaxError: '(' was never closed` en panel_control.py linea 530  
**Estado:** Corregido. El codigo actual compila.

---

## 3. Alertas watchdog (reporte_sesion.json)

- **401 alertas** en la ultima sesion
- Tipos: HAMBRE_CRITICA_SIN_RESPUESTA, HAMBRE_SIN_COMIDA_DISPONIBLE
- Entidades afectadas: David, Eva, Felix, Tryndamere, Ana, Bruno, Amiguisimo
- **Causa probable:** 8 entidades (incl. Tryndamere) con recursos limitados; algunas no encuentran comida a tiempo.

---

## 4. Ventanas 580x270 en app_diagnostico

Multiples entradas "Ventana creada 580x270" — probablemente dialogs de tkinter (messagebox, etc.) o ventanas de pygame. No critico.

---

## 5. Recomendaciones

1. **Corregir bug accion_seguir** — Ver seccion 2.1
2. **Revisar balance** — Con 8 entidades, la comida puede ser insuficiente. Considerar aumentar `cantidad_comida_inicial` o `cantidad_regeneracion_comida`
3. **Rotacion de logs** — simulacion.log tiene 86k+ lineas. Considerar rotacion o limite de tamano
