"""
Tests de INTERACCIONES SOCIALES REALES.

Verifica que compartir, robar y seguir ejecutan acciones reales
con transferencia de recursos y cambio de relaciones.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ["SDL_VIDEODRIVER"] = "dummy"
os.environ["SDL_AUDIODRIVER"] = "dummy"

from configuracion import Configuracion
from mundo.generador_mundo import GeneradorMundo
from entidades.fabrica_entidades import FabricaEntidades
from tipos.enums import TipoRecurso, TipoEvento, ResultadoAccion
from tipos.modelos import Posicion, PercepcionLocal
from nucleo.bus_eventos import BusEventos
from nucleo.contexto import ContextoDecision, ContextoSimulacion
from acciones.accion_compartir import AccionCompartir, CANTIDAD_COMPARTIDA
from acciones.accion_robar import AccionRobar, CANTIDAD_ROBADA
from acciones.accion_seguir import AccionSeguir


def setup():
    cfg = Configuracion()
    gen = GeneradorMundo(cfg)
    mapa = gen.generar_mapa()
    gen.distribuir_comida(mapa)
    gen.distribuir_material(mapa)
    gen.distribuir_refugios(mapa)
    fab = FabricaEntidades(cfg)
    entidades = fab.crear_entidades_iniciales(mapa)
    bus = BusEventos()
    sociales = [e for e in entidades if hasattr(e, "relaciones")]
    return sociales, entidades, mapa, cfg, bus


def _ctx_sim(entidades, mapa, bus, tick=1):
    return ContextoSimulacion(
        tick_actual=tick,
        mapa=mapa,
        bus_eventos=bus,
        entidades=entidades,
    )


def _ctx_dec(entidad, entidades, mapa, cfg, tick=1):
    percepcion = entidad.percibir_entorno(mapa, cfg)
    return ContextoDecision(
        tick_actual=tick,
        mapa=mapa,
        percepcion_local=percepcion,
        configuracion=cfg,
        entidades=entidades,
    )


# ──────────────────────────────────────────────
# COMPARTIR
# ──────────────────────────────────────────────

def test_compartir_transfiere_comida():
    sociales, entidades, mapa, cfg, bus = setup()
    donante = sociales[0]
    receptor = sociales[1]

    # Poner al receptor cerca del donante
    receptor.posicion = Posicion(donante.posicion.x + 1, donante.posicion.y)

    # Dar comida al donante
    donante.estado_interno.inventario.agregar(TipoRecurso.COMIDA, 3)
    receptor.estado_interno.hambre = 0.8  # receptor tiene hambre alta
    inv_receptor_antes = receptor.estado_interno.inventario.comida

    accion = AccionCompartir(donante.id_entidad, receptor.id_entidad)
    ctx = _ctx_sim(entidades, mapa, bus, tick=1)
    ctx.percepcion_local = PercepcionLocal(
        recursos_visibles=[],
        refugios_visibles=[],
        entidades_visibles=[receptor],
        posiciones_vecinas=[],
        amenaza_local=0.0,
    )
    resultado = accion.ejecutar(donante, ctx)

    assert resultado == ResultadoAccion.EXITO, f"Resultado: {resultado}"
    assert receptor.estado_interno.inventario.comida == inv_receptor_antes + CANTIDAD_COMPARTIDA, \
        "El receptor no recibio comida"
    assert donante.estado_interno.inventario.comida == 3 - CANTIDAD_COMPARTIDA, \
        "El donante no perdio comida"
    print(f"OK test_compartir_transfiere_comida: donante={donante.estado_interno.inventario.comida} receptor={receptor.estado_interno.inventario.comida}")


def test_compartir_actualiza_relacion_receptor():
    sociales, entidades, mapa, cfg, bus = setup()
    donante = sociales[0]
    receptor = sociales[1]
    receptor.posicion = Posicion(donante.posicion.x + 1, donante.posicion.y)

    donante.estado_interno.inventario.agregar(TipoRecurso.COMIDA, 3)
    receptor.estado_interno.hambre = 0.8
    confianza_antes = receptor.relaciones.obtener_relacion(donante.id_entidad).confianza

    accion = AccionCompartir(donante.id_entidad, receptor.id_entidad)
    ctx = _ctx_sim(entidades, mapa, bus)
    ctx.percepcion_local = PercepcionLocal([], [], [receptor], [], 0.0)
    accion.ejecutar(donante, ctx)

    confianza_despues = receptor.relaciones.obtener_relacion(donante.id_entidad).confianza
    assert confianza_despues > confianza_antes, \
        f"Confianza no aumento: {confianza_antes:.2f} -> {confianza_despues:.2f}"
    print(f"OK test_compartir_actualiza_relacion_receptor: confianza {confianza_antes:.2f}->{confianza_despues:.2f}")


def test_compartir_emite_evento():
    sociales, entidades, mapa, cfg, bus = setup()
    donante, receptor = sociales[0], sociales[1]
    receptor.posicion = Posicion(donante.posicion.x + 1, donante.posicion.y)
    donante.estado_interno.inventario.agregar(TipoRecurso.COMIDA, 2)
    receptor.estado_interno.hambre = 0.8

    accion = AccionCompartir(donante.id_entidad)
    ctx = _ctx_sim(entidades, mapa, bus)
    ctx.percepcion_local = PercepcionLocal([], [], [receptor], [], 0.0)
    accion.ejecutar(donante, ctx)

    eventos = bus.obtener_eventos_pendientes()
    tipos = [e.tipo for e in eventos]
    assert TipoEvento.COMPARTIO in tipos, f"No se emitio COMPARTIO. Eventos: {[t.value for t in tipos]}"
    print(f"OK test_compartir_emite_evento: {[t.value for t in tipos]}")


def test_compartir_falla_sin_comida():
    sociales, entidades, mapa, cfg, bus = setup()
    donante, receptor = sociales[0], sociales[1]
    receptor.posicion = Posicion(donante.posicion.x + 1, donante.posicion.y)
    receptor.estado_interno.hambre = 0.8
    # Sin comida en inventario

    accion = AccionCompartir(donante.id_entidad)
    ctx = _ctx_sim(entidades, mapa, bus)
    ctx.percepcion_local = PercepcionLocal([], [], [receptor], [], 0.0)
    resultado = accion.ejecutar(donante, ctx)
    assert resultado in (ResultadoAccion.FALLO, ResultadoAccion.NO_APLICA)
    print(f"OK test_compartir_falla_sin_comida: resultado={resultado.value}")


# ──────────────────────────────────────────────
# ROBAR
# ──────────────────────────────────────────────

def test_robar_transfiere_comida():
    sociales, entidades, mapa, cfg, bus = setup()
    ladron, victima = sociales[0], sociales[1]
    victima.posicion = Posicion(ladron.posicion.x + 1, ladron.posicion.y)
    victima.estado_interno.inventario.agregar(TipoRecurso.COMIDA, 2)
    inv_antes = ladron.estado_interno.inventario.comida

    accion = AccionRobar(ladron.id_entidad, victima.id_entidad)
    ctx = _ctx_sim(entidades, mapa, bus)
    ctx.percepcion_local = PercepcionLocal([], [], [victima], [], 0.0)
    resultado = accion.ejecutar(ladron, ctx)

    assert resultado == ResultadoAccion.EXITO, f"Resultado: {resultado}"
    assert ladron.estado_interno.inventario.comida == inv_antes + CANTIDAD_ROBADA
    assert victima.estado_interno.inventario.comida == 2 - CANTIDAD_ROBADA
    print(f"OK test_robar_transfiere_comida: ladron={ladron.estado_interno.inventario.comida} victima={victima.estado_interno.inventario.comida}")


def test_robar_aumenta_hostilidad_victima():
    sociales, entidades, mapa, cfg, bus = setup()
    ladron, victima = sociales[0], sociales[1]
    victima.posicion = Posicion(ladron.posicion.x + 1, ladron.posicion.y)
    victima.estado_interno.inventario.agregar(TipoRecurso.COMIDA, 2)
    host_antes = victima.relaciones.obtener_relacion(ladron.id_entidad).hostilidad

    accion = AccionRobar(ladron.id_entidad, victima.id_entidad)
    ctx = _ctx_sim(entidades, mapa, bus)
    ctx.percepcion_local = PercepcionLocal([], [], [victima], [], 0.0)
    accion.ejecutar(ladron, ctx)

    host_despues = victima.relaciones.obtener_relacion(ladron.id_entidad).hostilidad
    assert host_despues > host_antes, \
        f"Hostilidad no aumento: {host_antes:.2f} -> {host_despues:.2f}"
    print(f"OK test_robar_aumenta_hostilidad_victima: {host_antes:.2f}->{host_despues:.2f}")


def test_robar_aumenta_riesgo_victima():
    sociales, entidades, mapa, cfg, bus = setup()
    ladron, victima = sociales[0], sociales[1]
    victima.posicion = Posicion(ladron.posicion.x + 1, ladron.posicion.y)
    victima.estado_interno.inventario.agregar(TipoRecurso.COMIDA, 2)
    riesgo_antes = victima.estado_interno.riesgo_percibido

    accion = AccionRobar(ladron.id_entidad, victima.id_entidad)
    ctx = _ctx_sim(entidades, mapa, bus)
    ctx.percepcion_local = PercepcionLocal([], [], [victima], [], 0.0)
    accion.ejecutar(ladron, ctx)

    assert victima.estado_interno.riesgo_percibido > riesgo_antes
    print(f"OK test_robar_aumenta_riesgo_victima: {riesgo_antes:.2f}->{victima.estado_interno.riesgo_percibido:.2f}")


def test_robar_emite_evento():
    sociales, entidades, mapa, cfg, bus = setup()
    ladron, victima = sociales[0], sociales[1]
    victima.posicion = Posicion(ladron.posicion.x + 1, ladron.posicion.y)
    victima.estado_interno.inventario.agregar(TipoRecurso.COMIDA, 2)

    accion = AccionRobar(ladron.id_entidad, victima.id_entidad)
    ctx = _ctx_sim(entidades, mapa, bus)
    ctx.percepcion_local = PercepcionLocal([], [], [victima], [], 0.0)
    accion.ejecutar(ladron, ctx)

    eventos = bus.obtener_eventos_pendientes()
    tipos = [e.tipo for e in eventos]
    assert TipoEvento.ROBO in tipos, f"No se emitio ROBO. Eventos: {[t.value for t in tipos]}"
    print(f"OK test_robar_emite_evento: {[t.value for t in tipos]}")


def test_robar_falla_sin_victima_con_comida():
    sociales, entidades, mapa, cfg, bus = setup()
    ladron, victima = sociales[0], sociales[1]
    victima.posicion = Posicion(ladron.posicion.x + 1, ladron.posicion.y)
    # Victima sin comida

    accion = AccionRobar(ladron.id_entidad, victima.id_entidad)
    ctx = _ctx_sim(entidades, mapa, bus)
    ctx.percepcion_local = PercepcionLocal([], [], [victima], [], 0.0)
    resultado = accion.ejecutar(ladron, ctx)
    assert resultado in (ResultadoAccion.FALLO, ResultadoAccion.NO_APLICA)
    print(f"OK test_robar_falla_sin_victima_con_comida: resultado={resultado.value}")


# ──────────────────────────────────────────────
# SEGUIR
# ──────────────────────────────────────────────

def test_seguir_emite_evento():
    sociales, entidades, mapa, cfg, bus = setup()
    seguidor, objetivo = sociales[0], sociales[1]
    # Poner el objetivo a distancia 3
    objetivo.posicion = Posicion(seguidor.posicion.x + 3, seguidor.posicion.y)

    accion = AccionSeguir(seguidor.id_entidad, objetivo.id_entidad)
    ctx = _ctx_sim(entidades, mapa, bus)
    ctx.percepcion_local = seguidor.percibir_entorno(mapa, Configuracion())
    resultado = accion.ejecutar(seguidor, ctx)

    assert resultado == ResultadoAccion.EXITO
    eventos = bus.obtener_eventos_pendientes()
    tipos = [e.tipo for e in eventos]
    assert TipoEvento.SIGUIO in tipos, f"No se emitio SIGUIO. Eventos: {[t.value for t in tipos]}"
    print(f"OK test_seguir_emite_evento: {[t.value for t in tipos]}")


def test_seguir_adyacente_mejora_confianza():
    sociales, entidades, mapa, cfg, bus = setup()
    seguidor, objetivo = sociales[0], sociales[1]
    # Poner el objetivo adyacente (dist=1)
    objetivo.posicion = Posicion(seguidor.posicion.x + 1, seguidor.posicion.y)
    conf_antes = seguidor.relaciones.obtener_relacion(objetivo.id_entidad).confianza

    accion = AccionSeguir(seguidor.id_entidad, objetivo.id_entidad)
    ctx = _ctx_sim(entidades, mapa, bus)
    ctx.percepcion_local = PercepcionLocal([], [], [objetivo], [], 0.0)
    accion.ejecutar(seguidor, ctx)

    conf_despues = seguidor.relaciones.obtener_relacion(objetivo.id_entidad).confianza
    assert conf_despues > conf_antes, \
        f"Confianza no aumento: {conf_antes:.2f} -> {conf_despues:.2f}"
    print(f"OK test_seguir_adyacente_mejora_confianza: {conf_antes:.2f}->{conf_despues:.2f}")


# ──────────────────────────────────────────────
# MOTOR DE DECISION CON RELACIONES
# ──────────────────────────────────────────────

def test_relaciones_afectan_motor_decision_compartir():
    """Confianza alta debe aumentar puntuacion de COMPARTIR."""
    from agentes.motor_decision import MotorDecision
    from acciones.accion_compartir import AccionCompartir as AC

    sociales, entidades, mapa, cfg, bus = setup()
    donante, receptor = sociales[0], sociales[1]
    receptor.posicion = Posicion(donante.posicion.x + 1, donante.posicion.y)
    donante.estado_interno.inventario.agregar(TipoRecurso.COMIDA, 3)
    receptor.estado_interno.hambre = 0.7

    # Percepcion con receptor visible
    percepcion_con_receptor = PercepcionLocal([], [], [receptor], [], 0.0)
    ctx = ContextoDecision(
        tick_actual=1,
        mapa=mapa,
        percepcion_local=percepcion_con_receptor,
        configuracion=cfg,
        entidades=entidades,
    )
    motor = MotorDecision()

    # Sin confianza
    accion = AC(donante.id_entidad, receptor.id_entidad)
    puntuadas_sin = motor.puntuar_acciones(donante, ctx, [accion])
    score_sin = puntuadas_sin[0].modificadores.get("relaciones", 0.0)

    # Con confianza alta
    donante.relaciones.ajustar_confianza(receptor.id_entidad, 0.8)

    puntuadas_con = motor.puntuar_acciones(donante, ctx, [accion])
    score_con = puntuadas_con[0].modificadores.get("relaciones", 0.0)

    assert score_con > score_sin, \
        f"Con confianza el modificador relaciones deberia subir: sin={score_sin:.3f} con={score_con:.3f}"
    print(f"OK test_relaciones_afectan_motor_decision_compartir: mod_relaciones sin={score_sin:.3f} con={score_con:.3f}")


def test_relaciones_afectan_motor_decision_huir():
    """Hostilidad alta de entidad cercana debe aumentar puntuacion de HUIR."""
    from agentes.motor_decision import MotorDecision
    from acciones.accion_huir import AccionHuir

    sociales, entidades, mapa, cfg, bus = setup()
    presa, agresor = sociales[0], sociales[1]
    agresor.posicion = Posicion(presa.posicion.x + 1, presa.posicion.y)
    presa.estado_interno.riesgo_percibido = 0.35

    # Percepcion con agresor visible
    percepcion_con_agresor = PercepcionLocal([], [], [agresor], [], 0.35)
    ctx = ContextoDecision(
        tick_actual=1,
        mapa=mapa,
        percepcion_local=percepcion_con_agresor,
        configuracion=cfg,
        entidades=entidades,
    )
    motor = MotorDecision()
    accion_huir = AccionHuir(presa.id_entidad)

    puntuadas_sin = motor.puntuar_acciones(presa, ctx, [accion_huir])
    mod_sin = puntuadas_sin[0].modificadores.get("relaciones", 0.0)

    # Presa tiene alta hostilidad registrada con el agresor
    presa.relaciones.ajustar_hostilidad(agresor.id_entidad, 0.8)
    puntuadas_con = motor.puntuar_acciones(presa, ctx, [accion_huir])
    mod_con = puntuadas_con[0].modificadores.get("relaciones", 0.0)

    assert mod_con > mod_sin, \
        f"Hostilidad deberia aumentar mod relaciones huir: sin={mod_sin:.3f} con={mod_con:.3f}"
    print(f"OK test_relaciones_afectan_motor_decision_huir: mod_relaciones sin={mod_sin:.3f} con={mod_con:.3f}")


# ──────────────────────────────────────────────
# RUNNER
# ──────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 60)
    print("TESTS INTERACCIONES SOCIALES REALES")
    print("=" * 60)

    print("--- Compartir ---")
    test_compartir_transfiere_comida()
    test_compartir_actualiza_relacion_receptor()
    test_compartir_emite_evento()
    test_compartir_falla_sin_comida()

    print("--- Robar ---")
    test_robar_transfiere_comida()
    test_robar_aumenta_hostilidad_victima()
    test_robar_aumenta_riesgo_victima()
    test_robar_emite_evento()
    test_robar_falla_sin_victima_con_comida()

    print("--- Seguir ---")
    test_seguir_emite_evento()
    test_seguir_adyacente_mejora_confianza()

    print("--- Motor de decision con relaciones ---")
    test_relaciones_afectan_motor_decision_compartir()
    test_relaciones_afectan_motor_decision_huir()

    print()
    print("=" * 60)
    print("TODOS LOS TESTS INTERACCIONES SOCIALES: OK")
    print("=" * 60)
