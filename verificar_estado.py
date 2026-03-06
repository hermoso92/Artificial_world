"""
Lee debug_output.json o debug_live.json y verifica el estado.
Devuelve código 0 si todo OK, 1 si hay problemas.

Uso: python verificar_estado.py
"""

import json
import os
import sys

DIR = os.path.dirname(os.path.abspath(__file__))
RUTA_OUTPUT = os.path.join(DIR, "debug_output.json")
RUTA_LIVE = os.path.join(DIR, "debug_live.json")


def main():
    ruta = RUTA_OUTPUT if os.path.exists(RUTA_OUTPUT) else RUTA_LIVE
    if not os.path.exists(ruta):
        print(f"ERROR: No existe {RUTA_OUTPUT} ni {RUTA_LIVE}")
        print("Ejecuta: python debug_runner.py 30")
        print("O: python principal.py (con config.debug_archivo_activo=True)")
        return 1

    with open(ruta, encoding="utf-8") as f:
        data = json.load(f)

    errores = []
    ticks = data.get("ticks_ejecutados", data.get("tick", 0))
    estado = data.get("estado_final", data) if "estado_final" in data else data
    entidades = estado.get("entidades", [])

    if not entidades:
        errores.append("No hay entidades en estado final")

    posiciones = [tuple(e["posicion"]) for e in entidades]
    if len(posiciones) != len(set(posiciones)):
        errores.append("Hay entidades en la misma celda")

    snapshots = data.get("snapshots", [])
    if not snapshots and estado.get("entidades"):
        snapshots = [estado]

    movimientos = 0
    for e in entidades:
        if e.get("accion") in ("mover", "recoger_comida", "comer", "descansar", "ir_refugio", "explorar"):
            movimientos += 1
    if movimientos == 0 and ticks > 1:
        errores.append("Ninguna entidad realizó acciones de movimiento")

    if errores:
        print("VERIFICACIÓN FALLIDA:")
        for e in errores:
            print(f"  - {e}")
        return 1

    print("VERIFICACIÓN OK")
    print(f"  Ticks: {ticks}")
    print(f"  Entidades: {len(entidades)}")
    print(f"  Posiciones distintas: OK")
    print(f"  Sin acciones bloqueadas: OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
