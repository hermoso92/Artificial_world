"""Sistema de selección de entidad."""


class SistemaSeleccion:
    """Mantiene la entidad seleccionada."""

    def __init__(self):
        self.id_entidad_seleccionada: int | None = None
