"""
Tipos de terreno para celdas.
"""

from enum import Enum


class TipoTerreno(Enum):
    """Tipo de terreno de una celda."""

    NORMAL = "normal"
    AGUA = "agua"
    OBSTACULO = "obstaculo"
