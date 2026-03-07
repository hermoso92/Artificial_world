"""
Zona: región o área del mapa.
"""

from dataclasses import dataclass

from tipos.modelos import Posicion


@dataclass
class Zona:
    """Zona o región del mapa."""

    id_zona: int
    nombre: str
    posiciones: list[Posicion]
    metadatos: dict | None = None
