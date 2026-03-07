"""
Test de integración del watchdog: ejecuta simulación real y verifica alertas.

Demuestra que el watchdog recibe datos del bucle de simulación y genera alertas
cuando hay anomalías (entidad atrapada). Verifica también que las alertas
se escriben en simulacion.log.
"""
import os
import sys
import tempfile
import logging

# Headless para tests
os.environ["SDL_VIDEODRIVER"] = "dummy"
os.environ["SDL_AUDIODRIVER"] = "dummy"

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from configuracion import Configuracion
from mundo.generador_mundo import GeneradorMundo
from entidades.fabrica_entidades import FabricaEntidades
from sistemas.sistema_watchdog import SistemaWatchdog
from tipos.enums import TipoAccion
from tipos.modelos import Posicion


def test_watchdog_integracion_trampa_posicion():
    """
    Ejecuta ticks reales con una entidad fija en la misma posición.
    Verifica que el watchdog genera alerta TRAMPA_POSICION.
    """
    cfg = Configuracion()
    gen = GeneradorMundo(cfg)
    mapa = gen.generar_mapa()
    gen.distribuir_comida(mapa)
    gen.distribuir_material(mapa)
    gen.distribuir_refugios(mapa)
    fab = FabricaEntidades(cfg)
    entidades = fab.crear_entidades_iniciales(mapa)

    ent = entidades[0]
    pos_fija = Posicion(10, 10)
    ent.posicion = pos_fija

    wd = SistemaWatchdog()
    for tick in range(25):
        ent.posicion = pos_fija
        ent.estado_interno.accion_actual = TipoAccion.DESCANSAR
        wd.registrar_tick(tick, [ent])

    alertas = wd.obtener_alertas_recientes(20)
    codigos = [a.codigo for a in alertas]
    assert "TRAMPA_POSICION" in codigos, (
        f"Debería detectar TRAMPA_POSICION con entidad fija 25 ticks. "
        f"Alertas: {codigos}"
    )


def test_watchdog_integracion_log_escrito():
    """
    Verifica que las alertas del watchdog se escriben en el archivo de log.
    Usa un archivo temporal para no contaminar simulacion.log del proyecto.
    """
    import sistemas.sistema_logs  # Asegura que el logger mundo_artificial esté configurado

    with tempfile.NamedTemporaryFile(mode="w", suffix=".log", delete=False) as f:
        log_path = f.name

    try:
        logger_root = logging.getLogger("mundo_artificial")
        fh = logging.FileHandler(log_path, mode="w", encoding="utf-8")
        fh.setLevel(logging.WARNING)
        fh.setFormatter(logging.Formatter("%(message)s"))
        logger_root.addHandler(fh)

        cfg = Configuracion()
        gen = GeneradorMundo(cfg)
        mapa = gen.generar_mapa()
        gen.distribuir_comida(mapa)
        gen.distribuir_refugios(mapa)
        fab = FabricaEntidades(cfg)
        entidades = fab.crear_entidades_iniciales(mapa)

        ent = entidades[0]
        ent.posicion = Posicion(5, 5)
        ent.estado_interno.accion_actual = TipoAccion.DESCANSAR

        wd = SistemaWatchdog()
        for tick in range(25):
            ent.posicion = Posicion(5, 5)
            wd.registrar_tick(tick, [ent])

        logger_root.removeHandler(fh)
        fh.close()

        with open(log_path, "r", encoding="utf-8") as f:
            contenido = f.read()

        assert "WATCHDOG" in contenido, (
            f"El log debería contener 'WATCHDOG'. Contenido: {contenido[:500]}"
        )
        assert "TRAMPA_POSICION" in contenido, (
            f"El log debería contener 'TRAMPA_POSICION'. Contenido: {contenido[:500]}"
        )
    finally:
        if os.path.exists(log_path):
            os.unlink(log_path)


def test_watchdog_integracion_simulacion_completa():
    """
    Usa la clase Simulacion real: inicializa, crea mundo, entidades,
    y ejecuta _ejecutar_tick_completo varias veces.
    Verifica que el watchdog recibe datos y puede generar alertas.

    Nota: En una simulación normal las entidades se mueven, por lo que
    TRAMPA_POSICION puede no dispararse. Este test verifica que el
    watchdog está integrado y que problemas_detectados_total o alertas
    reflejan el estado (puede ser 0 si no hay anomalías).
    """
    from nucleo.simulacion import Simulacion

    cfg = Configuracion()
    cfg.cantidad_entidades_sociales = 2
    cfg.incluir_gato = False
    cfg.ancho_mapa = 20
    cfg.alto_mapa = 20

    sim = Simulacion(cfg)
    sim.inicializar()
    sim.crear_mundo()
    sim.crear_entidades_iniciales()

    assert sim.sistema_watchdog is not None
    assert sim.entidades

    for _ in range(15):
        sim._ejecutar_tick_completo()

    assert sim.sistema_watchdog.historial
    for e in sim.entidades:
        assert e.id_entidad in sim.sistema_watchdog.historial


if __name__ == "__main__":
    test_watchdog_integracion_trampa_posicion()
    print("OK: test_watchdog_integracion_trampa_posicion")

    test_watchdog_integracion_log_escrito()
    print("OK: test_watchdog_integracion_log_escrito")

    test_watchdog_integracion_simulacion_completa()
    print("OK: test_watchdog_integracion_simulacion_completa")

    print("\nTodos los tests de integración del watchdog pasaron.")
