"""Acción de compartir recursos."""

from agentes.pesos_utilidad import obtener_utilidad_base
from tipos.enums import ResultadoAccion, TipoAccion

from .accion_base import AccionBase


class AccionCompartir(AccionBase):
    """Compartir recurso con otra entidad."""

    def __init__(self, id_entidad: int, id_objetivo: int = 0):
        super().__init__(TipoAccion.COMPARTIR, id_entidad)
        self.id_objetivo = id_objetivo

    def es_viable(self, entidad, contexto) -> bool:
        return True

    def calcular_utilidad_base(self, entidad, contexto) -> float:
        return obtener_utilidad_base("compartir")

    def ejecutar(self, entidad, contexto) -> ResultadoAccion:
        return ResultadoAccion.NO_APLICA
