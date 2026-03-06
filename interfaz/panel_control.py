"""
Panel de control avanzado.
Pestañas: Control, Órdenes, Entidades, Archivo.
Velocidad, modo visualización, dar órdenes a entidades.
"""

import pygame

from tipos.enums import TipoDirectiva, EstadoDirectiva
from tipos.modelos import DirectivaExterna, Posicion

from .estado_panel import EstadoPanel, ModoVisualizacion, PestanaPanel


class PanelControl:
    """Panel de control avanzado con pestañas e interactividad."""

    ALTURA_PESTANA = 28
    ALTURA_BOTON = 24
    ANCHO_BOTON = 70
    MARGEN = 10
    ESPACIO = 4
    OFFSET_TITULO = 22  # Altura del título en cada pestaña

    def __init__(self, configuracion, x0: int, ancho: int, alto: int, estado: EstadoPanel | None = None):
        self.configuracion = configuracion
        self.x0 = x0
        self.ancho = ancho
        self.alto = alto
        self.estado = estado or EstadoPanel()
        self.rects_botones: dict[str, pygame.Rect] = {}
        self.rects_entidades: dict[int, pygame.Rect] = {}
        self.rects_ordenes: dict[str, pygame.Rect] = {}

        self.color_fondo = (35, 38, 45)
        self.color_pestana_activa = (60, 65, 75)
        self.color_pestana_inactiva = (45, 48, 55)
        self.color_boton = (70, 75, 85)
        self.color_boton_hover = (90, 95, 105)
        self.color_boton_orden = (80, 120, 160)
        self.color_texto = (220, 220, 220)
        self.color_texto_sec = (160, 165, 170)
        self.color_seleccion = (100, 180, 120)

    def procesar_click(self, pos: tuple[int, int], tick: int, entidades: list, mapa) -> dict | None:
        """
        Procesa click del ratón. Devuelve acción a ejecutar o None.
        Acciones: {"tipo": "pausar"|"velocidad"|"modo"|"guardar"|"cargar"|"orden"|"seleccionar", ...}
        """
        x, y = pos
        if x < self.x0:
            return None

        self.rects_botones.clear()
        self.rects_entidades.clear()
        self.rects_ordenes.clear()

        # Pestañas
        pestana_w = self.ancho // 6
        for i, p in enumerate(PestanaPanel):
            r = pygame.Rect(self.x0 + i * pestana_w, 0, pestana_w, self.ALTURA_PESTANA)
            if r.collidepoint(x, y):
                self.estado.pestana_actual = p
                return {"tipo": "cambiar_pestana"}

        y_base = self.ALTURA_PESTANA + self.MARGEN

        if self.estado.pestana_actual == PestanaPanel.CONTROL:
            return self._procesar_click_control(x, y, y_base, tick)
        if self.estado.pestana_actual == PestanaPanel.ORDENES:
            return self._procesar_click_ordenes(x, y, y_base, entidades, tick)
        if self.estado.pestana_actual == PestanaPanel.ENTIDADES:
            return self._procesar_click_entidades(x, y, y_base, entidades)
        if self.estado.pestana_actual == PestanaPanel.EVENTOS:
            return None
        if self.estado.pestana_actual == PestanaPanel.WATCHDOG:
            return None
        if self.estado.pestana_actual == PestanaPanel.ARCHIVO:
            return self._procesar_click_archivo(x, y, y_base, tick)
        return None

    def _procesar_click_control(self, x: int, y: int, y_base: int, tick: int) -> dict | None:
        bx = self.x0 + self.MARGEN
        by = y_base + self.OFFSET_TITULO
        w = self.ancho - 2 * self.MARGEN

        r_pausa = pygame.Rect(bx, by, w, self.ALTURA_BOTON)
        if r_pausa.collidepoint(x, y):
            return {"tipo": "pausar"}

        by += self.ALTURA_BOTON + self.ESPACIO
        r_tick = pygame.Rect(bx, by, w, self.ALTURA_BOTON)
        if r_tick.collidepoint(x, y):
            return {"tipo": "tick_manual"}

        by += self.ALTURA_BOTON + self.ESPACIO
        r_vel = pygame.Rect(bx, by, w, self.ALTURA_BOTON)
        if r_vel.collidepoint(x, y):
            return {"tipo": "velocidad"}

        by += self.ALTURA_BOTON + self.ESPACIO
        r_modo = pygame.Rect(bx, by, w, self.ALTURA_BOTON)
        if r_modo.collidepoint(x, y):
            return {"tipo": "modo_visualizacion"}

        return None

    def _procesar_click_ordenes(self, x: int, y: int, y_base: int, entidades: list, tick: int) -> dict | None:
        bx = self.x0 + self.MARGEN
        if self.estado.entidad_seleccionada_id is None:
            by = y_base + self.OFFSET_TITULO + 18
            for ent in entidades:
                r = pygame.Rect(bx, by, self.ancho - 2 * self.MARGEN, 28)
                if r.collidepoint(x, y):
                    return {"tipo": "seleccionar", "id_entidad": ent.id_entidad}
                by += 32
            return None

        by = y_base + self.OFFSET_TITULO + 28

        # --- Botón CONTROL TOTAL (toggle) ---
        ent_sel = next((e for e in entidades if e.id_entidad == self.estado.entidad_seleccionada_id), None)
        en_ctrl = getattr(ent_sel, "control_total", False) if ent_sel else False
        r_ctrl = pygame.Rect(bx, by, self.ancho - 2 * self.MARGEN, self.ALTURA_BOTON + 4)
        self.rects_ordenes["control_total"] = r_ctrl
        if r_ctrl.collidepoint(x, y):
            return {
                "tipo": "toggle_control_total",
                "id_entidad": self.estado.entidad_seleccionada_id,
            }
        by += self.ALTURA_BOTON + 4 + self.ESPACIO + 4

        ordenes_base = [
            (TipoDirectiva.PRIORIZAR_SUPERVIVENCIA, "Priorizar supervivencia"),
            (TipoDirectiva.VOLVER_A_REFUGIO, "Ir al refugio"),
            (TipoDirectiva.EXPLORAR_ZONA, "Explorar zona"),
            (TipoDirectiva.RECOGER_EN_ZONA, "Recoger recursos"),
            (TipoDirectiva.QUEDARSE_AQUI, "QUEDARSE AQUI"),
        ]
        for tipo, label in ordenes_base:
            r = pygame.Rect(bx, by, self.ancho - 2 * self.MARGEN, self.ALTURA_BOTON)
            self.rects_ordenes[label] = r
            if r.collidepoint(x, y):
                return {
                    "tipo": "orden",
                    "id_entidad": self.estado.entidad_seleccionada_id,
                    "tipo_directiva": tipo,
                    "tick": tick,
                }
            by += self.ALTURA_BOTON + self.ESPACIO

        # Botón IR A POSICION
        r_ir = pygame.Rect(bx, by, self.ancho - 2 * self.MARGEN, self.ALTURA_BOTON)
        self.rects_ordenes["ir_posicion_btn"] = r_ir
        if r_ir.collidepoint(x, y):
            self.estado.coord_input_activo = True
            self.estado.coord_input_texto = ""
            return {"tipo": "activar_coord_input"}
        by += self.ALTURA_BOTON + self.ESPACIO

        # Campo de texto coordenadas (clic lo activa)
        r_input = pygame.Rect(bx, by, self.ancho - 2 * self.MARGEN, self.ALTURA_BOTON)
        self.rects_ordenes["coord_input"] = r_input
        if r_input.collidepoint(x, y):
            self.estado.coord_input_activo = True
            return {"tipo": "activar_coord_input"}
        by += self.ALTURA_BOTON + self.ESPACIO

        # Botón CONFIRMAR coord
        r_confirm = pygame.Rect(bx, by, self.ancho - 2 * self.MARGEN, self.ALTURA_BOTON)
        self.rects_ordenes["coord_confirmar"] = r_confirm
        if r_confirm.collidepoint(x, y) and self.estado.coord_input_texto:
            partes = self.estado.coord_input_texto.replace(" ", "").split(",")
            if len(partes) == 2:
                try:
                    cx, cy = int(partes[0]), int(partes[1])
                    self.estado.coord_objetivo_x = cx
                    self.estado.coord_objetivo_y = cy
                    self.estado.coord_input_activo = False
                    return {
                        "tipo": "orden",
                        "id_entidad": self.estado.entidad_seleccionada_id,
                        "tipo_directiva": TipoDirectiva.IR_A_POSICION,
                        "tick": tick,
                        "objetivo_x": cx,
                        "objetivo_y": cy,
                    }
                except ValueError:
                    self.estado.mensaje_feedback = "Formato: X,Y  ej: 5,10"
                    self.estado.mensaje_feedback_tick = 80

        # Botón deseleccionar entidad
        by += self.ALTURA_BOTON + self.ESPACIO * 3
        r_des = pygame.Rect(bx, by, self.ancho - 2 * self.MARGEN, self.ALTURA_BOTON)
        self.rects_ordenes["deseleccionar"] = r_des
        if r_des.collidepoint(x, y):
            self.estado.entidad_seleccionada_id = None
            return {"tipo": "deseleccionar"}

        return None

    def _procesar_click_entidades(self, x: int, y: int, y_base: int, entidades: list) -> dict | None:
        by = y_base + self.OFFSET_TITULO
        for ent in entidades:
            r = pygame.Rect(self.x0 + self.MARGEN, by, self.ancho - 2 * self.MARGEN, 36)
            self.rects_entidades[ent.id_entidad] = r
            if r.collidepoint(x, y):
                return {"tipo": "seleccionar", "id_entidad": ent.id_entidad}
            by += 40
        return None

    def _procesar_click_archivo(self, x: int, y: int, y_base: int, tick: int) -> dict | None:
        bx = self.x0 + self.MARGEN
        by = y_base + self.OFFSET_TITULO

        r_guardar = pygame.Rect(bx, by, self.ANCHO_BOTON, self.ALTURA_BOTON)
        if r_guardar.collidepoint(x, y):
            return {"tipo": "guardar"}

        by += self.ALTURA_BOTON + self.ESPACIO
        r_cargar = pygame.Rect(bx, by, self.ANCHO_BOTON, self.ALTURA_BOTON)
        if r_cargar.collidepoint(x, y):
            return {"tipo": "cargar"}

        return None

    def dibujar(
        self,
        pantalla: pygame.Surface,
        entidades: list,
        tick_actual: int,
        guardado_ok: bool,
        cargado_ok: bool,
        eventos_recientes: list | None = None,
        alertas_watchdog: list | None = None,
        watchdog_total: int = 0,
    ) -> None:
        """Dibuja el panel completo."""
        pygame.draw.rect(pantalla, self.color_fondo, (self.x0, 0, self.ancho, self.alto))
        pygame.draw.line(pantalla, (60, 64, 72), (self.x0, 0), (self.x0, self.alto), 2)

        try:
            fuente_tit = pygame.font.SysFont("arial", 12, bold=True)
            fuente = pygame.font.SysFont("arial", 11)
        except Exception:
            fuente_tit = pygame.font.Font(None, 16)
            fuente = pygame.font.Font(None, 14)

        # Pestañas
        pestana_w = self.ancho // 6
        for i, p in enumerate(PestanaPanel):
            rx = self.x0 + i * pestana_w
            activa = p == self.estado.pestana_actual
            # Pestaña WATCHDOG en rojo si hay alertas activas
            if p == PestanaPanel.WATCHDOG and alertas_watchdog:
                color = (160, 40, 40) if not activa else (200, 60, 60)
            else:
                color = self.color_pestana_activa if activa else self.color_pestana_inactiva
            pygame.draw.rect(pantalla, color, (rx, 0, pestana_w, self.ALTURA_PESTANA))
            lbl = p.value[:4].upper() if p.value else ""
            txt = fuente.render(lbl, True, self.color_texto)
            pantalla.blit(txt, (rx + pestana_w // 2 - txt.get_width() // 2, 6))
            if i > 0:
                pygame.draw.line(pantalla, (50, 54, 62), (rx, 0), (rx, self.ALTURA_PESTANA), 1)

        y = self.ALTURA_PESTANA + self.MARGEN

        if self.estado.pestana_actual == PestanaPanel.CONTROL:
            self._dibujar_control(pantalla, fuente, fuente_tit, y, tick_actual)
        elif self.estado.pestana_actual == PestanaPanel.ORDENES:
            self._dibujar_ordenes(pantalla, fuente, fuente_tit, y, entidades)
        elif self.estado.pestana_actual == PestanaPanel.ENTIDADES:
            self._dibujar_entidades(pantalla, fuente, fuente_tit, y, entidades)
        elif self.estado.pestana_actual == PestanaPanel.EVENTOS:
            self._dibujar_eventos(pantalla, fuente, fuente_tit, y, eventos_recientes or [])
        elif self.estado.pestana_actual == PestanaPanel.WATCHDOG:
            self._dibujar_watchdog(pantalla, fuente, fuente_tit, y,
                                   alertas_watchdog or [], watchdog_total)
        elif self.estado.pestana_actual == PestanaPanel.ARCHIVO:
            self._dibujar_archivo(pantalla, fuente, fuente_tit, y, guardado_ok, cargado_ok)

    def _dibujar_control(self, pantalla, fuente, fuente_tit, y, tick_actual) -> None:
        tit = fuente_tit.render("CONTROL", True, self.color_texto)
        pantalla.blit(tit, (self.x0 + self.MARGEN, y))
        y += 22

        # Pausa
        texto_pausa = "Reanudar  [P]" if self.estado.pausado else "Pausar  [P]"
        color_pausa = (120, 200, 120) if self.estado.pausado else self.color_boton
        self._dibujar_boton_ancho(pantalla, self.x0 + self.MARGEN, y, texto_pausa, fuente, color_pausa)
        y += self.ALTURA_BOTON + self.ESPACIO

        # Tick manual
        self._dibujar_boton_ancho(pantalla, self.x0 + self.MARGEN, y, "Tick manual  [N]", fuente, (60, 80, 120))
        y += self.ALTURA_BOTON + self.ESPACIO

        # Velocidad
        vel_str = f"{self.estado.velocidad}x"
        self._dibujar_boton_ancho(pantalla, self.x0 + self.MARGEN, y, f"Velocidad: {vel_str}  [V]", fuente)
        y += self.ALTURA_BOTON + self.ESPACIO

        # Modo visualización
        modo_str = self.estado.modo_visualizacion.value.replace("_", " ")
        self._dibujar_boton_ancho(pantalla, self.x0 + self.MARGEN, y, f"Modo: {modo_str[:12]}  [M]", fuente)
        y += self.ALTURA_BOTON + self.ESPACIO

        txt_tick = fuente.render(f"Tick: {tick_actual}", True, self.color_texto_sec)
        pantalla.blit(txt_tick, (self.x0 + self.MARGEN, y))
        y += 18

        if self.estado.pausado:
            txt = fuente.render("PAUSADO - N = 1 tick", True, (255, 200, 80))
            pantalla.blit(txt, (self.x0 + self.MARGEN, y))

    def _dibujar_ordenes(self, pantalla, fuente, fuente_tit, y, entidades) -> None:
        tit = fuente_tit.render("DAR ÓRDENES", True, self.color_texto)
        pantalla.blit(tit, (self.x0 + self.MARGEN, y))
        y += 22

        if self.estado.entidad_seleccionada_id is None:
            txt = fuente.render("Selecciona una entidad:", True, self.color_texto_sec)
            pantalla.blit(txt, (self.x0 + self.MARGEN, y))
            y += 18
            for ent in entidades:
                pygame.draw.rect(
                    pantalla,
                    self.color_boton_orden,
                    (self.x0 + self.MARGEN, y, self.ancho - 2 * self.MARGEN, 28),
                )
                pygame.draw.rect(
                    pantalla,
                    (100, 140, 180),
                    (self.x0 + self.MARGEN, y, self.ancho - 2 * self.MARGEN, 28),
                    1,
                )
                nombre = getattr(ent, "nombre", f"E{ent.id_entidad}")
                txt_ent = fuente.render(f"  {nombre}", True, (255, 255, 255))
                pantalla.blit(txt_ent, (self.x0 + self.MARGEN + 6, y + 5))
                y += 32
            return

        ent = next((e for e in entidades if e.id_entidad == self.estado.entidad_seleccionada_id), None)
        if ent:
            txt_sel = fuente.render(f"Objetivo: {ent.nombre}", True, self.color_seleccion)
            pantalla.blit(txt_sel, (self.x0 + self.MARGEN, y))
        y += 28

        # --- Botón CONTROL TOTAL ---
        en_ctrl = getattr(ent, "control_total", False) if ent else False
        color_ctrl = (200, 80, 20) if en_ctrl else (40, 100, 180)
        borde_ctrl = (255, 140, 40) if en_ctrl else (80, 160, 220)
        pygame.draw.rect(
            pantalla, color_ctrl,
            (self.x0 + self.MARGEN, y, self.ancho - 2 * self.MARGEN, self.ALTURA_BOTON + 4),
        )
        pygame.draw.rect(
            pantalla, borde_ctrl,
            (self.x0 + self.MARGEN, y, self.ancho - 2 * self.MARGEN, self.ALTURA_BOTON + 4), 2,
        )
        label_ctrl = ">> CONTROL TOTAL: ON [WASD] <<" if en_ctrl else "   TOMAR CONTROL TOTAL"
        txt_ctrl = fuente_tit.render(label_ctrl, True, (255, 255, 200) if en_ctrl else (200, 220, 255))
        pantalla.blit(txt_ctrl, (self.x0 + self.MARGEN + 6, y + 5))
        if en_ctrl:
            hint = fuente.render("WASD/flechas = mover  P = pausa", True, (255, 200, 100))
            pantalla.blit(hint, (self.x0 + self.MARGEN + 4, y + 18))
        y += self.ALTURA_BOTON + 4 + self.ESPACIO + 4

        ordenes_base = [
            (TipoDirectiva.PRIORIZAR_SUPERVIVENCIA, "Priorizar supervivencia"),
            (TipoDirectiva.VOLVER_A_REFUGIO, "Ir al refugio"),
            (TipoDirectiva.EXPLORAR_ZONA, "Explorar zona"),
            (TipoDirectiva.RECOGER_EN_ZONA, "Recoger recursos"),
            (TipoDirectiva.QUEDARSE_AQUI, "QUEDARSE AQUI"),
        ]
        for _, label in ordenes_base:
            color_btn = (120, 60, 160) if label == "QUEDARSE AQUI" else self.color_boton_orden
            pygame.draw.rect(
                pantalla, color_btn,
                (self.x0 + self.MARGEN, y, self.ancho - 2 * self.MARGEN, self.ALTURA_BOTON),
            )
            pygame.draw.rect(
                pantalla, (100, 140, 180),
                (self.x0 + self.MARGEN, y, self.ancho - 2 * self.MARGEN, self.ALTURA_BOTON), 1,
            )
            txt = fuente.render(label, True, (255, 255, 255))
            pantalla.blit(txt, (self.x0 + self.MARGEN + 6, y + 4))
            y += self.ALTURA_BOTON + self.ESPACIO

        # --- IR A POSICIÓN ---
        pygame.draw.rect(
            pantalla, (60, 130, 80),
            (self.x0 + self.MARGEN, y, self.ancho - 2 * self.MARGEN, self.ALTURA_BOTON),
        )
        pygame.draw.rect(
            pantalla, (80, 180, 100),
            (self.x0 + self.MARGEN, y, self.ancho - 2 * self.MARGEN, self.ALTURA_BOTON), 1,
        )
        txt_ir = fuente.render("IR A POSICION (X,Y)", True, (255, 255, 255))
        pantalla.blit(txt_ir, (self.x0 + self.MARGEN + 6, y + 4))
        y += self.ALTURA_BOTON + self.ESPACIO

        # Campo de texto para coordenadas
        color_input = (60, 80, 50) if self.estado.coord_input_activo else (40, 50, 40)
        borde_input = (100, 200, 100) if self.estado.coord_input_activo else (70, 90, 70)
        pygame.draw.rect(
            pantalla, color_input,
            (self.x0 + self.MARGEN, y, self.ancho - 2 * self.MARGEN, self.ALTURA_BOTON),
        )
        pygame.draw.rect(
            pantalla, borde_input,
            (self.x0 + self.MARGEN, y, self.ancho - 2 * self.MARGEN, self.ALTURA_BOTON), 1,
        )
        texto_campo = self.estado.coord_input_texto if self.estado.coord_input_texto else "Teclea X,Y  ej: 5,10"
        color_campo = (255, 255, 200) if self.estado.coord_input_activo else self.color_texto_sec
        txt_input = fuente.render(texto_campo, True, color_campo)
        pantalla.blit(txt_input, (self.x0 + self.MARGEN + 6, y + 4))
        y += self.ALTURA_BOTON + self.ESPACIO

        # Botón confirmar coord
        tiene_coord = bool(self.estado.coord_input_texto)
        color_confirm = (40, 140, 60) if tiene_coord else (40, 55, 45)
        pygame.draw.rect(
            pantalla, color_confirm,
            (self.x0 + self.MARGEN, y, self.ancho - 2 * self.MARGEN, self.ALTURA_BOTON),
        )
        pygame.draw.rect(
            pantalla, (60, 160, 80),
            (self.x0 + self.MARGEN, y, self.ancho - 2 * self.MARGEN, self.ALTURA_BOTON), 1,
        )
        txt_confirm = fuente.render("CONFIRMAR POSICION [Enter]", True, (200, 255, 200) if tiene_coord else (80, 100, 80))
        pantalla.blit(txt_confirm, (self.x0 + self.MARGEN + 6, y + 4))
        y += self.ALTURA_BOTON + self.ESPACIO

        # Coord objetivo actual
        if self.estado.coord_objetivo_x is not None:
            txt_obj = fuente.render(
                f"Objetivo: ({self.estado.coord_objetivo_x},{self.estado.coord_objetivo_y})",
                True, (100, 230, 130),
            )
            pantalla.blit(txt_obj, (self.x0 + self.MARGEN, y))
            y += 14

        if self.estado.mensaje_feedback and self.estado.mensaje_feedback_tick > 0:
            txt_fb = fuente.render(self.estado.mensaje_feedback, True, (100, 200, 100))
            pantalla.blit(txt_fb, (self.x0 + self.MARGEN, y))
            y += 16

        # Botón deseleccionar
        y += 4
        pygame.draw.rect(
            pantalla, (60, 40, 40),
            (self.x0 + self.MARGEN, y, self.ancho - 2 * self.MARGEN, self.ALTURA_BOTON),
        )
        txt_des = fuente.render("< Cambiar entidad", True, (200, 150, 150))
        pantalla.blit(txt_des, (self.x0 + self.MARGEN + 6, y + 4))
        y += self.ALTURA_BOTON + self.ESPACIO

        # Mini-panel stats bajo los botones de orden
        if ent and y + 60 < self.alto:
            y += 4
            self._dibujar_barra_stat(pantalla, fuente, self.x0 + self.MARGEN, y,
                                     self.ancho - 2 * self.MARGEN, "Energia",
                                     int(ent.estado_interno.energia * 100), (80, 180, 80))
            y += 14
            self._dibujar_barra_stat(pantalla, fuente, self.x0 + self.MARGEN, y,
                                     self.ancho - 2 * self.MARGEN, "Hambre ",
                                     int(ent.estado_interno.hambre * 100), (200, 100, 60))
            y += 14
            acc = ent.estado_interno.accion_actual
            txt = fuente.render(f"Accion: {acc.value if acc else '-'}", True, self.color_texto_sec)
            pantalla.blit(txt, (self.x0 + self.MARGEN + 4, y))

    def _dibujar_entidades(self, pantalla, fuente, fuente_tit, y, entidades) -> None:
        tit = fuente_tit.render("ENTIDADES", True, self.color_texto)
        pantalla.blit(tit, (self.x0 + self.MARGEN, y))
        y += 22

        for ent in entidades:
            sel = ent.id_entidad == self.estado.entidad_seleccionada_id
            color_fondo = self.color_seleccion if sel else self.color_fondo
            pygame.draw.rect(
                pantalla,
                color_fondo,
                (self.x0 + self.MARGEN, y, self.ancho - 2 * self.MARGEN, 34),
            )
            pygame.draw.rect(
                pantalla,
                (80, 85, 95),
                (self.x0 + self.MARGEN, y, self.ancho - 2 * self.MARGEN, 34),
                1,
            )
            nombre = getattr(ent, "nombre", f"E{ent.id_entidad}")
            txt1 = fuente.render(nombre, True, ent.color if not sel else (255, 255, 255))
            pantalla.blit(txt1, (self.x0 + self.MARGEN + 6, y + 2))
            acc = ent.estado_interno.accion_actual
            acc_str = acc.value if acc else "-"
            e_val = int(ent.estado_interno.energia * 100)
            h_val = int(ent.estado_interno.hambre * 100)
            txt2 = fuente.render(f"{acc_str} | E:{e_val}% H:{h_val}%", True, self.color_texto_sec)
            pantalla.blit(txt2, (self.x0 + self.MARGEN + 6, y + 16))
            y += 40

        if self.estado.entidad_seleccionada_id and y + 120 < self.alto:
            ent = next((e for e in entidades if e.id_entidad == self.estado.entidad_seleccionada_id), None)
            if ent:
                y += self.ESPACIO
                self._dibujar_panel_jugador(pantalla, fuente, fuente_tit, y, ent)

    def _dibujar_panel_jugador(self, pantalla, fuente, fuente_tit, y, ent) -> None:
        """Panel avanzado del jugador seleccionado."""
        ancho = self.ancho - 2 * self.MARGEN
        x0 = self.x0 + self.MARGEN

        # --- Cabecera ---
        pygame.draw.rect(pantalla, (30, 35, 45), (x0, y, ancho, 16))
        tit = fuente_tit.render(f">> {ent.nombre.upper()} <<", True, ent.color)
        pantalla.blit(tit, (x0 + 4, y + 2))
        y += 18

        # --- Stats principales ---
        e_val = int(ent.estado_interno.energia * 100)
        h_val = int(ent.estado_interno.hambre * 100)
        s_val = int(getattr(ent.estado_interno, "salud", 1.0) * 100)
        r_val = int(getattr(ent.estado_interno, "riesgo_percibido", 0.0) * 100)

        self._dibujar_barra_stat(pantalla, fuente, x0, y, ancho, "Energia", e_val, (80, 180, 80))
        y += 14
        self._dibujar_barra_stat(pantalla, fuente, x0, y, ancho, "Hambre ", h_val, (200, 100, 60))
        y += 14
        self._dibujar_barra_stat(pantalla, fuente, x0, y, ancho, "Salud  ", s_val, (80, 140, 220))
        y += 14
        self._dibujar_barra_stat(pantalla, fuente, x0, y, ancho, "Riesgo ", r_val, (200, 60, 60))
        y += 16

        # --- Posición, rasgo, acción ---
        acc = ent.estado_interno.accion_actual
        acc_str = acc.value if acc else "ninguna"
        rasgo = getattr(ent, "rasgo_principal", None)
        rasgo_str = rasgo.value if rasgo else "-"
        inv = ent.estado_interno.inventario
        comida_inv = getattr(inv, "comida", 0) if inv else 0
        mat_inv = getattr(inv, "material", 0) if inv else 0

        lineas_info = [
            f"Pos: ({ent.posicion.x},{ent.posicion.y})  Rasgo: {rasgo_str}",
            f"Accion actual: {acc_str}",
            f"Inventario: {comida_inv} comida | {mat_inv} material",
        ]
        for linea in lineas_info:
            txt = fuente.render(linea, True, self.color_texto_sec)
            if y + 14 < self.alto - 5:
                pantalla.blit(txt, (x0 + 4, y))
            y += 13

        # --- Directivas activas ---
        directivas_obj = getattr(ent, "gestor_directivas", None)
        directivas_activas = []
        if directivas_obj:
            directivas_activas = getattr(directivas_obj, "directivas_activas", [])

        if directivas_activas and y + 14 < self.alto - 5:
            sep = fuente_tit.render("Ordenes activas:", True, (140, 190, 230))
            pantalla.blit(sep, (x0 + 4, y))
            y += 13
            for d in directivas_activas[:3]:
                tipo_str = d.tipo_directiva.value if hasattr(d.tipo_directiva, "value") else str(d.tipo_directiva)
                exp = getattr(d, "tick_expiracion", None)
                tiempo = f"exp:{exp}" if exp else "perm"
                txt = fuente.render(f"  [{d.intensidad:.1f}] {tipo_str} ({tiempo})", True, (200, 220, 100))
                if y + 13 < self.alto - 5:
                    pantalla.blit(txt, (x0 + 4, y))
                y += 13

        # --- Historial últimas decisiones ---
        historial = getattr(ent, "historial_decisiones", [])
        if historial and y + 14 < self.alto - 5:
            sep = fuente_tit.render("Historial decisiones:", True, (140, 190, 230))
            pantalla.blit(sep, (x0 + 4, y))
            y += 13
            for h in reversed(historial[-5:]):
                color_h = (180, 200, 140) if h.get("score", 0) > 0.5 else self.color_texto_sec
                txt = fuente.render(
                    f"  t{h['tick']} {h['accion']:14s} {h['score']:.2f} ({h['motivo']})",
                    True, color_h,
                )
                if y + 13 < self.alto - 5:
                    pantalla.blit(txt, (x0 + 4, y))
                y += 13

    def _dibujar_barra_stat(self, pantalla, fuente, x0, y, ancho, label, valor, color) -> None:
        """Barra de stat con label, valor numérico y barra visual."""
        # Label
        txt = fuente.render(f"{label}: {valor:3d}%", True, self.color_texto_sec)
        pantalla.blit(txt, (x0 + 4, y))
        # Barra de fondo
        bx = x0 + 80
        bw = ancho - 85
        pygame.draw.rect(pantalla, (50, 55, 65), (bx, y + 1, bw, 10))
        # Barra rellena
        fill = max(0, min(bw, int(bw * valor / 100)))
        if fill > 0:
            pygame.draw.rect(pantalla, color, (bx, y + 1, fill, 10))

    def _dibujar_watchdog(self, pantalla, fuente, fuente_tit, y,
                          alertas: list, total_detectados: int) -> None:
        """Panel del watchdog: alertas automáticas detectadas."""
        x0 = self.x0 + self.MARGEN
        ancho = self.ancho - 2 * self.MARGEN

        # Título con contador
        color_tit = (220, 80, 80) if alertas else (80, 200, 100)
        tit = fuente_tit.render(f"WATCHDOG  [{total_detectados} detectados]", True, color_tit)
        pantalla.blit(tit, (x0, y))
        y += 18

        if not alertas:
            txt = fuente.render("Sin problemas detectados", True, (80, 200, 100))
            pantalla.blit(txt, (x0, y))
            return

        # Color por nivel
        colores = {
            "CRITICAL": (255, 80, 80),
            "ERROR":    (255, 160, 60),
            "WARN":     (255, 220, 60),
        }

        for alerta in alertas:
            if y + 14 > self.alto - 10:
                break
            color = colores.get(alerta.nivel, self.color_texto_sec)
            # Fondo de fila
            pygame.draw.rect(pantalla, (40, 40, 50), (x0, y, ancho, 28))
            pygame.draw.rect(pantalla, color, (x0, y, 3, 28))  # barra lateral de color
            # Nivel + código
            lbl = f"[{alerta.nivel}] {alerta.codigo}"
            txt1 = fuente_tit.render(lbl, True, color)
            pantalla.blit(txt1, (x0 + 6, y + 2))
            # Entidad + mensaje
            msg = f"{alerta.entidad}: {alerta.mensaje}"
            if len(msg) > 42:
                msg = msg[:42] + "..."
            txt2 = fuente.render(msg, True, self.color_texto_sec)
            pantalla.blit(txt2, (x0 + 6, y + 15))
            y += 32

    def _dibujar_eventos(self, pantalla, fuente, fuente_tit, y, eventos_recientes: list) -> None:
        tit = fuente_tit.render("EVENTOS / ACCIONES", True, self.color_texto)
        pantalla.blit(tit, (self.x0 + self.MARGEN, y))
        y += 22

        if not eventos_recientes:
            txt = fuente.render("Sin eventos recientes", True, self.color_texto_sec)
            pantalla.blit(txt, (self.x0 + self.MARGEN, y))
            return

        for ev in eventos_recientes[:12]:
            tipo_str = getattr(ev.tipo, "value", str(ev.tipo)) if hasattr(ev, "tipo") else "-"
            desc = getattr(ev, "descripcion", tipo_str)
            tick = getattr(ev, "tick", 0)
            txt = fuente.render(f"[{tick}] {desc}", True, self.color_texto_sec)
            if y + 16 <= self.alto - 10:
                pantalla.blit(txt, (self.x0 + self.MARGEN, y))
            y += 16

    def _dibujar_archivo(self, pantalla, fuente, fuente_tit, y, guardado_ok, cargado_ok) -> None:
        tit = fuente_tit.render("ARCHIVO", True, self.color_texto)
        pantalla.blit(tit, (self.x0 + self.MARGEN, y))
        y += 22

        self._dibujar_boton(pantalla, self.x0 + self.MARGEN, y, "Guardar (G)", fuente)
        y += self.ALTURA_BOTON + self.ESPACIO
        self._dibujar_boton(pantalla, self.x0 + self.MARGEN, y, "Cargar (C)", fuente)
        y += self.ALTURA_BOTON + 15

        if guardado_ok:
            txt = fuente.render("Guardado OK", True, (100, 200, 100))
            pantalla.blit(txt, (self.x0 + self.MARGEN, y))
        elif cargado_ok:
            txt = fuente.render("Cargado OK", True, (100, 200, 100))
            pantalla.blit(txt, (self.x0 + self.MARGEN, y))
        elif self.estado.mensaje_feedback and self.estado.mensaje_feedback_tick > 0:
            color = (200, 100, 100) if "Error" in self.estado.mensaje_feedback else (100, 200, 100)
            txt = fuente.render(self.estado.mensaje_feedback[:40], True, color)
            pantalla.blit(txt, (self.x0 + self.MARGEN, y))

    def _dibujar_boton(self, pantalla, x, y, texto, fuente) -> None:
        pygame.draw.rect(pantalla, self.color_boton, (x, y, self.ANCHO_BOTON, self.ALTURA_BOTON))
        pygame.draw.rect(pantalla, (90, 95, 105), (x, y, self.ANCHO_BOTON, self.ALTURA_BOTON), 1)
        txt = fuente.render(texto, True, self.color_texto)
        pantalla.blit(txt, (x + 6, y + 4))

    def _dibujar_boton_ancho(self, pantalla, x, y, texto, fuente, color=None) -> None:
        """Botón de ancho completo del panel."""
        color = color or self.color_boton
        w = self.ancho - 2 * self.MARGEN
        pygame.draw.rect(pantalla, color, (x, y, w, self.ALTURA_BOTON))
        pygame.draw.rect(pantalla, (90, 95, 105), (x, y, w, self.ALTURA_BOTON), 1)
        txt = fuente.render(texto, True, self.color_texto)
        pantalla.blit(txt, (x + 6, y + 4))

    def crear_directiva(
        self,
        id_entidad: int,
        tipo: TipoDirectiva,
        tick: int,
        objetivo_x: int | None = None,
        objetivo_y: int | None = None,
    ) -> DirectivaExterna:
        """Crea una DirectivaExterna para enviar a la entidad."""
        self.estado.contador_directivas += 1
        duracion = 999 if tipo == TipoDirectiva.QUEDARSE_AQUI else 200
        pos_objetivo = Posicion(objetivo_x, objetivo_y) if objetivo_x is not None and objetivo_y is not None else None
        return DirectivaExterna(
            id_directiva=self.estado.contador_directivas,
            tipo_directiva=tipo,
            id_entidad_objetivo=id_entidad,
            prioridad=0.95,
            intensidad=1.0,
            tick_emision=tick,
            tick_expiracion=tick + duracion,
            estado=EstadoDirectiva.ACEPTADA,
            objetivo_posicion=pos_objetivo,
            objetivo_entidad=None,
            metadatos=None,
        )
