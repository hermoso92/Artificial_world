"""
Sistema central de logging, reporting y debugging para artificial word.

Objetivos:
- Configuración unificada de logs (nivel, formato)
- Log estructurado (JSON) para debugging y análisis
- Reporte de sesión al finalizar (ticks, alertas, métricas, errores)
- Alineado con la misión: observabilidad para demos B2B y desarrollo
"""

import json
import logging
import os
import sys
import time
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import TYPE_CHECKING

from utilidades.paths import obtener_base_path

if TYPE_CHECKING:
    from nucleo.simulacion import Simulacion

# Nombres de loggers del proyecto (unificados)
LOGGER_RAIZ = "mundo_artificial"
LOGGER_SIMULACION = "mundo_artificial.simulacion"
LOGGER_WATCHDOG = "mundo_artificial.watchdog"
LOGGER_AMIGUISIMO = "mundo_artificial.amiguisimo"


@dataclass
class ConfiguracionLogging:
    """Parámetros de logging y reporte."""

    nivel_log: str = "INFO"
    log_estructurado: bool = False
    log_consola: bool = False
    reporte_sesion_activo: bool = True
    reporte_sesion_ruta: str = "reporte_sesion.json"
    max_lineas_log: int = 50000


def _nivel_from_str(s: str) -> int:
    """Convierte string a nivel de logging."""
    m = {
        "DEBUG": logging.DEBUG,
        "INFO": logging.INFO,
        "WARNING": logging.WARNING,
        "ERROR": logging.ERROR,
        "CRITICAL": logging.CRITICAL,
    }
    return m.get(s.upper(), logging.INFO)


def configurar_logging(
    nivel: str = "INFO",
    log_estructurado: bool = False,
    log_consola: bool = False,
    ruta_archivo: str | None = None,
) -> None:
    """
    Configura el logging global del proyecto.
    Debe llamarse al inicio, antes de cualquier otro import que use logging.
    """
    if ruta_archivo is None:
        ruta_archivo = os.path.join(obtener_base_path(), "simulacion.log")

    nivel_int = _nivel_from_str(nivel)
    root = logging.getLogger(LOGGER_RAIZ)
    root.setLevel(nivel_int)

    # Evitar duplicar handlers
    if root.handlers:
        for h in root.handlers[:]:
            root.removeHandler(h)

    # Handler archivo
    fh = logging.FileHandler(ruta_archivo, mode="a", encoding="utf-8")
    fh.setLevel(nivel_int)
    if log_estructurado:
        fh.setFormatter(_JsonFormatter())
    else:
        fh.setFormatter(
            logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s", datefmt="%H:%M:%S")
        )
    root.addHandler(fh)

    # Handler consola (opcional)
    if log_consola:
        ch = logging.StreamHandler(sys.stdout)
        ch.setLevel(nivel_int)
        ch.setFormatter(logging.Formatter("%(levelname)s %(name)s: %(message)s"))
        root.addHandler(ch)

    # Propagación a hijos
    for name in (LOGGER_SIMULACION, LOGGER_WATCHDOG, LOGGER_AMIGUISIMO):
        logging.getLogger(name).setLevel(nivel_int)


class _JsonFormatter(logging.Formatter):
    """Formatea logs como JSON para parsing y análisis."""

    def format(self, record: logging.LogRecord) -> str:
        d = {
            "ts": datetime.now().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
        }
        if record.exc_info:
            d["exc"] = self.formatException(record.exc_info)
        return json.dumps(d, ensure_ascii=False)


