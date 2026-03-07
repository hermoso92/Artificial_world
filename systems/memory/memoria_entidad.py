"""
Memoria de una entidad: recuerdos espaciales, sociales y eventos recientes.
"""

from tipos.enums import TipoEvento
from tipos.modelos import EventoSistema, Posicion, RecuerdoEspacial, RecuerdoSocial


class MemoriaEntidad:
    """Gestiona la memoria de una entidad."""

    def __init__(
        self,
        capacidad_recuerdos_espaciales: int = 20,
        capacidad_recuerdos_sociales: int = 15,
        capacidad_eventos: int = 20,
    ):
        self.recuerdos_espaciales: list[RecuerdoEspacial] = []
        self.recuerdos_sociales: list[RecuerdoSocial] = []
        self.eventos_recientes: list[EventoSistema] = []
        self.capacidad_recuerdos_espaciales = capacidad_recuerdos_espaciales
        self.capacidad_recuerdos_sociales = capacidad_recuerdos_sociales
        self.capacidad_eventos = capacidad_eventos

    def registrar_recurso_visto(
        self, tipo: str, posicion: Posicion, tick: int, relevancia: float = 1.0
    ) -> None:
        """Registra un recurso visto."""
        recuerdo = RecuerdoEspacial(
            tipo=tipo, posicion=posicion, tick_observado=tick, relevancia=relevancia
        )
        self._agregar_recuerdo_espacial(recuerdo)

    def registrar_refugio_visto(
        self, posicion: Posicion, tick: int, relevancia: float = 0.8
    ) -> None:
        """Registra un refugio visto."""
        recuerdo = RecuerdoEspacial(
            tipo="refugio", posicion=posicion, tick_observado=tick, relevancia=relevancia
        )
        self._agregar_recuerdo_espacial(recuerdo)

    def registrar_evento_social(
        self, id_entidad: int, tipo_evento: TipoEvento, tick: int, impacto: float
    ) -> None:
        """Registra un evento social."""
        recuerdo = RecuerdoSocial(
            id_entidad=id_entidad, tipo_evento=tipo_evento, tick=tick, impacto=impacto
        )
        self.recuerdos_sociales.append(recuerdo)
        if len(self.recuerdos_sociales) > self.capacidad_recuerdos_sociales:
            self.recuerdos_sociales.pop(0)

    def registrar_evento(self, evento: EventoSistema) -> None:
        """Registra un evento en el buffer reciente."""
        self.eventos_recientes.append(evento)
        if len(self.eventos_recientes) > self.capacidad_eventos:
            self.eventos_recientes.pop(0)

    def _agregar_recuerdo_espacial(self, recuerdo: RecuerdoEspacial) -> None:
        """Añade un recuerdo espacial, manteniendo capacidad."""
        self.recuerdos_espaciales.append(recuerdo)
        if len(self.recuerdos_espaciales) > self.capacidad_recuerdos_espaciales:
            self.recuerdos_espaciales.pop(0)

    def obtener_recursos_recientes(self, tipo: str | None = None) -> list[RecuerdoEspacial]:
        """Obtiene recuerdos de recursos, opcionalmente filtrados por tipo."""
        if tipo is None:
            return [r for r in self.recuerdos_espaciales if r.tipo in ("comida", "material")]
        return [r for r in self.recuerdos_espaciales if r.tipo == tipo]

    def obtener_refugios_conocidos(self) -> list[RecuerdoEspacial]:
        """Obtiene recuerdos de refugios."""
        return [r for r in self.recuerdos_espaciales if r.tipo == "refugio"]

    def obtener_eventos_recientes(self) -> list[EventoSistema]:
        """Obtiene eventos recientes."""
        return self.eventos_recientes.copy()

    def obtener_recuerdos_sociales_de(self, id_entidad: int) -> list[RecuerdoSocial]:
        """Obtiene recuerdos sociales sobre una entidad."""
        return [r for r in self.recuerdos_sociales if r.id_entidad == id_entidad]

    def degradar_memoria(self, tick_actual: int) -> None:
        """Degrada recuerdos antiguos (por ahora no hace nada)."""
        pass

    def limpiar_memoria_antigua(self, tick_actual: int) -> None:
        """Elimina recuerdos expirados."""
        self.recuerdos_espaciales = [
            r for r in self.recuerdos_espaciales
            if r.tick_caducidad is None or tick_actual < r.tick_caducidad
        ]
