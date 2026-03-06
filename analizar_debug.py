import json
from collections import Counter

with open("debug_output.json", encoding="utf-8") as f:
    data = json.load(f)

snaps = data.get("snapshots", [])
print(f"Total snapshots: {len(snaps)}")

if snaps:
    last = snaps[-1]
    tick_val = last["tick"]
    print(f"Ultimo tick: {tick_val}")
    for e in last["entidades"]:
        print(f"  {e['nombre']}: accion={e['accion']}, energia={e['energia']:.2f}, hambre={e['hambre']:.2f}")

acciones = Counter()
for snap in snaps:
    for e in snap["entidades"]:
        key = e["nombre"] + ":" + e["accion"]
        acciones[key] += 1

print("\nAcciones por entidad (variedad):")
for k, v in sorted(acciones.items()):
    pct = v / len(snaps) * 100
    print(f"  {k}: {v}x ({pct:.0f}%)")

# Verificar variedad real
print("\nResumen de variedad:")
por_entidad = {}
for k in acciones:
    nombre, accion = k.split(":", 1)
    por_entidad.setdefault(nombre, set()).add(accion)

for nombre, acciones_set in por_entidad.items():
    print(f"  {nombre}: {len(acciones_set)} acciones distintas -> {acciones_set}")
