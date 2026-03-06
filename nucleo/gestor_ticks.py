"""
Gestor de ticks de la simulación.
"""


class GestorTicks:
    """Mantiene el contador de ticks."""

    def __init__(self):
        self.tick_actual: int = 0

    def avanzar(self) -> int:
        """Avanza un tick y devuelve el nuevo valor."""
        self.tick_actual += 1
        return self.tick_actual

    def reiniciar(self) -> None:
        """Reinicia el contador a cero."""
        self.tick_actual = 0
