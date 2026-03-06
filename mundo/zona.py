"""
Zonas o regiones del mapa (opcional para modelar áreas).
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
