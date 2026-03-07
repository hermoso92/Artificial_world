# Sistema de Logging, Reporting y Debugging — artificial word

Sistema centralizado para observabilidad, demos B2B y desarrollo.

---

## 1. Configuración (`configuracion.py`)

| Parámetro | Default | Descripción |
|-----------|---------|-------------|
| `nivel_log` | `"INFO"` | DEBUG, INFO, WARNING, ERROR, CRITICAL |
| `log_estructurado` | `False` | Si True, logs en JSON para parsing |
| `log_consola` | `False` | Si True, salida también a stdout |
| `reporte_sesion_activo` | `True` | Genera reporte_sesion.json al finalizar |
| `reporte_sesion_ruta` | `"reporte_sesion.json"` | Ruta del reporte |

---

## 2. Archivos generados

| Archivo | Contenido |
|---------|-----------|
| `simulacion.log` | Log principal (eventos, decisiones, watchdog) |
| `app_diagnostico.log` | Arranque y cierre de principal.py |
| `amiguisimo_debug.log` | Acciones de Amiguisimo en Modo Sombra |
| `reporte_sesion.json` | Resumen de la sesión al finalizar |

---

## 3. Reporte de sesión (`reporte_sesion.json`)

Se genera automáticamente al cerrar la simulación (normal o por error).

```json
{
  "version": 1,
  "proyecto": "artificial_word",
  "inicio": "2026-03-07T...",
  "fin": "2026-03-07T...",
  "duracion_segundos": 120.5,
  "tick_final": 3500,
  "entidades": 7,
  "metricas_globales": { "movio": 1200, "comio": 80, ... },
  "alertas_watchdog_total": 3,
  "alertas_watchdog_ultimas": [...],
  "excepciones": [],
  "estado": "OK"
}
```

---

## 4. Modo debug intensivo

Para depurar decisiones o entidades pilladas:

```python
# En configuracion.py o al crear Configuracion
config.nivel_log = "DEBUG"
config.debug_entidades_pilladas = True
config.debug_archivo_activo = True  # Escribe debug_live.json cada 5 ticks
```

---

## 5. Loggers del proyecto

| Logger | Uso |
|--------|-----|
| `mundo_artificial` | Raíz, eventos, decisiones |
| `mundo_artificial.watchdog` | Alertas del watchdog |
| `mundo_artificial.amiguisimo` | Debug de Modo Sombra |
| `simulacion` | Bucle principal, acciones UI |

---

## 6. Flujo de inicialización

1. `principal.py` crea `Configuracion`
2. `configurar_logging()` se ejecuta con los parámetros de config
3. Se importa `Simulacion` (que usa los loggers ya configurados)
4. Al finalizar el bucle, `SistemaReporte.generar_desde_simulacion()` escribe el reporte

---

## 7. Modo Competencia

Sistema de observabilidad defensiva y forense. Registra eventos sensibles (guardar/cargar estado, modo sombra, exportación de reportes) con risk_score, integridad y correlación.

- **Archivo:** `audit_competencia.db` (append-only)
- **Config:** `modo_competencia_activo`, `modo_competencia_ruta_db`, `modo_competencia_umbral_alerta`, `modo_competencia_umbral_legal`
- **Diseño completo:** [docs/DESIGN_MODO_COMPETENCIA.md](DESIGN_MODO_COMPETENCIA.md)
