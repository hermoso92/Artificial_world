"""
Recurso: comida o material en el mundo.
"""

from tipos.enums import TipoRecurso


class Recurso:
    """Recurso que puede recogerse en una celda."""

    def __init__(
        self,
        tipo: TipoRecurso,
        cantidad: int = 1,
        valor_estrategico: float = 1.0,
    ):
        self.tipo = tipo
        self.cantidad = cantidad
        self.valor_estrategico = valor_estrategico

    def consumir(self, cantidad: int = 1) -> int:
        """
        Consume cantidad del recurso.
        Devuelve la cantidad realmente consumida.
        """
        consumido = min(cantidad, self.cantidad)
        self.cantidad -= consumido
        return consumido

    def esta_agotado(self) -> bool:
        """Indica si el recurso está agotado."""
        return self.cantidad <= 0
