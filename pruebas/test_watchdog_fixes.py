"""
Verificacion de los 3 fixes del watchdog con evidencia concreta.
Cada caso debe generar una alerta especifica.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ["SDL_VIDEODRIVER"] = "dummy"
os.environ["SDL_AUDIODRIVER"] = "dummy"
import logging
logging.disable(logging.CRITICAL)

from collections import deque, Counter
from configuracion import Configuracion
from mundo.generador_mundo import GeneradorMundo
from entidades.fabrica_entidades import FabricaEntidades
from sistemas.sistema_watchdog import SistemaWatchdog, HistorialEntidad

cfg = Configuracion()
gen = GeneradorMundo(cfg)
mapa = gen.generar_mapa()
gen.distribuir_comida(mapa)
gen.distribuir_refugios(mapa)
fab = FabricaEntidades(cfg)
entidades = fab.crear_entidades_iniciales(mapa)
ana = next(e for e in entidades if e.nombre == "Ana")

fallos = []
exitos = []

# -------------------------------------------------------
# TEST 1: hambre=1.0 + mover durante 8 ticks -> debe alertar HAMBRE_CRITICA_SIN_RESPUESTA
# -------------------------------------------------------
wd = SistemaWatchdog()
wd.historial[ana.id_entidad] = HistorialEntidad(id_entidad=ana.id_entidad, nombre=ana.nombre)
h = wd.historial[ana.id_entidad]
h.acciones = deque(["mover"] * 15, maxlen=15)
h.hambres = deque([1.0] * 15, maxlen=15)
h.energias = deque([0.5] * 15, maxlen=15)
h.posiciones = deque([(5, 5)] * 15, maxlen=15)
wd.ultimo_tick_analizado = -1

alertas_antes = wd.problemas_detectados_total
wd._analizar(10, [ana])
nuevas = wd.problemas_detectados_total - alertas_antes
alertas = [a for a in wd.obtener_alertas_recientes(20) if a.entidad == ana.nombre]
codigos = [a.codigo for a in alertas]

if "HAMBRE_CRITICA_SIN_RESPUESTA" in codigos:
    exitos.append("FIX1 OK: hambre=1.0 + mover -> HAMBRE_CRITICA_SIN_RESPUESTA generada")
else:
    fallos.append(f"FIX1 FALLO: hambre=1.0 + mover no genero HAMBRE_CRITICA_SIN_RESPUESTA. Alertas: {codigos}")

# -------------------------------------------------------
# TEST 2: hambre=1.0 + mover 15 ticks -> debe alertar HAMBRE_SIN_COMIDA_DISPONIBLE
# -------------------------------------------------------
wd2 = SistemaWatchdog()
wd2.historial[ana.id_entidad] = HistorialEntidad(id_entidad=ana.id_entidad, nombre=ana.nombre)
h2 = wd2.historial[ana.id_entidad]
h2.acciones = deque(["mover"] * 15, maxlen=15)
h2.hambres = deque([1.0] * 15, maxlen=15)
h2.energias = deque([0.5] * 15, maxlen=15)
h2.posiciones = deque([(i, i) for i in range(15)], maxlen=15)
wd2.ultimo_tick_analizado = -1

wd2._analizar(20, [ana])
alertas2 = [a for a in wd2.obtener_alertas_recientes(20) if a.entidad == ana.nombre]
codigos2 = [a.codigo for a in alertas2]

if "HAMBRE_SIN_COMIDA_DISPONIBLE" in codigos2:
    exitos.append("FIX2 OK: hambre=1.0 + mover 15 ticks -> HAMBRE_SIN_COMIDA_DISPONIBLE generada")
else:
    fallos.append(f"FIX2 FALLO: HAMBRE_SIN_COMIDA_DISPONIBLE no generada. Alertas: {codigos2}")

# -------------------------------------------------------
# TEST 3: explorar+mover 95% sin supervivencia -> SOLO_MOVIMIENTO_GLOBAL
# -------------------------------------------------------
wd3 = SistemaWatchdog()
for e in entidades:
    wd3.historial[e.id_entidad] = HistorialEntidad(id_entidad=e.id_entidad, nombre=e.nombre)
    h3 = wd3.historial[e.id_entidad]
    h3.acciones = deque(["mover"] * 10, maxlen=15)
    h3.hambres = deque([0.5] * 10, maxlen=15)
    h3.energias = deque([0.5] * 10, maxlen=15)
    h3.posiciones = deque([(i, i) for i in range(10)], maxlen=15)
wd3.ultimo_tick_analizado = -1

wd3._analizar(30, entidades)
alertas3 = wd3.obtener_alertas_recientes(20)
codigos3 = [a.codigo for a in alertas3]

if "SOLO_MOVIMIENTO_GLOBAL" in codigos3:
    exitos.append("FIX3 OK: mover 100% sin supervivencia -> SOLO_MOVIMIENTO_GLOBAL generada")
else:
    fallos.append(f"FIX3 FALLO: SOLO_MOVIMIENTO_GLOBAL no generada. Alertas: {codigos3}")

# -------------------------------------------------------
# TEST 4: hambre=1.0 + comer -> NO debe alertar (comportamiento correcto)
# -------------------------------------------------------
wd4 = SistemaWatchdog()
wd4.historial[ana.id_entidad] = HistorialEntidad(id_entidad=ana.id_entidad, nombre=ana.nombre)
h4 = wd4.historial[ana.id_entidad]
h4.acciones = deque(["mover"] * 6 + ["comer"] * 2, maxlen=15)
h4.hambres = deque([1.0] * 8, maxlen=15)
h4.energias = deque([0.5] * 8, maxlen=15)
h4.posiciones = deque([(i, i) for i in range(8)], maxlen=15)
wd4.ultimo_tick_analizado = -1

wd4._analizar(40, [ana])
alertas4 = [a for a in wd4.obtener_alertas_recientes(20) if a.entidad == ana.nombre and a.codigo == "HAMBRE_CRITICA_SIN_RESPUESTA"]
if not alertas4:
    exitos.append("FIX4 OK: hambre=1.0 + comer -> sin falso positivo HAMBRE_CRITICA_SIN_RESPUESTA")
else:
    fallos.append("FIX4 FALLO FALSO POSITIVO: hambre=1.0 + comer genero HAMBRE_CRITICA_SIN_RESPUESTA")

# -------------------------------------------------------
# RESULTADO FINAL
# -------------------------------------------------------
print("\n=== VERIFICACION WATCHDOG FIXES ===\n")
for e in exitos:
    print(f"  OK  {e}")
for f in fallos:
    print(f"  FALLO  {f}")

print(f"\nResumen: {len(exitos)} OK, {len(fallos)} FALLOS")

if fallos:
    sys.exit(1)
else:
    print("\nTODOS LOS FIXES VERIFICADOS CORRECTAMENTE")
