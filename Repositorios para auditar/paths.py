"""
Rutas base para logs y archivos.
Cuando se ejecuta como .exe (PyInstaller), usa la carpeta del ejecutable.
"""

import os
import sys


def obtener_base_path() -> str:
    """Carpeta donde escribir logs y archivos de datos."""
    if getattr(sys, "frozen", False):
        return os.path.dirname(sys.executable)
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
