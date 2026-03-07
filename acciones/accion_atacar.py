"""
Acción de ataque: acercarse y aplicar daño al objetivo.

Versión mínima:
  - Si el objetivo está adyacente: aplicar daño y emitir evento.
  - Si salud del objetivo <= 0: marcar como inactivo (eliminado).
  - Si el objetivo no está en rango: el gestor sombra ya habrá movido primero;
    esta acción solo ejecuta el ataque cuando está en rango.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from tipos.enums import ResultadoAccion, TipoAccion, TipoEvento
from tipos.modelos import EventoSistema

from .accion_base import AccionBase

if TYPE_CHECKING:
    from nucleo.contexto import ContextoSimulacion

DAÑO_POR_ATAQUE = 0.25   # fracción de salud que se quita por ataque


class AccionAtacar(AccionBase):
    """Ataque directo a otra entidad. Requiere estar adyacente (dist Manhattan ≤ 1)."""

    def __init__(self, id_entidad: int, id_objetivo: int):
        super().__init__(TipoAccion.ATACAR, id_entidad)
        self.id_objetivo = id_objetivo

    def es_viable(self, entidad, contexto) -> bool:
        """Viable si el objetivo existe y está adyacente."""
        entidades = getattr(contexto, "entidades", [])
        obj = next((e for e in entidades if e.id_entidad == self.id_objetivo), None)
        if obj is None:
            return False
        dist = (
            abs(entidad.posicion.x - obj.posicion.x) +
            abs(entidad.posicion.y - obj.posicion.y)
        )
        return dist <= 1

    def calcular_utilidad_base(self, entidad, contexto) -> float:
        return 0.0  # No se usa en modo poseido; el gestor asigna 9.0

    def ejecutar(self, entidad, contexto: "ContextoSimulacion") -> ResultadoAccion:
        entidades = getattr(contexto, "entidades", [])
        obj = next((e for e in entidades if e.id_entidad == self.id_objetivo), None)
        if obj is None:
            return ResultadoAccion.NO_APLICA

        dist = (
            abs(entidad.posicion.x - obj.posicion.x) +
            abs(entidad.posicion.y - obj.posicion.y)
        )
        if dist > 1:
            return ResultadoAccion.FALLO

        # Aplicar daño
        salud_anterior = getattr(obj.estado_interno, "salud", 1.0)
        nueva_salud = max(0.0, salud_anterior - DAÑO_POR_ATAQUE)
        obj.estado_interno.salud = nueva_salud

        # Aumentar hostilidad del objetivo hacia el atacante
        if hasattr(obj, "relaciones"):
            rel = obj.relaciones.obtener_relacion(entidad.id_entidad)
            if rel:
                rel.hostilidad = min(1.0, rel.hostilidad + 0.4)
                rel.confianza = max(-1.0, rel.confianza - 0.3)

        eliminado = nueva_salud <= 0.0
        if eliminado:
            # Marcar como inactivo (no lo elimina de la lista, lo hace la simulación si decide)
            obj.estado_interno.activo = False

        tick = getattr(contexto, "tick_actual", 0)
        bus = getattr(contexto, "bus_eventos", None)
        if bus:
            bus.emitir(EventoSistema(
                tick=tick,
                tipo=TipoEvento.ATAQUE_EJECUTADO,
                id_origen=entidad.id_entidad,
                id_objetivo=self.id_objetivo,
                posicion=entidad.posicion,
                descripcion=(
                    f"[ATAQUE] {entidad.nombre} → {obj.nombre} "
                    f"salud:{salud_anterior:.2f}→{nueva_salud:.2f}"
                    + (" [ELIMINADO]" if eliminado else "")
                ),
                metadatos={
                    "daño": DAÑO_POR_ATAQUE,
                    "salud_anterior": salud_anterior,
                    "nueva_salud": nueva_salud,
                    "eliminado": eliminado,
                },
            ))

        return ResultadoAccion.EXITO
