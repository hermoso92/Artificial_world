"""
GestorModoSombra — backend central del MODO SOMBRA.

Responsabilidades:
  1. Mantener el registro de entidades en cada modo (AUTONOMO / DIRIGIDO / POSEIDO).
  2. Gestionar la cola de ComandoSombra por entidad.
  3. Emitir los eventos correspondientes al bus de eventos.
  4. En cada tick, traducir el comando activo en la acción que debe ejecutar la entidad.

Pipeline de CONTROL FORZADO (modo POSEIDO):
    UI → ComandoSombra → GestorModoSombra.encolar_comando()
       → tick: GestorModoSombra.procesar_tick(entidad, tick)
       → devuelve AccionPuntuada | None para que EntidadBase la use

Pipeline de DIRECTIVA INTERPRETABLE (modo DIRIGIDO):
    UI → DirectivaExterna → EntidadBase.recibir_directiva()
       → GestorModoSombra.activar_modo_dirigido(entidad)
       → motor_decision usa aplicar_modificadores_por_directivas (ya existe)
"""

from __future__ import annotations

import logging
from collections import defaultdict
from typing import TYPE_CHECKING

from tipos.enums import (
    ModoControl,
    TipoComandoSombra,
    EstadoComandoSombra,
    TipoEvento,
    TipoAccion,
)
from tipos.modelos import ComandoSombra, EventoSistema, Posicion, AccionPuntuada

if TYPE_CHECKING:
    from entidades.entidad_base import EntidadBase
    from nucleo.bus_eventos import BusEventos
    from nucleo.contexto import ContextoDecision

_logger = logging.getLogger("modo_sombra")


