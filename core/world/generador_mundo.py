"""
Generador de mundo inicial.
"""

from tipos.enums import TipoRecurso
from tipos.modelos import Posicion

from core.shelter.refugio import Refugio
from .mapa import Mapa
from .recurso import Recurso
from .zona import Zona


class GeneradorMundo:
    """Crea el mundo inicial con recursos y refugios."""

    def __init__(self, configuracion):
        self.configuracion = configuracion

    def generar_mapa(self) -> Mapa:
        """Genera un mapa con las dimensiones configuradas."""
        ancho = self.configuracion.ancho_mapa
        alto = self.configuracion.alto_mapa
        if ancho < 2 or alto < 2:
            raise ValueError(
                f"Mapa mínimo 2x2: ancho={ancho}, alto={alto}. "
                "Con mapa 1x1 las entidades no tienen vecinos y se quedan pilladas."
            )
        return Mapa(ancho, alto)

    def distribuir_comida(self, mapa: Mapa, cantidad: int | None = None) -> None:
        """Distribuye comida en el mapa."""
        cantidad = cantidad or self.configuracion.cantidad_comida_inicial
        self._distribuir_recurso(mapa, TipoRecurso.COMIDA, cantidad)

    def distribuir_material(self, mapa: Mapa, cantidad: int | None = None) -> None:
        """Distribuye material en el mapa."""
        cantidad = cantidad or self.configuracion.cantidad_material_inicial
        self._distribuir_recurso(mapa, TipoRecurso.MATERIAL, cantidad)

    def _distribuir_recurso(
        self, mapa: Mapa, tipo: TipoRecurso, cantidad: int
    ) -> None:
        """Distribuye un tipo de recurso en posiciones aleatorias."""
        import random
        random.seed(self.configuracion.semilla_aleatoria)
        colocados = 0
        intentos = 0
        max_intentos = cantidad * 10
        while colocados < cantidad and intentos < max_intentos:
            x = random.randint(0, mapa.ancho - 1)
            y = random.randint(0, mapa.alto - 1)
            pos = Posicion(x, y)
            celda = mapa.obtener_celda(pos)
            if celda and celda.recurso is None:
                mapa.colocar_recurso(pos, Recurso(tipo, 1))
                colocados += 1
            intentos += 1

    def distribuir_refugios(self, mapa: Mapa, cantidad: int | None = None) -> None:
        """Distribuye refugios en el mapa."""
        cantidad = cantidad or self.configuracion.cantidad_refugios
        import random
        random.seed(self.configuracion.semilla_aleatoria + 1)
        colocados = 0
        intentos = 0
        max_intentos = cantidad * 10
        while colocados < cantidad and intentos < max_intentos:
            x = random.randint(0, mapa.ancho - 1)
            y = random.randint(0, mapa.alto - 1)
            pos = Posicion(x, y)
            celda = mapa.obtener_celda(pos)
            if celda and celda.refugio is None and celda.recurso is None:
                mapa.colocar_refugio(pos, Refugio(colocados))
                colocados += 1
            intentos += 1

    def crear_zonas(self, mapa: Mapa) -> list:
        """Crea 2-3 zonas de ejemplo basadas en areas del mapa."""
        zonas = []
        ancho, alto = mapa.ancho, mapa.alto
        if ancho < 4 or alto < 4:
            return zonas
        # Zona noroeste (esquina superior izquierda)
        w1 = max(1, ancho // 3)
        h1 = max(1, alto // 3)
        pos_noroeste = [Posicion(x, y) for x in range(w1) for y in range(h1)]
        zonas.append(Zona(id_zona=1, nombre="Noroeste", posiciones=pos_noroeste))
        # Zona centro
        cx1, cx2 = ancho // 4, 3 * ancho // 4
        cy1, cy2 = alto // 4, 3 * alto // 4
        pos_centro = [Posicion(x, y) for x in range(cx1, cx2) for y in range(cy1, cy2)]
        zonas.append(Zona(id_zona=2, nombre="Centro", posiciones=pos_centro))
        # Zona sureste (esquina inferior derecha)
        x0, y0 = max(0, ancho - w1), max(0, alto - h1)
        pos_sureste = [Posicion(x, y) for x in range(x0, ancho) for y in range(y0, alto)]
        if pos_sureste and (x0 > w1 or y0 > h1):
            zonas.append(Zona(id_zona=3, nombre="Sureste", posiciones=pos_sureste))
        return zonas
