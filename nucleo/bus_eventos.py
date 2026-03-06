"""
Bus de eventos para desacoplar acciones, logs y UI.
"""

from tipos.modelos import EventoSistema


class BusEventos:
    """Gestiona la emisión y cola de eventos."""

    def __init__(self):
        self.eventos_pendientes: list[EventoSistema] = []
        self.suscriptores: dict = {}

    def emitir(self, evento: EventoSistema) -> None:
        """Emite un evento."""
        self.eventos_pendientes.append(evento)

    def obtener_eventos_pendientes(self) -> list[EventoSistema]:
        """Obtiene y devuelve los eventos pendientes."""
        pendientes = self.eventos_pendientes.copy()
        self.eventos_pendientes.clear()
        return pendientes

    def limpiar(self) -> None:
        """Limpia la cola de eventos."""
        self.eventos_pendientes.clear()
