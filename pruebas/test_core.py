"""
Tests del núcleo de MUNDO_ARTIFICIAL.
Ejecutar: python -m pytest pruebas/test_core.py -v
O sin pytest: python pruebas/test_core.py
"""

import os
import sys

# Headless para Pygame (antes de importar pygame)
os.environ.setdefault("SDL_VIDEODRIVER", "dummy")
os.environ.setdefault("SDL_AUDIODRIVER", "dummy")

# Añadir raíz del proyecto al path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def test_configuracion():
    """Configuración carga correctamente."""
    from configuracion import Configuracion

    c = Configuracion()
    assert c.ancho_mapa >= 2
    assert c.alto_mapa >= 2
    assert c.cantidad_entidades_sociales >= 1
    assert c.ticks_entre_regeneracion > 0


def test_tipos_enums():
    """Enums definidos correctamente."""
    from tipos.enums import TipoAccion, TipoEntidad, TipoEvento, TipoRecurso

    assert TipoAccion.MOVER is not None
    assert TipoEntidad.SOCIAL is not None
    assert TipoEvento.COMIO is not None
    assert TipoRecurso.COMIDA is not None


def test_posicion():
    """Posicion es hashable y tiene distancia."""
    from tipos.modelos import Posicion

    p1 = Posicion(0, 0)
    p2 = Posicion(3, 4)
    assert p1.distancia_manhattan(p2) == 7
    assert hash(p1) is not None
    s = {p1, p2}
    assert len(s) == 2


def test_simulacion_init_sin_render():
    """Simulación inicializa sin ventana (headless)."""
    from configuracion import Configuracion
    from nucleo.simulacion import Simulacion

    c = Configuracion()
    s = Simulacion(c)
    s.inicializar()
    s.crear_mundo()
    s.crear_entidades_iniciales()

    assert s.mapa is not None
    assert s.mapa.ancho >= 2
    assert s.mapa.alto >= 2
    assert len(s.entidades) >= 1
    assert len(s.entidades) <= c.cantidad_entidades_sociales + (1 if c.incluir_gato else 0)


def test_entidades_posiciones_distintas():
    """Entidades no comparten celda inicial."""
    from configuracion import Configuracion
    from nucleo.simulacion import Simulacion

    c = Configuracion()
    s = Simulacion(c)
    s.inicializar()
    s.crear_mundo()
    s.crear_entidades_iniciales()

    posiciones = [e.posicion for e in s.entidades]
    assert len(posiciones) == len(set(posiciones)), "Entidades no deben compartir celda"


def test_motor_decide_accion():
    """Motor genera acción viable para entidad."""
    from configuracion import Configuracion
    from nucleo.simulacion import Simulacion
    from nucleo.contexto import ContextoDecision

    c = Configuracion()
    s = Simulacion(c)
    s.inicializar()
    s.crear_mundo()
    s.crear_entidades_iniciales()

    ent = s.entidades[0]
    percepcion = ent.percibir_entorno(s.mapa, c)
    ent.estado_interno.riesgo_percibido = percepcion.amenaza_local

    ctx = ContextoDecision(
        tick_actual=0,
        mapa=s.mapa,
        percepcion_local=percepcion,
        configuracion=c,
        directivas_activas=[],
    )
    accion_puntuada = ent.decidir_accion(ctx)

    assert accion_puntuada is not None, "Motor debe devolver al menos una acción"
    assert accion_puntuada.accion is not None
    assert accion_puntuada.accion.es_viable(ent, ctx), "Acción elegida debe ser viable"


def test_pesos_hambre_explorar_penaliza():
    """Hambre alta penaliza explorar/mover."""
    from agentes.pesos_utilidad import calcular_modificador_hambre
    from agentes.estado_interno import EstadoInterno
    from tipos.enums import TipoRecurso

    class EntidadMock:
        estado_interno = EstadoInterno(hambre=0.9, energia=0.5)

    mod = calcular_modificador_hambre(EntidadMock(), "explorar")
    assert mod < 0, "Hambre alta debe penalizar explorar"


