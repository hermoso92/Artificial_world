"""
Sistema de regeneración de recursos del mundo.
"""

import random

from tipos.enums import TipoRecurso
from tipos.modelos import Posicion

from mundo.recurso import Recurso


class SistemaRegeneracion:
    """Regenera comida y material en el mapa."""

    def actualizar(self, mapa, tick_actual: int, configuracion) -> None:
        """Actualiza el mundo (regeneración según reglas)."""
        ticks_reg = getattr(configuracion, "ticks_entre_regeneracion", 30)
        if ticks_reg <= 0 or tick_actual % ticks_reg != 0:
            return

        celdas_vacias = [
            (x, y) for (x, y), celda in mapa.celdas.items()
            if celda.recurso is None
        ]
        if not celdas_vacias:
            return

        random.seed(configuracion.semilla_aleatoria + tick_actual)
        cant_comida = getattr(configuracion, "cantidad_regeneracion_comida", 3)
        cant_material = getattr(configuracion, "cantidad_regeneracion_material", 1)

        for _ in range(cant_comida):
            if not celdas_vacias:
                break
            idx = random.randint(0, len(celdas_vacias) - 1)
            x, y = celdas_vacias.pop(idx)
            mapa.colocar_recurso(Posicion(x, y), Recurso(TipoRecurso.COMIDA, 1))

        celdas_vacias = [
            (x, y) for (x, y), celda in mapa.celdas.items()
            if celda.recurso is None
        ]
        for _ in range(cant_material):
            if not celdas_vacias:
                break
            idx = random.randint(0, len(celdas_vacias) - 1)
            x, y = celdas_vacias.pop(idx)
            mapa.colocar_recurso(Posicion(x, y), Recurso(TipoRecurso.MATERIAL, 1))
