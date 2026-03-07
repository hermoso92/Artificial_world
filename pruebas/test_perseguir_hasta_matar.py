"""
Test de integración: perseguir hasta matar.

Verifica el flujo completo en Modo Sombra:
- Activar modo combate
- Encolar ATACAR_OBJETIVO sobre una entidad
- Ejecutar ticks: acercarse, atacar, repetir hasta que el objetivo muera
- Comprobar que la víctima se elimina de la simulación (activo=False, quitada del mapa)
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ["SDL_VIDEODRIVER"] = "dummy"
os.environ["SDL_AUDIODRIVER"] = "dummy"

import logging
logging.disable(logging.CRITICAL)

from configuracion import Configuracion
from nucleo.simulacion import Simulacion
from tipos.enums import TipoComandoSombra


def test_perseguir_hasta_matar():
    """Modo Sombra + ATACAR_OBJETIVO: perseguir y atacar hasta eliminar."""
    cfg = Configuracion()
    cfg.modo_combate_activo = True
    cfg.ancho_mapa = 12
    cfg.alto_mapa = 12
    cfg.cantidad_entidades_sociales = 2
    cfg.incluir_gato = True
    cfg.incluir_tryndamere = False

    sim = Simulacion(cfg)
    sim.inicializar()
    sim.crear_mundo()
    sim.crear_entidades_iniciales()

    ami = next(e for e in sim.entidades if e.nombre == "Amiguisimo")
    victimas = [e for e in sim.entidades if e.nombre != "Amiguisimo"]
    assert victimas, "Necesitamos al menos una víctima"
    victima = victimas[0]
    id_victima = victima.id_entidad

    sim.gestor_modo_sombra.activar_modo_poseido(ami, tick=0)
    sim.gestor_modo_sombra.encolar_comando(
        ami, TipoComandoSombra.ATACAR_OBJETIVO, 0,
        objetivo_entidad=id_victima,
    )

    iniciales = len(sim.entidades)
    max_ticks = 120
    eliminada = False

    for _ in range(max_ticks):
        sim._ejecutar_tick_completo()
        if not any(e.id_entidad == id_victima for e in sim.entidades):
            eliminada = True
            break

    assert eliminada, (
        f"Víctima no eliminada tras {max_ticks} ticks. "
        f"Entidades restantes: {[e.nombre for e in sim.entidades]}"
    )
    assert len(sim.entidades) == iniciales - 1, (
        f"Debería haber una entidad menos. Teníamos {iniciales}, hay {len(sim.entidades)}"
    )
    print(f"OK test_perseguir_hasta_matar: víctima eliminada en tick {sim.gestor_ticks.tick_actual}")


def test_atacar_adyacente_mata_en_4_golpes():
    """Con objetivo adyacente y salud 1.0, 4 ataques eliminan."""
    from acciones.accion_atacar import AccionAtacar, DAÑO_POR_ATAQUE
    from nucleo.contexto import ContextoSimulacion

    cfg = Configuracion()
    cfg.modo_combate_activo = True
    from mundo.generador_mundo import GeneradorMundo
    from entidades.fabrica_entidades import FabricaEntidades
    from nucleo.bus_eventos import BusEventos
    from tipos.modelos import Posicion

    gen = GeneradorMundo(cfg)
    mapa = gen.generar_mapa()
    gen.distribuir_comida(mapa, 2)
    gen.distribuir_refugios(mapa, 1)
    fab = FabricaEntidades(cfg)
    entidades = fab.crear_entidades_iniciales(mapa)

    atacante = next(e for e in entidades if e.nombre == "Amiguisimo")
    victima = next(e for e in entidades if e.id_entidad != atacante.id_entidad)
    bus = BusEventos()

    mapa.quitar_entidad(atacante)
    mapa.quitar_entidad(victima)
    atacante.posicion = Posicion(5, 5)
    victima.posicion = Posicion(6, 5)
    mapa.colocar_entidad(atacante, atacante.posicion)
    mapa.colocar_entidad(victima, victima.posicion)

    salud_inicial = victima.estado_interno.salud
    golpes = 0
    while victima.estado_interno.salud > 0 and golpes < 10:
        accion = AccionAtacar(atacante.id_entidad, victima.id_entidad)
        ctx = ContextoSimulacion(
            tick_actual=golpes,
            mapa=mapa,
            bus_eventos=bus,
            entidades=entidades,
        )
        accion.ejecutar(atacante, ctx)
        golpes += 1

    assert victima.estado_interno.salud <= 0
    assert getattr(victima.estado_interno, "activo", True) is False
    assert golpes == 4, f"Con DAÑO={DAÑO_POR_ATAQUE} y salud {salud_inicial} se necesitan 4 golpes, se usaron {golpes}"
    print(f"OK test_atacar_adyacente_mata_en_4_golpes: {golpes} golpes, salud final={victima.estado_interno.salud}")


if __name__ == "__main__":
    print("=" * 60)
    print("TESTS PERSECUCIÓN HASTA MATAR")
    print("=" * 60)
    test_atacar_adyacente_mata_en_4_golpes()
    test_perseguir_hasta_matar()
    print("=" * 60)
    print("TODOS OK")
    print("=" * 60)