def test_pesos_hambre_comer_bonifica():
    """Hambre alta bonifica comer."""
    from agentes.pesos_utilidad import calcular_modificador_hambre
    from agentes.estado_interno import EstadoInterno

    class EntidadMock:
        estado_interno = EstadoInterno(hambre=0.9, energia=0.5)

    mod = calcular_modificador_hambre(EntidadMock(), "comer")
    assert mod > 0, "Hambre alta debe bonificar comer"


def test_descansar_siempre_viable():
    """Descansar es viable incluso con energía llena."""
    from acciones.accion_descansar import AccionDescansar
    from agentes.estado_interno import EstadoInterno

    class EntidadMock:
        id_entidad = 1
        estado_interno = EstadoInterno(energia=1.0, hambre=0.0)

    acc = AccionDescansar(1)
    assert acc.es_viable(EntidadMock(), None) is True


def test_sistema_metricas_registra():
    """SistemaMetricas registra eventos."""
    from sistemas.sistema_metricas import SistemaMetricas
    from tipos.modelos import EventoSistema
    from tipos.enums import TipoEvento

    s = SistemaMetricas()
    s.registrar_evento(
        EventoSistema(0, TipoEvento.COMIO, 1, None, None, "test", {})
    )
    res = s.obtener_resumen()
    assert "comio" in res
    assert res["comio"] >= 1


def test_directiva_aumenta_score():
    """Una directiva EXPLORAR_ZONA sube el score de explorar."""
    from configuracion import Configuracion
    from nucleo.simulacion import Simulacion
    from nucleo.contexto import ContextoDecision
    from tipos.enums import TipoDirectiva, EstadoDirectiva
    from tipos.modelos import DirectivaExterna
    from agentes.motor_decision import MotorDecision

    c = Configuracion()
    s = Simulacion(c)
    s.inicializar()
    s.crear_mundo()
    s.crear_entidades_iniciales()
    ent = s.entidades[0]
    percepcion = ent.percibir_entorno(s.mapa, c)

    motor = MotorDecision()
    ctx_base = ContextoDecision(tick_actual=0, mapa=s.mapa, percepcion_local=percepcion,
                                configuracion=c, entidades_cercanas=[], directivas_activas=[],
                                eventos_recientes_globales=[])
    directiva = DirectivaExterna(id_directiva=1, tipo_directiva=TipoDirectiva.EXPLORAR_ZONA,
                                  id_entidad_objetivo=ent.id_entidad, prioridad=0.9, intensidad=0.9,
                                  tick_emision=0, tick_expiracion=100, estado=EstadoDirectiva.ACEPTADA)
    ctx_dir = ContextoDecision(tick_actual=0, mapa=s.mapa, percepcion_local=percepcion,
                               configuracion=c, entidades_cercanas=[], directivas_activas=[directiva],
                               eventos_recientes_globales=[])

    from tipos.enums import TipoAccion
    acciones = motor.generar_acciones_candidatas(ent, ctx_base)
    puntuadas_base = motor.puntuar_acciones(ent, ctx_base, acciones)
    puntuadas_dir = motor.puntuar_acciones(ent, ctx_dir, acciones)

    score_base = next((p.puntuacion_final for p in puntuadas_base
                       if p.accion.tipo_accion == TipoAccion.EXPLORAR), None)
    score_dir = next((p.puntuacion_final for p in puntuadas_dir
                      if p.accion.tipo_accion == TipoAccion.EXPLORAR), None)

    assert score_base is not None, "Explorar debe ser candidata"
    assert score_dir is not None, "Explorar debe ser candidata con directiva"
    assert score_dir > score_base, f"Directiva debe subir score explorar: {score_base:.3f} -> {score_dir:.3f}"


