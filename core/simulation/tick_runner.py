"""
Ejecución pura de un tick de simulación.

No depende de interfaz (pygame, paneles). Recibe el estado de simulación
y orquesta: ticks, entidades, mundo, eventos, persistencia.
"""


def ejecutar_tick(sim) -> None:
    """Avanza el mundo exactamente 1 tick: todas las entidades actúan.

    Args:
        sim: Instancia de Simulacion con mapa, entidades, gestor_ticks,
             bus_eventos, sistema_watchdog, sistema_persistencia, etc.
    """
    sim.gestor_ticks.avanzar()
    for entidad in sim.entidades:
        sim.actualizar_entidad(entidad)
    # Eliminar entidades inactivas (salud<=0 por ataque)
    inactivas = [
        e for e in sim.entidades
        if not getattr(e.estado_interno, "activo", True)
    ]
    for e in inactivas:
        if sim.mapa:
            sim.mapa.quitar_entidad(e)
    sim.entidades[:] = [
        e for e in sim.entidades
        if getattr(e.estado_interno, "activo", True)
    ]
    if sim.sistema_watchdog:
        sim.sistema_watchdog.registrar_tick(
            sim.gestor_ticks.tick_actual, sim.entidades
        )
    sim.actualizar_mundo()
    sim.despachar_eventos()
    sim._escribir_debug_si_activo()
    if sim.sistema_persistencia:
        if sim.sistema_persistencia.auto_guardar_si_procede(sim):
            _set_feedback(sim, "Auto-guardado", 15)


def _set_feedback(sim, mensaje: str, ticks: int) -> None:
    """Escribe feedback en el panel si existe (evita importar interfaz)."""
    panel = getattr(sim, "estado_panel", None)
    if panel is not None:
        panel.mensaje_feedback = mensaje
        panel.mensaje_feedback_tick = ticks
