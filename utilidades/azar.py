"""Utilidades de aleatoriedad."""

import random


def obtener_semilla(configuracion) -> int:
    """Obtiene la semilla de la configuración."""
    return getattr(configuracion, "semilla_aleatoria", 42)
