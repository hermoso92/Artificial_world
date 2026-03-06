"""Acción de ir al refugio."""

from tipos.enums import ResultadoAccion, TipoAccion
from tipos.modelos import Posicion

from agentes.pesos_utilidad import obtener_utilidad_base

from .accion_base import AccionBase


class AccionIrRefugio(AccionBase):
    """Desplazarse a una celda vecina que tiene refugio."""

    def __init__(self, id_entidad: int, destino_x: int = 0, destino_y: int = 0):
        super().__init__(TipoAccion.IR_REFUGIO, id_entidad)
        self.destino_x = destino_x
        self.destino_y = destino_y

    def es_viable(self, entidad, contexto) -> bool:
        if contexto is None or contexto.mapa is None:
            return False
        destino = Posicion(self.destino_x, self.destino_y)
        vecinos = contexto.mapa.obtener_vecinos(entidad.posicion)
        if destino not in vecinos:
            return False
        celda = contexto.mapa.obtener_celda(destino)
        return celda is not None and celda.tiene_refugio()

    def calcular_utilidad_base(self, entidad, contexto) -> float:
        return obtener_utilidad_base("ir_refugio")

    def ejecutar(self, entidad, contexto) -> ResultadoAccion:
        if contexto is None or contexto.mapa is None:
            return ResultadoAccion.FALLO
        destino = Posicion(self.destino_x, self.destino_y)
        if not contexto.mapa.mover_entidad(entidad, destino):
            return ResultadoAccion.FALLO
        entidad.posicion_anterior = entidad.posicion
        entidad.posicion = destino
        celda = contexto.mapa.obtener_celda(destino)
        if celda and celda.tiene_refugio() and celda.refugio:
            celda.refugio.aplicar_beneficio_descanso(entidad.estado_interno)
        if contexto.configuracion:
            delta = getattr(
                contexto.configuracion, "decremento_energia_por_movimiento", 0.03
            )
            entidad.estado_interno.actualizar_energia(-delta)
        if contexto and getattr(contexto, "bus_eventos", None):
            from tipos.modelos import EventoSistema
            from tipos.enums import TipoEvento
            contexto.bus_eventos.emitir(EventoSistema(
                tick=getattr(contexto, "tick_actual", 0),
                tipo=TipoEvento.ENTRO_REFUGIO,
                id_origen=entidad.id_entidad,
                id_objetivo=None,
                posicion=entidad.posicion,
                descripcion=f"{entidad.nombre} entro al refugio",
            ))
        return ResultadoAccion.EXITO
