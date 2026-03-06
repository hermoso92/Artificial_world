"""Acción de huir."""

from agentes.pesos_utilidad import obtener_utilidad_base
from tipos.enums import ResultadoAccion, TipoAccion
from tipos.modelos import Posicion

from .accion_base import AccionBase


def _obtener_posicion_amenaza(entidad, percepcion) -> Posicion | None:
    """Obtiene la posición de la amenaza más cercana desde entidades_visibles."""
    if not percepcion or not percepcion.entidades_visibles:
        return None
    amenazas = [
        pos for pos, ids in percepcion.entidades_visibles
        if any(id_e != entidad.id_entidad for id_e in ids)
    ]
    if not amenazas:
        return None
    return min(amenazas, key=lambda p: entidad.posicion.distancia_manhattan(p))


def _elegir_destino_alejado(entidad, contexto, pos_amenaza: Posicion) -> Posicion | None:
    """Elige el vecino más alejado de la amenaza."""
    if contexto is None or contexto.mapa is None:
        return None
    vecinos = contexto.mapa.obtener_vecinos(entidad.posicion)
    if not vecinos:
        return None
    return max(vecinos, key=lambda v: v.distancia_manhattan(pos_amenaza))


class AccionHuir(AccionBase):
    """Huir de una amenaza."""

    def __init__(self, id_entidad: int):
        super().__init__(TipoAccion.HUIR, id_entidad)

    def es_viable(self, entidad, contexto) -> bool:
        percepcion = getattr(contexto, "percepcion_local", None) if contexto else None
        return percepcion is not None and bool(percepcion.entidades_visibles)

    def calcular_utilidad_base(self, entidad, contexto) -> float:
        return obtener_utilidad_base("huir")

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
                tipo=TipoEvento.HUYO,
                id_origen=entidad.id_entidad,
                id_objetivo=None,
                posicion=entidad.posicion,
                descripcion=f"{entidad.nombre} huyo",
            ))
        return ResultadoAccion.EXITO
