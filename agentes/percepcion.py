"""
Sistema de percepción del entorno.
"""

from typing import TYPE_CHECKING

from tipos.modelos import PercepcionLocal, Posicion

if TYPE_CHECKING:
    from entidades.entidad_base import EntidadBase
    from mundo.mapa import Mapa


class SistemaPercepcion:
    """Construye la percepción local de una entidad."""

    @staticmethod
    def percibir(
        mapa: "Mapa", entidad: "EntidadBase", radio: int
    ) -> PercepcionLocal:
        """Construye la percepción del entorno para la entidad."""
        recursos = mapa.obtener_recursos_en_radio(entidad.posicion, radio)
        refugios = mapa.obtener_refugios_en_radio(entidad.posicion, radio)
        entidades_info = mapa.obtener_entidades_en_radio(entidad.posicion, radio)
        vecinos = mapa.obtener_vecinos(entidad.posicion)
        amenaza = SistemaPercepcion.calcular_amenaza_local(
            entidad, entidades_info
        )
        return PercepcionLocal(
            recursos_visibles=recursos,
            refugios_visibles=refugios,
            entidades_visibles=entidades_info,
            posiciones_vecinas=vecinos,
            amenaza_local=amenaza,
        )

    @staticmethod
    def calcular_amenaza_local(
        entidad: "EntidadBase", entidades_visibles: list
    ) -> float:
        """Calcula el nivel de amenaza percibido."""
        if not entidades_visibles:
            return 0.0
        # Por ahora simplificado: si hay entidades hostiles cerca, sube amenaza
        if hasattr(entidad, "relaciones") and entidad.relaciones:
            amenaza = 0.0
            for _, ids in entidades_visibles:
                for id_e in ids:
                    if id_e != entidad.id_entidad:
                        rel = entidad.relaciones.obtener_relacion(id_e)
                        amenaza = max(amenaza, rel.hostilidad * 0.5 + rel.miedo * 0.5)
            return min(1.0, amenaza)
        return 0.0
