"""
Reproduce exactamente el estado que tiene la DB:
Clara en (20,13), hambre=1.0, energia=0.40, comida=0, rasgo=AGRESIVO
Eva en (38,0), hambre=1.0, energia=0.40, comida=0, rasgo=OPORTUNISTA
Verifica que AccionRobar.es_viable devuelve False cuando no hay nadie cerca con comida.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ["SDL_VIDEODRIVER"] = "dummy"
os.environ["SDL_AUDIODRIVER"] = "dummy"

from configuracion import Configuracion
from mundo.generador_mundo import GeneradorMundo
from entidades.fabrica_entidades import FabricaEntidades
from entidades.entidad_social import EntidadSocial
from agentes.estado_interno import EstadoInterno
from agentes.inventario import Inventario
from tipos.enums import TipoRasgoSocial
from tipos.modelos import Posicion, PercepcionLocal
from nucleo.contexto import ContextoDecision
from acciones.accion_robar import AccionRobar

cfg = Configuracion()
gen = GeneradorMundo(cfg)
mapa = gen.generar_mapa()
gen.distribuir_comida(mapa)
gen.distribuir_material(mapa)
gen.distribuir_refugios(mapa)

# --- Reproducir estado exacto de Clara desde DB ---
inv_vacio = Inventario(comida=0, material=0)
estado_clara = EstadoInterno(hambre=1.0, energia=0.40, salud=1.0, inventario=inv_vacio)
clara = EntidadSocial(
    id_entidad=3,
    nombre="Clara",
    rasgo_principal=TipoRasgoSocial.AGRESIVO,
    posicion=Posicion(20, 13),
    estado_interno=estado_clara,
)
mapa.colocar_entidad(clara, Posicion(20, 13))

# Percepcion sin nadie cerca con comida
p_vacia = PercepcionLocal(
    recursos_visibles=[],
    refugios_visibles=[],
    entidades_visibles=[],  # nadie cerca
    posiciones_vecinas=[],
    amenaza_local=0.0,
)
ctx = ContextoDecision(
    tick_actual=100,
    mapa=mapa,
    percepcion_local=p_vacia,
    configuracion=cfg,
)

# TEST: AccionRobar.es_viable con nadie cerca
robar = AccionRobar(clara.id_entidad)
viable_sin_nadie = robar.es_viable(clara, ctx)
assert viable_sin_nadie == False, f"FALLO: robar viable sin nadie cerca = {viable_sin_nadie}"
print("OK: AccionRobar.es_viable = False cuando no hay nadie cerca con comida")

# TEST: decision completa - que accion elige Clara
from agentes.motor_decision import MotorDecision
motor = MotorDecision()
acciones = motor.generar_acciones_candidatas(clara, ctx)
nombres_acciones = [a.tipo_accion.value for a in acciones]
print(f"Acciones candidatas para Clara: {nombres_acciones}")
assert "robar" not in nombres_acciones, f"FALLO: robar sigue siendo candidata: {nombres_acciones}"
print("OK: robar NO aparece en candidatas")

# TEST: Verificar que decide algo distinto a robar
puntuadas = motor.puntuar_acciones(clara, ctx, acciones)
mejor = motor.seleccionar_mejor_accion(puntuadas)
if mejor:
    print(f"OK: Clara decide '{mejor.accion.tipo_accion.value}' (score={mejor.puntuacion_final:.3f})")
    assert mejor.accion.tipo_accion.value != "robar", f"FALLO: sigue eligiendo robar"
else:
    print("WARN: Clara no tiene acciones candidatas (fallback)")

# TEST: Con otra entidad cercana CON comida -> robar SI debe ser viable
inv_lleno = Inventario(comida=2, material=0)
estado_otra = EstadoInterno(hambre=0.3, energia=0.8, salud=1.0, inventario=inv_lleno)
otra = EntidadSocial(
    id_entidad=99, nombre="Victima", rasgo_principal=TipoRasgoSocial.COOPERATIVO,
    posicion=Posicion(21, 13), estado_interno=estado_otra,
)
mapa.colocar_entidad(otra, Posicion(21, 13))
p_con_victima = PercepcionLocal(
    recursos_visibles=[], refugios_visibles=[],
    entidades_visibles=[otra],
    posiciones_vecinas=[], amenaza_local=0.0,
)
ctx2 = ContextoDecision(tick_actual=100, mapa=mapa, percepcion_local=p_con_victima, configuracion=cfg)
viable_con_victima = robar.es_viable(clara, ctx2)
assert viable_con_victima == True, f"FALLO: robar deberia ser viable con victima cerca con comida"
print("OK: AccionRobar.es_viable = True cuando hay victima cercana con comida")

print("")
print("TODOS LOS TESTS DEL BUG ROBAR: PASADOS")
