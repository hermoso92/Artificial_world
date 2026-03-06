"""Acción de descansar."""

from tipos.enums import ResultadoAccion, TipoAccion

from agentes.pesos_utilidad import obtener_utilidad_base

from .accion_base import AccionBase


class AccionDescansar(AccionBase):
    """Descansar para recuperar energía."""

    def __init__(self, id_entidad: int):
        super().__init__(TipoAccion.DESCANSAR, id_entidad)

    def es_viable(self, entidad, contexto) -> bool:
        return True

    def calcular_utilidad_base(self, entidad, contexto) -> float:
        return obtener_utilidad_base("descansar")

    def ejecutar(self, entidad, contexto) -> ResultadoAccion:
        if contexto is None or contexto.configuracion is None:
            return ResultadoAccion.FALLO
        if entidad.estado_interno.energia >= 1.0:
            return ResultadoAccion.EXITO
        config = contexto.configuracion
        celda = contexto.mapa.obtener_celda(entidad.posicion) if contexto.mapa else None
        en_refugio = celda is not None and celda.tiene_refugio() and celda.refugio
        if en_refugio:
            celda.refugio.aplicar_beneficio_descanso(entidad.estado_interno)
        else:
            delta = getattr(config, "recuperacion_energia_descanso", 0.05)
            entidad.estado_interno.actualizar_energia(delta)
        if contexto and getattr(contexto, "bus_eventos", None):
            from tipos.modelos import EventoSistema
            from tipos.enums import TipoEvento
            contexto.bus_eventos.emitir(EventoSistema(
                tick=getattr(contexto, "tick_actual", 0),
                tipo=TipoEvento.DESCANSO,
                id_origen=entidad.id_entidad,
                id_objetivo=None,
                posicion=entidad.posicion,
                descripcion=f"{entidad.nombre} descanso",
            ))
        return ResultadoAccion.EXITO
