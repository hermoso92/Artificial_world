"""
Script de diagnóstico: ejecuta la simulación con logging detallado a consola.
Ejecuta ~100 ticks y muestra qué acción elige cada entidad.
"""

import sys

# Forzar salida sin buffering para ver logs en tiempo real
sys.stdout.reconfigure(line_buffering=True) if hasattr(sys.stdout, "reconfigure") else None

from configuracion import Configuracion
from nucleo.simulacion import Simulacion


def main() -> None:
    """Ejecuta simulación en modo diagnóstico con logs a consola."""
    config = Configuracion()
    config.debug_entidades_pilladas = True

    sim = Simulacion(config)
    sim.inicializar()
    sim.crear_mundo()
    sim.crear_entidades_iniciales()

    print("=" * 60)
    print("MUNDO_ARTIFICIAL - DIAGNÓSTICO")
    print("=" * 60)
    print(f"Entidades: {len(sim.entidades)}")
    for e in sim.entidades:
        rasgo = getattr(e, "rasgo_principal", None)
        rasgo_str = f" ({rasgo.value})" if rasgo else ""
        print(f"  - {e.nombre} id={e.id_entidad} pos={e.posicion.como_tupla()}{rasgo_str}")
    print("=" * 60)

    import pygame
    reloj = sim.renderizador.obtener_reloj()
    fps = config.fps_objetivo
    ticks_max = 80
    tick_actual = 0

    while tick_actual < ticks_max:
        for evento in pygame.event.get():
            if evento.type == pygame.QUIT:
                print("\n[Usuario cerró ventana]")
                sim.renderizador.cerrar()
                return

        sim.gestor_ticks.avanzar()
        tick_actual = sim.gestor_ticks.tick_actual

        # Log cada 5 ticks para no saturar
        if tick_actual % 5 == 0 or tick_actual <= 3:
            print(f"\n--- Tick {tick_actual} ---")

        for entidad in sim.entidades:
            entidad.actualizar_estado_interno(config)
            percepcion = entidad.percibir_entorno(sim.mapa, config)
            entidad.estado_interno.riesgo_percibido = percepcion.amenaza_local
            entidad.actualizar_memoria(percepcion, tick_actual)
            entidad.actualizar_directivas(tick_actual)

            from nucleo.contexto import ContextoDecision
            contexto = ContextoDecision(
                tick_actual=tick_actual,
                mapa=sim.mapa,
                percepcion_local=percepcion,
                configuracion=config,
                entidades_cercanas=[],
                directivas_activas=entidad.gestor_directivas.obtener_directivas_activas(tick_actual),
                eventos_recientes_globales=[],
            )
            accion_puntuada = entidad.decidir_accion(contexto)

            if accion_puntuada:
                entidad.estado_interno.accion_actual = accion_puntuada.accion.tipo_accion
                acc = accion_puntuada.accion
                tipo = acc.tipo_accion.value if hasattr(acc.tipo_accion, "value") else str(acc.tipo_accion)
                destino = ""
                if hasattr(acc, "destino_x") and hasattr(acc, "destino_y"):
                    destino = f" -> ({acc.destino_x},{acc.destino_y})"
                punt = accion_puntuada.puntuacion_final

                if tick_actual % 5 == 0 or tick_actual <= 3:
                    print(f"  {entidad.nombre}: {tipo}{destino} (utilidad={punt:.2f}) pos={entidad.posicion.como_tupla()} E={entidad.estado_interno.energia:.2f} H={entidad.estado_interno.hambre:.2f}")

                from nucleo.contexto import ContextoSimulacion
                ctx_sim = ContextoSimulacion(
                    tick_actual=tick_actual,
                    mapa=sim.mapa,
                    bus_eventos=sim.bus_eventos,
                    sistema_metricas=sim.sistema_metricas,
                    configuracion=config,
                    entidades=sim.entidades,
                    percepcion_local=percepcion,
                )
                entidad.ejecutar_accion(accion_puntuada, ctx_sim)
            else:
                entidad.estado_interno.accion_actual = None
                num_v = len(percepcion.posiciones_vecinas) if percepcion and percepcion.posiciones_vecinas else 0
                print(f"  {entidad.nombre}: SIN ACCIÓN (vecinos={num_v}) pos={entidad.posicion.como_tupla()}")

        sim.actualizar_mundo()
        sim.despachar_eventos()
        sim.renderizar()
        reloj.tick(fps)

    print("\n" + "=" * 60)
    print("DIAGNÓSTICO COMPLETADO - Posiciones finales:")
    for e in sim.entidades:
        print(f"  {e.nombre}: {e.posicion.como_tupla()}")
    if sim.sistema_logs.debug_entidades_pilladas:
        print("\nDebug entidades pilladas (None):")
        for d in sim.sistema_logs.debug_entidades_pilladas[-10:]:
            print(f"  {d}")
    print("=" * 60)

    sim.renderizador.cerrar()


if __name__ == "__main__":
    main()
