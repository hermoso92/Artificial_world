"""
Renderizador del mundo y entidades.
Incluye: nombres, acciones, modos de visualización, panel de control avanzado.
"""

import pygame

from tipos.enums import TipoRecurso, TipoEntidad

from .estado_panel import ModoVisualizacion
from .panel_control import PanelControl


class Renderizador:
    """Renderiza el mapa, entidades y paneles."""

    def _log(self, msg: str) -> None:
        try:
            import os
            from datetime import datetime
            ruta = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "app_diagnostico.log")
            with open(ruta, "a", encoding="utf-8") as f:
                f.write(f"[{datetime.now().isoformat()}] {msg}\n")
        except Exception:
            pass

    def __init__(self, configuracion=None):
        self.configuracion = configuracion
        self.inicializado = False
        self.pantalla = None
        self.reloj = None
        self.panel_control: PanelControl | None = None

        # Colores
        self.color_fondo = (40, 44, 52)
        self.color_celda = (55, 59, 68)
        self.color_comida = (120, 200, 80)
        self.color_material = (180, 140, 90)
        self.color_refugio = (100, 150, 200)
        self.color_borde = (70, 74, 82)
        self.color_panel = (35, 38, 45)
        self.color_texto = (220, 220, 220)
        self.color_texto_sec = (160, 165, 170)

    def inicializar(self, estado_panel: "EstadoPanel | None" = None) -> None:
        """Inicializa Pygame y la ventana."""
        from .estado_panel import EstadoPanel
        pygame.init()
        pygame.display.set_caption("MUNDO_ARTIFICIAL")
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
        self.dibujar_entidades(entidades, estado_ui.get("entidad_seleccionada_id"))
        self.dibujar_barra_inferior(estado_ui)

        if self.panel_control:
            self.panel_control.dibujar(
                self.pantalla,
                entidades,
                estado_ui.get("tick_actual", 0),
                estado_ui.get("guardado_ok", False),
                estado_ui.get("cargado_ok", False),
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
            color = self.color_celda
            if modo == ModoVisualizacion.CALOR_ENERGIA or modo == ModoVisualizacion.CALOR_HAMBRE:
                ent_en_celda = [e for e in entidades if e.posicion.x == x and e.posicion.y == y]
                if ent_en_celda:
                    e0 = ent_en_celda[0]
                    if modo == ModoVisualizacion.CALOR_ENERGIA:
                        v = int(e0.estado_interno.energia * 255)
                        color = (255 - v, v, 80)
                    else:
                        v = int(e0.estado_interno.hambre * 255)
                        color = (v, 255 - v, 80)
            elif modo == ModoVisualizacion.RECURSOS:
                if celda.tiene_recurso() and celda.recurso:
                    color = (
                        (100, 180, 100) if celda.recurso.tipo == TipoRecurso.COMIDA
                        else (160, 120, 80)
                    )
                else:
                    color = (45, 48, 52)
            elif modo == ModoVisualizacion.REFUGIOS:
                if celda.tiene_refugio():
                    color = (80, 130, 200)
                else:
                    color = (45, 48, 52)
            pygame.draw.rect(self.pantalla, color, rect)
            pygame.draw.rect(self.pantalla, self.color_borde, rect, 1)

    def dibujar_recursos(self, mapa) -> None:
        """Dibuja los recursos en el mapa."""
        if mapa is None:
            return
        tam = self.configuracion.tamano_celda
        margen = 2
        for (x, y), celda in mapa.celdas.items():
            if celda.tiene_recurso() and celda.recurso:
                cx = x * tam + tam // 2
                cy = y * tam + tam // 2
                radio = tam // 2 - margen
                color = (
                    self.color_comida
                    if celda.recurso.tipo == TipoRecurso.COMIDA
                    else self.color_material
                )
                pygame.draw.circle(self.pantalla, color, (cx, cy), radio)

    def dibujar_refugios(self, mapa) -> None:
        """Dibuja los refugios en el mapa."""
        if mapa is None:
            return
        tam = self.configuracion.tamano_celda
        margen = 2
        for (x, y), celda in mapa.celdas.items():
            if celda.tiene_refugio():
                rect = pygame.Rect(
                    x * tam + margen,
                    y * tam + margen,
                    tam - 2 * margen,
                    tam - 2 * margen,
                )
                pygame.draw.rect(self.pantalla, self.color_refugio, rect)
                pygame.draw.rect(self.pantalla, (80, 120, 180), rect, 2)

    def dibujar_entidades(self, entidades: list, entidad_seleccionada_id: int | None = None) -> None:
        """Dibuja las entidades con nombres y acción."""
        if not entidades:
            return
        tam = self.configuracion.tamano_celda
        radio = max(3, tam // 3)
        try:
            fuente_nombre = pygame.font.SysFont("arial", 10)
            fuente_accion = pygame.font.SysFont("arial", 8)
        except Exception:
            fuente_nombre = pygame.font.Font(None, 14)
            fuente_accion = pygame.font.Font(None, 12)

        for entidad in entidades:
            px = entidad.posicion.x * tam + tam // 2
            py = entidad.posicion.y * tam + tam // 2
            color = entidad.color
            seleccionada = entidad.id_entidad == entidad_seleccionada_id
            en_ctrl = getattr(entidad, "control_total", False)

            # Anillo exterior: naranja pulsante si control total, amarillo si seleccionada
            if en_ctrl:
                pygame.draw.circle(self.pantalla, (255, 140, 0), (px, py), radio + 5, 3)
                pygame.draw.circle(self.pantalla, (255, 220, 50), (px, py), radio + 8, 1)
            elif seleccionada:
                pygame.draw.circle(self.pantalla, (255, 255, 100), (px, py), radio + 3, 2)

            pygame.draw.circle(self.pantalla, color, (px, py), radio)
            pygame.draw.circle(self.pantalla, (255, 255, 255), (px, py), radio, 1)
            if entidad.tipo_entidad == TipoEntidad.GATO:
                pygame.draw.circle(self.pantalla, (255, 255, 255), (px, py), radio - 2, 1)

            nombre = getattr(entidad, "nombre", f"E{entidad.id_entidad}")
            # En control total, mostrar el nombre en naranja con prefijo [TÚ]
            color_nombre = (255, 180, 50) if en_ctrl else (255, 255, 255)
            prefijo = "[TU] " if en_ctrl else ""
            texto_nom = fuente_nombre.render(f"{prefijo}{nombre}", True, color_nombre)
            rect_nom = texto_nom.get_rect(center=(px, py - radio - 8))
            sombra = pygame.Surface((rect_nom.w + 2, rect_nom.h + 2))
            sombra.fill((0, 0, 0))
            sombra.set_alpha(180)
            self.pantalla.blit(sombra, (rect_nom.x - 1, rect_nom.y - 1))
            self.pantalla.blit(texto_nom, rect_nom)

            acc = entidad.estado_interno.accion_actual
            acc_str = ("CTRL" if en_ctrl else acc.value) if (en_ctrl or acc) else "-"
            color_acc = (255, 140, 0) if en_ctrl else self.color_texto_sec
            texto_acc = fuente_accion.render(acc_str, True, color_acc)
            rect_acc = texto_acc.get_rect(center=(px, py + radio + 6))
            self.pantalla.blit(texto_acc, rect_acc)

    def dibujar_barra_inferior(self, estado_ui: dict) -> None:
        """Barra inferior con tick, velocidad, modo y feedback."""
        tick = estado_ui.get("tick_actual", 0)
        pausado = estado_ui.get("pausado", False)
        velocidad = estado_ui.get("velocidad", 1.0)
        modo = estado_ui.get("modo_visualizacion", ModoVisualizacion.NORMAL)
        feedback = estado_ui.get("mensaje_feedback", "")
        modo_sombra = estado_ui.get("modo_sombra", False)
        sombra_esperando = estado_ui.get("sombra_esperando_input", False)
        try:
            fuente = pygame.font.SysFont("arial", 12)
            fuente_b = pygame.font.SysFont("arial", 12, bold=True)
        except Exception:
            fuente = pygame.font.Font(None, 18)
            fuente_b = fuente

        y_bar = self.alto_mapa + 3

        if modo_sombra:
            # Fondo especial para modo sombra
            color_barra = (60, 30, 10) if sombra_esperando else (30, 50, 20)
            pygame.draw.rect(self.pantalla, color_barra,
                             (0, y_bar, self.ancho_mapa, self.alto_total - y_bar))
            if sombra_esperando:
                txt_sombra = fuente_b.render(
                    f"[MODO SOMBRA] Tick {tick} - TU TURNO: WASD=mover  ESPACIO=esperar  P=pausar",
                    True, (255, 200, 80)
                )
            else:
                txt_sombra = fuente_b.render(
                    f"[MODO SOMBRA] Tick {tick} - Ejecutando turno...",
                    True, (150, 200, 150)
                )
            self.pantalla.blit(txt_sombra, (10, y_bar + 4))
        else:
            estado_str = "PAUSADO" if pausado else "Ejecutando"
            texto = fuente.render(
                f"Tick: {tick}  |  {estado_str}  |  {velocidad}x  |  {modo.value}",
                True, self.color_texto,
            )
            self.pantalla.blit(texto, (10, y_bar + 5))

        if feedback:
            color_fb = (255, 200, 80) if "SOMBRA" in feedback else (
                (100, 200, 100) if ("OK" in feedback or "Auto" in feedback) else (200, 150, 100)
            )
            txt_fb = fuente.render(feedback[:80], True, color_fb)
            # Si modo sombra ya ocupa la barra, poner feedback debajo
            y_fb = y_bar + 18 if modo_sombra else y_bar + 5
            x_fb = 10 if modo_sombra else (
                fuente.render(
                    f"Tick: {tick}  |  {'PAUSADO' if pausado else 'Ejecutando'}  |  {velocidad}x  |  {modo.value}",
                    True, self.color_texto
                ).get_width() + 15
            )
            if y_fb + 14 < self.alto_total:
                self.pantalla.blit(txt_fb, (x_fb, y_fb))

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
