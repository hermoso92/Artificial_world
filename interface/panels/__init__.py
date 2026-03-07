"""
Panels: paneles de control, modo sombra, eventos.

Reexporta desde interfaz/ durante la migración incremental.
"""

from interfaz.estado_panel import EstadoPanel
from interfaz.panel_control import PanelControl
from interfaz.panel_eventos import PanelEventos
from interfaz.panel_modo_sombra import PanelModoSombra

__all__ = ["EstadoPanel", "PanelControl", "PanelEventos", "PanelModoSombra"]
