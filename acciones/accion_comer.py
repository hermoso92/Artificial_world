"""Acción de comer."""

from tipos.enums import ResultadoAccion, TipoAccion, TipoRecurso

from agentes.pesos_utilidad import obtener_utilidad_base

from .accion_base import AccionBase


class AccionComer(AccionBase):
    """Consumir comida del inventario."""

    def __init__(self, id_entidad: int):
        super().__init__(TipoAccion.COMER, id_entidad)

    def es_viable(self, entidad, contexto) -> bool:
        return entidad.estado_interno.inventario.tiene(TipoRecurso.COMIDA, 1)

    def calcular_utilidad_base(self, entidad, contexto) -> float:
        return obtener_utilidad_base("comer")

    def ejecutar(self, entidad, contexto) -> ResultadoAccion:
        if not entidad.estado_interno.inventario.quitar(TipoRecurso.COMIDA, 1):
            return ResultadoAccion.FALLO
        reduccion = 0.30
        if contexto and contexto.configuracion:
            reduccion = getattr(
                contexto.configuracion, "reduccion_hambre_por_comida", 0.30
            )
        entidad.estado_interno.actualizar_hambre(-reduccion)
        if contexto and getattr(contexto, "bus_eventos", None):
            from tipos.modelos import EventoSistema
            from tipos.enums import TipoEvento
            contexto.bus_eventos.emitir(EventoSistema(
                tick=getattr(contexto, "tick_actual", 0),
                tipo=TipoEvento.COMIO,
                id_origen=entidad.id_entidad,
                id_objetivo=None,
                posicion=entidad.posicion,
                descripcion=f"{entidad.nombre} comio",
            ))
        return ResultadoAccion.EXITO
