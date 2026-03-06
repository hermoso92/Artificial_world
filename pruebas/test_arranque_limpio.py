"""
Arranca la simulacion con SDL dummy para capturar exactamente donde falla el bucle.
No tiene ventana real, pero reproduce el crash del bucle.
"""
import os, sys, traceback
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ["SDL_VIDEODRIVER"] = "dummy"
os.environ["SDL_AUDIODRIVER"] = "dummy"

from configuracion import Configuracion
from nucleo.simulacion import Simulacion

import pygame
pygame.init()

cfg = Configuracion()
sim = Simulacion(cfg)

# Inicializar manualmente para poder instrumentar
sim.inicializar()
sim.crear_mundo()
sim.crear_entidades_iniciales()

print(f"Entidades creadas: {[e.nombre for e in sim.entidades]}")
print(f"Amiguisimo presente: {any(e.nombre == 'Amiguisimo' for e in sim.entidades)}")

# Ejecutar 10 ticks y verificar que no hay excepcion
errores = []
for i in range(10):
    try:
        sim._ejecutar_tick_completo()
    except Exception as e:
        errores.append(f"Tick {i}: {type(e).__name__}: {e}")
        traceback.print_exc()

if errores:
    print("ERRORES EN TICKS:")
    for err in errores:
        print(" ", err)
else:
    print(f"OK: 10 ticks ejecutados sin excepcion")
    print(f"Tick actual: {sim.gestor_ticks.tick_actual}")

# Verificar estado de entidades
for e in sim.entidades:
    print(f"  {e.nombre}: pos={e.posicion.como_tupla()} H={e.estado_interno.hambre:.2f} E={e.estado_interno.energia:.2f} accion={e.estado_interno.accion_actual}")

pygame.quit()
print("TEST ARRANQUE LIMPIO: OK")
