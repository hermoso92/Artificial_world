"""Acción de robar recursos."""

from agentes.pesos_utilidad import obtener_utilidad_base
from tipos.enums import ResultadoAccion, TipoAccion

from .accion_base import AccionBase


class AccionRobar(AccionBase):
    """Intentar robar recurso a otra entidad."""

    def __init__(self, id_entidad: int, id_objetivo: int = 0):
        super().__init__(TipoAccion.ROBAR, id_entidad)
        self.id_objetivo = id_objetivo

    def es_viable(self, entidad, contexto) -> bool:
        """Solo viable si hay una entidad cercana con comida en el inventario."""
        if contexto is None:
            return False
        entidades_cercanas = []
        if contexto.percepcion_local:
            entidades_cercanas = getattr(contexto.percepcion_local, "entidades_visibles", [])
        elif hasattr(contexto, "entidades"):
            entidades_cercanas = [
                e for e in (contexto.entidades or [])
                if e.id_entidad != entidad.id_entidad
            ]
        for otra in entidades_cercanas:
            inv = getattr(getattr(otra, "estado_interno", None), "inventario", None)
            comida = getattr(inv, "comida", 0) if inv else 0
            if comida > 0:
                self.id_objetivo = otra.id_entidad
                return True
        return False

    def calcular_utilidad_base(self, entidad, contexto) -> float:
        return obtener_utilidad_base("robar")

    def ejecutar(self, entidad, contexto) -> ResultadoAccion:
        return ResultadoAccion.NO_APLICA
