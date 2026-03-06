"""
Refugio: zona segura donde descansar.
"""


class Refugio:
    """Refugio que ofrece bonus de descanso."""

    def __init__(
        self,
        id_refugio: int,
        bonus_descanso: float = 0.08,
        nivel_seguridad: float = 1.0,
    ):
        self.id_refugio = id_refugio
        self.bonus_descanso = bonus_descanso
        self.nivel_seguridad = nivel_seguridad

    def aplicar_beneficio_descanso(self, estado_interno) -> None:
        """Aplica el bonus de descanso al estado interno."""
        estado_interno.actualizar_energia(self.bonus_descanso)