def test_directiva_supervivencia_prioriza_comer():
    """PRIORIZAR_SUPERVIVENCIA sube el score de comer cuando hay comida."""
    from configuracion import Configuracion
    from nucleo.simulacion import Simulacion
    from nucleo.contexto import ContextoDecision
    from tipos.enums import TipoDirectiva, EstadoDirectiva, TipoAccion
    from tipos.modelos import DirectivaExterna
    from agentes.motor_decision import MotorDecision

    c = Configuracion()
    s = Simulacion(c)
    s.inicializar()
    s.crear_mundo()
    s.crear_entidades_iniciales()
    ent = s.entidades[0]
    ent.estado_interno.hambre = 0.5
    # Darle comida para poder comer
    ent.estado_interno.inventario.comida = 2
    percepcion = ent.percibir_entorno(s.mapa, c)
    motor = MotorDecision()

    directiva = DirectivaExterna(id_directiva=2, tipo_directiva=TipoDirectiva.PRIORIZAR_SUPERVIVENCIA,
                                  id_entidad_objetivo=ent.id_entidad, prioridad=0.9, intensidad=0.9,
                                  tick_emision=0, tick_expiracion=100, estado=EstadoDirectiva.ACEPTADA)
    ctx = ContextoDecision(tick_actual=0, mapa=s.mapa, percepcion_local=percepcion,
                           configuracion=c, entidades_cercanas=[], directivas_activas=[directiva],
                           eventos_recientes_globales=[])
    acciones = motor.generar_acciones_candidatas(ent, ctx)
    puntuadas = motor.puntuar_acciones(ent, ctx, acciones)

    scores = {p.accion.tipo_accion: p.modificadores.get("directivas", 0) for p in puntuadas}
    comer_mod = scores.get(TipoAccion.COMER, 0)
    assert comer_mod > 0.5, f"PRIORIZAR_SUPERVIVENCIA debe dar mod alto a comer, got {comer_mod:.3f}"


def test_historial_decisiones_se_acumula():
    """Las decisiones se guardan en historial_decisiones de la entidad."""
    from configuracion import Configuracion
    from nucleo.simulacion import Simulacion
    from nucleo.contexto import ContextoDecision

    c = Configuracion()
    s = Simulacion(c)
    s.inicializar()
    s.crear_mundo()
    s.crear_entidades_iniciales()
    ent = s.entidades[0]

    assert hasattr(ent, "historial_decisiones"), "EntidadBase debe tener historial_decisiones"
    for i in range(5):
        percepcion = ent.percibir_entorno(s.mapa, c)
        ctx = ContextoDecision(tick_actual=i, mapa=s.mapa, percepcion_local=percepcion,
                               configuracion=c, entidades_cercanas=[], directivas_activas=[],
                               eventos_recientes_globales=[])
        ent.decidir_accion(ctx)

    assert len(ent.historial_decisiones) == 5, f"Debe haber 5 entradas, hay {len(ent.historial_decisiones)}"
    for entrada in ent.historial_decisiones:
        assert "tick" in entrada
        assert "accion" in entrada
        assert "score" in entrada
        assert "motivo" in entrada


def test_velocidades_lentas_disponibles():
    """Las velocidades lentas 0.05x y 0.1x están disponibles."""
    from interfaz.estado_panel import EstadoPanel

    ep = EstadoPanel()
    assert 0.05 in ep.velocidades_disponibles, "0.05x debe estar disponible"
    assert 0.1 in ep.velocidades_disponibles, "0.1x debe estar disponible"


def test_paso_manual_tick():
    """El flag paso_manual existe y es False por defecto."""
    from interfaz.estado_panel import EstadoPanel

    ep = EstadoPanel()
    assert hasattr(ep, "paso_manual"), "EstadoPanel debe tener paso_manual"
    assert ep.paso_manual is False, "paso_manual debe ser False por defecto"


