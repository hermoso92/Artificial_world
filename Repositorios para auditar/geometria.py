"""
Utilidades geométricas para el grid 2D.
"""

from tipos.modelos import Posicion


def distancia_manhattan(p1: Posicion, p2: Posicion) -> int:
    """Distancia Manhattan entre dos posiciones."""
    return p1.distancia_manhattan(p2)
