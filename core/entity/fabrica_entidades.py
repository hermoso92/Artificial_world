"""
Fábrica de entidades: crea entidades sociales y gato.
"""

import random

from tipos.enums import TipoRasgoGato, TipoRasgoSocial
from tipos.modelos import Posicion

from .entidad_gato import EntidadGato
from .entidad_social import EntidadSocial

NOMBRE_FUNDADOR = "Tryndamere"
COLOR_FUNDADOR = (180, 60, 80)


class FabricaEntidades:
    """Crea entidades iniciales."""

    def __init__(self, configuracion):
        self.configuracion = configuracion
        random.seed(configuracion.semilla_aleatoria)
        self._contador_id = 0

    def _siguiente_id(self) -> int:
        self._contador_id += 1
        return self._contador_id

    def _posicion_aleatoria_valida(
        self, mapa, posiciones_ocupadas: set | None = None
    ) -> Posicion:
        """Obtiene una posición no ocupada por otras entidades."""
        ocupadas = posiciones_ocupadas or set()
        for _ in range(200):
            x = random.randint(0, mapa.ancho - 1)
            y = random.randint(0, mapa.alto - 1)
            pos = Posicion(x, y)
            if pos not in ocupadas:
                return pos
        return Posicion(
            random.randint(0, mapa.ancho - 1),
            random.randint(0, mapa.alto - 1),
        )

    def crear_entidad_social(
        self,
        nombre: str,
        rasgo: TipoRasgoSocial,
        posicion: Posicion,
        color: tuple[int, int, int] = (100, 150, 200),
    ) -> EntidadSocial:
        """Crea una entidad social."""
        id_e = self._siguiente_id()
        return EntidadSocial(
            id_entidad=id_e,
            nombre=nombre,
            rasgo_principal=rasgo,
            posicion=posicion,
            color=color,
        )

    def crear_gato(
        self,
        nombre: str,
        rasgo: TipoRasgoGato,
        posicion: Posicion,
        color: tuple[int, int, int] = (200, 150, 50),
    ) -> EntidadGato:
        """Crea el gato."""
        id_e = self._siguiente_id()
        return EntidadGato(
            id_entidad=id_e,
            nombre=nombre,
            rasgo_principal=rasgo,
            posicion=posicion,
            color=color,
        )

    def crear_entidades_iniciales(self, mapa) -> list:
        """Crea las entidades iniciales y las coloca en el mapa."""
        entidades = []
        posiciones_ocupadas: set = set()
        rasgos_sociales = list(TipoRasgoSocial)
        nombres_sociales = ["Ana", "Bruno", "Clara", "David", "Eva", "Félix"]

        cantidad = self.configuracion.cantidad_entidades_sociales
        for i in range(cantidad):
            pos = self._posicion_aleatoria_valida(mapa, posiciones_ocupadas)
            posiciones_ocupadas.add(pos)
            rasgo = rasgos_sociales[i % len(rasgos_sociales)]
            nombre = nombres_sociales[i % len(nombres_sociales)]
            ent = self.crear_entidad_social(nombre, rasgo, pos)
            mapa.colocar_entidad(ent, pos)
            entidades.append(ent)

        if self.configuracion.incluir_gato:
            pos_gato = self._posicion_aleatoria_valida(mapa, posiciones_ocupadas)
            posiciones_ocupadas.add(pos_gato)
            gato = self.crear_gato(
                "Amiguisimo",
                TipoRasgoGato.CURIOSO,
                pos_gato,
            )
            mapa.colocar_entidad(gato, pos_gato)
            entidades.append(gato)

        if getattr(self.configuracion, "incluir_tryndamere", True):
            pos_fund = self._posicion_aleatoria_valida(mapa, posiciones_ocupadas)
            posiciones_ocupadas.add(pos_fund)
            fundador = self.crear_entidad_social(
                NOMBRE_FUNDADOR,
                TipoRasgoSocial.NEUTRAL,
                pos_fund,
                color=COLOR_FUNDADOR,
            )
            mapa.colocar_entidad(fundador, pos_fund)
            entidades.append(fundador)

        return entidades
