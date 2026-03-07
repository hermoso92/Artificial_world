"""
Refugio: zona segura donde descansar.

Modelo base para el refugio personal del usuario (20x20).
Estructura preparada para: espacio, propietario, objetos, memoria, entidades residentes.
"""

# Tamaño estándar del refugio personal (celdas)
SHELTER_SIZE = 20


class Refugio:
    """Refugio que ofrece bonus de descanso.
    
    Estructura preparada para evolución:
    - espacio 20x20 (origen en mapa)
    - propietario/usuario (id o None si compartido)
    - objetos, memoria local, entidades residentes (futuro)
    """

    def __init__(
        self,
        id_refugio: int,
        bonus_descanso: float = 0.08,
        nivel_seguridad: float = 1.0,
        ancho: int = 1,
        alto: int = 1,
        id_propietario: str | None = None,
    ):
        self.id_refugio = id_refugio
        self.bonus_descanso = bonus_descanso
        self.nivel_seguridad = nivel_seguridad
        self.ancho = ancho
        self.alto = alto
        self.id_propietario = id_propietario

    def aplicar_beneficio_descanso(self, estado_interno) -> None:
        """Aplica el bonus de descanso al estado interno."""
        estado_interno.actualizar_energia(self.bonus_descanso)
