"""
Renderizador del mundo y entidades.
Incluye: nombres, acciones, modos de visualización, panel de control avanzado.
Tema: Ecosistema Viviente — paleta orgánica, jerarquía suave.
"""

import pygame

from tipos.enums import TipoRecurso, TipoEntidad

from .estado_panel import ModoVisualizacion
from .panel_control import PanelControl


# ─── Paleta "Ecosistema Viviente" ───────────────────────────────────────────
# Base oscura forestal, acentos orgánicos, bordes sutiles
COLOR_FONDO = (22, 26, 30)
COLOR_CELDA = (38, 45, 52)
COLOR_CELDA_ALT = (42, 50, 58)
COLOR_COMIDA = (107, 198, 126)
COLOR_MATERIAL = (196, 165, 116)
COLOR_REFUGIO = (90, 159, 212)
COLOR_BORDE_GRID = (52, 60, 70)
COLOR_TEXTO = (232, 237, 244)
COLOR_TEXTO_SEC = (138, 153, 168)
COLOR_ENTIDAD_SEL = (232, 212, 122)
COLOR_CTRL_TOTAL = (255, 160, 60)


class Renderizador:
    """Renderiza el mapa, entidades y paneles."""

    def _log(self, msg: str) -> None:
        try:
            import os
            import logging
            from datetime import datetime
            ruta = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "app_diagnostico.log")
            with open(ruta, "a", encoding="utf-8") as f:
                f.write(f"[{datetime.now().isoformat()}] {msg}\n")
        except Exception as e:
            logging.getLogger(__name__).debug("_log falló: %s", e)

    def __init__(self, configuracion=None):
        self.configuracion = configuracion
        self.inicializado = False
        self.pantalla = None
        self.reloj = None
        self.panel_control: PanelControl | None = None

        # Colores (compatibilidad)
        self.color_fondo = COLOR_FONDO
        self.color_celda = COLOR_CELDA
        self.color_comida = COLOR_COMIDA
        self.color_material = COLOR_MATERIAL
        self.color_refugio = COLOR_REFUGIO
        self.color_borde = COLOR_BORDE_GRID
        self.color_panel = (35, 40, 48)
        self.color_texto = COLOR_TEXTO
        self.color_texto_sec = COLOR_TEXTO_SEC

    def inicializar(self, estado_panel: "EstadoPanel | None" = None) -> None:
        """Inicializa Pygame y la ventana."""
        from .estado_panel import EstadoPanel
        pygame.init()
        pygame.display.set_caption("Mundo Artificial — Simulación de Vida")
        ancho_mapa = self.configuracion.ancho_mapa * self.configuracion.tamano_celda
        alto_mapa = self.configuracion.alto_mapa * self.configuracion.tamano_celda
        ancho_panel = getattr(self.configuracion, "ancho_panel_control", 340)
        self.ancho_total = ancho_mapa + ancho_panel
        self.alto_total = alto_mapa + 30
        self.ancho_mapa = ancho_mapa
        self.alto_mapa = alto_mapa
        self.ancho_panel = ancho_panel
        flags = pygame.RESIZABLE | pygame.SHOWN
        self.pantalla = pygame.display.set_mode((self.ancho_total, self.alto_total), flags)
        pygame.display.flip()
        self._log(f"Ventana creada {self.ancho_total}x{self.alto_total}")
        # Forzar ventana al frente en Windows
        try:
            import ctypes
            hwnd = pygame.display.get_wm_info().get("window")
            if hwnd:
                ctypes.windll.user32.ShowWindow(hwnd, 9)   # SW_RESTORE
                ctypes.windll.user32.SetForegroundWindow(hwnd)
                ctypes.windll.user32.BringWindowToTop(hwnd)
                self._log("Ventana forzada al frente OK")
        except Exception as ex:
            self._log(f"forzar_frente: {ex}")
        self.reloj = pygame.time.Clock()
        self.panel_control = PanelControl(
            self.configuracion,
            self.ancho_mapa,
            self.ancho_panel,
            self.alto_total,
            estado=estado_panel or EstadoPanel(),
        )
        self.inicializado = True

    def renderizar(
        self, mapa, entidades: list, estado_ui: dict
    ) -> None:
        """Renderiza el estado actual."""
        if not self.inicializado or self.pantalla is None:
            return
        self.pantalla.fill(self.color_fondo)

        modo = estado_ui.get("modo_visualizacion", ModoVisualizacion.NORMAL)
        self.dibujar_mapa(mapa, modo, entidades)
        self.dibujar_recursos(mapa)
        self.dibujar_refugios(mapa)
        self.dibujar_entidades(mapa, entidades, estado_ui.get("entidad_seleccionada_id"))
        self.dibujar_barra_inferior(estado_ui)

        if self.panel_control:
            self.panel_control.dibujar(
                self.pantalla,
                entidades,
                estado_ui.get("tick_actual", 0),
                estado_ui.get("guardado_ok", False),
                estado_ui.get("cargado_ok", False),
                mapa=mapa,
                eventos_recientes=estado_ui.get("eventos_recientes", []),
                alertas_watchdog=estado_ui.get("alertas_watchdog", []),
                watchdog_total=estado_ui.get("watchdog_total", 0),
            )
        pygame.display.flip()

    def dibujar_mapa(self, mapa, modo: ModoVisualizacion, entidades: list) -> None:
        """Dibuja el grid del mapa, con modo de calor/recursos/refugios si aplica."""
        if mapa is None:
            return
        tam = self.configuracion.tamano_celda
        for (x, y), celda in mapa.celdas.items():
            rect = pygame.Rect(x * tam, y * tam, tam, tam)
            # Patrón sutil: celdas alternas ligeramente distintas
            base = COLOR_CELDA if (x + y) % 2 == 0 else COLOR_CELDA_ALT
            color = base
            if modo == ModoVisualizacion.CALOR_ENERGIA or modo == ModoVisualizacion.CALOR_HAMBRE:
                ent_en_celda = [e for e in entidades if e.posicion.x == x and e.posicion.y == y]
                if ent_en_celda:
                    e0 = ent_en_celda[0]
                    if modo == ModoVisualizacion.CALOR_ENERGIA:
                        v = int(e0.estado_interno.energia * 255)
                        color = (max(0, 80 - v // 3), min(255, 60 + v), 90)
                    else:
                        v = int(e0.estado_interno.hambre * 255)
                        color = (min(255, 80 + v), max(0, 120 - v // 2), 90)
            elif modo == ModoVisualizacion.RECURSOS:
                if celda.tiene_recurso() and celda.recurso:
                    color = (
                        (90, 170, 110) if celda.recurso.tipo == TipoRecurso.COMIDA
                        else (150, 130, 90)
                    )
                else:
                    color = (32, 38, 44)
            elif modo == ModoVisualizacion.REFUGIOS:
                if celda.tiene_refugio():
                    color = (75, 130, 185)
                else:
                    color = (32, 38, 44)
            pygame.draw.rect(self.pantalla, color, rect)
            pygame.draw.rect(self.pantalla, COLOR_BORDE_GRID, rect, 1)

    def dibujar_recursos(self, mapa) -> None:
        """Dibuja los recursos en el mapa."""
        if mapa is None:
            return
        tam = self.configuracion.tamano_celda
        margen = max(1, tam // 6)
        for (x, y), celda in mapa.celdas.items():
            if celda.tiene_recurso() and celda.recurso:
                cx = x * tam + tam // 2
                cy = y * tam + tam // 2
                radio = tam // 2 - margen
                color = COLOR_COMIDA if celda.recurso.tipo == TipoRecurso.COMIDA else COLOR_MATERIAL
                # Sombra sutil
                pygame.draw.circle(self.pantalla, (20, 25, 28), (cx + 1, cy + 1), radio)
                pygame.draw.circle(self.pantalla, color, (cx, cy), radio)
                pygame.draw.circle(self.pantalla, (255, 255, 255), (cx, cy), radio, 1)

    def dibujar_refugios(self, mapa) -> None:
        """Dibuja los refugios en el mapa."""
        if mapa is None:
            return
        tam = self.configuracion.tamano_celda
        margen = max(1, tam // 6)
        for (x, y), celda in mapa.celdas.items():
            if celda.tiene_refugio():
                rect = pygame.Rect(
                    x * tam + margen,
                    y * tam + margen,
                    tam - 2 * margen,
                    tam - 2 * margen,
                )
                pygame.draw.rect(self.pantalla, (70, 130, 180), rect)
                pygame.draw.rect(self.pantalla, COLOR_REFUGIO, rect)
                pygame.draw.rect(self.pantalla, (120, 180, 230), rect, 1)

    def dibujar_entidades(
        self,
        mapa,
        entidades: list,
        entidad_seleccionada_id: int | None = None,
    ) -> None:
        """Dibuja las entidades con nombre, acción y pensamiento (motivo)."""
        if not entidades:
            return
        tam = self.configuracion.tamano_celda
        radio = max(4, tam // 3)
        try:
            fuente_nombre = pygame.font.SysFont("segoe ui", 12, bold=True)
            fuente_accion = pygame.font.SysFont("segoe ui", 10)
            fuente_pens = pygame.font.SysFont("segoe ui", 9)
        except Exception:
            try:
                fuente_nombre = pygame.font.SysFont("arial", 12, bold=True)
                fuente_accion = pygame.font.SysFont("arial", 10)
                fuente_pens = pygame.font.SysFont("arial", 9)
            except Exception:
                fuente_nombre = pygame.font.Font(None, 18)
                fuente_accion = pygame.font.Font(None, 16)
                fuente_pens = pygame.font.Font(None, 14)

        for entidad in entidades:
            px = entidad.posicion.x * tam + tam // 2
            py = entidad.posicion.y * tam + tam // 2
            color = entidad.color
            seleccionada = entidad.id_entidad == entidad_seleccionada_id
            en_ctrl = getattr(entidad, "control_total", False)
            mostrar_detalle = seleccionada or en_ctrl

            # Anillo exterior
            if en_ctrl:
                pygame.draw.circle(self.pantalla, (40, 30, 20), (px + 1, py + 1), radio + 6, 4)
                pygame.draw.circle(self.pantalla, COLOR_CTRL_TOTAL, (px, py), radio + 6, 3)
                pygame.draw.circle(self.pantalla, (255, 200, 100), (px, py), radio + 8, 1)
            elif seleccionada:
                pygame.draw.circle(self.pantalla, (35, 35, 25), (px + 1, py + 1), radio + 4, 3)
                pygame.draw.circle(self.pantalla, COLOR_ENTIDAD_SEL, (px, py), radio + 4, 2)

            # Cuerpo: sombra + relleno
            pygame.draw.circle(self.pantalla, (15, 18, 22), (px + 1, py + 1), radio)
            pygame.draw.circle(self.pantalla, color, (px, py), radio)
            pygame.draw.circle(self.pantalla, (255, 255, 255), (px, py), radio, 1)
            if entidad.tipo_entidad == TipoEntidad.GATO:
                pygame.draw.circle(self.pantalla, (255, 255, 255), (px, py), max(1, radio - 2), 1)

            nombre = getattr(entidad, "nombre", f"E{entidad.id_entidad}")
            en_refugio = ""
            if mapa:
                celda = mapa.obtener_celda(entidad.posicion)
                if celda and celda.tiene_refugio() and celda.refugio:
                    en_refugio = f" [Ref#{celda.refugio.id_refugio}]"
            color_nombre = COLOR_CTRL_TOTAL if en_ctrl else COLOR_TEXTO
            prefijo = "[TÚ] " if en_ctrl else ""
            texto_nom_str = f"{prefijo}{nombre}{en_refugio}"
            if not mostrar_detalle and len(texto_nom_str) > 10:
                texto_nom_str = texto_nom_str[:10] + "…"
            texto_nom = fuente_nombre.render(texto_nom_str, True, color_nombre)
            rect_nom = texto_nom.get_rect(center=(px, py - radio - 12))
            # Fondo semitransparente para legibilidad
            pad = 3
            bg_rect = pygame.Rect(rect_nom.x - pad, rect_nom.y - 1, rect_nom.w + pad * 2, rect_nom.h + 2)
            pygame.draw.rect(self.pantalla, (15, 18, 22), bg_rect)
            pygame.draw.rect(self.pantalla, (45, 52, 60), bg_rect, 1)
            self.pantalla.blit(texto_nom, rect_nom)

            acc = entidad.estado_interno.accion_actual
            acc_str = ("CTRL" if en_ctrl else acc.value) if (en_ctrl or acc) else "-"
            color_acc = COLOR_CTRL_TOTAL if en_ctrl else COLOR_TEXTO_SEC
            texto_acc = fuente_accion.render(acc_str, True, color_acc)
            rect_acc = texto_acc.get_rect(center=(px, py + radio + 10))
            bg_acc = pygame.Rect(rect_acc.x - 2, rect_acc.y - 1, rect_acc.w + 4, rect_acc.h + 2)
            pygame.draw.rect(self.pantalla, (15, 18, 22), bg_acc)
            pygame.draw.rect(self.pantalla, (45, 52, 60), bg_acc, 1)
            self.pantalla.blit(texto_acc, rect_acc)

            # Pensamiento (motivo): solo para seleccionado o en control
            if mostrar_detalle:
                historial = getattr(entidad, "historial_decisiones", [])
                motivo = ""
                if historial:
                    ult = historial[-1]
                    motivo = ult.get("motivo", "")[:35]
                    if len(ult.get("motivo", "")) > 35:
                        motivo += "…"
                if motivo:
                    texto_pens = fuente_pens.render(f"«{motivo}»", True, (160, 180, 200))
                    rect_pens = texto_pens.get_rect(center=(px, py + radio + 24))
                    if 0 <= rect_pens.top < self.alto_mapa - 5:
                        bg_pens = pygame.Rect(rect_pens.x - 2, rect_pens.y - 1, rect_pens.w + 4, rect_pens.h + 2)
                        pygame.draw.rect(self.pantalla, (20, 25, 28), bg_pens)
                        pygame.draw.rect(self.pantalla, (55, 65, 75), bg_pens, 1)
                        self.pantalla.blit(texto_pens, rect_pens)

    def dibujar_barra_inferior(self, estado_ui: dict) -> None:
        """Barra inferior con tick, velocidad, modo, feedback y alertas watchdog."""
        tick = estado_ui.get("tick_actual", 0)
        pausado = estado_ui.get("pausado", False)
        velocidad = estado_ui.get("velocidad", 1.0)
        modo = estado_ui.get("modo_visualizacion", ModoVisualizacion.NORMAL)
        feedback = estado_ui.get("mensaje_feedback", "")
        modo_sombra = estado_ui.get("modo_sombra", False)
        sombra_esperando = estado_ui.get("sombra_esperando_input", False)
        watchdog_total = estado_ui.get("watchdog_total", 0)
        try:
            fuente = pygame.font.SysFont("segoe ui", 12)
            fuente_b = pygame.font.SysFont("segoe ui", 12, bold=True)
        except Exception:
            fuente = pygame.font.SysFont("arial", 12)
            fuente_b = pygame.font.SysFont("arial", 12, bold=True)

        y_bar = self.alto_mapa
        alto_barra = self.alto_total - y_bar
        # Fondo barra con elevación sutil
        color_barra_base = (28, 32, 38)
        if modo_sombra:
            color_barra_base = (55, 35, 15) if sombra_esperando else (25, 45, 30)
        pygame.draw.rect(self.pantalla, color_barra_base, (0, y_bar, self.ancho_mapa, alto_barra))
        pygame.draw.line(self.pantalla, (45, 52, 60), (0, y_bar), (self.ancho_mapa, y_bar), 1)

        y_bar += 6

        if modo_sombra:
            txt_sombra = fuente_b.render(
                f"[MODO SOMBRA] Tick {tick} — TU TURNO: WASD=mover  ESPACIO=esperar  P=pausar"
                if sombra_esperando else f"[MODO SOMBRA] Tick {tick} — Ejecutando turno...",
                True, (255, 200, 100) if sombra_esperando else (150, 210, 160),
            )
            self.pantalla.blit(txt_sombra, (12, y_bar))

        texto = None
        if not modo_sombra:
            estado_str = "pausado" if pausado else "ejecutando"
            hints = "  P=pausa  Selecciona+flechas=mover  N=paso  Click mapa=destino"
            texto = fuente.render(
                f"Tick: {tick}  ·  {estado_str}  ·  {velocidad}x  ·  {modo.value}  ·  {hints}",
                True, COLOR_TEXTO_SEC,
            )
            self.pantalla.blit(texto, (12, y_bar))

        if feedback:
            color_fb = (255, 200, 100) if "SOMBRA" in feedback else (
                (107, 198, 126) if ("OK" in feedback or "Auto" in feedback) else (232, 180, 100)
            )
            txt_fb = fuente.render(feedback[:80], True, color_fb)
            y_fb = y_bar + 16 if modo_sombra else y_bar
            x_fb = 12 if modo_sombra else (texto.get_width() + 20 if texto else 12)
            if y_fb + 14 < self.alto_total:
                self.pantalla.blit(txt_fb, (x_fb, y_fb))

        if watchdog_total > 0:
            txt_wd = fuente_b.render(f"WATCHDOG: {watchdog_total} alertas", True, (224, 122, 90))
            x_wd = self.ancho_mapa - txt_wd.get_width() - 16
            if x_wd > 12:
                self.pantalla.blit(txt_wd, (x_wd, y_bar))

    def obtener_panel(self) -> PanelControl | None:
        """Devuelve el panel de control para procesar clicks."""
        return self.panel_control

    def dibujar_paneles(self, estado_ui: dict) -> None:
        """Compatibilidad."""
        self.dibujar_barra_inferior(estado_ui)

    def obtener_reloj(self):
        """Devuelve el reloj de Pygame para FPS."""
        return self.reloj

    def cerrar(self) -> None:
        """Cierra Pygame."""
        pygame.quit()
