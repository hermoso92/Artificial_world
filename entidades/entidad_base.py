"""
Entidad base: clase base para todas las entidades autónomas.
"""

from typing import TYPE_CHECKING

from tipos.enums import TipoEntidad
from tipos.modelos import AccionPuntuada, DirectivaExterna, PercepcionLocal, Posicion

from agentes.directivas import GestorDirectivas
from agentes.estado_interno import EstadoInterno
from agentes.memoria import MemoriaEntidad
from agentes.motor_decision import MotorDecision
from agentes.percepcion import SistemaPercepcion

if TYPE_CHECKING:
    from mundo.mapa import Mapa
    from nucleo.contexto import ContextoDecision, ContextoSimulacion


class EntidadBase:
    """Clase base para entidades autónomas del mundo."""

    def __init__(
        self,
        id_entidad: int,
        tipo_entidad: TipoEntidad,
        nombre: str,
        color: tuple[int, int, int],
        posicion: Posicion,
        estado_interno: EstadoInterno | None = None,
        memoria: MemoriaEntidad | None = None,
        motor_decision: MotorDecision | None = None,
        gestor_directivas: GestorDirectivas | None = None,
    ):
        self.id_entidad = id_entidad
        self.tipo_entidad = tipo_entidad
        self.nombre = nombre
        self.color = color
        self.posicion = posicion
        self.posicion_anterior: Posicion | None = None
        self.estado_interno = estado_interno or EstadoInterno()
        self.memoria = memoria or MemoriaEntidad()
        self.motor_decision = motor_decision or MotorDecision()
        self.gestor_directivas = gestor_directivas or GestorDirectivas()
        # Historial de las últimas 8 decisiones para debug/panel
        self.historial_decisiones: list[dict] = []
        # Modo control total / Modo Sombra: el jugador maneja esta entidad manualmente
        self.control_total: bool = False
        self.control_total_pendiente: Posicion | None = None  # movimiento pedido por teclado
        self.sombra_accion_pendiente: str | None = None  # "mover", "esperar"

    def actualizar_estado_interno(self, configuracion) -> None:
        """Actualiza hambre por tick (la energía se actualiza por acción)."""
        self.estado_interno.actualizar_hambre(
            configuracion.incremento_hambre_por_tick
        )

    def percibir_entorno(
        self, mapa: "Mapa", configuracion
    ) -> PercepcionLocal:
        """Construye la percepción del entorno."""
        radio = getattr(configuracion, "radio_percepcion", 5)
        return SistemaPercepcion.percibir(mapa, self, radio)

    def actualizar_memoria(
        self, percepcion: PercepcionLocal, tick_actual: int
    ) -> None:
        """Actualiza la memoria con la percepción."""
        for pos, recurso in percepcion.recursos_visibles:
            self.memoria.registrar_recurso_visto(
                recurso.tipo.name.lower(), pos, tick_actual
            )
        for pos, _ in percepcion.refugios_visibles:
            self.memoria.registrar_refugio_visto(pos, tick_actual)

    def actualizar_directivas(self, tick_actual: int) -> None:
        """Actualiza el estado de las directivas activas."""
        self.gestor_directivas.filtrar_directivas_expiradas(tick_actual)

    def decidir_accion(self, contexto_decision: "ContextoDecision") -> AccionPuntuada | None:
        """Decide la mejor acción y registra en historial.
        En modo control_total / sombra, la IA no toma decisiones; el jugador manda.
        """
        if self.control_total:
            # Accion ESPERAR explícita (tecla ESPACIO en modo sombra)
            if self.sombra_accion_pendiente == "esperar":
                self.sombra_accion_pendiente = None
                from acciones.accion_descansar import AccionDescansar
                accion = AccionDescansar(self.id_entidad)
                puntuada = AccionPuntuada(
                    accion=accion,
                    puntuacion_base=9.0,
                    modificadores={"sombra": 9.0},
                    puntuacion_final=9.0,
                    motivo_principal="SOMBRA_ESPERAR",
                )
                self.historial_decisiones.append({
                    "tick": contexto_decision.tick_actual,
                    "accion": "descansar",
                    "score": 9.0,
                    "motivo": "SOMBRA_ESPERAR",
                })
                if len(self.historial_decisiones) > 8:
                    self.historial_decisiones.pop(0)
                return puntuada

            # Movimiento manual pendiente
            if self.control_total_pendiente is not None:
                dest = self.control_total_pendiente
                self.control_total_pendiente = None
                self.sombra_accion_pendiente = None
                from acciones.accion_mover import AccionMover
                accion = AccionMover(self.id_entidad, dest.x, dest.y)
                puntuada = AccionPuntuada(
                    accion=accion,
                    puntuacion_base=9.0,
                    modificadores={"sombra": 9.0},
                    puntuacion_final=9.0,
                    motivo_principal="SOMBRA_MOVER",
                )
                self.historial_decisiones.append({
                    "tick": contexto_decision.tick_actual,
                    "accion": "mover",
                    "score": 9.0,
                    "motivo": "SOMBRA_MOVER",
                })
                if len(self.historial_decisiones) > 8:
                    self.historial_decisiones.pop(0)
                return puntuada

            # Sin acción pendiente: mundo espera
            return None

        resultado = self.motor_decision.decidir(self, contexto_decision)
        if resultado:
            entrada = {
                "tick": contexto_decision.tick_actual,
                "accion": resultado.accion.tipo_accion.value,
                "score": round(resultado.puntuacion_final, 3),
                "motivo": resultado.motivo_principal,
            }
            self.historial_decisiones.append(entrada)
            if len(self.historial_decisiones) > 8:
                self.historial_decisiones.pop(0)
        return resultado

    def ejecutar_accion(
        self, accion_puntuada: AccionPuntuada, contexto_simulacion: "ContextoSimulacion"
    ):
        """Ejecuta la acción elegida."""
        return accion_puntuada.accion.ejecutar(self, contexto_simulacion)

    def recibir_directiva(self, directiva: DirectivaExterna) -> None:
        """Recibe una directiva externa."""
        self.gestor_directivas.agregar_directiva(directiva)

    def puede_aceptar_directiva(self, directiva: DirectivaExterna) -> bool:
        """Indica si puede aceptar la directiva."""
        return True

    def obtener_resumen_debug(self) -> dict:
        """Resumen para debug y panel de entidad."""
        return {
            "id": self.id_entidad,
            "nombre": self.nombre,
            "tipo": self.tipo_entidad.value,
            "posicion": self.posicion.como_tupla(),
            "hambre": self.estado_interno.hambre,
            "energia": self.estado_interno.energia,
            "salud": self.estado_interno.salud,
            "inventario": self.estado_interno.inventario.como_dict(),
            "accion_actual": (
                self.estado_interno.accion_actual.value
                if self.estado_interno.accion_actual
                else None
            ),
        }
