"""
Gestión de relaciones entre entidades.
"""

from tipos.modelos import RelacionSocial


class GestorRelaciones:
    """Gestiona las relaciones de una entidad con otras."""

    def __init__(self):
        self.relaciones_por_entidad: dict[int, RelacionSocial] = {}

    def obtener_relacion(self, id_entidad: int) -> RelacionSocial:
        """Obtiene la relación con una entidad, creándola si no existe."""
        if id_entidad not in self.relaciones_por_entidad:
            self.relaciones_por_entidad[id_entidad] = RelacionSocial()
        return self.relaciones_por_entidad[id_entidad]

    def ajustar_confianza(self, id_entidad: int, delta: float) -> None:
        """Ajusta la confianza hacia una entidad."""
        rel = self.obtener_relacion(id_entidad)
        rel.confianza = max(0.0, min(1.0, rel.confianza + delta))

    def ajustar_miedo(self, id_entidad: int, delta: float) -> None:
        """Ajusta el miedo hacia una entidad."""
        rel = self.obtener_relacion(id_entidad)
        rel.miedo = max(0.0, min(1.0, rel.miedo + delta))

    def ajustar_hostilidad(self, id_entidad: int, delta: float) -> None:
        """Ajusta la hostilidad hacia una entidad."""
        rel = self.obtener_relacion(id_entidad)
        rel.hostilidad = max(0.0, min(1.0, rel.hostilidad + delta))

    def ajustar_utilidad(self, id_entidad: int, delta: float) -> None:
        """Ajusta la utilidad percibida de una entidad."""
        rel = self.obtener_relacion(id_entidad)
        rel.utilidad_percibida = max(0.0, min(1.0, rel.utilidad_percibida + delta))

    def registrar_interaccion_positiva(self, id_entidad: int, magnitud: float = 1.0) -> None:
        """Registra una interacción positiva."""
        self.ajustar_confianza(id_entidad, 0.15 * magnitud)
        self.ajustar_utilidad(id_entidad, 0.10 * magnitud)

    def registrar_interaccion_negativa(self, id_entidad: int, magnitud: float = 1.0) -> None:
        """Registra una interacción negativa."""
        self.ajustar_hostilidad(id_entidad, 0.25 * magnitud)
        self.ajustar_miedo(id_entidad, 0.10 * magnitud)

    def obtener_entidades_hostiles(self) -> list[int]:
        """Obtiene IDs de entidades con hostilidad alta."""
        return [
            id_e for id_e, rel in self.relaciones_por_entidad.items()
            if rel.hostilidad >= 0.5
        ]

    def obtener_entidades_confiables(self) -> list[int]:
        """Obtiene IDs de entidades con confianza alta."""
        return [
            id_e for id_e, rel in self.relaciones_por_entidad.items()
            if rel.confianza >= 0.5
        ]

    def serializar(self) -> dict:
        """Serializa las relaciones para persistencia."""
        return {
            str(id_e): {
                "confianza": rel.confianza,
                "miedo": rel.miedo,
                "hostilidad": rel.hostilidad,
                "utilidad_percibida": rel.utilidad_percibida,
            }
            for id_e, rel in self.relaciones_por_entidad.items()
        }
