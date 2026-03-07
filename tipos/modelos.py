"""
Modelos de datos del proyecto MUNDO_ARTIFICIAL.
Estructuras explícitas para evitar diccionarios anónimos.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from .enums import EstadoDirectiva, TipoDirectiva, TipoEvento, TipoComandoSombra, EstadoComandoSombra


@dataclass(frozen=True)
class Posicion:
    """Posición en el grid 2D."""

    x: int
    y: int

    def como_tupla(self) -> tuple[int, int]:
        """Devuelve la posición como tupla (x, y)."""
        return (self.x, self.y)

    def distancia_manhattan(self, otra: Posicion) -> int:
        """Distancia Manhattan entre posiciones."""
        return abs(self.x - otra.x) + abs(self.y - otra.y)


@dataclass
class RecuerdoEspacial:
    """Recuerdo de algo visto en el espacio."""

    tipo: str
    posicion: Posicion
    tick_observado: int
    relevancia: float
    tick_caducidad: int | None = None


@dataclass
class RecuerdoSocial:
    """Recuerdo de interacción con otra entidad."""

    id_entidad: int
    tipo_evento: TipoEvento
    tick: int
    impacto: float


@dataclass
class RelacionSocial:
    """Relación entre dos entidades."""

    confianza: float = 0.0
    miedo: float = 0.0
    hostilidad: float = 0.0
    utilidad_percibida: float = 0.0


@dataclass
class EventoSistema:
    """Evento emitido por el sistema."""

    tick: int
    tipo: TipoEvento
    id_origen: int | None
    id_objetivo: int | None
    posicion: Posicion | None
    descripcion: str
    metadatos: dict = field(default_factory=dict)


@dataclass
class DirectivaExterna:
    """Directiva emitida por una entidad externa."""

    id_directiva: int
    tipo_directiva: TipoDirectiva
    id_entidad_objetivo: int
    prioridad: float
    intensidad: float
    tick_emision: int
    tick_expiracion: int | None
    estado: EstadoDirectiva
    objetivo_posicion: Posicion | None = None
    objetivo_entidad: int | None = None
    metadatos: dict | None = None

    def esta_activa(self, tick_actual: int) -> bool:
        """Indica si la directiva está activa en el tick actual."""
        if self.estado in (EstadoDirectiva.RECHAZADA, EstadoDirectiva.COMPLETADA, EstadoDirectiva.EXPIRADA):
            return False
        if self.tick_expiracion is not None and tick_actual >= self.tick_expiracion:
            return False
        return True

    def ha_expirado(self, tick_actual: int) -> bool:
        """Indica si la directiva ha expirado."""
        return self.tick_expiracion is not None and tick_actual >= self.tick_expiracion


@dataclass
class PercepcionLocal:
    """Percepción del entorno inmediato de una entidad."""

    recursos_visibles: list
    refugios_visibles: list
    entidades_visibles: list
    posiciones_vecinas: list[Posicion]
    amenaza_local: float


@dataclass
class AccionPuntuada:
    """Acción con su puntuación de utilidad calculada."""

    accion: Any  # AccionBase - evita import circular
    puntuacion_base: float
    modificadores: dict[str, float]
    puntuacion_final: float
    motivo_principal: str


@dataclass
class ComandoSombra:
    """Comando forzado emitido desde el MODO POSEIDO.

    La entidad no interpreta ni filtra: ejecuta lo que indica el comando.
    """

    id_comando: int
    id_entidad_objetivo: int
    tipo_comando: TipoComandoSombra
    tick_emision: int
    prioridad: float = 1.0
    objetivo_posicion: "Posicion | None" = None
    objetivo_entidad: int | None = None
    parametros: dict | None = None
    estado: EstadoComandoSombra = field(default_factory=lambda: EstadoComandoSombra.PENDIENTE)
    tick_inicio: int | None = None
    tick_fin: int | None = None
    motivo_fallo: str | None = None

    def esta_terminado(self) -> bool:
        """True si el comando ya no está pendiente ni en progreso."""
        return self.estado in (
            EstadoComandoSombra.COMPLETADO,
            EstadoComandoSombra.CANCELADO,
            EstadoComandoSombra.FALLIDO,
        )
