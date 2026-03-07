"""
Ejecuta el juego en modo debug: salida en consola en tiempo real.
Usa: python ejecutar_debug.py

Veras eventos, watchdog y decisiones en la terminal mientras juegas.
"""
import os
import sys

# Forzar driver real (no dummy)
if os.environ.get("SDL_VIDEODRIVER") == "dummy":
    del os.environ["SDL_VIDEODRIVER"]

from configuracion import Configuracion
from sistemas.sistema_logging_reporte import configurar_logging

cfg = Configuracion()
cfg.log_consola = True
cfg.nivel_log = "INFO"

configurar_logging(
    nivel=cfg.nivel_log,
    log_estructurado=cfg.log_estructurado,
    log_consola=True,
)

print("=" * 50)
print("artificial word - MODO DEBUG (consola activa)")
print("=" * 50)
print("Cierra la ventana del juego para salir.")
print("Eventos y watchdog se muestran aqui en tiempo real.")
print("=" * 50)

from nucleo.simulacion import Simulacion

sim = Simulacion(cfg)
sim.ejecutar_bucle_principal()

print("=" * 50)
print("Juego cerrado. Revisa reporte_sesion.json si hubo errores.")
print("=" * 50)
