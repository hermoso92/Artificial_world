"""
Panel MODO SOMBRA — interfaz dedicada para intervenir sobre entidades.

Tres bloques:
  BLOQUE 1 — OBSERVAR:   estado completo de la entidad seleccionada.
  BLOQUE 2 — DIRECTIVAS: órdenes interpretables (modo DIRIGIDO).
  BLOQUE 3 — CONTROL TOTAL: comandos forzados (modo POSEIDO).

Pipeline DIRECTIVA:
    UI → DirectivaExterna → GestorDirectivas → MotorDecision → Acción

Pipeline COMANDO FORZADO:
    UI → ComandoSombra → GestorModoSombra.encolar_comando() → Ejecutor → Acción

Este panel se integra como pestaña SOMBRA en panel_control.py.
"""

from __future__ import annotations

import pygame
from typing import TYPE_CHECKING

from tipos.enums import (
    TipoDirectiva,
    TipoComandoSombra,
    ModoControl,
    EstadoDirectiva,
)
from tipos.modelos import DirectivaExterna, Posicion

if TYPE_CHECKING:
    from interfaz.estado_panel import EstadoPanel


# ──────────────────────────────────────────────
# Colores
# ──────────────────────────────────────────────
COLOR_FONDO        = (28, 30, 38)
COLOR_TITULO       = (200, 200, 210)
COLOR_SUBTITULO    = (120, 140, 180)
COLOR_TEXTO        = (190, 190, 200)
COLOR_TEXTO_SEC    = (130, 135, 145)
COLOR_AUTONOMO     = (80, 180, 80)
COLOR_DIRIGIDO     = (80, 160, 220)
COLOR_POSEIDO      = (220, 100, 40)
COLOR_BTN_DIRECTIVA = (60, 100, 160)
COLOR_BTN_COMANDO  = (140, 50, 40)
COLOR_BTN_CANCELAR = (80, 40, 40)
COLOR_BTN_HOVER    = (100, 120, 160)
COLOR_SELECCION    = (90, 160, 110)
COLOR_BORDE        = (70, 74, 82)
COLOR_BARRA_BUENA  = (80, 180, 80)
COLOR_BARRA_MALA   = (200, 80, 60)
COLOR_BARRA_MEDIA  = (200, 160, 60)
COLOR_SOMBRA_ACTIVA = (200, 80, 20)


# ──────────────────────────────────────────────
# Definición de botones de directivas
# ──────────────────────────────────────────────
DIRECTIVAS_PANEL = [
    (TipoDirectiva.VOLVER_A_REFUGIO,        "VOLVER AL REFUGIO"),
    (TipoDirectiva.EXPLORAR_ZONA,           "EXPLORAR ZONA"),
    (TipoDirectiva.PRIORIZAR_SUPERVIVENCIA, "PRIORIZAR SUPERVIVENCIA"),
    (TipoDirectiva.RECOGER_EN_ZONA,         "RECOGER EN ZONA"),
    (TipoDirectiva.QUEDARSE_AQUI,           "QUEDARSE AQUI"),
    (TipoDirectiva.EVITAR_ENTIDAD,          "EVITAR ENTIDAD"),
    (TipoDirectiva.SEGUIR_ENTIDAD,          "SEGUIR ENTIDAD"),
    (TipoDirectiva.ACERCARSE_A_ENTIDAD,     "ACERCARSE A ENTIDAD"),
    (TipoDirectiva.INVESTIGAR_OBJETIVO,     "INVESTIGAR OBJETIVO"),
]

