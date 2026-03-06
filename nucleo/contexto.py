"""
Contextos de ejecución para decisión y simulación.
"""

from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from mundo.mapa import Mapa
    from tipos.modelos import DirectivaExterna, PercepcionLocal


@dataclass
class ContextoDecision:
    """Contexto para el motor de decisión."""

    tick_actual: int
    mapa: "Mapa"
    percepcion_local: "PercepcionLocal | None" = None
    configuracion: object = None
    entidades_cercanas: list = None
    directivas_activas: list["DirectivaExterna"] = None
    eventos_recientes_globales: list = None

    def __post_init__(self):
        if self.entidades_cercanas is None:
            self.entidades_cercanas = []
        if self.directivas_activas is None:
            self.directivas_activas = []
        if self.eventos_recientes_globales is None:
            self.eventos_recientes_globales = []


@dataclass
class ContextoSimulacion:
    """Contexto para ejecutar acciones."""

    tick_actual: int
    mapa: "Mapa"
    bus_eventos: object = None
    sistema_metricas: object = None
    configuracion: object = None
    entidades: list = None
    percepcion_local: "PercepcionLocal | None" = None

    def __post_init__(self):
        if self.entidades is None:
            self.entidades = []
