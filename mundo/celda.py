"""
Celda: unidad espacial del mapa.
"""

from typing import TYPE_CHECKING

from .terreno import TipoTerreno

if TYPE_CHECKING:
    from .recurso import Recurso
    from .refugio import Refugio
    from tipos.modelos import Posicion


class Celda:
    """Representa una unidad espacial del mapa."""

    def __init__(
        self,
        posicion: "Posicion",
        terreno: TipoTerreno = TipoTerreno.NORMAL,
    ):
        self.posicion = posicion
        self.terreno = terreno
        self.recurso: Recurso | None = None
        self.refugio: Refugio | None = None
        self.ids_entidades: list[int] = []
        self.metadatos: dict = {}

    def esta_vacia(self) -> bool:
        """Indica si la celda no tiene entidades."""
        return len(self.ids_entidades) == 0

    def tiene_recurso(self) -> bool:
        """Indica si la celda tiene un recurso."""
        return self.recurso is not None and not self.recurso.esta_agotado()

    def tiene_refugio(self) -> bool:
        """Indica si la celda tiene un refugio."""
        return self.refugio is not None

    def agregar_entidad(self, id_entidad: int) -> None:
        """Registra una entidad en la celda."""
        if id_entidad not in self.ids_entidades:
            self.ids_entidades.append(id_entidad)

    def quitar_entidad(self, id_entidad: int) -> None:
        """Quita una entidad de la celda."""
        if id_entidad in self.ids_entidades:
            self.ids_entidades.remove(id_entidad)
