"""Acción de recoger material."""

from tipos.enums import ResultadoAccion, TipoAccion, TipoRecurso

from .accion_base import AccionBase


class AccionRecogerMaterial(AccionBase):
    """Recoger material de la celda actual."""

    def __init__(self, id_entidad: int):
        super().__init__(TipoAccion.RECOGER_MATERIAL, id_entidad)

    def es_viable(self, entidad, contexto) -> bool:
        if contexto is None or contexto.mapa is None:
            return False
        celda = contexto.mapa.obtener_celda(entidad.posicion)
        return (
            celda is not None
            and celda.tiene_recurso()
            and celda.recurso is not None
            and celda.recurso.tipo == TipoRecurso.MATERIAL
        )

    def calcular_utilidad_base(self, entidad, contexto) -> float:
        from agentes.pesos_utilidad import obtener_utilidad_base
        return obtener_utilidad_base("recoger_material")

    def ejecutar(self, entidad, contexto) -> ResultadoAccion:
        if contexto is None or contexto.mapa is None:
            return ResultadoAccion.FALLO
        recurso = contexto.mapa.retirar_recurso(entidad.posicion)
        if recurso is None or recurso.tipo != TipoRecurso.MATERIAL:
            return ResultadoAccion.FALLO
        cantidad = recurso.consumir(1)
        entidad.estado_interno.inventario.agregar(TipoRecurso.MATERIAL, cantidad)
        if recurso.cantidad > 0:
            contexto.mapa.colocar_recurso(entidad.posicion, recurso)
        if contexto and getattr(contexto, "bus_eventos", None):
            from tipos.modelos import EventoSistema
            from tipos.enums import TipoEvento
            contexto.bus_eventos.emitir(EventoSistema(
                tick=getattr(contexto, "tick_actual", 0),
                tipo=TipoEvento.RECOGIO_RECURSO,
                id_origen=entidad.id_entidad,
                id_objetivo=None,
                posicion=entidad.posicion,
                descripcion=f"{entidad.nombre} recogio material",
            ))
        return ResultadoAccion.EXITO
