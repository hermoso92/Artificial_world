"""Test específico para verificar que las directivas afectan las decisiones."""
import os
os.environ["SDL_VIDEODRIVER"] = "dummy"

from configuracion import Configuracion
from nucleo.simulacion import Simulacion
from nucleo.contexto import ContextoDecision
from tipos.enums import TipoDirectiva, EstadoDirectiva, TipoAccion
from tipos.modelos import DirectivaExterna
from agentes.motor_decision import MotorDecision

cfg = Configuracion(cantidad_entidades_sociales=2, incluir_gato=False)
sim = Simulacion(cfg)
sim.inicializar()
sim.crear_mundo()
sim.crear_entidades_iniciales()

motor = MotorDecision()
entidad = sim.entidades[0]
percepcion = entidad.percibir_entorno(sim.mapa, cfg)

# --- Sin directiva ---
ctx_sin = ContextoDecision(
    tick_actual=0, mapa=sim.mapa, percepcion_local=percepcion,
    configuracion=cfg, entidades_cercanas=[], directivas_activas=[],
    eventos_recientes_globales=[],
)
puntuadas_sin = motor.puntuar_acciones(entidad, ctx_sin, motor.generar_acciones_candidatas(entidad, ctx_sin))
mejor_sin = max(puntuadas_sin, key=lambda x: x.puntuacion_final)

# --- Con directiva EXPLORAR_ZONA ---
directiva_explorar = DirectivaExterna(
    id_directiva=1,
    tipo_directiva=TipoDirectiva.EXPLORAR_ZONA,
    id_entidad_objetivo=entidad.id_entidad,
    prioridad=0.9,
    intensidad=0.9,
    tick_emision=0,
    tick_expiracion=100,
    estado=EstadoDirectiva.ACEPTADA,
)
ctx_explorar = ContextoDecision(
    tick_actual=0, mapa=sim.mapa, percepcion_local=percepcion,
    configuracion=cfg, entidades_cercanas=[], directivas_activas=[directiva_explorar],
    eventos_recientes_globales=[],
)
puntuadas_explorar = motor.puntuar_acciones(entidad, ctx_explorar, motor.generar_acciones_candidatas(entidad, ctx_explorar))
mejor_explorar = max(puntuadas_explorar, key=lambda x: x.puntuacion_final)

# --- Con directiva PRIORIZAR_SUPERVIVENCIA ---
directiva_supervivencia = DirectivaExterna(
    id_directiva=2,
    tipo_directiva=TipoDirectiva.PRIORIZAR_SUPERVIVENCIA,
    id_entidad_objetivo=entidad.id_entidad,
    prioridad=0.9,
    intensidad=0.9,
    tick_emision=0,
    tick_expiracion=100,
    estado=EstadoDirectiva.ACEPTADA,
)
ctx_superv = ContextoDecision(
    tick_actual=0, mapa=sim.mapa, percepcion_local=percepcion,
    configuracion=cfg, entidades_cercanas=[], directivas_activas=[directiva_supervivencia],
    eventos_recientes_globales=[],
)
puntuadas_superv = motor.puntuar_acciones(entidad, ctx_superv, motor.generar_acciones_candidatas(entidad, ctx_superv))
mejor_superv = max(puntuadas_superv, key=lambda x: x.puntuacion_final)

rasgo = getattr(entidad, "rasgo_principal", None)
print(f"Entidad: {entidad.nombre} (rasgo={rasgo.value if rasgo else '-'}, E={entidad.estado_interno.energia:.2f}, H={entidad.estado_interno.hambre:.2f})")
print(f"  Sin directiva:                 mejor={mejor_sin.accion.tipo_accion.value:20s} score={mejor_sin.puntuacion_final:.3f}")
print(f"  Con EXPLORAR_ZONA:             mejor={mejor_explorar.accion.tipo_accion.value:20s} score={mejor_explorar.puntuacion_final:.3f}")
print(f"  Con PRIORIZAR_SUPERVIVENCIA:   mejor={mejor_superv.accion.tipo_accion.value:20s} score={mejor_superv.puntuacion_final:.3f}")
print()

# Verificar que directivas cambian comportamiento
explorar_mod = next((ap.modificadores.get("directivas", 0) for ap in puntuadas_explorar if ap.accion.tipo_accion in (TipoAccion.EXPLORAR, TipoAccion.MOVER)), 0)
superv_mod = next((ap.modificadores.get("directivas", 0) for ap in puntuadas_superv if ap.accion.tipo_accion in (TipoAccion.COMER, TipoAccion.DESCANSAR, TipoAccion.RECOGER_COMIDA)), 0)

print(f"Modificador directiva EXPLORAR sobre explorar/mover: {explorar_mod:.3f}")
print(f"Modificador directiva SUPERVIVENCIA sobre comer/descansar/recoger: {superv_mod:.3f}")
print()

if explorar_mod > 0.1:
    print("OK: EXPLORAR_ZONA afecta correctamente el comportamiento")
else:
    print("FALLO: EXPLORAR_ZONA NO afecta suficientemente")

if superv_mod > 0.1:
    print("OK: PRIORIZAR_SUPERVIVENCIA afecta correctamente el comportamiento")
else:
    print("FALLO: PRIORIZAR_SUPERVIVENCIA NO afecta suficientemente")

# Mostrar todas las acciones con sus mods de directiva
print("\nDetalle EXPLORAR_ZONA:")
for ap in sorted(puntuadas_explorar, key=lambda x: x.puntuacion_final, reverse=True)[:5]:
    d = ap.modificadores.get("directivas", 0)
    print(f"  {ap.accion.tipo_accion.value:20s} final={ap.puntuacion_final:.3f} dir_mod={d:+.3f}")