class SistemaReporte:
    """
    Acumula datos de la sesión y genera reporte al finalizar.
    Para debugging, demos y observabilidad.
    """

    def __init__(self, ruta: str | None = None, activo: bool = True):
        self.activo = activo
        self.ruta = ruta or os.path.join(obtener_base_path(), "reporte_sesion.json")
        self.inicio: float = time.time()
        self.fin: float | None = None
        self.tick_final: int = 0
        self.excepciones: list[dict] = []
        self.alertas_watchdog: list[dict] = []

    def registrar_excepcion(self, exc: BaseException, contexto: str = "") -> None:
        """Registra una excepción para el reporte."""
        if not self.activo:
            return
        self.excepciones.append(
            {
                "tipo": type(exc).__name__,
                "mensaje": str(exc),
                "contexto": contexto,
                "ts": datetime.now().isoformat(),
            }
        )

    def registrar_alertas_watchdog(self, alertas: list) -> None:
        """Registra alertas del watchdog para el reporte."""
        if not self.activo:
            return
        for a in alertas:
            self.alertas_watchdog.append(
                {
                    "tick": getattr(a, "tick", 0),
                    "nivel": getattr(a, "nivel", "WARN"),
                    "codigo": getattr(a, "codigo", "?"),
                    "entidad": getattr(a, "entidad", "?"),
                    "mensaje": getattr(a, "mensaje", ""),
                }
            )

    def finalizar(self, tick_actual: int) -> None:
        """Marca el fin de la sesión."""
        self.fin = time.time()
        self.tick_final = tick_actual

    def generar_desde_simulacion(self, sim: "Simulacion") -> bool:
        """
        Genera el reporte de sesión a partir del estado de la simulación.
        Devuelve True si se escribió correctamente.
        """
        if not self.activo:
            return False
        self.finalizar(sim.gestor_ticks.tick_actual if sim.gestor_ticks else 0)

        # Alertas del watchdog
        if sim.sistema_watchdog and hasattr(sim.sistema_watchdog, "alertas"):
            self.registrar_alertas_watchdog(list(sim.sistema_watchdog.alertas))

        reporte = {
            "version": 1,
            "proyecto": "artificial_word",
            "inicio": datetime.fromtimestamp(self.inicio).isoformat(),
            "fin": datetime.fromtimestamp(self.fin or time.time()).isoformat(),
            "duracion_segundos": round((self.fin or time.time()) - self.inicio, 2),
            "tick_final": self.tick_final,
            "entidades": len(sim.entidades),
            "nombres_entidades": [e.nombre for e in sim.entidades],
            "metricas_globales": (
                sim.sistema_metricas.obtener_resumen() if sim.sistema_metricas else {}
            ),
            "alertas_watchdog_total": (
                sim.sistema_watchdog.problemas_detectados_total
                if sim.sistema_watchdog
                else 0
            ),
            "alertas_watchdog_ultimas": self.alertas_watchdog[-20:],
            "excepciones": self.excepciones,
            "estado": "OK" if not self.excepciones else "ERROR",
        }

        try:
            ruta_abs = self.ruta if os.path.isabs(self.ruta) else os.path.join(obtener_base_path(), self.ruta)
            with open(ruta_abs, "w", encoding="utf-8") as f:
                json.dump(reporte, f, indent=2, ensure_ascii=False)
            ok = True
        except Exception:
            ok = False
        sc = getattr(sim, "sistema_competencia", None)
        if sc and sc.activo:
            sc.registrar(
                action="exportar_reporte",
                target_resource=self.ruta or "reporte_sesion.json",
                target_type="reporte",
                outcome="success" if ok else "failure",
                signals=["exportacion_reporte"],
                tick=sim.gestor_ticks.tick_actual if sim.gestor_ticks else 0,
            )
        return ok

    def generar_minimo(self, tick_actual: int = 0) -> bool:
        """Genera reporte mínimo cuando no hay acceso a la simulación."""
        if not self.activo:
            return False
        self.finalizar(tick_actual)
        reporte = {
            "version": 1,
            "proyecto": "artificial_word",
            "inicio": datetime.fromtimestamp(self.inicio).isoformat(),
            "fin": datetime.fromtimestamp(self.fin or time.time()).isoformat(),
            "duracion_segundos": round((self.fin or time.time()) - self.inicio, 2),
            "tick_final": tick_actual,
            "estado": "OK" if not self.excepciones else "ERROR",
            "excepciones": self.excepciones,
        }
        try:
            ruta_abs = self.ruta if os.path.isabs(self.ruta) else os.path.join(obtener_base_path(), self.ruta)
            with open(ruta_abs, "w", encoding="utf-8") as f:
                json.dump(reporte, f, indent=2, ensure_ascii=False)
            return True
        except Exception:
            return False
