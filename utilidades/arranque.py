"""
Módulo de arranque: diagnóstico, logging y manejo de errores.
Centraliza la lógica de inicio para principal.py.
"""

import atexit
import os
import sys
import traceback
from datetime import datetime
from pathlib import Path
from typing import NoReturn

from utilidades.paths import obtener_base_path

_BASE = obtener_base_path()
LOG_PATH = os.path.join(_BASE, "app_diagnostico.log")
ERROR_PATH = os.path.join(_BASE, "error_critico.txt")


def log(msg: str) -> None:
    """Escribe en app_diagnostico.log."""
    try:
        with open(LOG_PATH, "a", encoding="utf-8") as f:
            f.write(f"[{datetime.now().isoformat()}] {msg}\n")
    except Exception:
        pass


def _log_fin() -> None:
    """Registra fin del proceso."""
    try:
        with open(LOG_PATH, "a", encoding="utf-8") as f:
            f.write(f"[{datetime.now().isoformat()}] Proceso terminando\n")
    except Exception:
        pass


atexit.register(_log_fin)


def mostrar_error_al_usuario(exc: BaseException) -> NoReturn:
    """Muestra el error: diálogo tkinter, archivo o consola."""
    msg = f"{type(exc).__name__}: {exc}\n\n{traceback.format_exc()}"
    log(f"ERROR: {exc}")
    log(traceback.format_exc())
    try:
        import tkinter as tk
        from tkinter import messagebox
        root = tk.Tk()
        root.withdraw()
        texto = msg[:800] + "\n\n[... truncado. Ver error_critico.txt]" if len(msg) > 800 else msg
        messagebox.showerror("MUNDO_ARTIFICIAL - Error critico", texto)
        root.destroy()
    except Exception:
        try:
            with open(ERROR_PATH, "w", encoding="utf-8") as f:
                f.write(msg)
            print(f"\nError guardado en: {ERROR_PATH}")
        except Exception:
            print(f"\nError: {exc}")
        input("Pulse Enter para salir...")
    sys.exit(1)


def preparar_entorno() -> None:
    """Elimina SDL dummy para tests headless."""
    if os.environ.get("SDL_VIDEODRIVER") == "dummy":
        del os.environ["SDL_VIDEODRIVER"]
        log("SDL_VIDEODRIVER dummy eliminado")


def ejecutar_simulacion() -> None:
    """Inicia la simulación pygame."""
    from configuracion import Configuracion
    from nucleo.simulacion import Simulacion
    from sistemas.sistema_logging_reporte import configurar_logging

    config = Configuracion()
    configurar_logging(
        nivel=getattr(config, "nivel_log", "INFO"),
        log_estructurado=getattr(config, "log_estructurado", False),
        log_consola=getattr(config, "log_consola", False),
    )
    log("Logging configurado")
    log("Imports OK")

    sim = Simulacion(config)
    log("Simulacion creada, llamando ejecutar_bucle_principal")
    sim.ejecutar_bucle_principal()
    log("Bucle finalizado (usuario cerro)")


def abrir_landing_en_navegador() -> None:
    """Abre artificial-world.html en el navegador por defecto."""
    ruta = Path(_BASE) / "artificial-world.html"
    if ruta.is_file():
        import webbrowser
        webbrowser.open(ruta.as_uri())
        log("Landing abierta en navegador")
    else:
        print(f"No se encontró: {ruta}")
        sys.exit(1)


def obtener_ruta_landing() -> str:
    """Devuelve la ruta absoluta de artificial-world.html."""
    return str(Path(_BASE) / "artificial-world.html")

