"""Tests del modo sombra por turnos."""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ["SDL_VIDEODRIVER"] = "dummy"
os.environ["SDL_AUDIODRIVER"] = "dummy"

from configuracion import Configuracion
from mundo.generador_mundo import GeneradorMundo
from entidades.fabrica_entidades import FabricaEntidades
from tipos.modelos import PercepcionLocal, Posicion
from nucleo.contexto import ContextoDecision


def setup():
    cfg = Configuracion()
    gen = GeneradorMundo(cfg)
    mapa = gen.generar_mapa()
    gen.distribuir_comida(mapa)
    gen.distribuir_material(mapa)
    gen.distribuir_refugios(mapa)
    fab = FabricaEntidades(cfg)
    entidades = fab.crear_entidades_iniciales(mapa)
    ami = next(e for e in entidades if e.nombre == "Amiguisimo")
    ctx = ContextoDecision(
        tick_actual=1, mapa=mapa,
        percepcion_local=PercepcionLocal([], [], [], [], 0.0),
        configuracion=cfg,
    )
    return ami, entidades, mapa, ctx


def test_mundo_congelado_sin_input():
    ami, _, _, ctx = setup()
    ami.control_total = True
    r = ami.decidir_accion(ctx)
    assert r is None, f"FALLO: esperaba None, got {r}"
    print("OK test_mundo_congelado_sin_input")


def test_mover_genera_sombra_mover():
    ami, _, _, ctx = setup()
    ami.control_total = True
    pos_antes = ami.posicion
    ami.control_total_pendiente = Posicion(pos_antes.x + 1, pos_antes.y)
    r = ami.decidir_accion(ctx)
    assert r is not None
    assert r.motivo_principal == "SOMBRA_MOVER"
    assert r.puntuacion_final == 9.0
    assert ami.control_total_pendiente is None, "pendiente no se limpio"
    print("OK test_mover_genera_sombra_mover")


def test_esperar_genera_sombra_esperar():
    ami, _, _, ctx = setup()
    ami.control_total = True
    ami.sombra_accion_pendiente = "esperar"
    r = ami.decidir_accion(ctx)
    assert r is not None
    assert r.motivo_principal == "SOMBRA_ESPERAR"
    assert ami.sombra_accion_pendiente is None, "sombra_accion_pendiente no se limpio"
    print("OK test_esperar_genera_sombra_esperar")


def test_otras_entidades_no_afectadas():
    ami, entidades, _, ctx = setup()
    ami.control_total = True
    otras = [e for e in entidades if e.nombre != "Amiguisimo"]
    assert len(otras) > 0
    for otra in otras:
        assert not otra.control_total
        r = otra.decidir_accion(ctx)
        # Las otras entidades siempre pueden decidir con IA
        # (pueden devolver None si no hay acciones viables pero no por modo sombra)
    print("OK test_otras_entidades_no_afectadas")


def test_doble_accion_no_procesa_dos_turnos():
    """Si se pulsa 2 teclas rapido, solo se registra 1 movimiento."""
    ami, _, _, ctx = setup()
    ami.control_total = True
    pos = ami.posicion
    ami.control_total_pendiente = Posicion(pos.x + 1, pos.y)
    # Segunda pulsacion antes de que se procese el tick
    # (deberia sobreescribir, no acumular)
    ami.control_total_pendiente = Posicion(pos.x + 2, pos.y)
    r = ami.decidir_accion(ctx)
    assert r is not None
    assert r.motivo_principal == "SOMBRA_MOVER"
    assert ami.control_total_pendiente is None
    # Segunda decision en mismo tick: debe dar None (turno consumido)
    r2 = ami.decidir_accion(ctx)
    assert r2 is None, f"FALLO: segundo turno en mismo ciclo deberia ser None, got {r2}"
    print("OK test_doble_accion_no_procesa_dos_turnos")


def test_desactivar_control_ia_retoma():
    ami, _, _, ctx = setup()
    ami.control_total = True
    ami.control_total = False
    r = ami.decidir_accion(ctx)
    # La IA decide normalmente (puede ser None si no hay candidatos, pero no por modo sombra)
    print(f"OK test_desactivar_control_ia_retoma: accion={r.accion.tipo_accion.value if r else 'IA-None'}")


def test_historial_registra_acciones_sombra():
    ami, _, _, ctx = setup()
    ami.control_total = True
    ami.control_total_pendiente = Posicion(ami.posicion.x + 1, ami.posicion.y)
    ami.decidir_accion(ctx)
    assert len(ami.historial_decisiones) == 1
    assert ami.historial_decisiones[-1]["motivo"] == "SOMBRA_MOVER"
    ami.sombra_accion_pendiente = "esperar"
    ami.decidir_accion(ctx)
    assert len(ami.historial_decisiones) == 2
    assert ami.historial_decisiones[-1]["motivo"] == "SOMBRA_ESPERAR"
    print("OK test_historial_registra_acciones_sombra")


if __name__ == "__main__":
    test_mundo_congelado_sin_input()
    test_mover_genera_sombra_mover()
    test_esperar_genera_sombra_esperar()
    test_otras_entidades_no_afectadas()
    test_doble_accion_no_procesa_dos_turnos()
    test_desactivar_control_ia_retoma()
    test_historial_registra_acciones_sombra()
    print("")
    print("TODOS LOS TESTS MODO SOMBRA: OK")
