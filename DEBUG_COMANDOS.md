# Debug y verificación en tiempo real — MUNDO_ARTIFICIAL

El agente (Cursor) puede ejecutar, comprobar y validar el proyecto sin ventana gráfica.

---

## Flujo de verificación automática

```powershell
cd "c:\Users\Cosigein SL\Desktop\artificial word"

# 1. Ejecutar simulación (headless, sin ventana)
python debug_runner.py 50

# 2. Verificar que el estado es correcto
python verificar_estado.py

# 3. Tests unitarios
python pruebas/test_core.py
```

---

## Archivos generados

| Archivo | Descripción |
|---------|-------------|
| `debug_output.json` | Estado completo: snapshots cada 5 ticks, estado final, métricas |
| `debug_log.txt` | Log por tick: acción de cada entidad |
| `debug_live.json` | Estado actual (solo si `debug_archivo_activo=True` en config) |

---

## Inspección en tiempo real con ventana

Para que el agente pueda leer el estado mientras la app corre con ventana:

1. En `configuracion.py` poner:
   ```python
   debug_archivo_activo: bool = True
   ```

2. Ejecutar `python principal.py`

3. Cada 5 ticks se escribe `debug_live.json`. El agente puede leerlo para comprobar:
   - Posiciones de entidades
   - Hambre, energía, acción actual
   - Métricas

---

## Comandos rápidos

```powershell
# Debug headless (50 ticks)
python debug_runner.py 50

# Verificar
python verificar_estado.py

# Tests
python pruebas/test_core.py

# App con ventana
python principal.py
```

---

## Resultado de la última ejecución

- **debug_runner.py 20**: 7 entidades, todas con acciones (mover, recoger_comida, comer, descansar)
- **verificar_estado.py**: OK — posiciones distintas, sin bloqueos
- **pruebas/test_core.py**: 10/10 tests pasaron
