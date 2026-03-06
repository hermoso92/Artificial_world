"""
Acción base: interfaz para todas las acciones.
"""

from abc import ABC, abstractmethod
from typing import TYPE_CHECKING

from tipos.enums import ResultadoAccion, TipoAccion

if TYPE_CHECKING:
    from nucleo.contexto import ContextoSimulacion


class AccionBase(ABC):
    """Clase base para todas las acciones."""

    def __init__(self, tipo_accion: TipoAccion, id_entidad: int):
        self.tipo_accion = tipo_accion
        self.id_entidad = id_entidad

    @abstractmethod
    def es_viable(self, entidad, contexto) -> bool:
        """Indica si la acción puede ejecutarse."""
        pass

    @abstractmethod
    def calcular_utilidad_base(self, entidad, contexto) -> float:
        """Calcula la utilidad base de la acción."""
        pass

    @abstractmethod
    def ejecutar(self, entidad, contexto: "ContextoSimulacion") -> ResultadoAccion:
        """Ejecuta la acción y devuelve el resultado."""
        pass

    def describir(self) -> str:
        """Descripción legible de la acción."""
        return f"{self.tipo_accion.value} (entidad {self.id_entidad})"
