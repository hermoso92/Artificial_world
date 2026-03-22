"""Acción de compartir recursos con entidades cercanas."""

from __future__ import annotations

from typing import TYPE_CHECKING

from tipos.enums import ResultadoAccion, TipoAccion, TipoEvento, TipoRecurso
from tipos.modelos import EventoSistema

from .accion_base import AccionBase

if TYPE_CHECKING:
    from nucleo.contexto import ContextoSimulacion

CANTIDAD_COMPARTIDA = 1   # unidades de comida que se transfieren


class AccionCompartir(AccionBase):
    """Dar 1 unidad de comida a la entidad cercana con más hambre."""

    def __init__(self, id_entidad: int, id_objetivo: int = 0):
        super().__init__(TipoAccion.COMPARTIR, id_entidad)
        self.id_objetivo = id_objetivo

    def es_viable(self, entidad, contexto) -> bool:
        """Viable si tiene comida y hay alguien cercano con hambre."""
        if not entidad.estado_interno.inventario.tiene(TipoRecurso.COMIDA, CANTIDAD_COMPARTIDA):
            return False
        entidades_cercanas = self._obtener_cercanas(entidad, contexto)
        for otra in entidades_cercanas:
            if otra.estado_interno.hambre >= 0.5:
                return True
        return False

    def calcular_utilidad_base(self, entidad, contexto) -> float:
        from agentes.pesos_utilidad import obtener_utilidad_base
        return obtener_utilidad_base("compartir")

    def ejecutar(self, entidad, contexto: "ContextoSimulacion") -> ResultadoAccion:
        entidades_cercanas = self._obtener_cercanas(entidad, contexto)
        # Elegir la entidad más hambrienta cercana
        candidatas = [
            e for e in entidades_cercanas
            if e.estado_interno.hambre >= 0.5
        ]
        if not candidatas:
            return ResultadoAccion.NO_APLICA
        objetivo = max(candidatas, key=lambda e: e.estado_interno.hambre)

        # Transferir comida
        if not entidad.estado_interno.inventario.quitar(TipoRecurso.COMIDA, CANTIDAD_COMPARTIDA):
            return ResultadoAccion.FALLO
        objetivo.estado_interno.inventario.agregar(TipoRecurso.COMIDA, CANTIDAD_COMPARTIDA)

        # Actualizar relaciones bilaterales
        if hasattr(entidad, "relaciones"):
            entidad.relaciones.registrar_interaccion_positiva(objetivo.id_entidad, magnitud=1.2)
        if hasattr(objetivo, "relaciones"):
            objetivo.relaciones.registrar_interaccion_positiva(entidad.id_entidad, magnitud=1.5)

        # Actualizar riesgo: compartir reduce miedo percibido
        entidad.estado_interno.riesgo_percibido = max(
            0.0, entidad.estado_interno.riesgo_percibido - 0.05
        )

        # Emitir evento
        tick = getattr(contexto, "tick_actual", 0)
        bus = getattr(contexto, "bus_eventos", None)
        if bus:
            bus.emitir(EventoSistema(
                tick=tick,
                tipo=TipoEvento.COMPARTIO,
                id_origen=entidad.id_entidad,
                id_objetivo=objetivo.id_entidad,
                posicion=entidad.posicion,
                descripcion=(
                    f"{entidad.nombre} comparte {CANTIDAD_COMPARTIDA} comida "
                    f"con {objetivo.nombre} (hambre={objetivo.estado_interno.hambre:.2f})"
                ),
                metadatos={"cantidad": CANTIDAD_COMPARTIDA},
            ))

        self.id_objetivo = objetivo.id_entidad
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