# Comandos forzados: (TipoComandoSombra, etiqueta, necesita_posicion, necesita_entidad)
COMANDOS_PANEL = [
    (TipoComandoSombra.MOVER_A_POSICION,    "MOVER A POSICION",  True,  False),
    (TipoComandoSombra.IR_A_REFUGIO,        "IR AL REFUGIO",     False, False),
    (TipoComandoSombra.QUEDARSE_EN_REFUGIO, "QUEDARSE EN REFUGIO", False, False),
    (TipoComandoSombra.RECOGER_OBJETIVO,    "RECOGER OBJETIVO",  True,  False),
    (TipoComandoSombra.SEGUIR_OBJETIVO,     "SEGUIR OBJETIVO",   False, True),
    (TipoComandoSombra.EVITAR_OBJETIVO,     "EVITAR OBJETIVO",   False, True),
    (TipoComandoSombra.ATACAR_OBJETIVO,     "ATACAR OBJETIVO",   False, True),
    (TipoComandoSombra.MATAR_OBJETIVO,      "MATAR OBJETIVO",    False, True),
]


class PanelModoSombra:
    """Panel dedicado al MODO SOMBRA.

    Se dibuja en el área del panel de control cuando la pestaña SOMBRA está activa.
    Devuelve acciones a la simulación mediante dict (mismo protocolo que PanelControl).
    """

    ALTURA_BTN   = 22
    MARGEN       = 8
    ESPACIO      = 3
    ALTURA_BARRA = 9

    def __init__(self, x0: int, ancho: int, alto: int, estado: "EstadoPanel"):
        self.x0    = x0
        self.ancho = ancho
        self.alto  = alto
        self.estado = estado

        # Rects de botones registrados en cada draw (para hit-test)
        self._rects_directivas: dict[str, pygame.Rect] = {}
        self._rects_comandos:   dict[str, pygame.Rect] = {}
        self._rect_control_total: pygame.Rect | None = None
        self._rect_desactivar:    pygame.Rect | None = None
        self._rect_coord_input:   pygame.Rect | None = None
        self._rect_coord_confirm: pygame.Rect | None = None
        self._rect_cmd_pos_input: pygame.Rect | None = None

        # Estado interno del panel
        self.cmd_pos_input_activo: bool = False   # True = esperando X,Y para MOVER_A_POSICION
        self.cmd_pos_texto: str = ""
        self.cmd_ent_input_activo: bool = False   # True = esperando ID entidad objetivo
        self.cmd_ent_texto: str = ""
        self._pending_cmd: TipoComandoSombra | None = None  # comando que espera posición/entidad

    # ──────────────────────────────────────────
    # DIBUJO PRINCIPAL
    # ──────────────────────────────────────────

    def dibujar(
        self,
        pantalla: pygame.Surface,
        entidades: list,
        tick_actual: int,
        gestor_sombra=None,
    ) -> None:
        """Dibuja el panel completo."""
        self._rects_directivas.clear()
        self._rects_comandos.clear()
        self._rect_control_total = None
        self._rect_desactivar = None

        pygame.draw.rect(pantalla, COLOR_FONDO, (self.x0, 0, self.ancho, self.alto))
        pygame.draw.line(pantalla, (60, 64, 72), (self.x0, 0), (self.x0, self.alto), 2)

        try:
            f_tit  = pygame.font.SysFont("arial", 12, bold=True)
            f_bold = pygame.font.SysFont("arial", 11, bold=True)
            f_norm = pygame.font.SysFont("arial", 11)
            f_sm   = pygame.font.SysFont("arial", 10)
        except Exception:
            f_tit = f_bold = f_norm = f_sm = pygame.font.Font(None, 14)

        y = self.MARGEN

        # ── Título ──────────────────────────────────────────────────────
        txt = f_tit.render("▌ MODO SOMBRA", True, (220, 120, 40))
        pantalla.blit(txt, (self.x0 + self.MARGEN, y))
        y += 18

        id_sel = self.estado.entidad_seleccionada_id
        ent = next((e for e in entidades if e.id_entidad == id_sel), None) if id_sel else None

        if ent is None:
            # Sin entidad seleccionada
            txt2 = f_norm.render("Selecciona una entidad:", True, COLOR_TEXTO_SEC)
            pantalla.blit(txt2, (self.x0 + self.MARGEN, y))
            y += 18
            for e in entidades:
                r = pygame.Rect(self.x0 + self.MARGEN, y, self.ancho - 2*self.MARGEN, 26)
                pygame.draw.rect(pantalla, (50, 80, 120), r)
                pygame.draw.rect(pantalla, (80, 120, 160), r, 1)
                nombre = getattr(e, "nombre", f"E{e.id_entidad}")
                t = f_norm.render(f"  {nombre}", True, (230, 230, 240))
                pantalla.blit(t, (self.x0 + self.MARGEN + 4, y + 4))
                y += 30
            return

        # ── BLOQUE 1: OBSERVAR ──────────────────────────────────────────
        y = self._dibujar_bloque_observar(pantalla, f_bold, f_norm, f_sm, y, ent, tick_actual, gestor_sombra)
        y += 6

        # ── BLOQUE 2: DIRECTIVAS ────────────────────────────────────────
        y = self._dibujar_bloque_directivas(pantalla, f_bold, f_norm, y, ent)
        y += 6

        # ── BLOQUE 3: CONTROL TOTAL ─────────────────────────────────────
        y = self._dibujar_bloque_control_total(pantalla, f_bold, f_norm, f_sm, y, ent, entidades)

    def _dibujar_bloque_observar(
        self, pantalla, f_bold, f_norm, f_sm, y, ent, tick_actual, gestor_sombra
    ) -> int:
        m = self.MARGEN
        x0 = self.x0 + m
        w  = self.ancho - 2*m

        # Cabecera del bloque
        pygame.draw.rect(pantalla, (35, 38, 50), (x0, y, w, 14))
        t = f_bold.render("[ OBSERVAR ]", True, COLOR_SUBTITULO)
        pantalla.blit(t, (x0 + 4, y + 1))
        y += 16

        # Nombre + modo_control
        nombre = getattr(ent, "nombre", f"E{ent.id_entidad}")
        modo = getattr(ent, "modo_control", None)
        modo_str = modo.value.upper() if modo else "?"
        color_modo = {
            "autonomo": COLOR_AUTONOMO,
            "dirigido": COLOR_DIRIGIDO,
            "poseido":  COLOR_POSEIDO,
        }.get(modo_str.lower(), COLOR_TEXTO)

        t = f_bold.render(f"{nombre}", True, ent.color if hasattr(ent, "color") else COLOR_TITULO)
        pantalla.blit(t, (x0, y))
        t2 = f_bold.render(f"[{modo_str}]", True, color_modo)
        pantalla.blit(t2, (x0 + w - t2.get_width() - 2, y))
        y += 14

        # Tipo + rasgo + posición + ID
        tipo = ent.tipo_entidad.value if hasattr(ent, "tipo_entidad") else "?"
        rasgo = getattr(ent, "rasgo_principal", None)
        rasgo_str = rasgo.value if rasgo else "-"
        pos = ent.posicion
        lineas = [
            f"ID:{ent.id_entidad}  Tipo:{tipo}  Rasgo:{rasgo_str}",
            f"Pos:({pos.x},{pos.y})",
        ]
        for linea in lineas:
            t = f_sm.render(linea, True, COLOR_TEXTO_SEC)
            if y + 12 < self.alto - 5:
                pantalla.blit(t, (x0 + 2, y))
            y += 12

        # Barras de stats
        ei = ent.estado_interno
        e_val = int(ei.energia  * 100)
        h_val = int(ei.hambre   * 100)
        s_val = int(getattr(ei, "salud", 1.0) * 100)
        y = self._barra(pantalla, f_sm, x0, y, w, "E", e_val, COLOR_BARRA_BUENA)
        y = self._barra(pantalla, f_sm, x0, y, w, "H", h_val,
                        COLOR_BARRA_MALA if h_val > 70 else COLOR_BARRA_MEDIA)
        y = self._barra(pantalla, f_sm, x0, y, w, "S", s_val,
                        COLOR_BARRA_MALA if s_val < 40 else COLOR_BARRA_BUENA)
        y += 2

        # Acción actual
        acc = ei.accion_actual
        acc_str = acc.value if acc else "-"
        t = f_norm.render(f"Accion: {acc_str}", True, COLOR_TEXTO)
        pantalla.blit(t, (x0, y))
        y += 13

        # Directivas activas
        dirs = ent.gestor_directivas.directivas_activas if hasattr(ent, "gestor_directivas") else []
        if dirs and y + 12 < self.alto - 5:
            t = f_sm.render(f"Directivas activas: {len(dirs)}", True, COLOR_DIRIGIDO)
            pantalla.blit(t, (x0, y))
            y += 12
            for d in dirs[:2]:
                tipo_d = d.tipo_directiva.value if hasattr(d.tipo_directiva, "value") else str(d.tipo_directiva)
                t = f_sm.render(f"  → {tipo_d} [i={d.intensidad:.1f}]", True, (160, 200, 120))
                if y + 11 < self.alto - 5:
                    pantalla.blit(t, (x0 + 2, y))
                y += 11

        # Resumen sombra del gestor
        if gestor_sombra and y + 12 < self.alto - 5:
            resumen = gestor_sombra.obtener_resumen_entidad(ent.id_entidad)
            cmd_act = resumen.get("comando_activo")
            if cmd_act:
                t = f_sm.render(
                    f"Cmd activo: #{cmd_act['id']} {cmd_act['tipo']} [{cmd_act['estado']}]",
                    True, COLOR_POSEIDO
                )
                if y + 11 < self.alto - 5:
                    pantalla.blit(t, (x0 + 2, y))
                y += 11
            elif modo_str.lower() == "poseido":
                t = f_sm.render("Cola vacía → volviendo a AUTONOMO", True, COLOR_TEXTO_SEC)
                pantalla.blit(t, (x0 + 2, y))
                y += 11

        # Historial decisiones (últimas 3)
        historial = getattr(ent, "historial_decisiones", [])
        if historial and y + 12 < self.alto - 5:
            t = f_sm.render("Historial:", True, COLOR_SUBTITULO)
            pantalla.blit(t, (x0, y))
            y += 11
            for h in reversed(historial[-3:]):
                color_h = (160, 200, 130) if h.get("score", 0) > 0.5 else COLOR_TEXTO_SEC
                txt_h = f_sm.render(
                    f"  t{h['tick']} {h['accion']:12s} {h['score']:.2f}",
                    True, color_h
                )
                if y + 11 < self.alto - 5:
                    pantalla.blit(txt_h, (x0 + 2, y))
                y += 11

        return y

    def _dibujar_bloque_directivas(self, pantalla, f_bold, f_norm, y, ent) -> int:
        m  = self.MARGEN
        x0 = self.x0 + m
        w  = self.ancho - 2*m

        # Cabecera
        pygame.draw.rect(pantalla, (30, 50, 70), (x0, y, w, 14))
        t = f_bold.render("[ DIRECTIVAS INTERPRETABLES ]", True, COLOR_DIRIGIDO)
        pantalla.blit(t, (x0 + 4, y + 1))
        y += 16

        for tipo_dir, label in DIRECTIVAS_PANEL:
            if y + self.ALTURA_BTN + 2 > self.alto - 5:
                break
            r = pygame.Rect(x0, y, w, self.ALTURA_BTN)
            self._rects_directivas[tipo_dir.value] = r
            pygame.draw.rect(pantalla, COLOR_BTN_DIRECTIVA, r)
            pygame.draw.rect(pantalla, (80, 130, 190), r, 1)
            t = f_norm.render(label, True, (230, 235, 245))
            pantalla.blit(t, (x0 + 5, y + 4))
            y += self.ALTURA_BTN + self.ESPACIO

        return y

    def _dibujar_bloque_control_total(
        self, pantalla, f_bold, f_norm, f_sm, y, ent, entidades
    ) -> int:
        m  = self.MARGEN
        x0 = self.x0 + m
        w  = self.ancho - 2*m

        if y + 14 > self.alto - 5:
            return y

        # Cabecera
        pygame.draw.rect(pantalla, (60, 28, 22), (x0, y, w, 14))
        t = f_bold.render("[ CONTROL TOTAL — POSEIDO ]", True, COLOR_POSEIDO)
        pantalla.blit(t, (x0 + 4, y + 1))
        y += 16

        # Botón POSEIDO toggle
        en_ctrl = getattr(ent, "control_total", False)
        modo = getattr(ent, "modo_control", None)
        en_poseido = (modo == ModoControl.POSEIDO) if modo else en_ctrl
        color_btn = COLOR_SOMBRA_ACTIVA if en_poseido else (40, 80, 140)
        borde_btn = (255, 140, 40) if en_poseido else (70, 120, 200)
        r = pygame.Rect(x0, y, w, self.ALTURA_BTN + 4)
        self._rect_control_total = r
        pygame.draw.rect(pantalla, color_btn, r)
        pygame.draw.rect(pantalla, borde_btn, r, 2)
        label_t = ">> POSEIDO: ON  [desactivar] <<" if en_poseido else "   ACTIVAR MODO POSEIDO"
        t = f_bold.render(label_t, True, (255, 240, 200) if en_poseido else (200, 220, 255))
        pantalla.blit(t, (x0 + 5, y + 5))
        y += self.ALTURA_BTN + 4 + self.ESPACIO + 2

        # Campo de entrada de posición (si hay comando pendiente que la requiere)
        if self.cmd_pos_input_activo and y + self.ALTURA_BTN + 2 < self.alto - 5:
            color_in = (50, 70, 50) if self.cmd_pos_input_activo else (35, 45, 35)
            borde_in = (80, 180, 80) if self.cmd_pos_input_activo else (50, 70, 50)
            r_in = pygame.Rect(x0, y, w, self.ALTURA_BTN)
            self._rect_cmd_pos_input = r_in
            pygame.draw.rect(pantalla, color_in, r_in)
            pygame.draw.rect(pantalla, borde_in, r_in, 1)
            texto_disp = self.cmd_pos_texto if self.cmd_pos_texto else "Teclea X,Y  ej: 5,10"
            color_t = (240, 255, 200) if self.cmd_pos_input_activo else COLOR_TEXTO_SEC
            t = f_norm.render(texto_disp, True, color_t)
            pantalla.blit(t, (x0 + 5, y + 4))
            y += self.ALTURA_BTN + self.ESPACIO
            hint = f_sm.render("[Enter]=confirmar  [Esc]=cancelar", True, COLOR_TEXTO_SEC)
            pantalla.blit(hint, (x0 + 4, y))
            y += 13

        # Campo de entrada de entidad objetivo
        if self.cmd_ent_input_activo and y + self.ALTURA_BTN + 2 < self.alto - 5:
            nombres_ent = ", ".join(e.nombre for e in entidades if hasattr(e, "nombre"))
            hint1 = f_sm.render(f"Entidades: {nombres_ent[:38]}", True, COLOR_TEXTO_SEC)
            pantalla.blit(hint1, (x0 + 4, y))
            y += 12
            r_ent = pygame.Rect(x0, y, w, self.ALTURA_BTN)
            pygame.draw.rect(pantalla, (50, 50, 70), r_ent)
            pygame.draw.rect(pantalla, (80, 80, 160), r_ent, 1)
            texto_ent = self.cmd_ent_texto if self.cmd_ent_texto else "Teclea ID o nombre..."
            t = f_norm.render(texto_ent, True, (230, 230, 255))
            pantalla.blit(t, (x0 + 5, y + 4))
            y += self.ALTURA_BTN + self.ESPACIO
            hint2 = f_sm.render("[Enter]=confirmar  [Esc]=cancelar", True, COLOR_TEXTO_SEC)
            pantalla.blit(hint2, (x0 + 4, y))
            y += 13

        # Botones de comandos forzados
        for tipo_cmd, label, req_pos, req_ent in COMANDOS_PANEL:
            if y + self.ALTURA_BTN + 2 > self.alto - 5:
                break
            color_c = (160, 40, 30) if tipo_cmd in (
                TipoComandoSombra.ATACAR_OBJETIVO,
                TipoComandoSombra.MATAR_OBJETIVO,
            ) else COLOR_BTN_COMANDO
            r = pygame.Rect(x0, y, w, self.ALTURA_BTN)
            self._rects_comandos[tipo_cmd.value] = r
            pygame.draw.rect(pantalla, color_c, r)
            pygame.draw.rect(pantalla, (180, 80, 70), r, 1)
            hint = " [→pos]" if req_pos else (" [→ent]" if req_ent else "")
            t = f_norm.render(label + hint, True, (240, 220, 210))
            pantalla.blit(t, (x0 + 5, y + 4))
            y += self.ALTURA_BTN + self.ESPACIO

        # Botón WASD hint si en poseido
        if en_poseido and y + 12 < self.alto - 5:
            hint = f_sm.render("WASD/flechas=mover  ESPACIO=esperar", True, (200, 160, 80))
            pantalla.blit(hint, (x0 + 2, y))
            y += 13

        # Botón desactivar sombra
        if y + self.ALTURA_BTN + 2 < self.alto - 5:
            r_des = pygame.Rect(x0, y, w, self.ALTURA_BTN)
            self._rect_desactivar = r_des
            pygame.draw.rect(pantalla, (50, 35, 35), r_des)
            pygame.draw.rect(pantalla, (100, 60, 60), r_des, 1)
            t = f_norm.render("< Liberar / Volver a IA", True, (180, 140, 140))
            pantalla.blit(t, (x0 + 5, y + 4))
            y += self.ALTURA_BTN + self.ESPACIO

        return y

    # ──────────────────────────────────────────
    # PROCESAMIENTO DE CLICKS
    # ──────────────────────────────────────────

    def procesar_click(
        self, pos: tuple[int, int], tick: int, entidades: list, mapa
    ) -> dict | None:
        """Procesa click en el panel sombra. Devuelve acción o None."""
        x, y = pos
        if x < self.x0:
            return None

        id_sel = self.estado.entidad_seleccionada_id
        if id_sel is None:
            # Seleccionar entidad
            for e in entidades:
                r_guess = pygame.Rect(
                    self.x0 + self.MARGEN,
                    0, self.ancho - 2*self.MARGEN, self.alto
                )
                if r_guess.collidepoint(x, y):
                    return {"tipo": "seleccionar", "id_entidad": e.id_entidad}
            return None

        # Toggle POSEIDO
        if self._rect_control_total and self._rect_control_total.collidepoint(x, y):
            return {"tipo": "toggle_control_total", "id_entidad": id_sel}

        # Botón desactivar
        if self._rect_desactivar and self._rect_desactivar.collidepoint(x, y):
            return {"tipo": "toggle_control_total", "id_entidad": id_sel}

        # Directivas interpretables
        for valor, rect in self._rects_directivas.items():
            if rect.collidepoint(x, y):
                try:
                    tipo_dir = TipoDirectiva(valor)
                except ValueError:
                    return None
                return {
                    "tipo": "orden",
                    "id_entidad": id_sel,
                    "tipo_directiva": tipo_dir,
                    "tick": tick,
                }

        # Comandos forzados
        for valor, rect in self._rects_comandos.items():
            if rect.collidepoint(x, y):
                try:
                    tipo_cmd = TipoComandoSombra(valor)
                except ValueError:
                    return None
                # Determinar si necesita posición u objetiva entidad
                meta = next((c for c in COMANDOS_PANEL if c[0] == tipo_cmd), None)
                if meta:
                    _, _, req_pos, req_ent = meta
                    if req_pos:
                        # Activar campo de entrada de posición
                        self.cmd_pos_input_activo = True
                        self.cmd_pos_texto = ""
                        self._pending_cmd = tipo_cmd
                        return {"tipo": "activar_cmd_pos_input"}
                    if req_ent:
                        self.cmd_ent_input_activo = True
                        self.cmd_ent_texto = ""
                        self._pending_cmd = tipo_cmd
                        return {"tipo": "activar_cmd_ent_input"}
                # Sin parámetros extra: emitir directamente
                return {
                    "tipo": "comando_sombra",
                    "id_entidad": id_sel,
                    "tipo_comando": tipo_cmd.value,
                    "tick": tick,
                }

        return None

    def procesar_tecla(
        self, key: int, unicode: str, entidades: list, tick: int
    ) -> dict | None:
        """Procesa teclas cuando el campo de input está activo."""
        import pygame as pg
        # Input de posición
        if self.cmd_pos_input_activo:
            if key == pg.K_ESCAPE:
                self.cmd_pos_input_activo = False
                self.cmd_pos_texto = ""
                self._pending_cmd = None
            elif key in (pg.K_RETURN, pg.K_KP_ENTER):
                return self._confirmar_posicion(entidades, tick)
            elif key == pg.K_BACKSPACE:
                self.cmd_pos_texto = self.cmd_pos_texto[:-1]
            elif unicode in "0123456789, ":
                self.cmd_pos_texto += unicode
            return None

        # Input de entidad
        if self.cmd_ent_input_activo:
            if key == pg.K_ESCAPE:
                self.cmd_ent_input_activo = False
                self.cmd_ent_texto = ""
                self._pending_cmd = None
            elif key in (pg.K_RETURN, pg.K_KP_ENTER):
                return self._confirmar_entidad(entidades, tick)
            elif key == pg.K_BACKSPACE:
                self.cmd_ent_texto = self.cmd_ent_texto[:-1]
            else:
                self.cmd_ent_texto += unicode
            return None

        return None

    def _confirmar_posicion(self, entidades: list, tick: int) -> dict | None:
        texto = self.cmd_pos_texto.replace(" ", "")
        partes = texto.split(",")
        if len(partes) != 2:
            return None
        try:
            cx, cy = int(partes[0]), int(partes[1])
        except ValueError:
            return None
        cmd = self._pending_cmd
        self.cmd_pos_input_activo = False
        self.cmd_pos_texto = ""
        self._pending_cmd = None
        if cmd is None or self.estado.entidad_seleccionada_id is None:
            return None
        return {
            "tipo": "comando_sombra",
            "id_entidad": self.estado.entidad_seleccionada_id,
            "tipo_comando": cmd.value,
            "tick": tick,
            "objetivo_x": cx,
            "objetivo_y": cy,
        }

    def _confirmar_entidad(self, entidades: list, tick: int) -> dict | None:
        texto = self.cmd_ent_texto.strip()
        # Buscar por ID numérico o por nombre
        obj_ent = None
        try:
            id_int = int(texto)
            obj_ent = next((e for e in entidades if e.id_entidad == id_int), None)
        except ValueError:
            obj_ent = next(
                (e for e in entidades if e.nombre.lower() == texto.lower()), None
            )
        if obj_ent is None:
            return None
        cmd = self._pending_cmd
        self.cmd_ent_input_activo = False
        self.cmd_ent_texto = ""
        self._pending_cmd = None
        if cmd is None or self.estado.entidad_seleccionada_id is None:
            return None
        return {
            "tipo": "comando_sombra",
            "id_entidad": self.estado.entidad_seleccionada_id,
            "tipo_comando": cmd.value,
            "tick": tick,
            "objetivo_entidad": obj_ent.id_entidad,
        }

    # ──────────────────────────────────────────
    # UTILIDADES
    # ──────────────────────────────────────────

    def _barra(
        self, pantalla, fuente, x0, y, ancho, label, valor, color
    ) -> int:
        t = fuente.render(f"{label}:{valor:3d}%", True, COLOR_TEXTO_SEC)
        pantalla.blit(t, (x0, y))
        bx = x0 + 50
        bw = ancho - 54
        pygame.draw.rect(pantalla, (45, 50, 60), (bx, y + 1, bw, self.ALTURA_BARRA))
        fill = max(0, min(bw, int(bw * valor / 100)))
        if fill > 0:
            pygame.draw.rect(pantalla, color, (bx, y + 1, fill, self.ALTURA_BARRA))
        return y + 12

    def tiene_input_activo(self) -> bool:
        """True si el panel tiene un campo de texto activo."""
        return self.cmd_pos_input_activo or self.cmd_ent_input_activo
