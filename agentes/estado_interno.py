"""
Estado interno de una entidad: hambre, energía, salud, inventario.
"""

from tipos.enums import TipoAccion
from tipos.modelos import Posicion

from .inventario import Inventario


class EstadoInterno:
    """Estado mutable de necesidades y situación actual."""

    def __init__(
        self,
        hambre: float = 0.0,
        energia: float = 1.0,
        salud: float = 1.0,
        riesgo_percibido: float = 0.0,
        inventario: Inventario | None = None,
    ):
        self.hambre = max(0.0, min(1.0, hambre))
        self.energia = max(0.0, min(1.0, energia))
        self.salud = max(0.0, min(1.0, salud))
        self.riesgo_percibido = max(0.0, min(1.0, riesgo_percibido))
        self.inventario = inventario or Inventario()
        self.accion_actual: TipoAccion | None = None
        self.objetivo_actual: Posicion | None = None

    def actualizar_hambre(self, delta: float) -> None:
        """Modifica la hambre (delta positivo la aumenta)."""
        self.hambre = max(0.0, min(1.0, self.hambre + delta))

    def actualizar_energia(self, delta: float) -> None:
        """Modifica la energía (delta positivo la aumenta)."""
        self.energia = max(0.0, min(1.0, self.energia + delta))

    def actualizar_salud(self, delta: float) -> None:
        """Modifica la salud (delta positivo la aumenta)."""
        self.salud = max(0.0, min(1.0, self.salud + delta))

    def necesita_comer(self) -> bool:
        """Indica si la hambre es alta."""
        return self.hambre >= 0.6

    def necesita_descansar(self) -> bool:
        """Indica si la energía es baja."""
        return self.energia <= 0.4

    def esta_critico(self) -> bool:
        """Indica si el estado es crítico (hambre o energía extremas)."""
        return self.hambre >= 0.85 or self.energia <= 0.15
