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

### Known pre-existing issue

`PanelModoSombra.__init__()` in `interfaz/panel_modo_sombra.py` accepts 4 args (x0, ancho, alto, estado), but `interfaz/panel_control.py` line 60 passes 5 (adding `self.configuracion`). This causes a `TypeError` that prevents the full GUI from starting and causes failures in tests that call `Simulacion.inicializar()` (which initializes the renderer). Tests that set up entities/world directly (without the renderer) work fine.

### Lint

No linting tools (flake8, pylint, mypy, ruff) are configured in this project. The CI pipeline (`pipeline.yml`) only runs tests. Use `python -m py_compile <file>` for basic syntax verification.

### Running the application

Entry point: `python principal.py`. Requires a display (X11/Xvfb) or SDL dummy drivers. In Cloud VMs, use `Xvfb :99 -screen 0 1280x1024x24 &` and `DISPLAY=:99` to provide a virtual display. Note: the app currently crashes on startup due to the PanelModoSombra issue described above.

### Dependencies

Only pip dependency: `pygame>=2.5.0` (from `requirements.txt`). System dependencies: `libsdl2-2.0-0`, `libsdl2-image-2.0-0`, `libsdl2-mixer-2.0-0`, `libsdl2-ttf-2.0-0`.
