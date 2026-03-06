"""
Entidad social: agente principal de la micro-sociedad.
"""

from tipos.enums import TipoEntidad, TipoRasgoSocial
from tipos.modelos import DirectivaExterna, Posicion

from agentes.relaciones import GestorRelaciones

from .entidad_base import EntidadBase


class EntidadSocial(EntidadBase):
    """Entidad con lógica social: relaciones, compartir, robar, etc."""

    def __init__(
        self,
        id_entidad: int,
        nombre: str,
        rasgo_principal: TipoRasgoSocial,
        posicion: Posicion,
        color: tuple[int, int, int] = (100, 150, 200),
        **kwargs
    ):
        super().__init__(
            id_entidad=id_entidad,
            tipo_entidad=TipoEntidad.SOCIAL,
            nombre=nombre,
            color=color,
            posicion=posicion,
            **kwargs
        )
        self.rasgo_principal = rasgo_principal
        self.relaciones = GestorRelaciones()

    def puede_aceptar_directiva(self, directiva: DirectivaExterna) -> bool:
        """Evalúa aceptación según rasgo y relaciones."""
        return super().puede_aceptar_directiva(directiva)

    def obtener_resumen_debug(self) -> dict:
        """Incluye rasgo y relaciones."""
        resumen = super().obtener_resumen_debug()
        resumen["rasgo"] = self.rasgo_principal.value
        resumen["relaciones"] = self.relaciones.serializar()
        return resumen
