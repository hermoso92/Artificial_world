# Estrategia de producto — Artificial World

**Fecha:** Marzo 2025  
**Estado:** revisado contra el repo real

---

## 1. Tesis oficial del repositorio

La tesis que mejor encaja con el código actual es esta:

- **Artificial World** = motor principal real en Python + laboratorio local auditable
- **Web fullstack** = demo funcional y puerta de entrada, con motor JavaScript propio
- **DobackSoft en este repo** = vertical demo; producto comercial completo en dobackv2
- **FireSimulator / juego** = superficie de demo y entrenamiento, no núcleo de negocio

No debe presentarse este repositorio como si ya contuviera el `DobackSoft` comercial completo.

Documento maestro de ownership: [docs/OWNERSHIP_ESTRATEGICO.md](OWNERSHIP_ESTRATEGICO.md).

---

## 2. Qué sostiene esta decisión

### Motor Python

Es la parte más consistente entre código, persistencia y pruebas:

- 13 tipos de acción en `tipos/enums.py`
- persistencia SQLite en `sistemas/sistema_persistencia.py`
- Modo Sombra en `sistemas/gestor_modo_sombra.py`
- runner de producción con 11 suites en `pruebas/run_tests_produccion.py`
- entrada principal clara en `principal.py`

### Web fullstack

Es una demo funcional, pero no el mismo producto que el motor Python:

- usa su propio motor en `backend/src/simulation/`
- expone REST + WebSocket en `backend/src/`
- sirve como puerta de entrada visual y superficie de exploración

### DobackSoft

Dentro de este repo hay base demo, no base suficiente para llamarlo MVP real completo:

- UI presente en `frontend/src/components/DobackSoft.jsx`
- `FireSimulator` jugable en `frontend/src/components/FireSimulator.jsx`
- sesiones y rutas mock en `backend/src/routes/dobacksoft.js`

---

## 3. Decisión de foco para una sola programadora

### Decisión inmediata

**Mantener el foco en el motor Python como producto real y usar la web como showcase funcional.**

Esto equivale, a corto plazo, a tratar la web como una combinación de:

- demo navegable
- herramienta de entrada
- superficie para verticales demo

No como prueba de que el mismo motor ya esté portado o integrado de extremo a extremo.

---

## 4. Evaluación de las tres opciones futuras

| Opción | Encaje con el repo actual | Coste | Recomendación |
|--------|----------------------------|-------|---------------|
| **1. Mantener dos motores separados** | Es el estado actual real | Medio/alto a largo plazo | Viable solo si se documenta claramente |
| **2. Exponer Python por API** | No existe aún como flujo real | Alto | No abrir ahora salvo necesidad fuerte |
| **3. Usar la web solo como showcase** | Encaja mejor con el estado actual y el foco limitado | Bajo/medio | **Recomendada a corto plazo** |

### Conclusión

La recomendación actual es:

- **corto plazo:** opción 3
- **estado técnico presente:** opción 1
- **exploración futura:** opción 2 solo si hay necesidad de unificar experiencia

---

## 5. Golden path de producto

El recorrido que mejor defiende el repo hoy es:

1. instalar dependencias
2. ejecutar `python principal.py`
3. observar simulación
4. probar Modo Sombra
5. guardar/cargar estado

Ese camino demuestra:

- núcleo real
- persistencia
- control manual
- capacidad técnica defendible

La web puede enseñarse después como demo visual del concepto, no como sustituto del núcleo.

---

## 6. Qué no debe prometer esta estrategia

Sin más evidencia, esta estrategia no debe usar como claim principal:

- miles de agentes
- latencia `< 1 ms`
- producto enterprise
- DobackSoft completo dentro de este repo
- telemetría real integrada extremo a extremo

Si alguno de esos puntos se quiere usar, debe apoyarse en benchmarks, integración real o pruebas versionadas.

---

## 7. Próximas acciones recomendadas

### P0

- fijar la verdad del producto en `README.md` y `docs/DOCUMENTACION_COMPLETA.md`
- documentar el golden path en `docs/GOLDEN_PATH.md`
- dejar explícito qué es real, demo y externo

### P1

- alinear `docs/MODOS_EJECUCION.md` con esta decisión
- limpiar claims y cifras inconsistentes en documentación pública
- usar una única marca: `Artificial World`

### P2

- decidir si `DobackSoft` se mantiene como demo vertical o se reduce a un MVP mínimo real
- evaluar si merece la pena una API del motor Python

---

## 8. Criterio de éxito

Esta estrategia será correcta si, al leer el repo:

- una persona nueva entiende en menos de 5 minutos qué es real y qué es demo
- nadie confunde el motor Python con la demo web
- `DobackSoft` no se sobrevende como producto completo dentro de este repositorio

---

## 9. Referencias

- [docs/OWNERSHIP_ESTRATEGICO.md](OWNERSHIP_ESTRATEGICO.md) — DobackSoft = producto; Artificial World = laboratorio; juego = demo
- [docs/SUPERFICIE_JUEGO.md](SUPERFICIE_JUEGO.md) — FireSimulator como superficie, no núcleo
- [README.md](../README.md)
- [docs/DOCUMENTACION_COMPLETA.md](DOCUMENTACION_COMPLETA.md)
- [docs/MODOS_EJECUCION.md](MODOS_EJECUCION.md)
- [docs/GOLDEN_PATH.md](GOLDEN_PATH.md)
- [AGENTE_ENTRANTE.md](../AGENTE_ENTRANTE.md)
