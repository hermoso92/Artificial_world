"""Acción de seguir a otra entidad.

Implementación real:
  - Mueve la entidad un paso hacia el objetivo
  - Si ya está adyacente, registra la interacción positiva sin moverse
  - Actualiza relaciones: aumenta confianza entre ambos
  - Emite evento SIGUIO
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from tipos.enums import ResultadoAccion, TipoAccion, TipoEvento
from tipos.modelos import EventoSistema, Posicion

from .accion_base import AccionBase

if TYPE_CHECKING:
    from nucleo.contexto import ContextoSimulacion


class AccionSeguir(AccionBase):
    """Seguir o mantenerse cerca de otra entidad."""

    def __init__(self, id_entidad: int, id_objetivo: int = 0):
        super().__init__(TipoAccion.SEGUIR, id_entidad)
        self.id_objetivo = id_objetivo

    def es_viable(self, entidad, contexto) -> bool:
        if contexto is None:
            return False
        cercanas = self._obtener_cercanas(entidad, contexto)
        return len(cercanas) > 0

    def calcular_utilidad_base(self, entidad, contexto) -> float:
        from agentes.pesos_utilidad import obtener_utilidad_base
        return obtener_utilidad_base("seguir")

    def ejecutar(self, entidad, contexto: "ContextoSimulacion") -> ResultadoAccion:
        entidades = getattr(contexto, "entidades", [])
        objetivo = next((e for e in entidades if e.id_entidad == self.id_objetivo), None)

        if objetivo is None:
            # Buscar el más cercano compatible
            cercanas = self._obtener_cercanas(entidad, contexto)
            if not cercanas:
                return ResultadoAccion.NO_APLICA
            objetivo = min(
                cercanas,
                key=lambda e: abs(e.posicion.x - entidad.posicion.x)
                              + abs(e.posicion.y - entidad.posicion.y)
            )
            self.id_objetivo = objetivo.id_entidad

        pos = entidad.posicion
        pos_obj = objetivo.posicion
        dist = abs(pos.x - pos_obj.x) + abs(pos.y - pos_obj.y)

        if dist <= 1:
            # Ya adyacente: interacción social positiva sin moverse
            if hasattr(entidad, "relaciones"):
                entidad.relaciones.registrar_interaccion_positiva(objetivo.id_entidad, magnitud=0.5)
            if hasattr(objetivo, "relaciones"):
                objetivo.relaciones.registrar_interaccion_positiva(entidad.id_entidad, magnitud=0.3)
        else:
            # Mover un paso hacia el objetivo
            destino = self._paso_hacia(pos, pos_obj, contexto)
            if destino and contexto.mapa and contexto.mapa.es_posicion_valida(destino):
                entidad.posicion_anterior = entidad.posicion
                contexto.mapa.mover_entidad(entidad, destino)
                entidad.posicion = destino
                # Leve aumento de confianza por seguir
                if hasattr(entidad, "relaciones"):
                    entidad.relaciones.ajustar_confianza(objetivo.id_entidad, 0.03)

        # Emitir evento
        tick = getattr(contexto, "tick_actual", 0)
        bus = getattr(contexto, "bus_eventos", None)
        if bus:
            bus.emitir(EventoSistema(
                tick=tick,
                tipo=TipoEvento.SIGUIO,
                id_origen=entidad.id_entidad,
                id_objetivo=objetivo.id_entidad,
                posicion=entidad.posicion,
                descripcion=f"{entidad.nombre} sigue a {objetivo.nombre}",
                metadatos={"distancia": dist},
            ))

        return ResultadoAccion.EXITO

    def _paso_hacia(self, pos: Posicion, destino: Posicion, contexto) -> Posicion | None:
        """Devuelve el paso vecino que acerca más a destino."""
        vecinos = []
        if contexto and contexto.percepcion_local:
            vecinos = list(contexto.percepcion_local.posiciones_vecinas)
        if not vecinos:
            for dx, dy in [(0, -1), (0, 1), (-1, 0), (1, 0)]:
                vecinos.append(Posicion(pos.x + dx, pos.y + dy))

        candidatos = []
        for v in vecinos:
            d = abs(v.x - destino.x) + abs(v.y - destino.y)
            candidatos.append((d, v))

        if not candidatos:
            return None
        candidatos.sort(key=lambda t: t[0])
        dist_actual = abs(pos.x - destino.x) + abs(pos.y - destino.y)
        if candidatos[0][0] >= dist_actual:
            return None
        return candidatos[0][1]

    def _obtener_cercanas(self, entidad, contexto) -> list:
        if contexto is None:
            return []
        if contexto.percepcion_local:
            entidades_raw = getattr(contexto.percepcion_local, "entidades_visibles", [])
            directas = []
            ids_cercanos: set[int] = set()
            for item in entidades_raw:
                if hasattr(item, "id_entidad"):
                    if item.id_entidad != entidad.id_entidad:
                        directas.append(item)
                else:
                    _, ids = item
                    ids_cercanos.update(ids)
            if directas:
                return directas
            if ids_cercanos:
                ids_cercanos.discard(entidad.id_entidad)
                todas = getattr(contexto, "entidades", [])
                return [e for e in todas if e.id_entidad in ids_cercanos]
            return []
        return [e for e in (getattr(contexto, "entidades", []) or [])
                if e.id_entidad != entidad.id_entidad]
