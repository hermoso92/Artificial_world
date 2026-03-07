"""
Simulación principal: orquesta mundo, entidades, ticks y render.
"""

from typing import TYPE_CHECKING

from nucleo.contexto import ContextoDecision, ContextoSimulacion

from interfaz.estado_panel import EstadoPanel, ModoVisualizacion

if TYPE_CHECKING:
    from mundo.mapa import Mapa


class Simulacion:
    """Orquesta la simulación completa."""

    def __init__(self, configuracion):
        self.configuracion = configuracion
        self.mapa: "Mapa | None" = None
        self.entidades: list = []
        self.gestor_ticks = None
        self.bus_eventos = None
        self.sistema_logs = None
        self.sistema_metricas = None
        self.sistema_regeneracion = None
        self.sistema_persistencia = None
        self.sistema_watchdog = None
        self.gestor_modo_sombra = None
        self.renderizador = None
        self.estado_panel = EstadoPanel()
        self.guardado_ok_tick = 0
        self.cargado_ok_tick = 0

    def inicializar(self) -> None:
        """Inicializa todos los sistemas."""
        from .gestor_ticks import GestorTicks
        from .bus_eventos import BusEventos
        from sistemas.sistema_logs import SistemaLogs
        from sistemas.sistema_metricas import SistemaMetricas
        from sistemas.sistema_regeneracion import SistemaRegeneracion
        from sistemas.sistema_persistencia import SistemaPersistencia
        from sistemas.gestor_modo_sombra import GestorModoSombra
        from interfaz.renderizador import Renderizador

        self.gestor_ticks = GestorTicks()
        self.sistema_persistencia = SistemaPersistencia(
            usar_sqlite=getattr(self.configuracion, "persistencia_sqlite", True),
            auto_guardar_intervalo=getattr(self.configuracion, "auto_guardar_intervalo_ticks", 20),
        )
        self.bus_eventos = BusEventos()
        self.sistema_logs = SistemaLogs()
        self.sistema_metricas = SistemaMetricas()
        self.sistema_regeneracion = SistemaRegeneracion()
        from sistemas.sistema_watchdog import SistemaWatchdog
        self.sistema_watchdog = SistemaWatchdog()
        self.gestor_modo_sombra = GestorModoSombra(bus_eventos=self.bus_eventos)
        self.renderizador = Renderizador(self.configuracion)
        self.renderizador.inicializar(estado_panel=self.estado_panel)
        # Inyectar gestor sombra en el panel de control
        if self.gestor_modo_sombra and self.renderizador.panel_control:
            self.renderizador.panel_control.gestor_sombra = self.gestor_modo_sombra

    def crear_mundo(self) -> None:
        """Crea el mundo inicial."""
        from mundo.generador_mundo import GeneradorMundo

        gen = GeneradorMundo(self.configuracion)
        self.mapa = gen.generar_mapa()
        gen.distribuir_comida(self.mapa)
        gen.distribuir_material(self.mapa)
        gen.distribuir_refugios(self.mapa)

    def crear_entidades_iniciales(self) -> None:
        """Crea las entidades iniciales."""
        from entidades.fabrica_entidades import FabricaEntidades

        fab = FabricaEntidades(self.configuracion)
        self.entidades = fab.crear_entidades_iniciales(self.mapa)
        # Inyectar gestor modo sombra en cada entidad
        if self.gestor_modo_sombra:
            for e in self.entidades:
                e._gestor_sombra = self.gestor_modo_sombra

    def procesar_entrada(self) -> bool:
        """Procesa entrada del usuario. Devuelve False si hay que salir."""
        import pygame
        for evento in pygame.event.get():
            if evento.type == pygame.QUIT:
                import logging
                logging.getLogger("simulacion").warning(
                    f"QUIT recibido en tick {self.gestor_ticks.tick_actual if self.gestor_ticks else 0}"
                )
                return False
            if evento.type == pygame.KEYDOWN:
                # Delegar al panel sombra si tiene input activo
                panel = self.renderizador.obtener_panel() if self.renderizador else None
                panel_s = panel.panel_sombra if panel else None
                if panel_s and panel_s.tiene_input_activo():
                    accion = panel_s.procesar_tecla(
                        evento.key, evento.unicode, self.entidades,
                        self.gestor_ticks.tick_actual
                    )
                    if accion:
                        self._procesar_click(accion)  # reusar el manejador con dict
                elif self.estado_panel.coord_input_activo:
                    self._procesar_tecla_coord_input(evento)
                else:
                    self._procesar_tecla(evento.key)
            if evento.type == pygame.MOUSEBUTTONDOWN and evento.button == 1:
                self._procesar_click(pygame.mouse.get_pos())
        return True

    def _procesar_tecla_coord_input(self, evento) -> None:
        """Captura teclas para el campo de texto de coordenadas."""
        import pygame
        if evento.key == pygame.K_ESCAPE:
            self.estado_panel.coord_input_activo = False
            self.estado_panel.coord_input_texto = ""
        elif evento.key == pygame.K_RETURN or evento.key == pygame.K_KP_ENTER:
            # Confirmar coordenadas
            texto = self.estado_panel.coord_input_texto.replace(" ", "")
            partes = texto.split(",")
            if len(partes) == 2:
                try:
                    cx, cy = int(partes[0]), int(partes[1])
                    self.estado_panel.coord_objetivo_x = cx
                    self.estado_panel.coord_objetivo_y = cy
                    self.estado_panel.coord_input_activo = False
                    # Enviar orden automáticamente si hay entidad seleccionada
                    id_ent = self.estado_panel.entidad_seleccionada_id
                    if id_ent:
                        ent = next((e for e in self.entidades if e.id_entidad == id_ent), None)
                        panel = self.renderizador.obtener_panel() if self.renderizador else None
                        if ent and panel:
                            from tipos.enums import TipoDirectiva
                            tick = self.gestor_ticks.tick_actual
                            directiva = panel.crear_directiva(id_ent, TipoDirectiva.IR_A_POSICION, tick, cx, cy)
                            ent.recibir_directiva(directiva)
                            self.estado_panel.mensaje_feedback = f">>> {ent.nombre} va a ({cx},{cy})"
                            self.estado_panel.mensaje_feedback_tick = 120
                            if self.sistema_logs:
                                self.sistema_logs.registrar_directiva_recibida(
                                    nombre_ent=ent.nombre,
                                    tipo_dir="ir_a_posicion",
                                    tick=tick,
                                    duracion=200,
                                    intensidad=1.0,
                                )
                except ValueError:
                    self.estado_panel.mensaje_feedback = "Formato invalido: usa X,Y"
                    self.estado_panel.mensaje_feedback_tick = 80
        elif evento.key == pygame.K_BACKSPACE:
            self.estado_panel.coord_input_texto = self.estado_panel.coord_input_texto[:-1]
        else:
            # Solo permitir dígitos, coma y espacio
            if evento.unicode in "0123456789, ":
                self.estado_panel.coord_input_texto += evento.unicode

    def _procesar_tecla(self, key) -> None:
        """Procesa teclas."""
        import pygame

        # --- Movimiento manual (WASD / flechas): controla entidad en modo sombra ---
        TECLAS_MOVIMIENTO = {
            pygame.K_w: (0, -1), pygame.K_UP:    (0, -1),
            pygame.K_s: (0,  1), pygame.K_DOWN:  (0,  1),
            pygame.K_a: (-1, 0), pygame.K_LEFT:  (-1, 0),
            pygame.K_d: (1,  0), pygame.K_RIGHT: (1,  0),
        }
        if key in TECLAS_MOVIMIENTO:
            entidad_sombra = self._obtener_entidad_control_total()
            if entidad_sombra and self.estado_panel.modo_sombra:
                if not self.estado_panel.sombra_esperando_input:
                    return  # No es su turno todavía (raro, pero seguro)
                dx, dy = TECLAS_MOVIMIENTO[key]
                nx = entidad_sombra.posicion.x + dx
                ny = entidad_sombra.posicion.y + dy
                from tipos.modelos import Posicion
                destino = Posicion(nx, ny)
                # Validar que el destino es accesible
                if self.mapa and not self.mapa.es_posicion_valida(destino):
                    self.estado_panel.mensaje_feedback = f"[SOMBRA] Posicion ({nx},{ny}) fuera del mapa"
                    self.estado_panel.mensaje_feedback_tick = 30
                    return
                entidad_sombra.control_total_pendiente = destino
                self.estado_panel.sombra_esperando_input = False  # ya actuó
            elif entidad_sombra and entidad_sombra.control_total:
                # Modo control total simple sin modo sombra
                dx, dy = TECLAS_MOVIMIENTO[key]
                nx = entidad_sombra.posicion.x + dx
                ny = entidad_sombra.posicion.y + dy
                from tipos.modelos import Posicion
                entidad_sombra.control_total_pendiente = Posicion(nx, ny)
            return

        # ESPACIO = pasar turno en modo sombra
        if key == pygame.K_SPACE:
            entidad_sombra = self._obtener_entidad_control_total()
            if entidad_sombra and self.estado_panel.modo_sombra and self.estado_panel.sombra_esperando_input:
                entidad_sombra.sombra_accion_pendiente = "esperar"
                self.estado_panel.sombra_esperando_input = False
                self.estado_panel.mensaje_feedback = f"[SOMBRA] {entidad_sombra.nombre} espera turno"
                self.estado_panel.mensaje_feedback_tick = 40
            return

        if key == pygame.K_p:
            self.estado_panel.pausado = not self.estado_panel.pausado
        elif key == pygame.K_n:
            self.estado_panel.paso_manual = True
        elif key == pygame.K_g:
            if self.sistema_persistencia and self.sistema_persistencia.guardar_estado(self):
                self.guardado_ok_tick = self.gestor_ticks.tick_actual + 90
                self.estado_panel.mensaje_feedback = "Guardado OK"
                self.estado_panel.mensaje_feedback_tick = 60
        elif key == pygame.K_c:
            if self.sistema_persistencia and self.sistema_persistencia.cargar_estado(self):
                self.cargado_ok_tick = self.gestor_ticks.tick_actual + 90
                self.estado_panel.mensaje_feedback = "Cargado OK"
                self.estado_panel.mensaje_feedback_tick = 60
        elif key == pygame.K_v:
            self.estado_panel.siguiente_velocidad()
        elif key == pygame.K_m:
            self.estado_panel.siguiente_modo_visualizacion()

    def _obtener_entidad_control_total(self):
        """Devuelve la entidad que está en modo control total, si existe."""
        for e in self.entidades:
            if getattr(e, "control_total", False):
                return e
        return None

    def _procesar_click(self, pos) -> None:
        """Procesa click del ratón o una acción dict directa desde el panel sombra."""
        # Si se pasa un dict directamente (desde panel sombra via tecla), procesarlo
        if isinstance(pos, dict):
            accion = pos
            self._manejar_accion_panel(accion)
            return

        x, y = pos
        tam = self.configuracion.tamano_celda
        if x < self.renderizador.ancho_mapa and y < self.renderizador.alto_mapa:
            celda_x, celda_y = x // tam, y // tam
            ent = next((e for e in self.entidades if e.posicion.x == celda_x and e.posicion.y == celda_y), None)
            if ent:
                self.estado_panel.entidad_seleccionada_id = ent.id_entidad
                return
        panel = self.renderizador.obtener_panel() if self.renderizador else None
        if not panel:
            return
        accion = panel.procesar_click(
            pos,
            self.gestor_ticks.tick_actual,
            self.entidades,
            self.mapa,
        )
        if not accion:
            return
        self._manejar_accion_panel(accion)

    def _manejar_accion_panel(self, accion: dict) -> None:
        """Despacha una acción del panel al sistema correcto."""
        panel = self.renderizador.obtener_panel() if self.renderizador else None
        tipo = accion.get("tipo")
        if tipo == "pausar":
            self.estado_panel.pausado = not self.estado_panel.pausado
        elif tipo == "tick_manual":
            self.estado_panel.paso_manual = True
        elif tipo == "velocidad":
            self.estado_panel.siguiente_velocidad()
        elif tipo == "modo_visualizacion":
            self.estado_panel.siguiente_modo_visualizacion()
        elif tipo == "guardar":
            if self.sistema_persistencia and self.sistema_persistencia.guardar_estado(self):
                self.guardado_ok_tick = self.gestor_ticks.tick_actual + 90
                self.estado_panel.mensaje_feedback = "Guardado OK"
                self.estado_panel.mensaje_feedback_tick = 60
        elif tipo == "cargar":
            if self.sistema_persistencia and self.sistema_persistencia.cargar_estado(self):
                self.cargado_ok_tick = self.gestor_ticks.tick_actual + 90
                self.estado_panel.mensaje_feedback = "Cargado OK"
                self.estado_panel.mensaje_feedback_tick = 60
        elif tipo == "toggle_control_total":
            id_ent = accion.get("id_entidad")
            ent = next((e for e in self.entidades if e.id_entidad == id_ent), None)
            if ent and hasattr(ent, "control_total"):
                # Desactivar control total en cualquier otra entidad primero
                for e in self.entidades:
                    if e.id_entidad != id_ent and getattr(e, "control_total", False):
                        if self.gestor_modo_sombra:
                            self.gestor_modo_sombra.desactivar_modo_sombra(
                                e, self.gestor_ticks.tick_actual
                            )
                        else:
                            e.control_total = False
                            e.control_total_pendiente = None
                            e.sombra_accion_pendiente = None
                en_ctrl = getattr(ent, "control_total", False)
                if not en_ctrl:
                    # Activar POSEIDO
                    if self.gestor_modo_sombra:
                        self.gestor_modo_sombra.activar_modo_poseido(
                            ent, self.gestor_ticks.tick_actual
                        )
                    ent.control_total = True
                    ent.modo_control = __import__("tipos.enums", fromlist=["ModoControl"]).ModoControl.POSEIDO
                    self.estado_panel.modo_sombra = True
                    self.estado_panel.sombra_esperando_input = True
                    self.estado_panel.pausado = False
                    self.estado_panel.mensaje_feedback = (
                        f"[MODO SOMBRA ON] {ent.nombre}  WASD=mover  ESPACIO=esperar"
                    )
                    self.estado_panel.mensaje_feedback_tick = 200
                else:
                    # Desactivar
                    if self.gestor_modo_sombra:
                        self.gestor_modo_sombra.desactivar_modo_sombra(
                            ent, self.gestor_ticks.tick_actual
                        )
                    ent.modo_control = __import__("tipos.enums", fromlist=["ModoControl"]).ModoControl.AUTONOMO
                    self.estado_panel.modo_sombra = False
                    self.estado_panel.sombra_esperando_input = False
                    self.estado_panel.mensaje_feedback = f"[MODO SOMBRA OFF] {ent.nombre} - IA retoma control"
                    self.estado_panel.mensaje_feedback_tick = 120
                import logging
                estado_str = "ON" if ent.control_total else "OFF"
                logging.getLogger("simulacion").info(
                    f"MODO_SOMBRA {estado_str} para {ent.nombre} en tick {self.gestor_ticks.tick_actual}"
                )
        elif tipo == "comando_sombra":
            # Comando forzado (modo POSEIDO) desde el panel_modo_sombra
            id_ent = accion.get("id_entidad")
            tipo_cmd_str = accion.get("tipo_comando")
            ent = next((e for e in self.entidades if e.id_entidad == id_ent), None)
            if ent and tipo_cmd_str and self.gestor_modo_sombra:
                from tipos.enums import TipoComandoSombra, ModoControl
                try:
                    tipo_cmd = TipoComandoSombra(tipo_cmd_str)
                except ValueError:
                    self.estado_panel.mensaje_feedback = f"Cmd desconocido: {tipo_cmd_str}"
                    self.estado_panel.mensaje_feedback_tick = 60
                    return
                obj_x = accion.get("objetivo_x")
                obj_y = accion.get("objetivo_y")
                obj_ent = accion.get("objetivo_entidad")
                from tipos.modelos import Posicion
                pos_obj = Posicion(obj_x, obj_y) if obj_x is not None and obj_y is not None else None
                tick = self.gestor_ticks.tick_actual
                cmd = self.gestor_modo_sombra.encolar_comando(
                    entidad=ent,
                    tipo_comando=tipo_cmd,
                    tick=tick,
                    objetivo_posicion=pos_obj,
                    objetivo_entidad=obj_ent,
                )
                ent.modo_control = ModoControl.POSEIDO
                self.estado_panel.modo_sombra = True
                self.estado_panel.sombra_esperando_input = False
                self.estado_panel.mensaje_feedback = (
                    f"[SOMBRA] cmd#{cmd.id_comando} {tipo_cmd.value} → {ent.nombre}"
                )
                self.estado_panel.mensaje_feedback_tick = 120
                if self.sistema_logs:
                    self.sistema_logs.registrar_directiva_recibida(
                        nombre_ent=ent.nombre,
                        tipo_dir=f"COMANDO_SOMBRA:{tipo_cmd.value}",
                        tick=tick,
                        duracion=0,
                        intensidad=1.0,
                    )
        elif tipo == "activar_coord_input":
            self.estado_panel.coord_input_activo = True
            self.estado_panel.coord_input_texto = ""
        elif tipo == "deseleccionar":
            self.estado_panel.entidad_seleccionada_id = None
        elif tipo == "seleccionar":
            self.estado_panel.entidad_seleccionada_id = accion.get("id_entidad")
        elif tipo == "orden":
            id_ent = accion.get("id_entidad")
            tipo_dir = accion.get("tipo_directiva")
            tick = accion.get("tick", self.gestor_ticks.tick_actual)
            objetivo_x = accion.get("objetivo_x")
            objetivo_y = accion.get("objetivo_y")
            ent = next((e for e in self.entidades if e.id_entidad == id_ent), None)
            if ent and tipo_dir:
                directiva = panel.crear_directiva(id_ent, tipo_dir, tick, objetivo_x, objetivo_y)
                ent.recibir_directiva(directiva)
                nombre_dir = tipo_dir.value if hasattr(tipo_dir, "value") else str(tipo_dir)
                if objetivo_x is not None:
                    self.estado_panel.mensaje_feedback = f">>> {ent.nombre} va a ({objetivo_x},{objetivo_y})"
                else:
                    self.estado_panel.mensaje_feedback = f"Orden [{nombre_dir}] → {ent.nombre}"
                self.estado_panel.mensaje_feedback_tick = 120
                # Cambiar a modo DIRIGIDO
                from tipos.enums import ModoControl
                if ent.modo_control != ModoControl.POSEIDO:
                    ent.modo_control = ModoControl.DIRIGIDO
                    if self.gestor_modo_sombra:
                        self.gestor_modo_sombra.activar_modo_dirigido(ent, tick)
                if self.sistema_logs:
                    intensidad = 1.0
                    duracion = 999 if nombre_dir == "quedarse_aqui" else 200
                    self.sistema_logs.registrar_directiva_recibida(
                        nombre_ent=ent.nombre,
                        tipo_dir=nombre_dir,
                        tick=tick,
                        duracion=duracion,
                        intensidad=intensidad,
                    )

    def actualizar_mundo(self) -> None:
        """Actualiza el mundo (regeneración, etc.)."""
        if self.sistema_regeneracion and self.mapa:
            self.sistema_regeneracion.actualizar(
                self.mapa, self.gestor_ticks.tick_actual, self.configuracion
            )

    def actualizar_entidad(self, entidad) -> None:
        """Actualiza una entidad: estado, percepción, decisión, ejecución."""
        tick = self.gestor_ticks.tick_actual
        entidad.actualizar_estado_interno(self.configuracion)
        percepcion = entidad.percibir_entorno(self.mapa, self.configuracion)
        entidad.estado_interno.riesgo_percibido = percepcion.amenaza_local
        entidad.actualizar_memoria(percepcion, tick)
        entidad.actualizar_directivas(tick)

        contexto_decision = ContextoDecision(
            tick_actual=tick,
            mapa=self.mapa,
            percepcion_local=percepcion,
            configuracion=self.configuracion,
            entidades_cercanas=[],
            directivas_activas=entidad.gestor_directivas.obtener_directivas_activas(tick),
            eventos_recientes_globales=[],
            entidades=self.entidades,
        )
        accion_puntuada = entidad.decidir_accion(contexto_decision)
        if accion_puntuada:
            entidad.estado_interno.accion_actual = accion_puntuada.accion.tipo_accion
            # Logging estructurado de decisiones
            if self.sistema_logs:
                num_dir = len(contexto_decision.directivas_activas)
                self.sistema_logs.registrar_decision(
                    nombre=entidad.nombre,
                    tick=tick,
                    accion=accion_puntuada.accion.tipo_accion.value,
                    score=accion_puntuada.puntuacion_final,
                    motivo=accion_puntuada.motivo_principal,
                    energia=entidad.estado_interno.energia,
                    hambre=entidad.estado_interno.hambre,
                    num_directivas=num_dir,
                )
            contexto_sim = ContextoSimulacion(
                tick_actual=tick,
                mapa=self.mapa,
                bus_eventos=self.bus_eventos,
                sistema_metricas=self.sistema_metricas,
                configuracion=self.configuracion,
                entidades=self.entidades,
                percepcion_local=percepcion,
            )
            entidad.ejecutar_accion(accion_puntuada, contexto_sim)
        else:
            entidad.estado_interno.accion_actual = None
            if getattr(self.configuracion, "debug_entidades_pilladas", False):
                num_vecinos = (
                    len(percepcion.posiciones_vecinas)
                    if percepcion and percepcion.posiciones_vecinas
                    else 0
                )
                self.sistema_logs.registrar_debug_decision(
                    entidad.id_entidad,
                    {
                        "tick": tick,
                        "posicion": entidad.posicion.como_tupla(),
                        "hambre": entidad.estado_interno.hambre,
                        "energia": entidad.estado_interno.energia,
                        "num_vecinos": num_vecinos,
                    },
                )

    def despachar_eventos(self) -> None:
        """Despacha eventos pendientes a logs y métricas."""
        if self.bus_eventos:
            for evento in self.bus_eventos.obtener_eventos_pendientes():
                if self.sistema_logs:
                    self.sistema_logs.registrar_evento(evento)
                if self.sistema_metricas:
                    self.sistema_metricas.registrar_evento(evento)

    def _escribir_debug_amiguisimo(self, entidad) -> None:
        """Escribe estado detallado de la entidad en control total a amiguisimo_debug.log."""
        import logging
        logger = logging.getLogger("amiguisimo_debug")
        if not logger.handlers:
            h = logging.FileHandler("amiguisimo_debug.log", encoding="utf-8")
            h.setFormatter(logging.Formatter("%(asctime)s %(message)s"))
            logger.addHandler(h)
            logger.setLevel(logging.DEBUG)
        ei = entidad.estado_interno
        dirs = entidad.gestor_directivas.obtener_directivas_activas(self.gestor_ticks.tick_actual)
        inv = ei.inventario
        logger.info(
            f"[t{self.gestor_ticks.tick_actual}] {entidad.nombre} "
            f"pos=({entidad.posicion.x},{entidad.posicion.y}) "
            f"E={ei.energia:.2f} H={ei.hambre:.2f} S={ei.salud:.2f} "
            f"inv=comida:{getattr(inv,'comida',0)} mat:{getattr(inv,'material',0)} "
            f"directivas={len(dirs)} "
            f"historial={[h['accion'] for h in entidad.historial_decisiones[-3:]]}"
        )

    def _escribir_debug_si_activo(self) -> None:
        """Escribe estado a archivo para inspección en tiempo real."""
        if not getattr(self.configuracion, "debug_archivo_activo", False):
            return
        tick = self.gestor_ticks.tick_actual
        if tick % 5 != 0 and tick > 2:
            return
        import json
        ruta = getattr(self.configuracion, "debug_archivo_ruta", "debug_live.json")
        estado = {
            "tick": tick,
            "entidades": [
                {
                    "id": e.id_entidad,
                    "nombre": e.nombre,
                    "posicion": e.posicion.como_tupla(),
                    "hambre": round(e.estado_interno.hambre, 3),
                    "energia": round(e.estado_interno.energia, 3),
                    "accion": e.estado_interno.accion_actual.value if e.estado_interno.accion_actual else None,
                }
                for e in self.entidades
            ],
            "metricas": self.sistema_metricas.obtener_resumen() if self.sistema_metricas else {},
        }
        try:
            with open(ruta, "w", encoding="utf-8") as f:
                json.dump(estado, f, indent=2, ensure_ascii=False)
        except OSError:
            pass

    def renderizar(self) -> None:
        """Renderiza el estado actual."""
        if self.renderizador:
            if self.estado_panel.mensaje_feedback_tick > 0:
                self.estado_panel.mensaje_feedback_tick -= 1
            estado_ui = {
                "tick_actual": self.gestor_ticks.tick_actual,
                "pausado": self.estado_panel.pausado,
                "velocidad": self.estado_panel.velocidad,
                "modo_visualizacion": self.estado_panel.modo_visualizacion,
                "entidad_seleccionada_id": self.estado_panel.entidad_seleccionada_id,
                "guardado_ok": self.guardado_ok_tick > self.gestor_ticks.tick_actual,
                "cargado_ok": self.cargado_ok_tick > self.gestor_ticks.tick_actual,
                "eventos_recientes": self.sistema_logs.obtener_eventos_recientes(12),
                "mensaje_feedback": self.estado_panel.mensaje_feedback if self.estado_panel.mensaje_feedback_tick > 0 else "",
                "alertas_watchdog": self.sistema_watchdog.obtener_alertas_recientes(10) if self.sistema_watchdog else [],
                "watchdog_total": self.sistema_watchdog.problemas_detectados_total if self.sistema_watchdog else 0,
                "modo_sombra": self.estado_panel.modo_sombra,
                "sombra_esperando_input": self.estado_panel.sombra_esperando_input,
            }
            # Activar log detallado de decisiones si hay entidad seleccionada o directivas activas
            if self.sistema_logs:
                hay_directivas = any(
                    len(e.gestor_directivas.obtener_directivas_activas(self.gestor_ticks.tick_actual)) > 0
                    for e in self.entidades
                )
                self.sistema_logs.log_decisiones_activo = (
                    self.estado_panel.entidad_seleccionada_id is not None or hay_directivas
                )
            self.renderizador.renderizar(self.mapa, self.entidades, estado_ui)

    def _ejecutar_tick_completo(self) -> None:
        """Avanza el mundo exactamente 1 tick: todas las entidades actúan."""
        self.gestor_ticks.avanzar()
        for entidad in self.entidades:
            self.actualizar_entidad(entidad)
        if self.sistema_watchdog:
            self.sistema_watchdog.registrar_tick(self.gestor_ticks.tick_actual, self.entidades)
        self.actualizar_mundo()
        self.despachar_eventos()
        self._escribir_debug_si_activo()
        if self.sistema_persistencia:
            if self.sistema_persistencia.auto_guardar_si_procede(self):
                self.estado_panel.mensaje_feedback = "Auto-guardado"
                self.estado_panel.mensaje_feedback_tick = 15

    def ejecutar_bucle_principal(self) -> None:
        """Bucle principal de la simulación."""
        import pygame
        import logging
        _logger = logging.getLogger("simulacion")

        self.inicializar()
        cargado = False
        if self.sistema_persistencia and self.sistema_persistencia.existe_estado_guardado():
            cargado = self.sistema_persistencia.cargar_estado(self)
            if cargado:
                self.cargado_ok_tick = 120
                self.estado_panel.mensaje_feedback = "Estado cargado al iniciar"
                self.estado_panel.mensaje_feedback_tick = 90
        if not cargado:
            self.crear_mundo()
            self.crear_entidades_iniciales()

        _logger.info(f"BUCLE INICIADO: entidades={[e.nombre for e in self.entidades]}")

        reloj = self.renderizador.obtener_reloj()
        fps = self.configuracion.fps_objetivo
        ejecutando = True
        acum_velocidad = 0.0

        while ejecutando:
            try:
                ejecutando = self.procesar_entrada()
                if not ejecutando:
                    _logger.warning(
                        f"BUCLE TERMINA: procesar_entrada=False tick={self.gestor_ticks.tick_actual}"
                    )
                    break

                entidad_sombra = self._obtener_entidad_control_total()

                if entidad_sombra and self.estado_panel.modo_sombra:
                    sombra_tiene_accion = (
                        entidad_sombra.control_total_pendiente is not None
                        or entidad_sombra.sombra_accion_pendiente is not None
                    )
                    if sombra_tiene_accion:
                        self._ejecutar_tick_completo()
                        pos = entidad_sombra.posicion
                        motivo = (
                            entidad_sombra.historial_decisiones[-1]["motivo"]
                            if entidad_sombra.historial_decisiones else "?"
                        )
                        self.estado_panel.mensaje_feedback = (
                            f"[SOMBRA t{self.gestor_ticks.tick_actual}] "
                            f"{entidad_sombra.nombre} ({pos.x},{pos.y}) {motivo}"
                        )
                        self.estado_panel.mensaje_feedback_tick = 60
                        self._escribir_debug_amiguisimo(entidad_sombra)
                        self.estado_panel.sombra_esperando_input = True
                    else:
                        if not self.estado_panel.sombra_esperando_input:
                            self.estado_panel.sombra_esperando_input = True

                elif not self.estado_panel.pausado:
                    acum_velocidad += self.estado_panel.velocidad
                    while acum_velocidad >= 1.0:
                        acum_velocidad -= 1.0
                        self._ejecutar_tick_completo()

                elif self.estado_panel.paso_manual:
                    self.estado_panel.paso_manual = False
                    self._ejecutar_tick_completo()
                    self.estado_panel.mensaje_feedback = f"Tick manual: {self.gestor_ticks.tick_actual}"
                    self.estado_panel.mensaje_feedback_tick = 45

                elif entidad_sombra and not self.estado_panel.modo_sombra:
                    if entidad_sombra.control_total_pendiente is not None:
                        self._ejecutar_tick_completo()
                        pos = entidad_sombra.posicion
                        self.estado_panel.mensaje_feedback = (
                            f"[CTRL] {entidad_sombra.nombre} ({pos.x},{pos.y})"
                        )
                        self.estado_panel.mensaje_feedback_tick = 30
                        self._escribir_debug_amiguisimo(entidad_sombra)

                self.renderizar()
                reloj.tick(fps)

            except Exception as _exc:
                import traceback as _tb
                _logger.critical(
                    f"EXCEPCION EN BUCLE tick={self.gestor_ticks.tick_actual if self.gestor_ticks else '?'}: "
                    f"{type(_exc).__name__}: {_exc}"
                )
                _logger.critical(_tb.format_exc())
                raise

        _logger.info(f"BUCLE FINALIZADO en tick {self.gestor_ticks.tick_actual if self.gestor_ticks else '?'}")
        self.renderizador.cerrar()
