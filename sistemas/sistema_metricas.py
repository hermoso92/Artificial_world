"""
Sistema de métricas de la simulación.
"""

from tipos.modelos import EventoSistema


class SistemaMetricas:
    """Registra métricas por entidad y globales."""

    def __init__(self):
        self.contadores_por_entidad: dict[int, dict] = {}
        self.contadores_globales: dict = {}

    def registrar_evento(self, evento: EventoSistema) -> None:
        """Registra un evento para métricas."""
        id_e = evento.id_origen
        tipo = evento.tipo.value
        if id_e is not None:
            ent = self.contadores_por_entidad.setdefault(id_e, {})
            ent[tipo] = ent.get(tipo, 0) + 1
        self.contadores_globales[tipo] = self.contadores_globales.get(tipo, 0) + 1

    def obtener_resumen(self) -> dict:
        """Obtiene resumen de métricas."""
        return dict(self.contadores_globales)

    def obtener_metricas_entidad(self, id_entidad: int) -> dict:
        """Obtiene métricas de una entidad."""
        return self.contadores_por_entidad.get(id_entidad, {})

    def obtener_heatmap_actividad(self) -> dict:
        """Obtiene heatmap de actividad por celda."""
        return {}
