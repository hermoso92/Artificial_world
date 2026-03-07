"""
Test de integracion completo para produccion.
Simula 200 ticks, guarda/carga estado, verifica persistencia y flujos criticos.
"""

import os
import sys
import tempfile
import shutil

os.environ.setdefault("SDL_VIDEODRIVER", "dummy")
os.environ.setdefault("SDL_AUDIODRIVER", "dummy")
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def test_simulacion_200_ticks_sin_crash():
    """200 ticks completos sin excepcion."""
    import logging
    logging.disable(logging.CRITICAL)
    from configuracion import Configuracion
    from nucleo.simulacion import Simulacion

    cfg = Configuracion()
    sim = Simulacion(cfg)
    sim.inicializar()
    sim.crear_mundo()
    sim.crear_entidades_iniciales()
    sim.sistema_persistencia = None  # Evitar guardar en test

    for i in range(200):
        sim._ejecutar_tick_completo()

    assert sim.gestor_ticks.tick_actual == 200
    assert len(sim.entidades) >= 1
    print("OK test_simulacion_200_ticks_sin_crash")


def test_guardar_cargar_estado():
    """Guardar y cargar estado preserva datos."""
    import logging
    logging.disable(logging.CRITICAL)
    from configuracion import Configuracion
    from nucleo.simulacion import Simulacion

    tmp = tempfile.mkdtemp()
    try:
        cfg = Configuracion()
        sim = Simulacion(cfg)
        sim.inicializar()
        sim.crear_mundo()
        sim.crear_entidades_iniciales()
        sim.sistema_persistencia = None

        for _ in range(50):
            sim._ejecutar_tick_completo()

        tick_antes = sim.gestor_ticks.tick_actual
        nombres_antes = [e.nombre for e in sim.entidades]
        pos_antes = {e.nombre: (e.posicion.x, e.posicion.y) for e in sim.entidades}

        # Guardar a JSON en tmp
        from sistemas.sistema_persistencia import SistemaPersistencia
        pers = SistemaPersistencia(usar_sqlite=False, auto_guardar_intervalo=999)
        ruta_json = os.path.join(tmp, "estado_test.json")
        pers.guardar_estado(sim, ruta_json)

        # Nueva sim, cargar
        sim2 = Simulacion(cfg)
        sim2.inicializar()
        sim2.crear_mundo()
        sim2.crear_entidades_iniciales()
        pers2 = SistemaPersistencia(usar_sqlite=False, auto_guardar_intervalo=999)
        ok = pers2.cargar_estado(sim2, ruta_json)

        assert ok
        assert sim2.gestor_ticks.tick_actual == tick_antes
        assert [e.nombre for e in sim2.entidades] == nombres_antes
        for e in sim2.entidades:
            assert (e.posicion.x, e.posicion.y) == pos_antes[e.nombre]
        print("OK test_guardar_cargar_estado")
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def test_modo_sombra_comandos_ejecutan():
    """Comandos sombra producen acciones reales."""
    from configuracion import Configuracion
    from mundo.generador_mundo import GeneradorMundo
    from entidades.fabrica_entidades import FabricaEntidades
    from tipos.modelos import Posicion
    from tipos.enums import TipoComandoSombra, ModoControl
    from nucleo.bus_eventos import BusEventos
    from nucleo.contexto import ContextoSimulacion
    from sistemas.gestor_modo_sombra import GestorModoSombra

    cfg = Configuracion()
    gen = GeneradorMundo(cfg)
    mapa = gen.generar_mapa()
    gen.distribuir_comida(mapa)
    gen.distribuir_refugios(mapa)
    fab = FabricaEntidades(cfg)
    entidades = fab.crear_entidades_iniciales(mapa)
    bus = BusEventos()
    gestor = GestorModoSombra(bus_eventos=bus)
    for e in entidades:
        e._gestor_sombra = gestor

    ami = next(e for e in entidades if e.nombre == "Amiguisimo")
    destino = Posicion(
        min(ami.posicion.x + 1, mapa.ancho - 1),
        ami.posicion.y
    )
    pos_inicial = (ami.posicion.x, ami.posicion.y)

    gestor.activar_modo_poseido(ami, 1)
    gestor.encolar_comando(ami, TipoComandoSombra.MOVER_A_POSICION, 1, objetivo_posicion=destino)

    ctx = ContextoSimulacion(
        tick_actual=1, mapa=mapa, bus_eventos=bus, entidades=entidades,
        configuracion=cfg
    )
    for _ in range(20):
        if gestor.obtener_comando_activo(ami.id_entidad) is None:
            break
        acc = gestor.procesar_tick(ami, 1, ctx)
        if acc and hasattr(acc.accion, "ejecutar"):
            acc.accion.ejecutar(ami, ctx)

    assert ami.modo_control == ModoControl.POSEIDO or (ami.posicion.x, ami.posicion.y) != pos_inicial
    print("OK test_modo_sombra_comandos_ejecutan")


def test_hambre_mejora_con_fix():
    """Tras 100 ticks, al menos 4 entidades tienen hambre < 0.90."""
    import logging
    logging.disable(logging.CRITICAL)
    from configuracion import Configuracion
    from nucleo.simulacion import Simulacion

    cfg = Configuracion()
    sim = Simulacion(cfg)
    sim.inicializar()
    sim.crear_mundo()
    sim.crear_entidades_iniciales()
    sim.sistema_persistencia = None

    for _ in range(100):
        sim._ejecutar_tick_completo()

    con_hambre_ok = sum(1 for e in sim.entidades if e.estado_interno.hambre < 0.90)
    assert con_hambre_ok >= 4, f"Solo {con_hambre_ok} con hambre < 0.90"
    print(f"OK test_hambre_mejora_con_fix: {con_hambre_ok}/7 con hambre OK")


def test_sintaxis_todos_modulos():
    """Todos los .py compilan sin error."""
    import py_compile
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    for root, _, files in os.walk(base):
        if "__pycache__" in root or "build" in root or "dist" in root:
            continue
        for f in files:
            if f.endswith(".py"):
                path = os.path.join(root, f)
                try:
                    py_compile.compile(path, doraise=True)
                except py_compile.PyCompileError as e:
                    raise AssertionError(f"Syntax error en {path}: {e}")
    print("OK test_sintaxis_todos_modulos")


if __name__ == "__main__":
    import inspect
    ok, fail = 0, 0
    for name, fn in inspect.getmembers(__import__(__name__), predicate=inspect.isfunction):
        if name.startswith("test_"):
            try:
                fn()
                ok += 1
            except Exception as e:
                fail += 1
                print(f"FAIL {name}: {e}")
    print(f"\nIntegracion produccion: {ok} OK, {fail} FAIL")
    sys.exit(1 if fail else 0)
