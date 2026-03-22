"""
Entidad gato: entidad no humana con lógica diferenciada.
"""

from tipos.enums import TipoEntidad, TipoRasgoGato
from tipos.modelos import DirectivaExterna, Posicion

from .entidad_base import EntidadBase


class EntidadGato(EntidadBase):
    """Gato: entidad no humana con prioridades distintas."""

    def __init__(
        self,
        id_entidad: int,
        nombre: str,
        rasgo_principal: TipoRasgoGato,
        posicion: Posicion,
        color: tuple[int, int, int] = (200, 150, 50),
        **kwargs
    ):
        super().__init__(
            id_entidad=id_entidad,
            tipo_entidad=TipoEntidad.GATO,
            nombre=nombre,
            color=color,
            posicion=posicion,
            **kwargs
        )
        self.rasgo_principal = rasgo_principal

    def puede_aceptar_directiva(self, directiva: DirectivaExterna) -> bool:
        """El gato interpreta distinto: más independiente."""
        return super().puede_aceptar_directiva(directiva)

    def obtener_resumen_debug(self) -> dict:
        """Incluye rasgo del gato."""
        resumen = super().obtener_resumen_debug()
        resumen["rasgo"] = self.rasgo_principal.value
        return resumen
