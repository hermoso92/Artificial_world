"""
Sistema de logs y eventos recientes para UI.
"""

import logging
import os
from tipos.modelos import EventoSistema
from utilidades.paths import obtener_base_path

_logger = logging.getLogger("mundo_artificial")


def _configurar_logger_archivo(ruta: str | None = None) -> None:
    """Configura el logger para archivo si no está ya configurado.
    Respeta la configuración central de sistema_logging_reporte si ya se ejecutó."""
    if _logger.handlers:
        return
    if ruta is None:
        ruta = os.path.join(obtener_base_path(), "simulacion.log")
    _logger.setLevel(logging.DEBUG)
    fh = logging.FileHandler(ruta, mode="a", encoding="utf-8")
    fh.setLevel(logging.DEBUG)
    fmt = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s", datefmt="%H:%M:%S")
    fh.setFormatter(fmt)
    _logger.addHandler(fh)


_configurar_logger_archivo()


class SistemaLogs:
    """Registra eventos y debug para observabilidad."""

    def __init__(self, max_eventos: int = 20, max_debug: int = 50):
        self.eventos_recientes: list[EventoSistema] = []
        self.max_eventos = max_eventos
        self.debug_entidades_pilladas: list[dict] = []
        self.max_debug = max_debug
        self.log_decisiones_activo: bool = False  # activar para logs verbosos

    def registrar_evento(self, evento: EventoSistema) -> None:
        """Registra un evento."""
        self.eventos_recientes.append(evento)
        if len(self.eventos_recientes) > self.max_eventos:
            self.eventos_recientes.pop(0)
        tipo_str = evento.tipo.value if hasattr(evento.tipo, "value") else str(evento.tipo)
        desc = getattr(evento, "descripcion", tipo_str)
        _logger.info("EVENTO tick=%d ent=%s tipo=%s desc=%s",
                     evento.tick, evento.id_origen, tipo_str, desc)

    def registrar_decision(self, nombre: str, tick: int, accion: str,
                           score: float, motivo: str, energia: float, hambre: float,
                           num_directivas: int) -> None:
        """Registra una decisión de entidad. Solo escribe si log activo o hay directivas."""
        if not self.log_decisiones_activo and num_directivas == 0:
            return
        _logger.debug(
            "DECISION tick=%d ent=%-8s accion=%-18s score=%.3f motivo=%-25s E=%.2f H=%.2f dir=%d",
            tick, nombre, accion, score, motivo, energia, hambre, num_directivas,
        )

    def registrar_directiva_recibida(self, nombre_ent: str, tipo_dir: str, tick: int,
                                     duracion: int, intensidad: float) -> None:
        """Registra cuando una entidad recibe una directiva."""
        _logger.info(
            "DIRECTIVA_RECIBIDA ent=%s tipo=%s tick=%d duracion=%d intensidad=%.2f",
            nombre_ent, tipo_dir, tick, duracion, intensidad,
        )

    def registrar_debug_decision(self, id_entidad: int, datos: dict) -> None:
        """Registra datos de debug cuando una entidad no tiene acción."""
        entrada = {"id_entidad": id_entidad, **datos}
        self.debug_entidades_pilladas.append(entrada)
        if len(self.debug_entidades_pilladas) > self.max_debug:
            self.debug_entidades_pilladas.pop(0)
        _logger.warning("ENTIDAD_PILLADA id=%d tick=%d pos=%s",
                        id_entidad, datos.get("tick", 0), datos.get("posicion", "?"))

    def obtener_eventos_recientes(self, limite: int = 20) -> list[EventoSistema]:
        """Obtiene los eventos más recientes."""
        return self.eventos_recientes[-limite:][::-1]
