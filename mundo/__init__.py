"""Módulo del mundo: mapa, celdas, recursos, refugios.

Reexporta desde core.world y core.shelter para compatibilidad.
"""

from core.shelter import Refugio
from core.world import Celda, GeneradorMundo, Mapa, Recurso, TipoTerreno, Zona

__all__ = ["Celda", "Mapa", "Recurso", "Refugio", "GeneradorMundo", "TipoTerreno", "Zona"]
