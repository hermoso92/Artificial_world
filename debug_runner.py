"""
Ejecuta la simulación en modo debug: escribe estado a archivo para inspección.
Permite verificar backend, frontend y estado en tiempo real sin ventana gráfica.

Uso: python debug_runner.py [ticks]
Por defecto: 50 ticks. Salida en debug_output.json y debug_log.txt
"""

import json
import os
import sys

# Headless para Pygame
os.environ.setdefault("SDL_VIDEODRIVER", "dummy")
os.environ.setdefault("SDL_AUDIODRIVER", "dummy")

# Raíz del proyecto
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

DEBUG_OUTPUT = "debug_output.json"
DEBUG_LOG = "debug_log.txt"


def estado_entidad(ent):
    """Serializa estado de una entidad."""
    return {
        "id": ent.id_entidad,
        "nombre": ent.nombre,
        "tipo": getattr(ent.tipo_entidad, "value", str(ent.tipo_entidad)),
        "posicion": ent.posicion.como_tupla(),
        "hambre": round(ent.estado_interno.hambre, 3),
        "energia": round(ent.estado_interno.energia, 3),
        "accion": ent.estado_interno.accion_actual.value if ent.estado_interno.accion_actual else None,
        "inventario": ent.estado_interno.inventario.como_dict(),
    }


def estado_simulacion(sim):
    """Extrae estado completo de la simulación."""
    return {
        "tick": sim.gestor_ticks.tick_actual,
        "entidades": [estado_entidad(e) for e in sim.entidades],
        "metricas": sim.sistema_metricas.obtener_resumen() if sim.sistema_metricas else {},
        "eventos_recientes": [
            {
                "tipo": e.tipo.value,
                "origen": e.id_origen,
                "desc": e.descripcion[:50],
            }
            for e in (sim.sistema_logs.obtener_eventos_recientes(5) if sim.sistema_logs else [])
        ],
        "debug_pilladas": (
            sim.sistema_logs.debug_entidades_pilladas[-5:]
            if getattr(sim.configuracion, "debug_entidades_pilladas", False)
            else []
        ),
    }


def main():
    ticks_max = int(sys.argv[1]) if len(sys.argv) > 1 else 50

    from configuracion import Configuracion
    from nucleo.simulacion import Simulacion

    config = Configuracion()
    config.debug_entidades_pilladas = True

    sim = Simulacion(config)
    sim.inicializar()
    sim.crear_mundo()
    sim.crear_entidades_iniciales()

    log_lines = []
    snapshots = []

    def log(msg):
        log_lines.append(msg)
        print(msg)

    log("=" * 60)
    log("MUNDO_ARTIFICIAL - DEBUG RUNNER")
    log("=" * 60)
    log(f"Mapa: {sim.mapa.ancho}x{sim.mapa.alto}")
    log(f"Entidades: {len(sim.entidades)}")
    for e in sim.entidades:
        log(f"  {e.nombre} id={e.id_entidad} pos={e.posicion.como_tupla()}")
    log("=" * 60)

    for _ in range(ticks_max):
        sim.gestor_ticks.avanzar()
        tick = sim.gestor_ticks.tick_actual

        for ent in sim.entidades:
            ent.actualizar_estado_interno(config)
            percepcion = ent.percibir_entorno(sim.mapa, config)
            ent.estado_interno.riesgo_percibido = percepcion.amenaza_local
            ent.actualizar_memoria(percepcion, tick)
            ent.actualizar_directivas(tick)

            from nucleo.contexto import ContextoDecision, ContextoSimulacion

            ctx_dec = ContextoDecision(
                tick_actual=tick,
                mapa=sim.mapa,
                percepcion_local=percepcion,
                configuracion=config,
                directivas_activas=ent.gestor_directivas.obtener_directivas_activas(tick),
            )
            acc = ent.decidir_accion(ctx_dec)

            if acc:
                ent.estado_interno.accion_actual = acc.accion.tipo_accion
                ctx_sim = ContextoSimulacion(
                    tick_actual=tick,
                    mapa=sim.mapa,
                    bus_eventos=sim.bus_eventos,
                    sistema_metricas=sim.sistema_metricas,
                    configuracion=config,
                    entidades=sim.entidades,
                    percepcion_local=percepcion,
                )
                ent.ejecutar_accion(acc, ctx_sim)
                if tick % 10 == 0 or tick <= 3:
                    tipo = acc.accion.tipo_accion.value
                    log(f"  Tick {tick} {ent.nombre}: {tipo} pos={ent.posicion.como_tupla()}")
            else:
                ent.estado_interno.accion_actual = None
                num_v = len(percepcion.posiciones_vecinas) if percepcion else 0
                log(f"  Tick {tick} {ent.nombre}: SIN ACCIÓN vecinos={num_v} pos={ent.posicion.como_tupla()}")
                sim.sistema_logs.registrar_debug_decision(
                    ent.id_entidad,
                    {"tick": tick, "posicion": ent.posicion.como_tupla(), "num_vecinos": num_v},
                )

        sim.actualizar_mundo()
        sim.despachar_eventos()

        if tick % 5 == 0 or tick <= 2 or tick >= ticks_max - 2:
            snapshots.append(estado_simulacion(sim))

    log("=" * 60)
    log("ESTADO FINAL")
    for e in sim.entidades:
        log(f"  {e.nombre}: pos={e.posicion.como_tupla()} E={e.estado_interno.energia:.2f} H={e.estado_interno.hambre:.2f}")
    log("=" * 60)

    # Escribir archivos
    with open(DEBUG_LOG, "w", encoding="utf-8") as f:
        f.write("\n".join(log_lines))

    with open(DEBUG_OUTPUT, "w", encoding="utf-8") as f:
        json.dump(
            {
                "ticks_ejecutados": ticks_max,
                "snapshots": snapshots,
                "estado_final": estado_simulacion(sim),
                "resumen": {
                    "entidades_con_movimiento": sum(
                        1 for e in sim.entidades
                        if e.posicion_anterior is not None
                    ),
                    "metricas": sim.sistema_metricas.obtener_resumen(),
                },
            },
            f,
            indent=2,
            ensure_ascii=False,
        )

    log(f"\nSalida escrita en {DEBUG_OUTPUT} y {DEBUG_LOG}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
