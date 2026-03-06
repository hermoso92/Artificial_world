"""
Punto de entrada del proyecto MUNDO_ARTIFICIAL.
"""

import os
from datetime import datetime

LOG_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "app_diagnostico.log")


def _log(msg: str) -> None:
    try:
        with open(LOG_PATH, "a", encoding="utf-8") as f:
            f.write(f"[{datetime.now().isoformat()}] {msg}\n")
    except Exception:
        pass


# Forzar driver de vídeo real (evitar dummy de tests headless)
if os.environ.get("SDL_VIDEODRIVER") == "dummy":
    del os.environ["SDL_VIDEODRIVER"]
    _log("SDL_VIDEODRIVER dummy eliminado")

_log("Inicio principal.py")

try:
    from configuracion import Configuracion
    from nucleo.simulacion import Simulacion
    _log("Imports OK")

    def main() -> None:
        """Inicia la simulación."""
        config = Configuracion()
        sim = Simulacion(config)
        _log("Simulacion creada, llamando ejecutar_bucle_principal")
        sim.ejecutar_bucle_principal()
        _log("Bucle finalizado (usuario cerro)")

    if __name__ == "__main__":
        main()
        _log("main() termino OK")
except Exception as e:
    _log(f"ERROR: {e}")
    import traceback
    _log(traceback.format_exc())
    raise
