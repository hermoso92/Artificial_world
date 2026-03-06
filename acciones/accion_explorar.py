"""Acción de exploración."""

import random

from agentes.pesos_utilidad import obtener_utilidad_base
from tipos.enums import ResultadoAccion, TipoAccion
from tipos.modelos import Posicion

from .accion_base import AccionBase


def _contar_visitas_posicion(memoria, posicion: Posicion) -> int:
    """Cuenta cuántas veces la posición aparece en recuerdos espaciales."""
    if not memoria or not memoria.recuerdos_espaciales:
        return 0
    return sum(
        1 for r in memoria.recuerdos_espaciales
        if r.posicion.x == posicion.x and r.posicion.y == posicion.y
    )


def _elegir_vecino_menos_visitado(entidad, contexto) -> Posicion | None:
    """Elige el vecino con menos recuerdos espaciales (menos visitado)."""
    if contexto is None or contexto.mapa is None:
        return None
    vecinos = contexto.mapa.obtener_vecinos(entidad.posicion)
    if not vecinos:
        return None
    memoria = getattr(entidad, "memoria", None)
    conteos = [(v, _contar_visitas_posicion(memoria, v)) for v in vecinos]
    minimo = min(c for _, c in conteos)
    candidatos = [v for v, c in conteos if c == minimo]
    return random.choice(candidatos) if candidatos else vecinos[0]


class AccionExplorar(AccionBase):
    """Explorar zona menos conocida."""

    def __init__(self, id_entidad: int):
        super().__init__(TipoAccion.EXPLORAR, id_entidad)

    def es_viable(self, entidad, contexto) -> bool:
        if contexto is None or contexto.mapa is None:
            return False
        return len(contexto.mapa.obtener_vecinos(entidad.posicion)) > 0

    def calcular_utilidad_base(self, entidad, contexto) -> float:
        return obtener_utilidad_base("explorar")

    def ejecutar(self, entidad, contexto) -> ResultadoAccion:
        destino = _elegir_vecino_menos_visitado(entidad, contexto)
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
                tipo=TipoEvento.SIGUIO,
                id_origen=entidad.id_entidad,
                id_objetivo=None,
                posicion=entidad.posicion,
                descripcion=f"{entidad.nombre} exploro ({destino.x},{destino.y})",
            ))
        return ResultadoAccion.EXITO
