"""
Gestión de directivas externas.
Las directivas modifican utilidades, no se ejecutan ciegamente.
"""

from tipos.enums import EstadoDirectiva
from tipos.modelos import DirectivaExterna


class GestorDirectivas:
    """Gestiona las directivas activas de una entidad."""

    def __init__(self):
        self.directivas_activas: list[DirectivaExterna] = []

    def agregar_directiva(self, directiva: DirectivaExterna) -> None:
        """Añade una directiva."""
        self.directivas_activas.append(directiva)

    def eliminar_directiva(self, id_directiva: int) -> None:
        """Elimina una directiva por ID."""
        self.directivas_activas = [
            d for d in self.directivas_activas if d.id_directiva != id_directiva
        ]

    def obtener_directivas_activas(self, tick_actual: int) -> list[DirectivaExterna]:
        """Obtiene directivas activas y no expiradas."""
        self.filtrar_directivas_expiradas(tick_actual)
        return [d for d in self.directivas_activas if d.esta_activa(tick_actual)]

    def filtrar_directivas_expiradas(self, tick_actual: int) -> None:
        """Elimina directivas expiradas."""
        self.directivas_activas = [
            d for d in self.directivas_activas if not d.ha_expirado(tick_actual)
        ]

    def evaluar_aceptacion(self, entidad, directiva: DirectivaExterna) -> EstadoDirectiva:
        """Evalúa si la entidad puede aceptar la directiva."""
        # Por ahora devuelve ACEPTADA; la lógica completa se implementa en Fase 6
        if entidad.estado_interno.esta_critico():
            return EstadoDirectiva.APLAZADA
        return EstadoDirectiva.ACEPTADA

    def explicar_conflicto_directiva(
        self, entidad, directiva: DirectivaExterna
    ) -> str:
        """Explica por qué una directiva podría ser conflictiva."""
        if entidad.estado_interno.esta_critico():
            return "Estado crítico: hambre o energía extremas"
        return ""
