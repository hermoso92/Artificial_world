"""
Tests estructurales: imports, configuracion, modulos, dependencias.
Verifican que la arquitectura esta intacta antes de tests funcionales.
"""

import os
import sys

os.environ.setdefault("SDL_VIDEODRIVER", "dummy")
os.environ.setdefault("SDL_AUDIODRIVER", "dummy")
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def test_import_principal():
    """El punto de entrada importa sin error."""
    import principal  # noqa: F401
    assert hasattr(principal, "main")


def test_import_configuracion():
    """Configuracion carga y valida."""
    from configuracion import Configuracion
    c = Configuracion()
    assert c.ancho_mapa >= 2
    assert c.alto_mapa >= 2
    assert c.fps_objetivo > 0


def test_import_tipos():
    """Modulo tipos completo."""
    from tipos.enums import TipoAccion, TipoEntidad, TipoEvento, ModoControl, TipoComandoSombra
    from tipos.modelos import Posicion, EventoSistema, ComandoSombra
    assert len(list(TipoAccion)) >= 10
    assert ModoControl.AUTONOMO.value == "autonomo"
    assert TipoComandoSombra.MOVER_A_POSICION is not None
    p = Posicion(1, 2)
    assert p.x == 1 and p.y == 2


def test_import_mundo():
    """Modulo mundo completo."""
    from mundo.mapa import Mapa
    from mundo.celda import Celda
    from mundo.recurso import Recurso
    from mundo.generador_mundo import GeneradorMundo
    from tipos.modelos import Posicion
    from tipos.enums import TipoRecurso
    m = Mapa(10, 10)
    assert m.ancho == 10
    c = m.obtener_celda(Posicion(0, 0))
    assert c is not None
    r = Recurso(TipoRecurso.COMIDA, 1)
    assert r.tipo == TipoRecurso.COMIDA


def test_import_agentes():
    """Modulo agentes completo."""
    from agentes.motor_decision import MotorDecision
    from agentes.estado_interno import EstadoInterno
    from agentes.inventario import Inventario
    from agentes.relaciones import GestorRelaciones
    from agentes.directivas import GestorDirectivas
    from agentes.memoria import MemoriaEntidad
    motor = MotorDecision()
    assert motor is not None
    inv = Inventario(1, 0)
    assert inv.comida == 1


def test_import_acciones():
    """Todas las acciones importables."""
    from acciones.accion_mover import AccionMover
    from acciones.accion_comer import AccionComer
    from acciones.accion_recoger_comida import AccionRecogerComida
    from acciones.accion_atacar import AccionAtacar
    from acciones.accion_compartir import AccionCompartir
    from acciones.accion_robar import AccionRobar
    from acciones.accion_seguir import AccionSeguir
    assert AccionMover(1, 0, 0).tipo_accion.value == "mover"
    assert AccionAtacar(1, 2).tipo_accion.value == "atacar"


def test_import_entidades():
    """Modulo entidades completo."""
    from entidades.entidad_base import EntidadBase
    from entidades.entidad_social import EntidadSocial
    from entidades.entidad_gato import EntidadGato
    from entidades.fabrica_entidades import FabricaEntidades
    from tipos.modelos import Posicion
    from tipos.enums import TipoRasgoSocial, TipoRasgoGato
    assert EntidadSocial is not None
    assert EntidadGato is not None


def test_import_sistemas():
    """Modulo sistemas completo."""
    from sistemas.sistema_logs import SistemaLogs
    from sistemas.sistema_persistencia import SistemaPersistencia
    from sistemas.sistema_watchdog import SistemaWatchdog
    from sistemas.gestor_modo_sombra import GestorModoSombra
    logs = SistemaLogs()
    assert logs.max_eventos > 0
    assert GestorModoSombra is not None


def test_import_nucleo():
    """Modulo nucleo completo."""
    from nucleo.simulacion import Simulacion
    from nucleo.bus_eventos import BusEventos
    from nucleo.contexto import ContextoDecision, ContextoSimulacion
    from nucleo.gestor_ticks import GestorTicks
    bus = BusEventos()
    assert bus is not None
    gt = GestorTicks()
    assert gt.tick_actual == 0


def test_import_interfaz():
    """Modulo interfaz completo."""
    from interfaz.renderizador import Renderizador
    from interfaz.panel_control import PanelControl
    from interfaz.panel_modo_sombra import PanelModoSombra
    from interfaz.estado_panel import EstadoPanel
    assert PanelModoSombra is not None
    assert EstadoPanel is not None


def test_utilidades_paths():
    """Paths resuelve correctamente base."""
    from utilidades.paths import obtener_base_path
    base = obtener_base_path()
    assert os.path.isdir(base)
    assert "artificial" in base.lower() or "word" in base.lower() or len(base) > 3


def test_config_validacion_rechaza_invalido():
    """Config rechaza valores invalidos."""
    from configuracion import Configuracion
    try:
        Configuracion(ancho_mapa=0)
        assert False, "Debia lanzar ValueError"
    except ValueError:
        pass
    try:
        Configuracion(fps_objetivo=0)
        assert False, "Debia lanzar ValueError"
    except ValueError:
        pass


def test_dependencia_pygame():
    """Pygame instalado y version correcta."""
    import pygame
    v = pygame.version.ver
    assert v >= "2.5"


if __name__ == "__main__":
    import inspect
    ok, fail = 0, 0
    for name, fn in inspect.getmembers(__import__(__name__), predicate=inspect.isfunction):
        if name.startswith("test_"):
            try:
                fn()
                ok += 1
                print(f"OK {name}")
            except Exception as e:
                fail += 1
                print(f"FAIL {name}: {e}")
    print(f"\nEstructurales: {ok} OK, {fail} FAIL")
    sys.exit(1 if fail else 0)
