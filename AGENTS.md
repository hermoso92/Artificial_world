# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

MUNDO_ARTIFICIAL is a 2D artificial life simulation with autonomous agents, built with Python 3.11+ and pygame. See `AGENTE_ENTRANTE.md` for full technical documentation (architecture, entities, decision engine, etc.).

### Running tests

All tests require SDL dummy drivers in headless environments:

```bash
SDL_VIDEODRIVER=dummy SDL_AUDIODRIVER=dummy python pruebas/test_core.py
SDL_VIDEODRIVER=dummy SDL_AUDIODRIVER=dummy python pruebas/test_modo_sombra.py
SDL_VIDEODRIVER=dummy SDL_AUDIODRIVER=dummy python pruebas/test_modo_sombra_completo.py
SDL_VIDEODRIVER=dummy SDL_AUDIODRIVER=dummy python pruebas/test_bug_robar.py
SDL_VIDEODRIVER=dummy SDL_AUDIODRIVER=dummy python pruebas/test_watchdog_fixes.py
SDL_VIDEODRIVER=dummy SDL_AUDIODRIVER=dummy python pruebas/test_watchdog_integracion.py
SDL_VIDEODRIVER=dummy SDL_AUDIODRIVER=dummy python pruebas/test_interacciones_sociales.py
SDL_VIDEODRIVER=dummy SDL_AUDIODRIVER=dummy python pruebas/test_arranque_limpio.py
```

### Lint

No linting tools (flake8, pylint, mypy, ruff) are configured in this project. The CI pipeline (`pipeline.yml`) only runs tests. Use `python -m py_compile <file>` for basic syntax verification.

### Running the application

Entry point: `python principal.py`. Requires a display (X11/Xvfb). In Cloud VMs, use `DISPLAY=:1` (TigerVNC display) to run the app visually in the Desktop pane. Clean start: delete `mundo_artificial.db` before running if entities behave unexpectedly.

### entidades_visibles format

`PercepcionLocal.entidades_visibles` contains tuples `(Posicion, list[int])` from `mapa.obtener_entidades_en_radio()`. Code that iterates over this field must unpack tuples to extract entity IDs, then resolve actual entity objects from `contexto.entidades`. Some tests pass entity objects directly — any new code must handle both formats. See Bugs 5-7 in `AGENTE_ENTRANTE.md` for details.

### Dependencies

Only pip dependency: `pygame>=2.5.0` (from `requirements.txt`). System dependencies: `libsdl2-2.0-0`, `libsdl2-image-2.0-0`, `libsdl2-mixer-2.0-0`, `libsdl2-ttf-2.0-0`.
