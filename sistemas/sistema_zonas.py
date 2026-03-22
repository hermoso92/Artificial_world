"""
Sistema de zonas: detecta entrada y salida de entidades en zonas del mapa.
Emite eventos ENTRO_ZONA y SALIO_ZONA al BusEventos.
"""

from tipos.enums import TipoEvento
from tipos.modelos import EventoSistema


class SistemaZonas:
    """Gestiona zonas del mapa y emite eventos de entrada/salida."""

    def __init__(self):
        self._zonas: dict[int, set[tuple[int, int]]] = {}
        self._zonas_info: dict[int, str] = {}
        self._estado_anterior: dict[int, set[int]] = {}

    def registrar_zona(self, zona) -> None:
        """Registra una zona e indexa sus posiciones para lookup O(1)."""
        pos_set = {p.como_tupla() for p in zona.posiciones}
        self._zonas[zona.id_zona] = pos_set
        self._zonas_info[zona.id_zona] = zona.nombre

    def tick(
        self,
        entidades: list,
        bus_eventos,
        tick_actual: int,
    ) -> None:
        """Comprueba qué zonas ocupa cada entidad y emite eventos de entrada/salida."""
        if not bus_eventos or not self._zonas:
            return

        for entidad in entidades:
            if not getattr(entidad.estado_interno, "activo", True):
                continue
            pos = entidad.posicion
            pos_tupla = pos.como_tupla()
            id_ent = entidad.id_entidad
            zonas_actuales: set[int] = set()

            for id_zona, posiciones in self._zonas.items():
                if pos_tupla in posiciones:
                    zonas_actuales.add(id_zona)

            previas = self._estado_anterior.get(id_ent, set())
            entraron = zonas_actuales - previas
            salieron = previas - zonas_actuales

            for id_zona in entraron:
                nombre = self._zonas_info.get(id_zona, str(id_zona))
                bus_eventos.emitir(
                    EventoSistema(
                        tick=tick_actual,
                        tipo=TipoEvento.ENTRO_ZONA,
                        id_origen=id_ent,
                        id_objetivo=None,
                        posicion=pos,
                        descripcion=f"{entidad.nombre} entro en zona {nombre}",
                        metadatos={"id_zona": id_zona, "nombre_zona": nombre},
                    )
                )

            for id_zona in salieron:
                nombre = self._zonas_info.get(id_zona, str(id_zona))
                bus_eventos.emitir(
                    EventoSistema(
                        tick=tick_actual,
                        tipo=TipoEvento.SALIO_ZONA,
                        id_origen=id_ent,
                        id_objetivo=None,
                        posicion=pos,
                        descripcion=f"{entidad.nombre} salio de zona {nombre}",
                        metadatos={"id_zona": id_zona, "nombre_zona": nombre},
                    )
                )

            if zonas_actuales:
                self._estado_anterior[id_ent] = zonas_actuales
            elif id_ent in self._estado_anterior:
                del self._estado_anterior[id_ent]
