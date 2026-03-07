"""
Estado del panel de control avanzado.
Centraliza velocidad, modo visualización, selección y órdenes.
"""

from dataclasses import dataclass, field
from enum import Enum


class ModoVisualizacion(Enum):
    """Modos de visualización del mapa."""
    NORMAL = "normal"
    CALOR_ENERGIA = "calor_energia"
    CALOR_HAMBRE = "calor_hambre"
    RECURSOS = "recursos"
    REFUGIOS = "refugios"


class PestanaPanel(Enum):
    """Pestañas del panel de control."""
    CONTROL = "control"
    ORDENES = "ordenes"
    SOMBRA  = "sombra"
    ENTIDADES = "entidades"
    EVENTOS = "eventos"
    WATCHDOG = "watchdog"
    ARCHIVO = "archivo"


@dataclass
class EstadoPanel:
    """Estado completo del panel de control."""

    # Simulación
    pausado: bool = False
    velocidad: float = 1.0
    velocidades_disponibles: tuple = (0.05, 0.1, 0.25, 0.5, 1.0, 2.0, 4.0)
    paso_manual: bool = False   # True cuando se avanzó un tick manualmente (tecla N)

    # Visualización
    modo_visualizacion: ModoVisualizacion = ModoVisualizacion.NORMAL

    # Panel
    pestana_actual: PestanaPanel = PestanaPanel.CONTROL
    scroll_offset: int = 0
    entidad_seleccionada_id: int | None = None

    # Órdenes
    contador_directivas: int = 0
    mensaje_feedback: str = ""
    mensaje_feedback_tick: int = 0

    # Entrada de coordenadas para IR_A_POSICION
    coord_input_activo: bool = False   # True = campo de texto activo
    coord_input_texto: str = ""        # Texto tecleado "X,Y"
    coord_objetivo_x: int | None = None
    coord_objetivo_y: int | None = None

    # Modo Sombra (control por turnos)
    modo_sombra: bool = False          # True = turno-a-turno, mundo espera a Amiguisimo
    sombra_esperando_input: bool = False   # True = este turno Amiguisimo aun no actuo

    # Archivo
    guardado_ok: bool = False
    cargado_ok: bool = False

    def siguiente_velocidad(self) -> float:
        """Cicla a la siguiente velocidad."""
        idx = self.velocidades_disponibles.index(self.velocidad) if self.velocidad in self.velocidades_disponibles else 2
        idx = (idx + 1) % len(self.velocidades_disponibles)
        self.velocidad = self.velocidades_disponibles[idx]
        return self.velocidad

    def siguiente_modo_visualizacion(self) -> ModoVisualizacion:
        """Cicla al siguiente modo de visualización."""
        modos = list(ModoVisualizacion)
        idx = modos.index(self.modo_visualizacion)
        idx = (idx + 1) % len(modos)
        self.modo_visualizacion = modos[idx]
        return self.modo_visualizacion