def test_log_decision_registra():
    """SistemaLogs.registrar_decision escribe al log cuando esta activo."""
    from sistemas.sistema_logs import SistemaLogs

    logs = SistemaLogs()
    logs.log_decisiones_activo = True
    # No debe lanzar excepción
    logs.registrar_decision("Ana", 10, "explorar", 0.42, "directivas:+0.72",
                            energia=0.8, hambre=0.3, num_directivas=1)


def test_variedad_acciones_minima():
    """En 30 ticks con estado variado, una entidad debe hacer al menos 2 acciones distintas."""
    from configuracion import Configuracion
    from nucleo.simulacion import Simulacion
    from nucleo.contexto import ContextoDecision

    c = Configuracion()
    s = Simulacion(c)
    s.inicializar()
    s.crear_mundo()
    s.crear_entidades_iniciales()
    ent = s.entidades[0]

    acciones_vistas = set()
    for i in range(30):
        ent.actualizar_estado_interno(c)  # acumula hambre real cada tick
        percepcion = ent.percibir_entorno(s.mapa, c)
        ctx = ContextoDecision(tick_actual=i, mapa=s.mapa, percepcion_local=percepcion,
                               configuracion=c, entidades_cercanas=[], directivas_activas=[],
                               eventos_recientes_globales=[])
        ap = ent.decidir_accion(ctx)
        if ap:
            acciones_vistas.add(ap.accion.tipo_accion.value)

    assert len(acciones_vistas) >= 2, (
        f"En 30 ticks debe haber al menos 2 acciones distintas, solo hubo: {acciones_vistas}"
    )


def test_hambre_penaliza_descansar():
    """Hambre alta con energia suficiente penaliza descansar."""
    from agentes.pesos_utilidad import calcular_modificador_hambre
    from agentes.estado_interno import EstadoInterno

    class EntidadMock:
        estado_interno = EstadoInterno(hambre=0.9, energia=0.7)

    mod = calcular_modificador_hambre(EntidadMock(), "descansar")
    assert mod < 0, f"Hambre alta + energia suficiente debe penalizar descansar, mod={mod}"


def test_watchdog_detecta_trampa():
    """Watchdog detecta entidad que no se mueve."""
    from sistemas.sistema_watchdog import SistemaWatchdog
    from agentes.estado_interno import EstadoInterno
    from tipos.modelos import Posicion
    from tipos.enums import TipoAccion

    class EntMock:
        id_entidad = 1
        nombre = "TestEnt"
        estado_interno = EstadoInterno()
        gestor_directivas = type("G", (), {"directivas_activas": []})()

    ent = EntMock()
    ent.posicion = Posicion(5, 5)
    ent.estado_interno.accion_actual = TipoAccion.DESCANSAR

    wd = SistemaWatchdog()
    for i in range(20):
        wd.registrar_tick(i, [ent])

    codigos = [a.codigo for a in wd.alertas]
    assert "TRAMPA_POSICION" in codigos, f"Debería detectar TRAMPA_POSICION, alertas: {codigos}"


def test_watchdog_detecta_bucle_accion():
    """Watchdog detecta misma acción repetida."""
    from sistemas.sistema_watchdog import SistemaWatchdog
    from agentes.estado_interno import EstadoInterno
    from tipos.modelos import Posicion
    from tipos.enums import TipoAccion

    class EntMock:
        id_entidad = 2
        nombre = "TestEnt2"
        estado_interno = EstadoInterno()
        gestor_directivas = type("G", (), {"directivas_activas": []})()

    ent = EntMock()
    ent.posicion = Posicion(1, 1)
    ent.estado_interno.accion_actual = TipoAccion.DESCANSAR
    ent.estado_interno.energia = 0.9   # No tiene motivo para descansar

    wd = SistemaWatchdog()
    for i in range(15):
        ent.posicion = Posicion(i % 3, i % 2)  # cambia posición
        wd.registrar_tick(i, [ent])

    codigos = [a.codigo for a in wd.alertas]
    assert "BUCLE_ACCION" in codigos, f"Debería detectar BUCLE_ACCION, alertas: {codigos}"


