"""Acción de robar recursos a otra entidad.

Robo real con consecuencias:
  - Quita comida al objetivo y la añade al ladrón
  - La víctima aumenta miedo y hostilidad hacia el ladrón
  - El ladrón gana utilidad a corto plazo pero pierde confianza social
  - Si la víctima tiene rasgo AGRESIVO puede reaccionar (futuro: contraataque)
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from tipos.enums import ResultadoAccion, TipoAccion, TipoEvento, TipoRecurso
from tipos.modelos import EventoSistema

from .accion_base import AccionBase

if TYPE_CHECKING:
    from nucleo.contexto import ContextoSimulacion

CANTIDAD_ROBADA = 1


class AccionRobar(AccionBase):
    """Intentar robar recurso a otra entidad."""

    def __init__(self, id_entidad: int, id_objetivo: int = 0):
        super().__init__(TipoAccion.ROBAR, id_entidad)
        self.id_objetivo = id_objetivo

    def es_viable(self, entidad, contexto) -> bool:
        """Solo viable si hay una entidad cercana con comida en el inventario."""
        if contexto is None:
            return False
        entidades_cercanas = self._obtener_cercanas(entidad, contexto)
        for otra in entidades_cercanas:
            inv = getattr(getattr(otra, "estado_interno", None), "inventario", None)
            comida = getattr(inv, "comida", 0) if inv else 0
            if comida > 0:
                self.id_objetivo = otra.id_entidad
                return True
        return False

    def calcular_utilidad_base(self, entidad, contexto) -> float:
        from agentes.pesos_utilidad import obtener_utilidad_base
        return obtener_utilidad_base("robar")

    def ejecutar(self, entidad, contexto: "ContextoSimulacion") -> ResultadoAccion:
        entidades = getattr(contexto, "entidades", [])
        objetivo = next((e for e in entidades if e.id_entidad == self.id_objetivo), None)

        if objetivo is None:
            # Buscar por proximidad si el id_objetivo no es válido
            cercanas = self._obtener_cercanas(entidad, contexto)
            for otra in cercanas:
                inv = getattr(getattr(otra, "estado_interno", None), "inventario", None)
                if inv and inv.comida > 0:
                    objetivo = otra
                    self.id_objetivo = otra.id_entidad
                    break

        if objetivo is None:
            return ResultadoAccion.NO_APLICA

        inv_obj = objetivo.estado_interno.inventario
        if not inv_obj.tiene(TipoRecurso.COMIDA, CANTIDAD_ROBADA):
            return ResultadoAccion.FALLO

        # Transferir
        inv_obj.quitar(TipoRecurso.COMIDA, CANTIDAD_ROBADA)
        entidad.estado_interno.inventario.agregar(TipoRecurso.COMIDA, CANTIDAD_ROBADA)

        # Consecuencias en relaciones
        if hasattr(objetivo, "relaciones"):
            objetivo.relaciones.registrar_interaccion_negativa(entidad.id_entidad, magnitud=2.0)
            # Víctima aumenta riesgo percibido
            objetivo.estado_interno.riesgo_percibido = min(
                1.0, objetivo.estado_interno.riesgo_percibido + 0.25
            )

        if hasattr(entidad, "relaciones"):
            # El ladrón pierde confianza de terceros (degradación social)
            entidad.relaciones.ajustar_confianza(objetivo.id_entidad, -0.20)
            entidad.relaciones.ajustar_utilidad(objetivo.id_entidad, +0.10)

        # Emitir evento
        tick = getattr(contexto, "tick_actual", 0)
        bus = getattr(contexto, "bus_eventos", None)
        if bus:
            bus.emitir(EventoSistema(
                tick=tick,
                tipo=TipoEvento.ROBO,
                id_origen=entidad.id_entidad,
                id_objetivo=objetivo.id_entidad,
                posicion=entidad.posicion,
                descripcion=(
                    f"{entidad.nombre} roba {CANTIDAD_ROBADA} comida "
                    f"a {objetivo.nombre}"
                ),
                metadatos={"cantidad": CANTIDAD_ROBADA},
            ))

        return ResultadoAccion.EXITO

    def _obtener_cercanas(self, entidad, contexto) -> list:
        """Devuelve lista de entidades cercanas (no tuplas)."""
        if contexto is None:
            return []
        entidades = getattr(contexto, "entidades", []) or []
        if contexto.percepcion_local:
            raw = getattr(contexto.percepcion_local, "entidades_visibles", [])
            if not raw:
                return []
            primer = raw[0]
            if hasattr(primer, "id_entidad"):
                return [e for e in raw if e.id_entidad != entidad.id_entidad]
            resultado = []
            for _pos, ids in raw:
                for id_e in ids:
                    if id_e != entidad.id_entidad:
                        e = next((x for x in entidades if x.id_entidad == id_e), None)
                        if e and e not in resultado:
                            resultado.append(e)
            return resultado
        return [e for e in entidades if e.id_entidad != entidad.id_entidad]
