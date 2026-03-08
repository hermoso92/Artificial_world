# Artificial World — Guía esencial (2 páginas)

> **Un solo documento** para entender, ejecutar y trabajar en el proyecto.

---

## Página 1 — Qué es y cómo arrancar

### Qué es

**Artificial World** es una simulación de vida artificial 2D con agentes autónomos. IA por utilidad (sin LLMs), grid 2D, recursos, refugios, memoria espacial y social.

**Estrategia:** Python = motor completo (13 acciones, Modo Sombra, relaciones, persistencia). Web = demo sin instalación.

### Cómo ejecutar

| Modo | Comando | Resultado |
|------|---------|-----------|
| **Python** | `pip install -r requirements.txt` → `python principal.py` | Ventana pygame, motor completo |
| **Web** | `.\scripts\iniciar_fullstack.ps1` | Backend 3001, Frontend 5173, abre navegador |
| **Landing** | `python principal.py --web` | Abre artificial-world.html |
| **.exe** | `.\build_exe.ps1` | Genera `dist\MundoArtificial.exe` |

### Estructura mínima

```
principal.py          ← entrada Python
nucleo/simulacion.py  ← orquestador
agentes/motor_decision.py  ← IA
acciones/             ← 13 acciones
backend/src/          ← API + motor JS
frontend/src/         ← React (Hub, SimulationView, MissionControl)
```

### Bases de datos

| BD | Uso |
|----|-----|
| `mundo_artificial.db` | Python — persistencia |
| `audit_simulacion.db` | Node — event store |
| `audit_competencia.db` | Python — modo competencia |

---

## Página 2 — Reglas y referencias

### Reglas obligatorias (AGENTS.md)

| Regla | Descripción |
|-------|-------------|
| Logger | `logger` siempre — nunca `console.log` |
| URLs | `config/api.js` — nunca hardcodear |
| Catch | No vacíos — siempre manejar error |
| Componentes | Máx. 300 líneas React |
| Puertos | 3001 backend, 5173 frontend |

### Tests

```powershell
# Python
$env:SDL_VIDEODRIVER="dummy"; $env:SDL_AUDIODRIVER="dummy"
python pruebas/test_core.py
python pruebas/verificar_todo.py

# Web
cd backend; npm test
cd frontend; npm test
```

### API rápida

- `GET /api/world` — estado
- `POST /api/simulation/start` — iniciar
- `ws://localhost:3001/ws` — tiempo real

### Si necesitas más

| Tema | Documento |
|------|-----------|
| Motor, modo sombra, estructura completa | `AGENTE_ENTRANTE.md` |
| Python vs Web, diferencias | `docs/MODOS_EJECUCION.md` |
| Guía ampliada | `docs/PROYECTO_GUIA.md` |
| Estrategia y próximos pasos | `docs/ESTRATEGIA_PRODUCTO.md` |
| Relato para dirección, inversores, familia | `docs/PAQUETE_RELATO/` |

---

*Artificial World — Constrúyelo. Habítalo. Haz que crezca.*
