# Modos de ejecución — Python vs Fullstack

Este documento separa las dos formas reales de ejecutar el proyecto sin mezclar producto, demo y roadmap.

---

## Resumen rápido

| Aspecto | `python principal.py` | Fullstack (`.\scripts\iniciar_fullstack.ps1`) |
|---------|------------------------|-----------------------------------------------|
| Tecnología | Python 3.11+ + pygame | Node.js + React + Vite |
| Interfaz | Ventana local | Navegador |
| Motor | `nucleo.Simulacion` | `backend/src/simulation/` |
| Rol | Producto real del repo | Demo funcional del concepto |
| Persistencia principal | Sí | No, salvo módulos concretos |
| DobackSoft | No aplica | Vertical demo dentro del hub |

---

## 1. Python + pygame

### Qué es

Es el **motor principal** del repositorio y la forma más defendible de mostrar `Artificial World`.

### Cómo iniciar

```powershell
python principal.py
```

O, para abrir la landing HTML:

```powershell
python principal.py --web
```

### Qué demuestra

- simulación principal
- 13 tipos de acción
- memoria espacial y social
- Modo Sombra
- persistencia SQLite
- watchdog

### Evidencia asociada

- `tipos/enums.py`
- `agentes/motor_decision.py`
- `systems/memory/memoria_entidad.py`
- `sistemas/sistema_persistencia.py`
- `sistemas/gestor_modo_sombra.py`
- `pruebas/run_tests_produccion.py`

---

## 2. Fullstack (backend + frontend)

### Qué es

Es una **demo funcional** con backend y frontend propios.  
No ejecuta el motor Python; usa un motor JavaScript independiente.

### Cómo iniciar

```powershell
.\scripts\iniciar_fullstack.ps1
```

Arranca:

1. backend en `3001`
2. frontend en `5173`
3. navegador en `http://localhost:5173`

### Qué demuestra

- demo navegable del concepto
- API REST
- WebSocket `/ws`
- hub con módulos como `HeroRefuge` y `DobackSoft`
- flujo fundador parcial: semilla -> constructor -> refugio -> mundo ligero

### Qué no demuestra por sí sola

- que el motor Python esté expuesto por web
- que exista una única base de verdad entre Python y JS
- que `DobackSoft` sea aquí un producto B2B completo
- que exista una capa 3D interactiva integrada

---

## 3. DobackSoft dentro del modo web

`DobackSoft` aparece en la capa web como vertical demo.

Estado verificable actual:

- `frontend/src/components/DobackSoft.jsx` ofrece tabs de subida, rutas y juego
- `frontend/src/components/FireSimulator.jsx` puede reproducir datos entregados por el visor
- `backend/src/routes/dobacksoft.js` mantiene sesiones y rutas en memoria y devuelve `MOCK_ROUTE`

Conclusión:

- **hay base demo real**
- **no hay evidencia suficiente para tratarlo aquí como MVP completo cerrado**

---

## 4. Comparación práctica

| Aspecto | Python | Fullstack |
|---------|--------|-----------|
| Producto real del repo | Sí | No |
| Demo visual rápida | No | Sí |
| Persistencia del mundo | Sí | No en la simulación principal |
| Modo Sombra | Sí | No |
| Relaciones sociales completas | Sí | No equivalentes |
| REST + WebSocket | No principal | Sí |
| DobackSoft demo | No | Sí |

---

## 5. Cuándo usar cada uno

| Objetivo | Modo recomendado |
|----------|------------------|
| Entender el núcleo real | Python |
| Probar la parte más sólida | Python |
| Enseñar una demo rápida en navegador | Fullstack |
| Explorar la vertical DobackSoft demo | Fullstack |
| Validar la tesis principal del repositorio | Python |

---

## 6. Decisión de foco

Mientras no exista una integración real entre ambos motores, la documentación debe asumir:

- Python = producto real
- fullstack = showcase/demo funcional
- DobackSoft = vertical demo dentro del showcase

La capa de IA local propuesta debe seguir la misma lógica:

- IA local = complemento operativo del laboratorio y del debugging
- no = prueba de integración completa entre Python, web y DobackSoft real

La tesis 2D/3D debe seguir esta separación:

- 2D = estado, rutas, refugios, lectura sistemica
- 3D = futura encarnacion visual
- 3D hoy = roadmap, no evidencia implementada

La decisión futura se documenta en [docs/ESTRATEGIA_PRODUCTO.md](ESTRATEGIA_PRODUCTO.md).

---

## 7. Referencias

- [README.md](../README.md)
- [docs/DOCUMENTACION_COMPLETA.md](DOCUMENTACION_COMPLETA.md)
- [docs/ESTRATEGIA_PRODUCTO.md](ESTRATEGIA_PRODUCTO.md)
- [docs/GOLDEN_PATH.md](GOLDEN_PATH.md)
- [docs/IA_LOCAL_BASE.md](IA_LOCAL_BASE.md)
- [docs/IMPLEMENTACION_AI_CORE_LOCAL.md](IMPLEMENTACION_AI_CORE_LOCAL.md)
- [docs/VISION_CIVILIZACIONES_VIVAS.md](VISION_CIVILIZACIONES_VIVAS.md)
- [AGENTE_ENTRANTE.md](../AGENTE_ENTRANTE.md)

## 8. Launcher único

`iniciar.ps1` ya puede actuar como `doctor` y `launcher` de varios caminos.

Importante:

- si el entorno lo permite, debe recomendar `python`
- la ruta `web` sigue siendo showcase funcional
- la ruta `ai` es opcional y complementaria al backend web
