"""
Mapa: gestión del mundo 2D.
"""

from typing import TYPE_CHECKING

from tipos.modelos import Posicion

from .celda import Celda
from .recurso import Recurso
from .terreno import TipoTerreno

if TYPE_CHECKING:
    from entidades.entidad_base import EntidadBase


def _refugio_cls():
    from core.shelter.refugio import Refugio
    return Refugio


class Mapa:
    """Gestiona el grid 2D, celdas, recursos, refugios y entidades."""

    def __init__(self, ancho: int, alto: int):
        self.ancho = ancho
        self.alto = alto
        self.celdas: dict[tuple[int, int], Celda] = {}
        self._inicializar_celdas()

    def _inicializar_celdas(self) -> None:
        """Crea todas las celdas del mapa."""
        for x in range(self.ancho):
            for y in range(self.alto):
                pos = Posicion(x, y)
                self.celdas[(x, y)] = Celda(pos, TipoTerreno.NORMAL)

    def es_posicion_valida(self, posicion: Posicion) -> bool:
        """Indica si la posición está dentro del mapa."""
        return 0 <= posicion.x < self.ancho and 0 <= posicion.y < self.alto

    def obtener_celda(self, posicion: Posicion) -> Celda | None:
        """Obtiene la celda en la posición, o None si es inválida."""
        if not self.es_posicion_valida(posicion):
            return None
        return self.celdas.get((posicion.x, posicion.y))

    def obtener_vecinos(self, posicion: Posicion) -> list[Posicion]:
        """Obtiene posiciones vecinas válidas (4 direcciones)."""
        vecinos = []
        for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            vecino = Posicion(posicion.x + dx, posicion.y + dy)
            if self.es_posicion_valida(vecino):
                vecinos.append(vecino)
        return vecinos

    def colocar_recurso(self, posicion: Posicion, recurso: Recurso) -> bool:
        """Coloca un recurso en la celda."""
        celda = self.obtener_celda(posicion)
        if celda is None:
            return False
        celda.recurso = recurso
        return True

    def retirar_recurso(self, posicion: Posicion) -> Recurso | None:
        """Retira el recurso de la celda y lo devuelve."""
        celda = self.obtener_celda(posicion)
        if celda is None or celda.recurso is None:
            return None
        recurso = celda.recurso
        celda.recurso = None
        return recurso

    def colocar_refugio(self, posicion: Posicion, refugio) -> bool:
        """Coloca un refugio en la celda."""
        celda = self.obtener_celda(posicion)
        if celda is None:
            return False
        celda.refugio = refugio
        return True

    def colocar_entidad(self, entidad: "EntidadBase", posicion: Posicion) -> bool:
        """Coloca una entidad en la posición."""
        celda = self.obtener_celda(posicion)
        if celda is None:
            return False
        celda.agregar_entidad(entidad.id_entidad)
        return True

    def quitar_entidad(self, entidad: "EntidadBase") -> bool:
        """Quita una entidad del mapa (p. ej. al morir)."""
        celda = self.obtener_celda(entidad.posicion)
        if celda is None:
            return False
        celda.quitar_entidad(entidad.id_entidad)
        return True

    def mover_entidad(self, entidad: "EntidadBase", nueva_posicion: Posicion) -> bool:
        """Mueve una entidad a una nueva posición."""
        celda_actual = self.obtener_celda(entidad.posicion)
        celda_nueva = self.obtener_celda(nueva_posicion)
        if celda_actual is None or celda_nueva is None:
            return False
        celda_actual.quitar_entidad(entidad.id_entidad)
        celda_nueva.agregar_entidad(entidad.id_entidad)
        return True

    def obtener_entidades_en_radio(
        self, posicion: Posicion, radio: int
    ) -> list[tuple[Posicion, list[int]]]:
        """Obtiene celdas con entidades dentro del radio."""
        resultado = []
        for x in range(
            max(0, posicion.x - radio), min(self.ancho, posicion.x + radio + 1)
        ):
            for y in range(
                max(0, posicion.y - radio), min(self.alto, posicion.y + radio + 1)
            ):
                pos = Posicion(x, y)
                celda = self.obtener_celda(pos)
                if celda and celda.ids_entidades:
                    dist = posicion.distancia_manhattan(pos)
                    if dist <= radio and dist > 0:
                        resultado.append((pos, celda.ids_entidades.copy()))
        return resultado

    def obtener_recursos_en_radio(
        self, posicion: Posicion, radio: int
    ) -> list[tuple[Posicion, Recurso]]:
        """Obtiene recursos visibles dentro del radio."""
        resultado = []
        for x in range(
            max(0, posicion.x - radio), min(self.ancho, posicion.x + radio + 1)
        ):
            for y in range(
                max(0, posicion.y - radio), min(self.alto, posicion.y + radio + 1)
            ):
                pos = Posicion(x, y)
                celda = self.obtener_celda(pos)
                if celda and celda.tiene_recurso() and celda.recurso:
                    dist = posicion.distancia_manhattan(pos)
                    if dist <= radio:
                        resultado.append((pos, celda.recurso))
        return resultado

    def obtener_refugios_en_radio(
        self, posicion: Posicion, radio: int
    ) -> list[tuple[Posicion, object]]:
        """Obtiene refugios visibles dentro del radio."""
        resultado = []
        for x in range(
            max(0, posicion.x - radio), min(self.ancho, posicion.x + radio + 1)
        ):
            for y in range(
                max(0, posicion.y - radio), min(self.alto, posicion.y + radio + 1)
            ):
                pos = Posicion(x, y)
                celda = self.obtener_celda(pos)
                if celda and celda.tiene_refugio() and celda.refugio:
                    dist = posicion.distancia_manhattan(pos)
                    if dist <= radio:
                        resultado.append((pos, celda.refugio))
        return resultado
