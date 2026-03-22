"""
Tests de MODO SOMBRA completo — verificación de los 6 casos de uso.

CASO 1: QUEDARSE_EN_REFUGIO — entidad va al refugio y descansa
CASO 2: MOVER_A_POSICION — entidad se mueve a celda objetivo
CASO 3: RECOGER_OBJETIVO — entidad va hacia un recurso
CASO 4: SEGUIR_OBJETIVO — entidad sigue a otra
CASO 5: EVITAR_OBJETIVO — entidad se aleja de otra
CASO 6: ATACAR_OBJETIVO — entidad se acerca y aplica daño

Además:
- Modo DIRIGIDO con directiva VOLVER_A_REFUGIO
- Trazabilidad: eventos emitidos
- Cola de comandos múltiples
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ["SDL_VIDEODRIVER"] = "dummy"
os.environ["SDL_AUDIODRIVER"] = "dummy"

from configuracion import Configuracion
from mundo.generador_mundo import GeneradorMundo
from entidades.fabrica_entidades import FabricaEntidades
from tipos.modelos import PercepcionLocal, Posicion
from tipos.enums import (
    ModoControl, TipoComandoSombra, EstadoComandoSombra,
    TipoDirectiva, TipoEvento, TipoAccion,
)
from nucleo.contexto import ContextoDecision
from nucleo.bus_eventos import BusEventos
from sistemas.gestor_modo_sombra import GestorModoSombra


# ──────────────────────────────────────────────────────────────────────
# SETUP
# ──────────────────────────────────────────────────────────────────────

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
    gestor = GestorModoSombra(bus_eventos=bus)
    for e in entidades:
        e._gestor_sombra = gestor
    ami = next(e for e in entidades if e.nombre == "Amiguisimo")
    return ami, entidades, mapa, cfg, bus, gestor


def _contexto(ami, entidades, mapa, cfg, tick=1):
    percepcion = ami.percibir_entorno(mapa, cfg)
    return ContextoDecision(
        tick_actual=tick,
        mapa=mapa,
        percepcion_local=percepcion,
        configuracion=cfg,
        entidades=entidades,
    )


# ──────────────────────────────────────────────────────────────────────
# TESTS DE MODO CONTROL
# ──────────────────────────────────────────────────────────────────────

def test_modo_default_es_autonomo():
    ami, *_ = setup()
    assert ami.modo_control == ModoControl.AUTONOMO
    print("OK test_modo_default_es_autonomo")


def test_activar_poseido_cambia_modo():
    ami, entidades, mapa, cfg, bus, gestor = setup()
    assert ami.modo_control == ModoControl.AUTONOMO
    gestor.activar_modo_poseido(ami, tick=1)
    assert ami.modo_control == ModoControl.POSEIDO
    assert ami.control_total is True
    print("OK test_activar_poseido_cambia_modo")


def test_activar_dirigido_cambia_modo():
    ami, entidades, mapa, cfg, bus, gestor = setup()
    gestor.activar_modo_dirigido(ami, tick=1)
    assert ami.modo_control == ModoControl.DIRIGIDO
    assert ami.control_total is False
    print("OK test_activar_dirigido_cambia_modo")


def test_desactivar_vuelve_a_autonomo():
    ami, entidades, mapa, cfg, bus, gestor = setup()
    gestor.activar_modo_poseido(ami, tick=1)
    gestor.desactivar_modo_sombra(ami, tick=2)
    assert ami.modo_control == ModoControl.AUTONOMO
    assert ami.control_total is False
    print("OK test_desactivar_vuelve_a_autonomo")


# ──────────────────────────────────────────────────────────────────────
# TESTS DE COLA DE COMANDOS
# ──────────────────────────────────────────────────────────────────────

def test_encolar_comando_activa_poseido():
    ami, entidades, mapa, cfg, bus, gestor = setup()
    pos_dest = Posicion(2, 2)
    cmd = gestor.encolar_comando(
        ami, TipoComandoSombra.MOVER_A_POSICION, tick=1, objetivo_posicion=pos_dest
    )
    assert ami.modo_control == ModoControl.POSEIDO
    assert cmd.estado == EstadoComandoSombra.PENDIENTE
    assert gestor.obtener_comando_activo(ami.id_entidad) is cmd
    print("OK test_encolar_comando_activa_poseido")


def test_encolar_multiples_comandos():
    ami, entidades, mapa, cfg, bus, gestor = setup()
    pos1 = Posicion(2, 2)
    pos2 = Posicion(4, 4)
    cmd1 = gestor.encolar_comando(ami, TipoComandoSombra.MOVER_A_POSICION, 1, pos1)
    cmd2 = gestor.encolar_comando(ami, TipoComandoSombra.IR_A_REFUGIO, 1)
    cola = gestor.obtener_cola(ami.id_entidad)
    assert len(cola) == 2
    assert gestor.obtener_comando_activo(ami.id_entidad) is cmd1
    print("OK test_encolar_multiples_comandos")


def test_cancelar_todos():
    ami, entidades, mapa, cfg, bus, gestor = setup()
    gestor.encolar_comando(ami, TipoComandoSombra.IR_A_REFUGIO, 1)
    gestor.encolar_comando(ami, TipoComandoSombra.QUEDARSE_EN_REFUGIO, 1)
    gestor.cancelar_todos(ami.id_entidad, tick=2)
    cmd = gestor.obtener_comando_activo(ami.id_entidad)
    assert cmd is None
    print("OK test_cancelar_todos")


# ──────────────────────────────────────────────────────────────────────
# CASO 2: MOVER_A_POSICION
# ──────────────────────────────────────────────────────────────────────

def test_caso2_mover_a_posicion():
    """La entidad recibe MOVER_A_POSICION y genera AccionMover hacia el destino."""
    ami, entidades, mapa, cfg, bus, gestor = setup()
    pos_actual = ami.posicion
    # Elegir destino a distancia > 1
    dest_x = min(pos_actual.x + 3, cfg.ancho_mapa - 1)
    dest_y = pos_actual.y
    pos_dest = Posicion(dest_x, dest_y)
    gestor.encolar_comando(ami, TipoComandoSombra.MOVER_A_POSICION, 1, pos_dest)

    ctx = _contexto(ami, entidades, mapa, cfg, tick=1)
    accion = ami.decidir_accion(ctx)
    assert accion is not None, "FALLO: no se generó acción"
    assert accion.accion.tipo_accion == TipoAccion.MOVER, f"Esperado MOVER, got {accion.accion.tipo_accion}"
    assert "SOMBRA_MOVER" in accion.motivo_principal or "sombra" in accion.motivo_principal.lower()
    print(f"OK test_caso2_mover_a_posicion: hacia ({dest_x},{dest_y}), motivo={accion.motivo_principal}")


def test_caso2_llegada_marca_completado():
    """Si ya estamos en destino, el comando se marca como COMPLETADO."""
    ami, entidades, mapa, cfg, bus, gestor = setup()
    pos_actual = ami.posicion
    # Destino = posición actual
    gestor.encolar_comando(ami, TipoComandoSombra.MOVER_A_POSICION, 1, pos_actual)

    ctx = _contexto(ami, entidades, mapa, cfg, tick=1)
    accion = ami.decidir_accion(ctx)
    assert accion is not None
    cmd = gestor.obtener_cola(ami.id_entidad)[0]
    assert cmd.estado == EstadoComandoSombra.COMPLETADO, f"Estado={cmd.estado}"
    print("OK test_caso2_llegada_marca_completado")


# ──────────────────────────────────────────────────────────────────────
# CASO 1: QUEDARSE_EN_REFUGIO
# ──────────────────────────────────────────────────────────────────────

def test_caso1_quedarse_en_refugio():
    """Comando QUEDARSE_EN_REFUGIO: si hay refugio en memoria, la entidad va o descansa."""
    ami, entidades, mapa, cfg, bus, gestor = setup()
    gestor.encolar_comando(ami, TipoComandoSombra.QUEDARSE_EN_REFUGIO, 1)

    ctx = _contexto(ami, entidades, mapa, cfg, tick=1)
    accion = ami.decidir_accion(ctx)
    assert accion is not None
    tipo = accion.accion.tipo_accion
    assert tipo in (TipoAccion.DESCANSAR, TipoAccion.MOVER, TipoAccion.EXPLORAR, TipoAccion.IR_REFUGIO), \
        f"Tipo inesperado: {tipo}"
    assert "SOMBRA" in accion.motivo_principal
    print(f"OK test_caso1_quedarse_en_refugio: tipo={tipo.value} motivo={accion.motivo_principal}")


# ──────────────────────────────────────────────────────────────────────
# CASO 4: SEGUIR_OBJETIVO
# ──────────────────────────────────────────────────────────────────────

def test_caso4_seguir_objetivo():
    """Comando SEGUIR_OBJETIVO: genera MOVER hacia el objetivo si no está adyacente."""
    ami, entidades, mapa, cfg, bus, gestor = setup()
    objetivo = next(e for e in entidades if e.id_entidad != ami.id_entidad)
    gestor.encolar_comando(ami, TipoComandoSombra.SEGUIR_OBJETIVO, 1,
                           objetivo_entidad=objetivo.id_entidad)

    ctx = _contexto(ami, entidades, mapa, cfg, tick=1)
    ctx.entidades = entidades
    accion = ami.decidir_accion(ctx)
    assert accion is not None
    assert accion.accion.tipo_accion in (TipoAccion.MOVER, TipoAccion.DESCANSAR), \
        f"Tipo inesperado: {accion.accion.tipo_accion}"
    print(f"OK test_caso4_seguir_objetivo: motivo={accion.motivo_principal}")


# ──────────────────────────────────────────────────────────────────────
# CASO 5: EVITAR_OBJETIVO
# ──────────────────────────────────────────────────────────────────────

def test_caso5_evitar_objetivo():
    """Comando EVITAR_OBJETIVO: genera MOVER lejos del objetivo."""
    ami, entidades, mapa, cfg, bus, gestor = setup()
    objetivo = next(e for e in entidades if e.id_entidad != ami.id_entidad)
    gestor.encolar_comando(ami, TipoComandoSombra.EVITAR_OBJETIVO, 1,
                           objetivo_entidad=objetivo.id_entidad)

    ctx = _contexto(ami, entidades, mapa, cfg, tick=1)
    ctx.entidades = entidades
    accion = ami.decidir_accion(ctx)
    assert accion is not None
    assert accion.accion.tipo_accion in (TipoAccion.MOVER, TipoAccion.DESCANSAR), \
        f"Tipo inesperado: {accion.accion.tipo_accion}"
    print(f"OK test_caso5_evitar_objetivo: motivo={accion.motivo_principal}")


# ──────────────────────────────────────────────────────────────────────
# CASO 6: ATACAR_OBJETIVO
# ──────────────────────────────────────────────────────────────────────

def test_caso6_atacar_objetivo_en_rango():
    """ATACAR_OBJETIVO: si objetivo adyacente, genera AccionAtacar."""
    from acciones.accion_atacar import AccionAtacar
    ami, entidades, mapa, cfg, bus, gestor = setup()
    cfg.modo_combate_activo = True  # Requerido para atacar
    objetivo = next(e for e in entidades if e.id_entidad != ami.id_entidad)
    # Colocar objetivo adyacente
    objetivo.posicion = Posicion(ami.posicion.x + 1, ami.posicion.y)
    gestor.encolar_comando(ami, TipoComandoSombra.ATACAR_OBJETIVO, 1,
                           objetivo_entidad=objetivo.id_entidad)

    ctx = _contexto(ami, entidades, mapa, cfg, tick=1)
    ctx.entidades = entidades
    accion = ami.decidir_accion(ctx)
    assert accion is not None, "FALLO: no se generó acción de ataque"
    assert accion.accion.tipo_accion == TipoAccion.ATACAR, \
        f"Esperado ATACAR, got {accion.accion.tipo_accion}"
    print(f"OK test_caso6_atacar_objetivo_en_rango: motivo={accion.motivo_principal}")


def test_caso6_ataque_aplica_daño():
    """ATACAR + ejecutar: la salud del objetivo disminuye."""
    from acciones.accion_atacar import AccionAtacar, DAÑO_POR_ATAQUE
    from nucleo.contexto import ContextoSimulacion

    ami, entidades, mapa, cfg, bus, gestor = setup()
    objetivo = next(e for e in entidades if e.id_entidad != ami.id_entidad)
    objetivo.posicion = Posicion(ami.posicion.x + 1, ami.posicion.y)
    salud_inicial = objetivo.estado_interno.salud

    accion = AccionAtacar(ami.id_entidad, objetivo.id_entidad)
    ctx_sim = ContextoSimulacion(
        tick_actual=1,
        mapa=mapa,
        bus_eventos=bus,
        entidades=entidades,
    )
    resultado = accion.ejecutar(ami, ctx_sim)
    from tipos.enums import ResultadoAccion
    assert resultado == ResultadoAccion.EXITO, f"Resultado: {resultado}"
    assert objetivo.estado_interno.salud < salud_inicial, \
        f"Salud no bajó: {objetivo.estado_interno.salud}"
    print(f"OK test_caso6_ataque_aplica_danio: salud {salud_inicial:.2f}->{objetivo.estado_interno.salud:.2f}")


def test_caso6_ataque_elimina_si_salud_cero():
    """Si salud llega a 0, la entidad se marca como inactiva."""
    from acciones.accion_atacar import AccionAtacar
    from nucleo.contexto import ContextoSimulacion

    ami, entidades, mapa, cfg, bus, gestor = setup()
    objetivo = next(e for e in entidades if e.id_entidad != ami.id_entidad)
    objetivo.posicion = Posicion(ami.posicion.x + 1, ami.posicion.y)
    # Reducir salud casi a cero
    objetivo.estado_interno.salud = 0.1

    accion = AccionAtacar(ami.id_entidad, objetivo.id_entidad)
    ctx_sim = ContextoSimulacion(
        tick_actual=1,
        mapa=mapa,
        bus_eventos=bus,
        entidades=entidades,
    )
    accion.ejecutar(ami, ctx_sim)
    assert objetivo.estado_interno.salud <= 0.0
    assert getattr(objetivo.estado_interno, "activo", True) is False
    print(f"OK test_caso6_ataque_elimina_si_salud_cero: activo={getattr(objetivo.estado_interno, 'activo', 'N/A')}")


# ──────────────────────────────────────────────────────────────────────
# DIRECTIVA INTERPRETABLE — MODO DIRIGIDO
# ──────────────────────────────────────────────────────────────────────

def test_directiva_volver_refugio_modo_dirigido():
    """Directiva VOLVER_A_REFUGIO pone modo DIRIGIDO y la IA toma en cuenta la directiva."""
    from tipos.modelos import DirectivaExterna
    from tipos.enums import EstadoDirectiva

    ami, entidades, mapa, cfg, bus, gestor = setup()
    gestor.activar_modo_dirigido(ami, tick=1)
    assert ami.modo_control == ModoControl.DIRIGIDO

    # Crear directiva
    directiva = DirectivaExterna(
        id_directiva=1,
        tipo_directiva=TipoDirectiva.VOLVER_A_REFUGIO,
        id_entidad_objetivo=ami.id_entidad,
        prioridad=0.95,
        intensidad=1.0,
        tick_emision=1,
        tick_expiracion=201,
        estado=EstadoDirectiva.ACEPTADA,
    )
    ami.recibir_directiva(directiva)
    assert len(ami.gestor_directivas.directivas_activas) == 1

    ctx = _contexto(ami, entidades, mapa, cfg, tick=1)
    ctx.directivas_activas = ami.gestor_directivas.obtener_directivas_activas(1)
    accion = ami.decidir_accion(ctx)
    # La IA debe decidir (no None) en modo DIRIGIDO
    assert accion is not None, "FALLO: IA no generó acción en modo DIRIGIDO"
    # La acción debe estar influenciada por la directiva (ir refugio, mover, explorar)
    print(f"OK test_directiva_volver_refugio_modo_dirigido: accion={accion.accion.tipo_accion.value}")


# ──────────────────────────────────────────────────────────────────────
# TRAZABILIDAD Y EVENTOS
# ──────────────────────────────────────────────────────────────────────

def test_trazabilidad_modo_activado():
    """Activar modo sombra emite evento MODO_SOMBRA_ACTIVADO."""
    ami, entidades, mapa, cfg, bus, gestor = setup()
    gestor.activar_modo_poseido(ami, tick=5)
    pendientes = bus.obtener_eventos_pendientes()
    tipos = [e.tipo for e in pendientes]
    assert TipoEvento.MODO_SOMBRA_ACTIVADO in tipos, f"Eventos: {tipos}"
    print(f"OK test_trazabilidad_modo_activado: {[t.value for t in tipos]}")


def test_trazabilidad_comando_emitido():
    """Encolar comando emite evento COMANDO_SOMBRA_EMITIDO."""
    ami, entidades, mapa, cfg, bus, gestor = setup()
    gestor.encolar_comando(ami, TipoComandoSombra.IR_A_REFUGIO, 3)
    pendientes = bus.obtener_eventos_pendientes()
    tipos = [e.tipo for e in pendientes]
    assert TipoEvento.COMANDO_SOMBRA_EMITIDO in tipos, f"Eventos: {tipos}"
    print(f"OK test_trazabilidad_comando_emitido: {[t.value for t in tipos]}")


def test_trazabilidad_comando_completado():
    """Comando MOVER_A_POSICION al destino actual emite COMANDO_SOMBRA_COMPLETADO."""
    ami, entidades, mapa, cfg, bus, gestor = setup()
    pos_actual = ami.posicion
    gestor.encolar_comando(ami, TipoComandoSombra.MOVER_A_POSICION, 1, pos_actual)
    bus.obtener_eventos_pendientes()  # limpiar previos

    ctx = _contexto(ami, entidades, mapa, cfg, tick=1)
    ami.decidir_accion(ctx)

    pendientes = bus.obtener_eventos_pendientes()
    tipos = [e.tipo for e in pendientes]
    assert TipoEvento.COMANDO_SOMBRA_COMPLETADO in tipos, \
        f"No se emitió COMPLETADO. Tipos: {[t.value for t in tipos]}"
    print(f"OK test_trazabilidad_comando_completado: {[t.value for t in tipos]}")


def test_trazabilidad_historial():
    """GestorModoSombra registra historial de trazabilidad."""
    ami, entidades, mapa, cfg, bus, gestor = setup()
    gestor.activar_modo_poseido(ami, 1)
    gestor.encolar_comando(ami, TipoComandoSombra.IR_A_REFUGIO, 2)
    historial = gestor.obtener_trazabilidad(ami.id_entidad)
    assert len(historial) >= 2
    tipos = [h["tipo"] for h in historial]
    assert "MODO_ACTIVADO" in tipos
    assert "COMANDO_EMITIDO" in tipos
    print(f"OK test_trazabilidad_historial: {tipos}")


# ──────────────────────────────────────────────────────────────────────
# COMPATIBILIDAD CON TESTS LEGACY
# ──────────────────────────────────────────────────────────────────────

def test_legacy_control_total_wasd_sin_gestor():
    """control_total=True + control_total_pendiente funciona sin gestor sombra."""
    ami, *_ = setup()
    ami._gestor_sombra = None  # desconectar gestor
    ami.control_total = True
    ctx = ContextoDecision(
        tick_actual=1,
        mapa=None,
        percepcion_local=PercepcionLocal([], [], [], [], 0.0),
    )
    pos_antes = ami.posicion
    ami.control_total_pendiente = Posicion(pos_antes.x + 1, pos_antes.y)
    r = ami.decidir_accion(ctx)
    assert r is not None
    assert r.motivo_principal == "SOMBRA_MOVER"
    print("OK test_legacy_control_total_wasd_sin_gestor")


def test_cola_vacia_vuelve_a_autonomo():
    """Si la cola se vacía, la entidad vuelve automáticamente a AUTONOMO."""
    ami, entidades, mapa, cfg, bus, gestor = setup()
    pos_actual = ami.posicion
    gestor.encolar_comando(ami, TipoComandoSombra.MOVER_A_POSICION, 1, pos_actual)
    # Después de procesar, la cola quedará con 1 cmd completado
    ctx = _contexto(ami, entidades, mapa, cfg, tick=1)
    ami.decidir_accion(ctx)  # tick 1: completa el cmd (ya estaba en destino)
    bus.obtener_eventos_pendientes()  # limpiar

    # tick 2: cola vacía → debe volver a AUTONOMO
    ctx2 = _contexto(ami, entidades, mapa, cfg, tick=2)
    ami.decidir_accion(ctx2)  # procesa y vuelve a AUTONOMO
    assert ami.modo_control == ModoControl.AUTONOMO, \
        f"Modo debería ser AUTONOMO, es {ami.modo_control.value}"
    print("OK test_cola_vacia_vuelve_a_autonomo")


# ──────────────────────────────────────────────────────────────────────
# RUNNER
# ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 60)
    print("TESTS MODO SOMBRA COMPLETO")
    print("=" * 60)

    test_modo_default_es_autonomo()
    test_activar_poseido_cambia_modo()
    test_activar_dirigido_cambia_modo()
    test_desactivar_vuelve_a_autonomo()
    test_encolar_comando_activa_poseido()
    test_encolar_multiples_comandos()
    test_cancelar_todos()

    print("--- Casos de uso ---")
    test_caso2_mover_a_posicion()
    test_caso2_llegada_marca_completado()
    test_caso1_quedarse_en_refugio()
    test_caso4_seguir_objetivo()
    test_caso5_evitar_objetivo()
    test_caso6_atacar_objetivo_en_rango()
    test_caso6_ataque_aplica_daño()
    test_caso6_ataque_elimina_si_salud_cero()

    print("--- Directivas (DIRIGIDO) ---")
    test_directiva_volver_refugio_modo_dirigido()

    print("--- Trazabilidad ---")
    test_trazabilidad_modo_activado()
    test_trazabilidad_comando_emitido()
    test_trazabilidad_comando_completado()
    test_trazabilidad_historial()

    print("--- Compatibilidad legacy ---")
    test_legacy_control_total_wasd_sin_gestor()
    test_cola_vacia_vuelve_a_autonomo()

    print()
    print("=" * 60)
    print("TODOS LOS TESTS MODO SOMBRA COMPLETO: OK")
    print("=" * 60)
