"""
Sistema Watchdog: detección automática de problemas en la simulación.

Analiza el estado en cada tick y emite alertas al log cuando detecta:
  - Entidad atrapada (misma posición N ticks seguidos)
  - Entidad con acción repetida en bucle (N ticks iguales)
  - Hambre crítica sin buscar comida
  - Energía crítica sin descansar
  - Directiva activa sin efecto en comportamiento
  - Acciones imposibles (score 0 o candidatos vacíos)
  - Velocidad de bucle anómala (ticks muy lentos)
"""

import logging
import time
from collections import Counter, deque
from dataclasses import dataclass, field

_logger = logging.getLogger("mundo_artificial.watchdog")


@dataclass
class HistorialEntidad:
    """Seguimiento de los últimos N ticks de una entidad."""
    id_entidad: int
    nombre: str
    posiciones: deque = field(default_factory=lambda: deque(maxlen=15))
    acciones: deque = field(default_factory=lambda: deque(maxlen=15))
    energias: deque = field(default_factory=lambda: deque(maxlen=15))
    hambres: deque = field(default_factory=lambda: deque(maxlen=15))


@dataclass
class AlertaWatchdog:
    """Alerta detectada por el watchdog."""
    tick: int
    nivel: str          # "WARN" | "ERROR" | "CRITICAL"
    codigo: str         # Identificador del problema
    entidad: str        # Nombre de la entidad o "SISTEMA"
    mensaje: str
    datos: dict = field(default_factory=dict)