class GestorModoSombra:
    """Sistema central del modo sombra.

    Se instancia una vez en la simulación y coordina todas las entidades.
    """

    def __init__(self, bus_eventos: "BusEventos | None" = None):
        self.bus_eventos = bus_eventos
        self.sistema_competencia = None  # Inyectado por Simulacion
        # modo_control por id_entidad; default AUTONOMO
        self._modos: dict[int, ModoControl] = defaultdict(lambda: ModoControl.AUTONOMO)
        # colas de comandos por id_entidad
        self._colas: dict[int, list[ComandoSombra]] = defaultdict(list)
        # contador global de IDs de comando
        self._contador_comandos: int = 0
        # historial de trazabilidad (últimos 50 eventos por sesión)
        self.trazabilidad: list[dict] = []

    # ------------------------------------------------------------------
    # MODO DE CONTROL
    # ------------------------------------------------------------------

    def obtener_modo(self, id_entidad: int) -> ModoControl:
        return self._modos[id_entidad]

    def activar_modo_poseido(self, entidad: "EntidadBase", tick: int) -> None:
        """Cambia la entidad a modo POSEIDO y emite evento."""
        anterior = self._modos[entidad.id_entidad]
        if anterior == ModoControl.POSEIDO:
            return
        self._modos[entidad.id_entidad] = ModoControl.POSEIDO
        # Sincronizar con campo en la entidad
        entidad.modo_control = ModoControl.POSEIDO
        entidad.control_total = True
        self._registrar_trazabilidad(
            tick, entidad.id_entidad, "MODO_ACTIVADO",
            f"{entidad.nombre} → POSEIDO (anterior: {anterior.value})"
        )
        self._emitir(EventoSistema(
            tick=tick,
            tipo=TipoEvento.MODO_SOMBRA_ACTIVADO,
            id_origen=None,
            id_objetivo=entidad.id_entidad,
            posicion=entidad.posicion,
            descripcion=f"[SOMBRA] {entidad.nombre} POSEIDO",
        ))
        if self.sistema_competencia and self.sistema_competencia.activo:
            self.sistema_competencia.registrar(
                action="modo_sombra_activado",
                target_resource=entidad.nombre,
                target_type="modo_sombra",
                outcome="success",
                signals=["modo_sombra_activado"],
                actor_id=str(entidad.id_entidad),
                actor_role="modo_sombra",
                tick=tick,
            )
        _logger.info("MODO_SOMBRA_ACTIVADO ent=%s tick=%d", entidad.nombre, tick)

    def activar_modo_dirigido(self, entidad: "EntidadBase", tick: int) -> None:
        """Cambia la entidad a modo DIRIGIDO (IA + directivas activas)."""
        self._modos[entidad.id_entidad] = ModoControl.DIRIGIDO
        entidad.modo_control = ModoControl.DIRIGIDO
        entidad.control_total = False
        self._registrar_trazabilidad(
            tick, entidad.id_entidad, "MODO_DIRIGIDO",
            f"{entidad.nombre} → DIRIGIDO"
        )
        self._emitir(EventoSistema(
            tick=tick,
            tipo=TipoEvento.DIRECTIVA_SOMBRA_EMITIDA,
            id_origen=None,
            id_objetivo=entidad.id_entidad,
            posicion=entidad.posicion,
            descripcion=f"[SOMBRA] {entidad.nombre} DIRIGIDO",
        ))

    def desactivar_modo_sombra(self, entidad: "EntidadBase", tick: int) -> None:
        """Vuelve al modo AUTONOMO y emite evento."""
        modo_anterior = self._modos[entidad.id_entidad]
        self._modos[entidad.id_entidad] = ModoControl.AUTONOMO
        entidad.modo_control = ModoControl.AUTONOMO
        entidad.control_total = False
        entidad.control_total_pendiente = None
        entidad.sombra_accion_pendiente = None
        # Cancelar todos los comandos pendientes
        for cmd in self._colas[entidad.id_entidad]:
            if not cmd.esta_terminado():
                cmd.estado = EstadoComandoSombra.CANCELADO
                cmd.tick_fin = tick
        self._registrar_trazabilidad(
            tick, entidad.id_entidad, "MODO_DESACTIVADO",
            f"{entidad.nombre} → AUTONOMO (anterior: {modo_anterior.value})"
        )
        self._emitir(EventoSistema(
            tick=tick,
            tipo=TipoEvento.MODO_SOMBRA_DESACTIVADO,
            id_origen=None,
            id_objetivo=entidad.id_entidad,
            posicion=entidad.posicion,
            descripcion=f"[SOMBRA] {entidad.nombre} AUTONOMO",
        ))
        if self.sistema_competencia and self.sistema_competencia.activo:
            self.sistema_competencia.registrar(
                action="modo_sombra_desactivado",
                target_resource=entidad.nombre,
                target_type="modo_sombra",
                outcome="success",
                signals=["modo_sombra_activado"],
                actor_id=str(entidad.id_entidad),
                actor_role="modo_sombra",
                tick=tick,
            )
        _logger.info("MODO_SOMBRA_DESACTIVADO ent=%s tick=%d", entidad.nombre, tick)

    # ------------------------------------------------------------------
    # COLA DE COMANDOS
    # ------------------------------------------------------------------

    def encolar_comando(
        self,
        entidad: "EntidadBase",
        tipo_comando: TipoComandoSombra,
        tick: int,
        objetivo_posicion: Posicion | None = None,
        objetivo_entidad: int | None = None,
        parametros: dict | None = None,
        prioridad: float = 1.0,
    ) -> ComandoSombra:
        """Crea un ComandoSombra, lo añade a la cola y activa modo POSEIDO."""
        self._contador_comandos += 1
        cmd = ComandoSombra(
            id_comando=self._contador_comandos,
            id_entidad_objetivo=entidad.id_entidad,
            tipo_comando=tipo_comando,
            tick_emision=tick,
            prioridad=prioridad,
            objetivo_posicion=objetivo_posicion,
            objetivo_entidad=objetivo_entidad,
            parametros=parametros,
        )
        self._colas[entidad.id_entidad].append(cmd)

        # Activar modo POSEIDO automáticamente
        self.activar_modo_poseido(entidad, tick)

        self._registrar_trazabilidad(
            tick, entidad.id_entidad, "COMANDO_EMITIDO",
            f"cmd#{cmd.id_comando} tipo={tipo_comando.value} "
            f"pos={objetivo_posicion} ent={objetivo_entidad}"
        )
        if self.sistema_competencia and self.sistema_competencia.activo:
            self.sistema_competencia.registrar(
                action="comando_sombra_emitido",
                target_resource=entidad.nombre,
                target_type="modo_sombra",
                outcome="success",
                signals=["comando_sombra", "directiva_emitida"],
                actor_id=str(entidad.id_entidad),
                actor_role="modo_sombra",
                tick=tick,
            )
        self._emitir(EventoSistema(
            tick=tick,
            tipo=TipoEvento.COMANDO_SOMBRA_EMITIDO,
            id_origen=None,
            id_objetivo=entidad.id_entidad,
            posicion=entidad.posicion,
            descripcion=f"[SOMBRA] cmd#{cmd.id_comando} {tipo_comando.value} → {entidad.nombre}",
            metadatos={"id_comando": cmd.id_comando, "tipo": tipo_comando.value},
        ))
        _logger.info(
            "COMANDO_SOMBRA_EMITIDO cmd=%d tipo=%s ent=%s tick=%d",
            cmd.id_comando, tipo_comando.value, entidad.nombre, tick
        )
        return cmd

    def obtener_comando_activo(self, id_entidad: int) -> ComandoSombra | None:
        """Devuelve el primer comando no terminado de la cola."""
        cola = self._colas[id_entidad]
        for cmd in cola:
            if not cmd.esta_terminado():
                return cmd
        return None

    def obtener_cola(self, id_entidad: int) -> list[ComandoSombra]:
        """Devuelve todos los comandos de la cola (para inspección)."""
        return list(self._colas[id_entidad])

    def cancelar_todos(self, id_entidad: int, tick: int) -> None:
        """Cancela todos los comandos pendientes de una entidad."""
        for cmd in self._colas[id_entidad]:
            if not cmd.esta_terminado():
                cmd.estado = EstadoComandoSombra.CANCELADO
                cmd.tick_fin = tick

    # ------------------------------------------------------------------
    # PROCESAMIENTO POR TICK
    # ------------------------------------------------------------------

    def procesar_tick(
        self,
        entidad: "EntidadBase",
        tick: int,
        contexto: "ContextoDecision",
    ) -> "AccionPuntuada | None":
        """Genera la AccionPuntuada correspondiente al comando activo en modo POSEIDO.

        Devuelve None si no hay comando activo (la entidad queda en espera).
        Si la cola se vacía, vuelve automáticamente a AUTONOMO.
        """
        modo = self._modos[entidad.id_entidad]
        if modo != ModoControl.POSEIDO:
            return None

        cmd = self.obtener_comando_activo(entidad.id_entidad)
        if cmd is None:
            # Cola vacía → devolver a AUTONOMO
            self.desactivar_modo_sombra(entidad, tick)
            return None

        # Marcar inicio si es la primera vez
        if cmd.estado == EstadoComandoSombra.PENDIENTE:
            cmd.estado = EstadoComandoSombra.EN_PROGRESO
            cmd.tick_inicio = tick
            self._emitir(EventoSistema(
                tick=tick,
                tipo=TipoEvento.COMANDO_SOMBRA_INICIADO,
                id_origen=None,
                id_objetivo=entidad.id_entidad,
                posicion=entidad.posicion,
                descripcion=f"[SOMBRA] cmd#{cmd.id_comando} {cmd.tipo_comando.value} INICIADO",
            ))
            _logger.info(
                "COMANDO_SOMBRA_INICIADO cmd=%d tipo=%s ent=%s tick=%d",
                cmd.id_comando, cmd.tipo_comando.value, entidad.nombre, tick
            )

        # Traducir comando → AccionPuntuada
        accion_puntuada = self._traducir_comando(entidad, cmd, tick, contexto)

        if accion_puntuada is None:
            # No se pudo generar acción → fallo
            cmd.estado = EstadoComandoSombra.FALLIDO
            cmd.tick_fin = tick
            cmd.motivo_fallo = "accion_no_generada"
            self._registrar_trazabilidad(
                tick, entidad.id_entidad, "COMANDO_FALLIDO",
                f"cmd#{cmd.id_comando} {cmd.tipo_comando.value} → no se generó acción"
            )
            _logger.warning(
                "COMANDO_SOMBRA_FALLIDO cmd=%d tipo=%s ent=%s tick=%d",
                cmd.id_comando, cmd.tipo_comando.value, entidad.nombre, tick
            )
            return None

        return accion_puntuada

    # ------------------------------------------------------------------
    # TRADUCCIÓN COMANDO → ACCION
    # ------------------------------------------------------------------

    def _traducir_comando(
        self,
        entidad: "EntidadBase",
        cmd: ComandoSombra,
        tick: int,
        contexto: "ContextoDecision",
    ) -> "AccionPuntuada | None":
        """Convierte un ComandoSombra en la AccionPuntuada concreta a ejecutar."""

        tipo = cmd.tipo_comando

        if tipo == TipoComandoSombra.MOVER_A_POSICION:
            return self._cmd_mover_a_posicion(entidad, cmd, tick, contexto)

        if tipo == TipoComandoSombra.IR_A_REFUGIO:
            return self._cmd_ir_a_refugio(entidad, cmd, tick, contexto)

        if tipo == TipoComandoSombra.QUEDARSE_EN_REFUGIO:
            return self._cmd_quedarse_en_refugio(entidad, cmd, tick, contexto)

        if tipo == TipoComandoSombra.RECOGER_OBJETIVO:
            return self._cmd_recoger_objetivo(entidad, cmd, tick, contexto)

        if tipo == TipoComandoSombra.SEGUIR_OBJETIVO:
            return self._cmd_seguir_objetivo(entidad, cmd, tick, contexto)

        if tipo == TipoComandoSombra.EVITAR_OBJETIVO:
            return self._cmd_evitar_objetivo(entidad, cmd, tick, contexto)

        if tipo == TipoComandoSombra.ATACAR_OBJETIVO:
            return self._cmd_atacar_objetivo(entidad, cmd, tick, contexto)

        if tipo == TipoComandoSombra.MATAR_OBJETIVO:
            # Reservado: redirigir a atacar hasta que haya sistema de combate completo
            return self._cmd_atacar_objetivo(entidad, cmd, tick, contexto)

        _logger.warning("Tipo de comando sombra no implementado: %s", tipo.value)
        return None

    def _hacer_accion_puntuada(self, accion, motivo: str) -> AccionPuntuada:
        return AccionPuntuada(
            accion=accion,
            puntuacion_base=9.0,
            modificadores={"sombra_forzado": 9.0},
            puntuacion_final=9.0,
            motivo_principal=motivo,
        )

    def _cmd_mover_a_posicion(self, entidad, cmd, tick, contexto) -> AccionPuntuada | None:
        objetivo = cmd.objetivo_posicion
        if objetivo is None:
            return None
        pos = entidad.posicion
        # ¿Ya llegamos?
        if pos.x == objetivo.x and pos.y == objetivo.y:
            self._completar_comando(cmd, tick, entidad)
            from acciones.accion_descansar import AccionDescansar
            return self._hacer_accion_puntuada(
                AccionDescansar(entidad.id_entidad), "SOMBRA_LLEGADO"
            )
        # Paso hacia el objetivo: movimiento Manhattan más cercano
        destino = self._paso_hacia(pos, objetivo, entidad, contexto)
        if destino is None:
            # Sin camino válido → descansar este tick
            from acciones.accion_descansar import AccionDescansar
            return self._hacer_accion_puntuada(
                AccionDescansar(entidad.id_entidad), "SOMBRA_BLOQUEADO"
            )
        from acciones.accion_mover import AccionMover
        return self._hacer_accion_puntuada(
            AccionMover(entidad.id_entidad, destino.x, destino.y),
            f"SOMBRA_MOVER->({objetivo.x},{objetivo.y})"
        )

    def _cmd_ir_a_refugio(self, entidad, cmd, tick, contexto) -> AccionPuntuada | None:
        mapa = contexto.mapa if contexto else None
        if mapa is None:
            return None
        # ¿Ya estamos en refugio?
        celda_actual = mapa.obtener_celda(entidad.posicion)
        if celda_actual and celda_actual.tiene_refugio():
            self._completar_comando(cmd, tick, entidad)
            from acciones.accion_descansar import AccionDescansar
            return self._hacer_accion_puntuada(
                AccionDescansar(entidad.id_entidad), "SOMBRA_EN_REFUGIO"
            )
        # Buscar refugio más cercano en memoria
        refugios = entidad.memoria.obtener_refugios_conocidos() if entidad.memoria else []
        if not refugios:
            # Sin memoria de refugio → explorar
            from acciones.accion_explorar import AccionExplorar
            return self._hacer_accion_puntuada(
                AccionExplorar(entidad.id_entidad), "SOMBRA_BUSCANDO_REFUGIO"
            )
        # Ir al más cercano
        pos = entidad.posicion
        mejor = min(
            refugios, key=lambda r: abs(r.posicion.x - pos.x) + abs(r.posicion.y - pos.y)
        )
        destino = self._paso_hacia(pos, mejor.posicion, entidad, contexto)
        if destino is None:
            from acciones.accion_ir_refugio import AccionIrRefugio
            return self._hacer_accion_puntuada(
                AccionIrRefugio(entidad.id_entidad, mejor.posicion.x, mejor.posicion.y),
                "SOMBRA_IR_REFUGIO"
            )
        from acciones.accion_mover import AccionMover
        return self._hacer_accion_puntuada(
            AccionMover(entidad.id_entidad, destino.x, destino.y),
            f"SOMBRA_->REFUGIO({mejor.posicion.x},{mejor.posicion.y})"
        )

    def _cmd_quedarse_en_refugio(self, entidad, cmd, tick, contexto) -> AccionPuntuada | None:
        mapa = contexto.mapa if contexto else None
        if mapa:
            celda_actual = mapa.obtener_celda(entidad.posicion)
            if celda_actual and celda_actual.tiene_refugio():
                # Ya estamos en refugio: descansar indefinidamente (comando permanente)
                from acciones.accion_descansar import AccionDescansar
                return self._hacer_accion_puntuada(
                    AccionDescansar(entidad.id_entidad), "SOMBRA_QUEDARSE_REFUGIO"
                )
        # No estamos en refugio: ir primero
        return self._cmd_ir_a_refugio(entidad, cmd, tick, contexto)

    def _cmd_recoger_objetivo(self, entidad, cmd, tick, contexto) -> AccionPuntuada | None:
        mapa = contexto.mapa if contexto else None
        if mapa is None:
            return None
        objetivo_pos = cmd.objetivo_posicion
        pos = entidad.posicion
        # Si hay posición objetivo, ir hacia ella
        if objetivo_pos:
            celda_obj = mapa.obtener_celda(objetivo_pos)
            if pos.x == objetivo_pos.x and pos.y == objetivo_pos.y:
                # Estamos en el objetivo → intentar recoger
                if celda_obj and celda_obj.tiene_recurso() and celda_obj.recurso:
                    from tipos.enums import TipoRecurso
                    if celda_obj.recurso.tipo == TipoRecurso.COMIDA:
                        from acciones.accion_recoger_comida import AccionRecogerComida
                        self._completar_comando(cmd, tick, entidad)
                        return self._hacer_accion_puntuada(
                            AccionRecogerComida(entidad.id_entidad), "SOMBRA_RECOGER_COMIDA"
                        )
                    else:
                        from acciones.accion_recoger_material import AccionRecogerMaterial
                        self._completar_comando(cmd, tick, entidad)
                        return self._hacer_accion_puntuada(
                            AccionRecogerMaterial(entidad.id_entidad), "SOMBRA_RECOGER_MATERIAL"
                        )
                else:
                    # Llegamos pero ya no hay recurso
                    cmd.estado = EstadoComandoSombra.FALLIDO
                    cmd.motivo_fallo = "recurso_desaparecio"
                    from acciones.accion_descansar import AccionDescansar
                    return self._hacer_accion_puntuada(
                        AccionDescansar(entidad.id_entidad), "SOMBRA_RECURSO_NO_ENCONTRADO"
                    )
            # Moverse hacia el objetivo
            destino = self._paso_hacia(pos, objetivo_pos, entidad, contexto)
            if destino:
                from acciones.accion_mover import AccionMover
                return self._hacer_accion_puntuada(
                    AccionMover(entidad.id_entidad, destino.x, destino.y),
                    f"SOMBRA_->RECURSO({objetivo_pos.x},{objetivo_pos.y})"
                )
        # Sin posición: usar percepción para encontrar recurso visible
        if contexto and contexto.percepcion_local:
            recursos = contexto.percepcion_local.recursos_visibles
            if recursos:
                r_pos, _ = recursos[0]
                destino = self._paso_hacia(pos, r_pos, entidad, contexto)
                if destino:
                    from acciones.accion_mover import AccionMover
                    return self._hacer_accion_puntuada(
                        AccionMover(entidad.id_entidad, destino.x, destino.y),
                        "SOMBRA_->RECURSO_CERCANO"
                    )
        from acciones.accion_explorar import AccionExplorar
        return self._hacer_accion_puntuada(
            AccionExplorar(entidad.id_entidad), "SOMBRA_BUSCANDO_RECURSO"
        )

    def _cmd_seguir_objetivo(self, entidad, cmd, tick, contexto) -> AccionPuntuada | None:
        id_obj = cmd.objetivo_entidad
        if id_obj is None:
            return None
        entidades = contexto.entidades if hasattr(contexto, "entidades") else []
        obj = next((e for e in entidades if e.id_entidad == id_obj), None)
        if obj is None:
            return None
        pos = entidad.posicion
        pos_obj = obj.posicion
        # Si ya estamos adyacente (distancia ≤ 2) no moverse
        dist = abs(pos.x - pos_obj.x) + abs(pos.y - pos_obj.y)
        if dist <= 1:
            from acciones.accion_descansar import AccionDescansar
            return self._hacer_accion_puntuada(
                AccionDescansar(entidad.id_entidad), f"SOMBRA_SIGUIENDO_{id_obj}"
            )
        destino = self._paso_hacia(pos, pos_obj, entidad, contexto)
        if destino is None:
            from acciones.accion_explorar import AccionExplorar
            return self._hacer_accion_puntuada(
                AccionExplorar(entidad.id_entidad), "SOMBRA_SEGUIR_BLOQUEADO"
            )
        from acciones.accion_mover import AccionMover
        return self._hacer_accion_puntuada(
            AccionMover(entidad.id_entidad, destino.x, destino.y),
            f"SOMBRA_SEGUIR->{id_obj}"
        )

    def _cmd_evitar_objetivo(self, entidad, cmd, tick, contexto) -> AccionPuntuada | None:
        id_obj = cmd.objetivo_entidad
        pos = entidad.posicion
        entidades = contexto.entidades if hasattr(contexto, "entidades") else []
        if id_obj is not None:
            obj = next((e for e in entidades if e.id_entidad == id_obj), None)
        else:
            obj = None
        # Buscar posición que maximice distancia al objetivo
        vecinos = contexto.percepcion_local.posiciones_vecinas if (
            contexto and contexto.percepcion_local
        ) else []
        if not vecinos:
            from acciones.accion_descansar import AccionDescansar
            return self._hacer_accion_puntuada(
                AccionDescansar(entidad.id_entidad), "SOMBRA_EVITAR_ESPERA"
            )
        if obj:
            pos_obj = obj.posicion
            mejor = max(
                vecinos,
                key=lambda p: abs(p.x - pos_obj.x) + abs(p.y - pos_obj.y)
            )
        else:
            # Sin objetivo concreto: moverse aleatoriamente
            mejor = vecinos[0]
        mapa = contexto.mapa if contexto else None
        if mapa and not mapa.es_posicion_valida(mejor):
            mejor = vecinos[0]
        from acciones.accion_mover import AccionMover
        return self._hacer_accion_puntuada(
            AccionMover(entidad.id_entidad, mejor.x, mejor.y),
            f"SOMBRA_EVITAR_{id_obj}"
        )

    def _cmd_atacar_objetivo(self, entidad, cmd, tick, contexto) -> AccionPuntuada | None:
        """Ataque mínimo: acercarse al objetivo y ejecutar AccionAtacar."""
        modo_combate = getattr(
            getattr(contexto, "configuracion", None), "modo_combate_activo", False
        )
        if not modo_combate:
            from acciones.accion_descansar import AccionDescansar
            return self._hacer_accion_puntuada(
                AccionDescansar(entidad.id_entidad), "SOMBRA_ATACAR_BLOQUEADO_modo_combate_off"
            )
        id_obj = cmd.objetivo_entidad
        if id_obj is None:
            return None
        entidades = contexto.entidades if hasattr(contexto, "entidades") else []
        obj = next((e for e in entidades if e.id_entidad == id_obj), None)
        if obj is None:
            # Objetivo desaparecido → completar
            self._completar_comando(cmd, tick, entidad)
            from acciones.accion_descansar import AccionDescansar
            return self._hacer_accion_puntuada(
                AccionDescansar(entidad.id_entidad), "SOMBRA_OBJETIVO_ELIMINADO"
            )
        pos = entidad.posicion
        pos_obj = obj.posicion
        dist = abs(pos.x - pos_obj.x) + abs(pos.y - pos_obj.y)
        if dist <= 1:
            # En rango: atacar
            from acciones.accion_atacar import AccionAtacar
            motivo = "SOMBRA_ATACAR" if cmd.tipo_comando == TipoComandoSombra.ATACAR_OBJETIVO else "SOMBRA_MATAR"
            return self._hacer_accion_puntuada(
                AccionAtacar(entidad.id_entidad, id_obj), motivo
            )
        # Acercarse
        destino = self._paso_hacia(pos, pos_obj, entidad, contexto)
        if destino is None:
            from acciones.accion_descansar import AccionDescansar
            return self._hacer_accion_puntuada(
                AccionDescansar(entidad.id_entidad), "SOMBRA_ATACAR_BLOQUEADO"
            )
        from acciones.accion_mover import AccionMover
        return self._hacer_accion_puntuada(
            AccionMover(entidad.id_entidad, destino.x, destino.y),
            f"SOMBRA_ACERCANDO_ATACAR_{id_obj}"
        )

    # ------------------------------------------------------------------
    # UTILIDADES
    # ------------------------------------------------------------------

    def _paso_hacia(
        self,
        pos_actual: Posicion,
        destino: Posicion,
        entidad: "EntidadBase",
        contexto: "ContextoDecision",
    ) -> Posicion | None:
        """Devuelve el vecino que más se acerca a destino, validado en el mapa."""
        mapa = contexto.mapa if contexto else None
        vecinos = []
        if contexto and contexto.percepcion_local:
            vecinos = list(contexto.percepcion_local.posiciones_vecinas)
        if not vecinos:
            # Generar vecinos simples si no hay percepción
            for dx, dy in [(0, -1), (0, 1), (-1, 0), (1, 0)]:
                vecinos.append(Posicion(pos_actual.x + dx, pos_actual.y + dy))

        candidatos = []
        for v in vecinos:
            if mapa and not mapa.es_posicion_valida(v):
                continue
            dist = abs(v.x - destino.x) + abs(v.y - destino.y)
            candidatos.append((dist, v))

        if not candidatos:
            return None
        candidatos.sort(key=lambda t: t[0])
        dist_actual = abs(pos_actual.x - destino.x) + abs(pos_actual.y - destino.y)
        mejor_dist, mejor_pos = candidatos[0]
        if mejor_dist >= dist_actual:
            return None  # No podemos acercarnos
        return mejor_pos

    def _completar_comando(self, cmd: ComandoSombra, tick: int, entidad: "EntidadBase") -> None:
        cmd.estado = EstadoComandoSombra.COMPLETADO
        cmd.tick_fin = tick
        self._registrar_trazabilidad(
            tick, entidad.id_entidad, "COMANDO_COMPLETADO",
            f"cmd#{cmd.id_comando} {cmd.tipo_comando.value} OK"
        )
        self._emitir(EventoSistema(
            tick=tick,
            tipo=TipoEvento.COMANDO_SOMBRA_COMPLETADO,
            id_origen=None,
            id_objetivo=entidad.id_entidad,
            posicion=entidad.posicion,
            descripcion=f"[SOMBRA] cmd#{cmd.id_comando} {cmd.tipo_comando.value} COMPLETADO",
        ))
        _logger.info(
            "COMANDO_SOMBRA_COMPLETADO cmd=%d tipo=%s ent=%s tick=%d",
            cmd.id_comando, cmd.tipo_comando.value, entidad.nombre, tick
        )

    def _emitir(self, evento: EventoSistema) -> None:
        if self.bus_eventos:
            self.bus_eventos.emitir(evento)

    def _registrar_trazabilidad(
        self, tick: int, id_entidad: int, tipo: str, descripcion: str
    ) -> None:
        entrada = {
            "tick": tick,
            "id_entidad": id_entidad,
            "tipo": tipo,
            "descripcion": descripcion,
        }
        self.trazabilidad.append(entrada)
        if len(self.trazabilidad) > 200:
            self.trazabilidad.pop(0)

    def obtener_trazabilidad(self, id_entidad: int | None = None, limite: int = 20) -> list[dict]:
        """Devuelve el historial de trazabilidad, opcionalmente filtrado por entidad."""
        registros = self.trazabilidad
        if id_entidad is not None:
            registros = [r for r in registros if r["id_entidad"] == id_entidad]
        return list(reversed(registros[-limite:]))

    def obtener_resumen_entidad(self, id_entidad: int) -> dict:
        """Resumen del estado sombra de una entidad (para el panel)."""
        modo = self._modos[id_entidad]
        cmd = self.obtener_comando_activo(id_entidad)
        cola_total = len(self._colas[id_entidad])
        comando_activo: dict | None = None
        if cmd is not None:
            comando_activo = {
                "id": cmd.id_comando,
                "tipo": cmd.tipo_comando.value,
                "estado": cmd.estado.value,
                "tick_emision": cmd.tick_emision,
                "tick_inicio": cmd.tick_inicio,
                "objetivo_posicion": cmd.objetivo_posicion.como_tupla() if cmd.objetivo_posicion else None,
                "objetivo_entidad": cmd.objetivo_entidad,
            }
        return {
            "modo_control": modo.value,
            "comando_activo": comando_activo,
            "cola_total": cola_total,
        }
