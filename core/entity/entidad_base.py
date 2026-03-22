"""
Entidad base: clase base para todas las entidades autónomas.
"""

from typing import TYPE_CHECKING

from tipos.enums import TipoEntidad, ModoControl
from tipos.modelos import AccionPuntuada, DirectivaExterna, PercepcionLocal, Posicion

from agentes.directivas import GestorDirectivas
from agentes.estado_interno import EstadoInterno
from agentes.memoria import MemoriaEntidad
from agentes.motor_decision import MotorDecision
from agentes.percepcion import SistemaPercepcion

if TYPE_CHECKING:
    from mundo.mapa import Mapa
    from nucleo.contexto import ContextoDecision, ContextoSimulacion
    from sistemas.gestor_modo_sombra import GestorModoSombra


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
        self.historial_decisiones: list[dict] = []

        self.modo_control: ModoControl = ModoControl.AUTONOMO
        self.control_total: bool = False
        self.control_total_pendiente: Posicion | None = None
        self.sombra_accion_pendiente: str | None = None
        self._gestor_sombra: "GestorModoSombra | None" = None

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
        """Decide la mejor acción según el modo de control activo."""
        tick = contexto_decision.tick_actual

        if self.modo_control == ModoControl.POSEIDO and self._gestor_sombra is not None:
            accion_puntuada = self._gestor_sombra.procesar_tick(self, tick, contexto_decision)
            if accion_puntuada:
                self._registrar_en_historial(accion_puntuada, tick)
            return accion_puntuada

        if self.control_total:
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
                self._registrar_en_historial(puntuada, tick)
                return puntuada

            if self.sombra_accion_pendiente == "comer":
                self.sombra_accion_pendiente = None
                from acciones.accion_comer import AccionComer
                accion = AccionComer(self.id_entidad)
                if accion.es_viable(self, contexto_decision):
                    puntuada = AccionPuntuada(
                        accion=accion, puntuacion_base=9.0,
                        modificadores={"sombra": 9.0}, puntuacion_final=9.0,
                        motivo_principal="SOMBRA_COMER",
                    )
                    self._registrar_en_historial(puntuada, tick)
                    return puntuada

            if self.sombra_accion_pendiente == "recoger":
                self.sombra_accion_pendiente = None
                accion = self._ctrl_accion_recoger(contexto_decision)
                if accion:
                    self._registrar_en_historial(accion, tick)
                    return accion

            if self.control_total_pendiente is not None:
                dest = self.control_total_pendiente
                self.control_total_pendiente = None
                self.sombra_accion_pendiente = None
                from acciones.accion_mover import AccionMover
                mapa = contexto_decision.mapa if contexto_decision else None
                celda_dest = mapa.obtener_celda(dest) if mapa else None
                if celda_dest and celda_dest.tiene_refugio():
                    from acciones.accion_ir_refugio import AccionIrRefugio
                    accion = AccionIrRefugio(self.id_entidad, dest.x, dest.y)
                    motivo = "SOMBRA_IR_REFUGIO"
                else:
                    accion = AccionMover(self.id_entidad, dest.x, dest.y)
                    motivo = "SOMBRA_MOVER"
                puntuada = AccionPuntuada(
                    accion=accion,
                    puntuacion_base=9.0,
                    modificadores={"sombra": 9.0},
                    puntuacion_final=9.0,
                    motivo_principal=motivo,
                )
                self._registrar_en_historial(puntuada, tick)
                self._ctrl_post_move_flags = True
                return puntuada

            if getattr(self, "_ctrl_post_move_flags", False):
                self._ctrl_post_move_flags = False
                auto = self._ctrl_accion_auto_en_celda(contexto_decision)
                if auto:
                    self._registrar_en_historial(auto, tick)
                    return auto

            return None

        resultado = self.motor_decision.decidir(self, contexto_decision)
        if resultado:
            self._registrar_en_historial(resultado, tick)
        return resultado

    def _ctrl_accion_recoger(self, contexto) -> AccionPuntuada | None:
        """Intenta recoger el recurso de la celda actual (control total)."""
        if not contexto or not contexto.mapa:
            return None
        celda = contexto.mapa.obtener_celda(self.posicion)
        if not celda or not celda.tiene_recurso() or not celda.recurso:
            return None
        from tipos.enums import TipoRecurso
        if celda.recurso.tipo == TipoRecurso.COMIDA:
            from acciones.accion_recoger_comida import AccionRecogerComida
            accion = AccionRecogerComida(self.id_entidad)
            motivo = "SOMBRA_RECOGER_COMIDA"
        else:
            from acciones.accion_recoger_material import AccionRecogerMaterial
            accion = AccionRecogerMaterial(self.id_entidad)
            motivo = "SOMBRA_RECOGER_MATERIAL"
        if accion.es_viable(self, contexto):
            return AccionPuntuada(
                accion=accion, puntuacion_base=9.0,
                modificadores={"sombra": 9.0}, puntuacion_final=9.0,
                motivo_principal=motivo,
            )
        return None

    def _ctrl_accion_auto_en_celda(self, contexto) -> AccionPuntuada | None:
        """Tras moverse en control total, recoge automáticamente si hay recurso."""
        return self._ctrl_accion_recoger(contexto)

    def _registrar_en_historial(self, accion_puntuada: AccionPuntuada, tick: int) -> None:
        """Registra una decisión en el historial (máx. 8 entradas)."""
        entrada = {
            "tick": tick,
            "accion": accion_puntuada.accion.tipo_accion.value,
            "score": round(accion_puntuada.puntuacion_final, 3),
            "motivo": accion_puntuada.motivo_principal,
        }
        self.historial_decisiones.append(entrada)
        if len(self.historial_decisiones) > 8:
            self.historial_decisiones.pop(0)

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
            "modo_control": self.modo_control.value,
        }
