"""Script de diagnóstico de utilidades por entidad."""
import os
os.environ["SDL_VIDEODRIVER"] = "dummy"

from configuracion import Configuracion
from nucleo.simulacion import Simulacion
from nucleo.contexto import ContextoDecision

cfg = Configuracion(cantidad_entidades_sociales=2, incluir_gato=False)
sim = Simulacion(cfg)
sim.inicializar()
sim.crear_mundo()
sim.crear_entidades_iniciales()
# Ejecutar un tick para que las entidades tengan estado inicial
sim.actualizar_mundo()

from agentes.motor_decision import MotorDecision
motor = MotorDecision()

for e in sim.entidades[:2]:
    percepcion = e.percibir_entorno(sim.mapa, cfg)
    ctx = ContextoDecision(
        tick_actual=0,
        mapa=sim.mapa,
        percepcion_local=percepcion,
        configuracion=cfg,
        entidades_cercanas=[],
        directivas_activas=[],
        eventos_recientes_globales=[],
    )
    acciones = motor.generar_acciones_candidatas(e, ctx)
    puntuadas = motor.puntuar_acciones(e, ctx, acciones)
    puntuadas.sort(key=lambda x: x.puntuacion_final, reverse=True)

    rasgo = getattr(e, "rasgo_principal", None)
    print(f"\n=== {e.nombre} rasgo={rasgo.value if rasgo else '-'} E={e.estado_interno.energia:.2f} H={e.estado_interno.hambre:.2f} ===")
    for ap in puntuadas[:10]:
        tipo = ap.accion.tipo_accion.value
        mods = ap.modificadores
        mod_str = " | ".join(f"{k}={v:+.3f}" for k, v in mods.items() if abs(v) > 0.001)
        print(f"  [{ap.puntuacion_final:.3f}] {tipo:22s} base={ap.puntuacion_base:.3f}  {mod_str}")
