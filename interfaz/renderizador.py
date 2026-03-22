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

    _ACCION_LEGIBLE = {
        "explorar": "Explorando",
        "mover": "Moviendose",
        "comer": "Comiendo",
        "descansar": "Descansando",
        "ir_refugio": "Yendo a refugio",
        "recoger_comida": "Recogiendo comida",
        "recoger_material": "Recogiendo material",
        "huir": "Huyendo!",
        "evitar": "Evitando",
        "compartir": "Compartiendo",
        "robar": "Robando!",
        "seguir": "Siguiendo",
        "atacar": "Atacando!",
    }

    _ACCION_COLOR = {
        "explorar": (150, 200, 255),
        "mover": (180, 180, 180),
        "comer": (120, 220, 80),
        "descansar": (180, 160, 255),
        "ir_refugio": (100, 180, 220),
        "recoger_comida": (140, 220, 100),
        "recoger_material": (200, 160, 100),
        "huir": (255, 100, 100),
        "evitar": (255, 160, 80),
        "compartir": (100, 255, 180),
        "robar": (255, 80, 80),
        "seguir": (180, 220, 255),
        "atacar": (255, 60, 60),
    }

    def dibujar_entidades(self, entidades: list, entidad_seleccionada_id: int | None = None) -> None:
        """Dibuja las entidades con nombres y acción."""
        if not entidades:
            return
        tam = self.configuracion.tamano_celda
        radio = max(3, tam // 3)
        try:
            fuente_nombre = pygame.font.SysFont("arial", 11, bold=True)
            fuente_accion = pygame.font.SysFont("arial", 9)
        except Exception:
            fuente_nombre = pygame.font.Font(None, 15)
            fuente_accion = pygame.font.Font(None, 13)

        for entidad in entidades:
            px = entidad.posicion.x * tam + tam // 2
            py_pos = entidad.posicion.y * tam + tam // 2
            color = entidad.color
            seleccionada = entidad.id_entidad == entidad_seleccionada_id
            en_ctrl = getattr(entidad, "control_total", False)

            if en_ctrl:
                pygame.draw.circle(self.pantalla, (255, 140, 0), (px, py_pos), radio + 5, 3)
                pygame.draw.circle(self.pantalla, (255, 220, 50), (px, py_pos), radio + 8, 1)
            elif seleccionada:
                pygame.draw.circle(self.pantalla, (255, 255, 100), (px, py_pos), radio + 3, 2)

            pygame.draw.circle(self.pantalla, color, (px, py_pos), radio)
            pygame.draw.circle(self.pantalla, (255, 255, 255), (px, py_pos), radio, 1)
            if entidad.tipo_entidad == TipoEntidad.GATO:
                pygame.draw.circle(self.pantalla, (255, 255, 255), (px, py_pos), radio - 2, 1)

            nombre = getattr(entidad, "nombre", f"E{entidad.id_entidad}")
            color_nombre = (255, 180, 50) if en_ctrl else (255, 255, 255)
            prefijo = "[TU] " if en_ctrl else ""
            texto_nom = fuente_nombre.render(f"{prefijo}{nombre}", True, color_nombre)
            rect_nom = texto_nom.get_rect(center=(px, py_pos - radio - 10))
            sombra = pygame.Surface((rect_nom.w + 4, rect_nom.h + 2))
            sombra.fill((0, 0, 0))
            sombra.set_alpha(200)
            self.pantalla.blit(sombra, (rect_nom.x - 2, rect_nom.y - 1))
            self.pantalla.blit(texto_nom, rect_nom)

            acc = entidad.estado_interno.accion_actual
            if en_ctrl:
                acc_str = "Tu control"
                color_acc = (255, 140, 0)
            elif acc:
                acc_str = self._ACCION_LEGIBLE.get(acc.value, acc.value)
                color_acc = self._ACCION_COLOR.get(acc.value, self.color_texto_sec)
            else:
                acc_str = "Pensando..."
                color_acc = self.color_texto_sec
            texto_acc = fuente_accion.render(acc_str, True, color_acc)
            rect_acc = texto_acc.get_rect(center=(px, py_pos + radio + 8))
            sombra_acc = pygame.Surface((rect_acc.w + 4, rect_acc.h + 2))
            sombra_acc.fill((0, 0, 0))
            sombra_acc.set_alpha(160)
            self.pantalla.blit(sombra_acc, (rect_acc.x - 2, rect_acc.y - 1))
            self.pantalla.blit(texto_acc, rect_acc)

    def dibujar_barra_inferior(self, estado_ui: dict) -> None:
        """Barra inferior con estado claro de la simulacion."""
        tick = estado_ui.get("tick_actual", 0)
        pausado = estado_ui.get("pausado", False)
        velocidad = estado_ui.get("velocidad", 1.0)
        feedback = estado_ui.get("mensaje_feedback", "")
        modo_sombra = estado_ui.get("modo_sombra", False)
        sombra_esperando = estado_ui.get("sombra_esperando_input", False)
        watchdog_total = estado_ui.get("watchdog_total", 0)
        try:
            fuente = pygame.font.SysFont("arial", 12)
            fuente_b = pygame.font.SysFont("arial", 12, bold=True)
        except Exception:
            fuente = pygame.font.Font(None, 18)
            fuente_b = fuente

        y_bar = self.alto_mapa + 3

        if modo_sombra:
            color_barra = (60, 30, 10) if sombra_esperando else (30, 50, 20)
            pygame.draw.rect(self.pantalla, color_barra,
                             (0, y_bar, self.ancho_mapa, self.alto_total - y_bar))
            if sombra_esperando:
                txt_sombra = fuente_b.render(
                    f"TU TURNO — Flechas=mover  Espacio=esperar  (ciclo {tick})",
                    True, (255, 200, 80)
                )
            else:
                txt_sombra = fuente_b.render(
                    f"Ejecutando turno... (ciclo {tick})",
                    True, (150, 200, 150)
                )
            self.pantalla.blit(txt_sombra, (10, y_bar + 4))
        else:
            _VEL_NOMBRES = {0.1: "Muy lenta", 0.25: "Lenta", 0.5: "Media", 1.0: "Normal", 2.0: "Rapida", 4.0: "Muy rapida"}
            vel_nombre = _VEL_NOMBRES.get(velocidad, f"{velocidad}x")
            if pausado:
                estado_str = "EN PAUSA"
                color_estado = (255, 200, 80)
            else:
                estado_str = "Simulacion en marcha"
                color_estado = (120, 220, 120)
            texto = fuente_b.render(estado_str, True, color_estado)
            self.pantalla.blit(texto, (10, y_bar + 5))
            info = fuente.render(
                f"Ciclo {tick}  |  Velocidad: {vel_nombre}",
                True, self.color_texto_sec,
            )
            self.pantalla.blit(info, (texto.get_width() + 20, y_bar + 5))

        if feedback:
            color_fb = (255, 200, 80) if "SOMBRA" in feedback else (
                (100, 200, 100) if ("OK" in feedback or "Auto" in feedback) else (200, 150, 100)
            )
            txt_fb = fuente.render(feedback[:80], True, color_fb)
            x_fb = self.ancho_mapa // 2 - txt_fb.get_width() // 2
            if not modo_sombra:
                self.pantalla.blit(txt_fb, (max(x_fb, 10), y_bar + 5))

        if watchdog_total > 0:
            txt_wd = fuente.render(f"{watchdog_total} alertas detectadas", True, (255, 130, 100))
            x_wd = self.ancho_mapa - txt_wd.get_width() - 15
            if x_wd > 10:
                self.pantalla.blit(txt_wd, (x_wd, y_bar + 5))

    def dibujar_bienvenida(self) -> None:
        """Pantalla de bienvenida que explica la simulacion."""
        if not self.inicializado or self.pantalla is None:
            return
        try:
            fuente_grande = pygame.font.SysFont("arial", 28, bold=True)
            fuente_media = pygame.font.SysFont("arial", 16)
            fuente_normal = pygame.font.SysFont("arial", 13)
            fuente_peq = pygame.font.SysFont("arial", 11)
        except Exception:
            fuente_grande = pygame.font.Font(None, 36)
            fuente_media = pygame.font.Font(None, 22)
            fuente_normal = pygame.font.Font(None, 18)
            fuente_peq = pygame.font.Font(None, 15)

        overlay = pygame.Surface((self.ancho_total, self.alto_total))
        overlay.fill((20, 25, 35))
        overlay.set_alpha(240)
        self.pantalla.blit(overlay, (0, 0))

        cx = self.ancho_total // 2
        y = 40

        titulo = fuente_grande.render("MUNDO ARTIFICIAL", True, (100, 200, 255))
        self.pantalla.blit(titulo, (cx - titulo.get_width() // 2, y))
        y += 40

        sub = fuente_media.render("Simulacion de vida artificial con agentes autonomos", True, (180, 200, 220))
        self.pantalla.blit(sub, (cx - sub.get_width() // 2, y))
        y += 40

        lineas = [
            ("QUE ESTAS VIENDO:", (255, 220, 100), fuente_media),
            ("", None, None),
            ("Un mundo 2D donde 7 criaturas viven de forma autonoma.", (220, 220, 220), fuente_normal),
            ("Cada una tiene nombre, personalidad y necesidades.", (220, 220, 220), fuente_normal),
            ("Exploran, comen, descansan, huyen e interactuan entre si.", (220, 220, 220), fuente_normal),
            ("", None, None),
            ("LOS HABITANTES:", (255, 220, 100), fuente_media),
            ("", None, None),
            ("Ana (cooperativa)  Bruno (neutral)  Clara (agresiva)", (180, 220, 255), fuente_normal),
            ("David (explorador)  Eva (oportunista)  Felix (cooperativo)", (180, 220, 255), fuente_normal),
            ("Amiguisimo (el gato curioso — puedes controlarlo!)", (255, 200, 100), fuente_normal),
            ("", None, None),
            ("EN EL MAPA:", (255, 220, 100), fuente_media),
            ("", None, None),
        ]
        for texto, color, fuente_l in lineas:
            if texto == "":
                y += 8
                continue
            txt = fuente_l.render(texto, True, color)
            self.pantalla.blit(txt, (cx - txt.get_width() // 2, y))
            y += 20

        leyenda_items = [
            ((120, 200, 80), "Circulos verdes = Comida"),
            ((180, 140, 90), "Circulos marrones = Material"),
            ((100, 150, 200), "Cuadrados azules = Refugios"),
            ((255, 255, 255), "Puntos con nombre = Criaturas"),
        ]
        for color, desc in leyenda_items:
            pygame.draw.circle(self.pantalla, color, (cx - 140, y + 7), 5)
            txt = fuente_normal.render(desc, True, (200, 200, 200))
            self.pantalla.blit(txt, (cx - 125, y))
            y += 20

        y += 15
        controles = fuente_media.render("CONTROLES BASICOS:", True, (255, 220, 100))
        self.pantalla.blit(controles, (cx - controles.get_width() // 2, y))
        y += 28

        teclas = [
            "[P] Pausar / reanudar la simulacion",
            "[V] Cambiar velocidad (lenta, media, rapida...)",
            "[N] Avanzar un solo paso (en pausa)",
            "Click en una criatura para seleccionarla",
        ]
        for t in teclas:
            txt = fuente_normal.render(t, True, (180, 200, 220))
            self.pantalla.blit(txt, (cx - txt.get_width() // 2, y))
            y += 20

        y += 20
        continuar = fuente_grande.render("Pulsa cualquier tecla para empezar", True, (100, 255, 150))
        self.pantalla.blit(continuar, (cx - continuar.get_width() // 2, y))

        pygame.display.flip()

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