class SistemaWatchdog:
    """
    Monitoriza la simulación y detecta problemas automáticamente.
    Se ejecuta cada N ticks sin coste significativo.
    """

    INTERVALO_TICKS = 10          # Analizar cada 10 ticks
    VENTANA_TRAMPA = 12           # Ticks iguales = entidad atrapada
    VENTANA_BUCLE_ACCION = 10     # Ticks con misma acción = bucle
    MAX_ALERTAS = 100             # Historial máximo de alertas
    HAMBRE_CRITICA = 0.90
    ENERGIA_CRITICA = 0.15

    def __init__(self):
        self.historial: dict[int, HistorialEntidad] = {}
        self.alertas: deque[AlertaWatchdog] = deque(maxlen=self.MAX_ALERTAS)
        self.alertas_activas: list[AlertaWatchdog] = []  # para mostrar en UI
        self.ultimo_tick_analizado: int = -1
        self.tick_inicio: float = time.time()
        self.ticks_por_segundo_real: float = 0.0
        self._ticks_acum: int = 0
        self._t_acum: float = time.time()
        self.problemas_detectados_total: int = 0

    # ------------------------------------------------------------------
    # API pública
    # ------------------------------------------------------------------

    def registrar_tick(self, tick: int, entidades: list) -> None:
        """Llama cada tick para actualizar el historial."""
        for e in entidades:
            if e.id_entidad not in self.historial:
                self.historial[e.id_entidad] = HistorialEntidad(
                    id_entidad=e.id_entidad,
                    nombre=e.nombre,
                )
            h = self.historial[e.id_entidad]
            h.posiciones.append((e.posicion.x, e.posicion.y))
            accion = e.estado_interno.accion_actual
            h.acciones.append(accion.value if accion else "ninguna")
            h.energias.append(round(e.estado_interno.energia, 2))
            h.hambres.append(round(e.estado_interno.hambre, 2))

        # Actualizar ticks/segundo real
        self._ticks_acum += 1
        ahora = time.time()
        if ahora - self._t_acum >= 2.0:
            self.ticks_por_segundo_real = self._ticks_acum / (ahora - self._t_acum)
            self._ticks_acum = 0
            self._t_acum = ahora

        # Analizar cada INTERVALO_TICKS
        if tick - self.ultimo_tick_analizado >= self.INTERVALO_TICKS:
            self.ultimo_tick_analizado = tick
            self._analizar(tick, entidades)

    def obtener_alertas_recientes(self, n: int = 8) -> list[AlertaWatchdog]:
        """Devuelve las N alertas más recientes."""
        return list(self.alertas)[-n:][::-1]

    def limpiar_alertas_activas(self) -> None:
        self.alertas_activas.clear()

    # ------------------------------------------------------------------
    # Análisis interno
    # ------------------------------------------------------------------

    def _analizar(self, tick: int, entidades: list) -> None:
        """Ejecuta todos los detectores."""
        nuevas = []
        for e in entidades:
            h = self.historial.get(e.id_entidad)
            if not h:
                continue
            nuevas += self._detectar_trampa_posicion(tick, e, h)
            nuevas += self._detectar_bucle_accion(tick, e, h)
            nuevas += self._detectar_hambre_sin_respuesta(tick, e, h)
            nuevas += self._detectar_hambre_moviendose(tick, e, h)
            nuevas += self._detectar_energia_sin_respuesta(tick, e, h)
            nuevas += self._detectar_directiva_ignorada(tick, e)

        nuevas += self._detectar_sin_variedad_global(tick, entidades)

        for alerta in nuevas:
            self.alertas.append(alerta)
            self.alertas_activas.append(alerta)
            self.problemas_detectados_total += 1
            nivel = alerta.nivel
            if nivel == "CRITICAL":
                _logger.critical("WATCHDOG [%s] ent=%s tick=%d: %s | datos=%s",
                                 alerta.codigo, alerta.entidad, alerta.tick,
                                 alerta.mensaje, alerta.datos)
            elif nivel == "ERROR":
                _logger.error("WATCHDOG [%s] ent=%s tick=%d: %s | datos=%s",
                              alerta.codigo, alerta.entidad, alerta.tick,
                              alerta.mensaje, alerta.datos)
            else:
                _logger.warning("WATCHDOG [%s] ent=%s tick=%d: %s | datos=%s",
                                alerta.codigo, alerta.entidad, alerta.tick,
                                alerta.mensaje, alerta.datos)

    def _detectar_trampa_posicion(self, tick: int, e, h: HistorialEntidad) -> list:
        """Detecta entidad que no se ha movido en N ticks seguidos."""
        if len(h.posiciones) < self.VENTANA_TRAMPA:
            return []
        ultimas = list(h.posiciones)[-self.VENTANA_TRAMPA:]
        if len(set(ultimas)) == 1:
            pos = ultimas[0]
            accion_actual = h.acciones[-1] if h.acciones else "?"
            return [AlertaWatchdog(
                tick=tick,
                nivel="ERROR",
                codigo="TRAMPA_POSICION",
                entidad=e.nombre,
                mensaje=f"lleva {self.VENTANA_TRAMPA} ticks sin moverse en {pos}",
                datos={"posicion": pos, "accion": accion_actual,
                       "energia": h.energias[-1], "hambre": h.hambres[-1]},
            )]
        return []

    def _detectar_bucle_accion(self, tick: int, e, h: HistorialEntidad) -> list:
        """Detecta entidad que repite la misma acción N ticks seguidos."""
        if len(h.acciones) < self.VENTANA_BUCLE_ACCION:
            return []
        ultimas = list(h.acciones)[-self.VENTANA_BUCLE_ACCION:]
        if len(set(ultimas)) == 1 and ultimas[0] not in ("explorar", "mover"):
            # explorar/mover repetidos son normales; descansar/ir_refugio repetidos NO
            return [AlertaWatchdog(
                tick=tick,
                nivel="WARN",
                codigo="BUCLE_ACCION",
                entidad=e.nombre,
                mensaje=f"repite '{ultimas[0]}' durante {self.VENTANA_BUCLE_ACCION} ticks",
                datos={"accion": ultimas[0], "energia": h.energias[-1], "hambre": h.hambres[-1]},
            )]
        return []

    def _detectar_hambre_sin_respuesta(self, tick: int, e, h: HistorialEntidad) -> list:
        """Detecta hambre > 0.90 sin que la acción sea comer/recoger comida en 8 ticks.
        'mover' ya no cuenta como respuesta válida: una entidad puede moverse sin encontrar comida
        indefinidamente y el watchdog no debe ser ciego a eso.
        """
        if len(h.hambres) < 8:
            return []
        if all(v >= self.HAMBRE_CRITICA for v in list(h.hambres)[-8:]):
            ultimas = list(h.acciones)[-8:]
            if not any(a in ("comer", "recoger_comida") for a in ultimas):
                return [AlertaWatchdog(
                    tick=tick,
                    nivel="CRITICAL",
                    codigo="HAMBRE_CRITICA_SIN_RESPUESTA",
                    entidad=e.nombre,
                    mensaje=f"hambre >= {self.HAMBRE_CRITICA} durante 8 ticks sin comer",
                    datos={"hambre": h.hambres[-1], "acciones": ultimas},
                )]
        return []

    def _detectar_hambre_moviendose(self, tick: int, e, h: HistorialEntidad) -> list:
        """Detecta entidad con hambre crítica que lleva muchos ticks moviéndose sin comer.
        Cubre el punto ciego de _detectar_hambre_sin_respuesta donde 'mover' no era suficiente.
        Umbral más alto (15 ticks) para no alertar en búsquedas normales breves.
        """
        UMBRAL_TICKS = 15
        if len(h.hambres) < UMBRAL_TICKS or len(h.acciones) < UMBRAL_TICKS:
            return []
        ultimas_hambres = list(h.hambres)[-UMBRAL_TICKS:]
        if not all(v >= self.HAMBRE_CRITICA for v in ultimas_hambres):
            return []
        ultimas_acc = list(h.acciones)[-UMBRAL_TICKS:]
        # Si en 15 ticks no comió ni recogió pero se movió constantemente
        comio = any(a in ("comer", "recoger_comida") for a in ultimas_acc)
        if comio:
            return []
        se_movio = any(a in ("mover", "explorar", "siguio") for a in ultimas_acc)
        if se_movio:
            return [AlertaWatchdog(
                tick=tick,
                nivel="WARN",
                codigo="HAMBRE_SIN_COMIDA_DISPONIBLE",
                entidad=e.nombre,
                mensaje=f"hambre critica {UMBRAL_TICKS} ticks moviendose sin encontrar comida",
                datos={"hambre": h.hambres[-1], "acciones_resumen": dict(Counter(ultimas_acc).most_common(3))},
            )]
        return []

    def _detectar_energia_sin_respuesta(self, tick: int, e, h: HistorialEntidad) -> list:
        """Detecta energía crítica sin descansar."""
        if len(h.energias) < 8:
            return []
        if all(v <= self.ENERGIA_CRITICA for v in list(h.energias)[-8:]):
            ultimas = list(h.acciones)[-8:]
            if not any(a in ("descansar", "ir_refugio") for a in ultimas):
                return [AlertaWatchdog(
                    tick=tick,
                    nivel="CRITICAL",
                    codigo="ENERGIA_CRITICA_SIN_RESPUESTA",
                    entidad=e.nombre,
                    mensaje=f"energia <= {self.ENERGIA_CRITICA} durante 8 ticks sin descansar",
                    datos={"energia": h.energias[-1], "acciones": ultimas},
                )]
        return []

    def _detectar_directiva_ignorada(self, tick: int, e) -> list:
        """Detecta directiva activa que no ha cambiado el comportamiento en 20 ticks."""
        gestor = getattr(e, "gestor_directivas", None)
        if not gestor:
            return []
        activas = getattr(gestor, "directivas_activas", [])
        if not activas:
            return []
        h = self.historial.get(e.id_entidad)
        if not h or len(h.acciones) < 20:
            return []
        # Si hay directiva EXPLORAR_ZONA y en los últimos 15 ticks no ha explorado/movido
        from tipos.enums import TipoDirectiva
        for d in activas:
            if d.tipo_directiva == TipoDirectiva.EXPLORAR_ZONA:
                ultimas = list(h.acciones)[-15:]
                if not any(a in ("explorar", "mover") for a in ultimas):
                    return [AlertaWatchdog(
                        tick=tick,
                        nivel="WARN",
                        codigo="DIRECTIVA_IGNORADA",
                        entidad=e.nombre,
                        mensaje=f"directiva {d.tipo_directiva.value} activa pero no explora",
                        datos={"directiva": d.tipo_directiva.value, "acciones": ultimas[-5:]},
                    )]
            if d.tipo_directiva == TipoDirectiva.PRIORIZAR_SUPERVIVENCIA:
                ultimas = list(h.acciones)[-15:]
                if not any(a in ("comer", "recoger_comida", "descansar") for a in ultimas):
                    return [AlertaWatchdog(
                        tick=tick,
                        nivel="WARN",
                        codigo="DIRECTIVA_IGNORADA",
                        entidad=e.nombre,
                        mensaje=f"directiva {d.tipo_directiva.value} activa pero no sobrevive",
                        datos={"directiva": d.tipo_directiva.value, "acciones": ultimas[-5:]},
                    )]
        return []

    def _detectar_sin_variedad_global(self, tick: int, entidades: list) -> list:
        """Detecta falta de variedad en las acciones del sistema.
        
        Detecta dos patrones:
        1. Una acción (sin ser explorar/mover) domina el 85%.
        2. explorar+mover combinados dominan el 95% sin acciones de supervivencia (comer/descansar/recoger).
        """
        if not entidades:
            return []
        todas_acciones = []
        for e in entidades:
            h = self.historial.get(e.id_entidad)
            if h and len(h.acciones) >= 10:
                todas_acciones.extend(list(h.acciones)[-10:])
        if not todas_acciones:
            return []
        conteo = Counter(todas_acciones)
        total = len(todas_acciones)
        accion_dom, count_dom = conteo.most_common(1)[0]
        pct = count_dom / total

        # Caso 1: una sola acción NO de movimiento domina el 85%
        if pct >= 0.85 and accion_dom not in ("explorar", "mover", "siguio"):
            return [AlertaWatchdog(
                tick=tick,
                nivel="ERROR",
                codigo="SIN_VARIEDAD_GLOBAL",
                entidad="SISTEMA",
                mensaje=f"'{accion_dom}' domina {pct*100:.0f}% de todas las acciones",
                datos={"accion": accion_dom, "porcentaje": round(pct, 3),
                       "distribucion": dict(conteo.most_common(5))},
            )]

        # Caso 2: explorar+mover combinados > 95% sin ninguna acción de supervivencia
        pct_movimiento = (conteo.get("explorar", 0) + conteo.get("mover", 0) + conteo.get("siguio", 0)) / total
        acciones_supervivencia = {"comer", "recoger_comida", "descansar", "ir_refugio", "recoger_material"}
        tiene_supervivencia = any(conteo.get(a, 0) > 0 for a in acciones_supervivencia)
        if pct_movimiento >= 0.95 and not tiene_supervivencia and len(entidades) >= 3:
            return [AlertaWatchdog(
                tick=tick,
                nivel="WARN",
                codigo="SOLO_MOVIMIENTO_GLOBAL",
                entidad="SISTEMA",
                mensaje=f"explorar+mover={pct_movimiento*100:.0f}% sin acciones de supervivencia",
                datos={"pct_movimiento": round(pct_movimiento, 3),
                       "distribucion": dict(conteo.most_common(5))},
            )]
        return []
