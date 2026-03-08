# Golden Path — Artificial World

> Recorrido único, defendible y verificable para enseñar el proyecto sin mezclar motor real, demo web y roadmap.

---

## Tesis

El golden path de este repositorio es el **motor Python**.

Razón:

- es la parte mejor respaldada por código y pruebas
- tiene persistencia real
- tiene Modo Sombra
- no depende de la capa demo web para demostrar el valor del proyecto

---

## Qué vas a demostrar

Con este recorrido demuestras:

- que existe un motor real de simulación
- que las entidades actúan dentro de un mundo persistente
- que hay control manual sobre una entidad
- que el proyecto tiene un núcleo defendible más allá del marketing

No demuestras con este recorrido:

- una integración completa con telemetría real
- que la web use el mismo motor
- que `DobackSoft` sea aquí un producto B2B completo

---

## Prerrequisitos

- Python 3.11+
- dependencias instaladas con `pip install -r requirements.txt`

---

## Comandos

```powershell
pip install -r requirements.txt
python principal.py
```

O bien:

```powershell
.\iniciar.ps1
```

Si el doctor detecta un entorno sano, debe recomendar el camino `python`.

---

## Resultado esperado

1. Se abre la ventana pygame del mundo.
2. Ves entidades moviéndose en la simulación.
3. El panel permite observar estado, eventos y controles.
4. Puedes activar el Modo Sombra y controlar una entidad.
5. El sistema puede guardar y cargar estado en `mundo_artificial.db`.

---

## Qué parte del sistema es real

- `principal.py`
- `nucleo/simulacion.py`
- `agentes/motor_decision.py`
- `systems/memory/memoria_entidad.py`
- `sistemas/sistema_persistencia.py`
- `sistemas/gestor_modo_sombra.py`

---

## Qué parte no entra en este golden path

- La demo web fullstack
- `DobackSoft` como vertical demo
- `HeroRefuge`
- landing HTML
- la futura base común de IA local
- cualquier capa 3D futura

Esas partes pueden enseñarse después, pero no son la prueba principal del repositorio.

Si después quieres enseñar la tesis de “civilizaciones vivas”, el mejor complemento es la capa web con el flujo:

- elegir semilla
- crear refugio fundador
- crear un mundo ligero con historia inicial

Ese flujo existe de forma parcial, pero no sustituye al golden path Python.

---

## Tiempo estimado

- Si ya tienes Python y dependencias: 1 a 3 minutos
- Si instalas dependencias por primera vez: 5 a 10 minutos

---

## Variante: Crónica fundacional (headless)

Si prefieres una demostración sin ventana gráfica y con artefactos verificables:

```powershell
python cronica_fundacional.py --ticks 200
```

Genera `cronica_fundacional.json` y `cronica_fundacional.md` con hitos, entidades finales y veredicto.

---

## Siguiente documento recomendado

Después de probar este recorrido:

- técnico: [AGENTE_ENTRANTE.md](../AGENTE_ENTRANTE.md)
- producto/dirección: [docs/DOCUMENTACION_COMPLETA.md](DOCUMENTACION_COMPLETA.md)
- comparación Python vs web: [docs/MODOS_EJECUCION.md](MODOS_EJECUCION.md)
- IA local y automatización: [docs/IA_LOCAL_BASE.md](IA_LOCAL_BASE.md)
