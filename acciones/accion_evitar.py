"""Acción de evitar entidad o zona."""

from tipos.enums import ResultadoAccion, TipoAccion

from .accion_huir import (
    _elegir_destino_alejado,
    _obtener_posicion_amenaza,
)
from .accion_base import AccionBase


class AccionEvitar(AccionBase):
    """Evitar acercarse a una entidad o zona."""

    def __init__(self, id_entidad: int, id_objetivo: int | None = None):
        super().__init__(TipoAccion.EVITAR, id_entidad)
        self.id_objetivo = id_objetivo

    def es_viable(self, entidad, contexto) -> bool:
        riesgo = getattr(entidad.estado_interno, "riesgo_percibido", 0.0)
        return riesgo > 0.3

    def calcular_utilidad_base(self, entidad, contexto) -> float:
        from agentes.pesos_utilidad import obtener_utilidad_base
        return obtener_utilidad_base("evitar")

    def ejecutar(self, entidad, contexto) -> ResultadoAccion:
        percepcion = getattr(contexto, "percepcion_local", None) if contexto else None
        pos_amenaza = _obtener_posicion_amenaza(entidad, percepcion)
        if pos_amenaza is None:
            return ResultadoAccion.NO_APLICA
        destino = _elegir_destino_alejado(entidad, contexto, pos_amenaza)
        if destino is None:
            return ResultadoAccion.NO_APLICA
        if not contexto.mapa.mover_entidad(entidad, destino):
            return ResultadoAccion.FALLO
        entidad.posicion_anterior = entidad.posicion
        entidad.posicion = destino
        if contexto and contexto.configuracion:
            delta = getattr(
                contexto.configuracion, "decremento_energia_por_movimiento", 0.03
            )
            entidad.estado_interno.actualizar_energia(-delta)
        if contexto and getattr(contexto, "bus_eventos", None):
            from tipos.modelos import EventoSistema
            from tipos.enums import TipoEvento
            contexto.bus_eventos.emitir(EventoSistema(
                tick=getattr(contexto, "tick_actual", 0),
                tipo=TipoEvento.EVITO,
                id_origen=entidad.id_entidad,
                id_objetivo=None,
                posicion=entidad.posicion,
                descripcion=f"{entidad.nombre} evito amenaza",
            ))
        return ResultadoAccion.EXITO
