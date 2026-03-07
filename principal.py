"""
Punto de entrada del proyecto MUNDO_ARTIFICIAL.

Uso:
  python principal.py          # Inicia la simulación pygame
  python principal.py --web     # Abre la landing en el navegador
  python principal.py --help    # Muestra ayuda
"""

import argparse
import sys

from utilidades.arranque import (
    abrir_landing_en_navegador,
    ejecutar_simulacion,
    log,
    mostrar_error_al_usuario,
    preparar_entorno,
)


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="MUNDO_ARTIFICIAL — Simulación 2D de agentes autónomos",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Ejemplos:
  python principal.py          Inicia la simulación (pygame)
  python principal.py --web     Abre la landing page en el navegador
        """,
    )
    parser.add_argument(
        "--web",
        action="store_true",
        help="Abre la landing page (artificial-world.html) en el navegador",
    )
    return parser.parse_args()


def main() -> int:
    """Punto de entrada principal."""
    log("Inicio principal.py")
    preparar_entorno()

    args = _parse_args()

    if args.web:
        abrir_landing_en_navegador()
        return 0

    ejecutar_simulacion()
    log("main() termino OK")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:
        mostrar_error_al_usuario(e)
