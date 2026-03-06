# Artificial World

Proyecto en desarrollo.

## Persistencia

**SQLite** en `mundo_artificial.db` (raíz del proyecto). Auto-guardado cada 20 ticks.

- **Auto-guardado**: cada 20 ticks, se guarda en tiempo real
- **Auto-carga**: al iniciar, si existe estado guardado se carga automáticamente
- **Guardar manual**: tecla `G` o pestaña Archivo → Guardar
- **Cargar manual**: tecla `C` o pestaña Archivo → Cargar

Config en `configuracion.py`: `persistencia_sqlite`, `auto_guardar_intervalo_ticks`