def test_watchdog_sin_variedad_global():
    """Watchdog detecta falta de variedad en todo el sistema."""
    from sistemas.sistema_watchdog import SistemaWatchdog
    from agentes.estado_interno import EstadoInterno
    from tipos.modelos import Posicion
    from tipos.enums import TipoAccion

    entidades = []
    for i in range(4):
        class E:
            pass
        e = E()
        e.id_entidad = 10 + i
        e.nombre = f"Ent{i}"
        e.posicion = Posicion(i, 0)
        e.estado_interno = EstadoInterno()
        e.estado_interno.accion_actual = TipoAccion.DESCANSAR
        e.gestor_directivas = type("G", (), {"directivas_activas": []})()
        entidades.append(e)

    wd = SistemaWatchdog()
    for tick in range(15):
        for e in entidades:
            e.posicion = Posicion(tick % 5, e.id_entidad % 3)
        wd.registrar_tick(tick, entidades)

    codigos = [a.codigo for a in wd.alertas]
    assert "SIN_VARIEDAD_GLOBAL" in codigos or "BUCLE_ACCION" in codigos, \
        f"Debería detectar falta de variedad, alertas: {codigos}"


def test_watchdog_sin_alertas_variedad_normal():
    """Watchdog NO dispara alertas cuando hay variedad normal."""
    from sistemas.sistema_watchdog import SistemaWatchdog
    from agentes.estado_interno import EstadoInterno
    from tipos.modelos import Posicion
    from tipos.enums import TipoAccion

    class EntMock:
        id_entidad = 99
        nombre = "Normal"
        estado_interno = EstadoInterno()
        gestor_directivas = type("G", (), {"directivas_activas": []})()

    ent = EntMock()
    acciones_ciclo = [TipoAccion.EXPLORAR, TipoAccion.MOVER, TipoAccion.DESCANSAR,
                      TipoAccion.RECOGER_COMIDA, TipoAccion.EXPLORAR, TipoAccion.MOVER]
    wd = SistemaWatchdog()
    for i in range(18):
        ent.posicion = Posicion(i, i % 5)
        ent.estado_interno.accion_actual = acciones_ciclo[i % len(acciones_ciclo)]
        wd.registrar_tick(i, [ent])

    trampa = [a for a in wd.alertas if a.codigo == "TRAMPA_POSICION"]
    assert len(trampa) == 0, "No debe detectar trampa si la entidad se mueve"


def run_tests():
    """Ejecuta todos los tests manualmente."""
    tests = [
        test_configuracion,
        test_tipos_enums,
        test_posicion,
        test_simulacion_init_sin_render,
        test_entidades_posiciones_distintas,
        test_motor_decide_accion,
        test_pesos_hambre_explorar_penaliza,
        test_pesos_hambre_comer_bonifica,
        test_descansar_siempre_viable,
        test_sistema_metricas_registra,
        # Tests avanzados
        test_directiva_aumenta_score,
        test_directiva_supervivencia_prioriza_comer,
        test_historial_decisiones_se_acumula,
        test_velocidades_lentas_disponibles,
        test_paso_manual_tick,
        test_log_decision_registra,
        test_variedad_acciones_minima,
        test_hambre_penaliza_descansar,
        test_watchdog_detecta_trampa,
        test_watchdog_detecta_bucle_accion,
        test_watchdog_sin_variedad_global,
        test_watchdog_sin_alertas_variedad_normal,
    ]
    ok = 0
    for t in tests:
        try:
            t()
            ok += 1
            print(f"  OK {t.__name__}")
        except Exception as e:
            print(f"  FAIL {t.__name__}: {e}")
    print(f"\n{ok}/{len(tests)} tests pasaron")
    return ok == len(tests)


if __name__ == "__main__":
    if run_tests():
        sys.exit(0)
    sys.exit(1)
