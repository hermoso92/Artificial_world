"""
World: mapa, grid, zonas.

Implementación en core; mundo/ reexporta para compatibilidad.
"""

from .celda import Celda
from .generador_mundo import GeneradorMundo
from .mapa import Mapa
from .recurso import Recurso
from .terreno import TipoTerreno
from .zona import Zona

__all__ = ["Celda", "GeneradorMundo", "Mapa", "Recurso", "TipoTerreno", "Zona"]
