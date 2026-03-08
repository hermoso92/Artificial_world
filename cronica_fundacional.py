"""
Ejecuta una sesión fundacional headless y genera la crónica.

Uso:
  python cronica_fundacional.py
  python cronica_fundacional.py --seed 123 --ticks 300
  python cronica_fundacional.py --founder "Elena" --refuge "Torre del Alba"
"""

import argparse
import logging
import os
import sys

# Headless para Pygame
os.environ.setdefault("SDL_VIDEODRIVER", "dummy")
os.environ.setdefault("SDL_AUDIODRIVER", "dummy")

# Raíz del proyecto
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Crónica fundacional — Simulación headless reproducible",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Ejemplos:
  python cronica_fundacional.py
  python cronica_fundacional.py --seed 42 --ticks 400
  python cronica_fundacional.py --founder Elena --refuge Torre del Alba
        """,
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=None,
        help="Semilla de simulación (default: config)",
    )
    parser.add_argument(
        "--founder",
        type=str,
        default=None,
        help="Nombre del fundador",
    )
    parser.add_argument(
        "--refuge",
        type=str,
        default=None,
        help="Nombre del refugio fundador",
    )
    parser.add_argument(
        "--civilization",
        type=str,
        default=None,
        help="ID de semilla de civilización",
    )
    parser.add_argument(
        "--ticks",
        type=int,
        default=None,
        help="Número de ticks a ejecutar",
    )
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="Menos salida por consola",
    )
    return parser.parse_args()


def main() -> int:
    """Punto de entrada."""
    args = _parse_args()
    if args.quiet:
        logging.disable(logging.CRITICAL)

    from configuracion import Configuracion
    from nucleo.simulacion import Simulacion
    from sistemas.sistema_logging_reporte import configurar_logging
    from sistemas.cronica_fundacional import generar_cronica

    configurar_logging(
        nivel="WARNING",
        log_estructurado=False,
        log_consola=not args.quiet,
    )

    cfg = Configuracion()
    if args.seed is not None:
        cfg.semilla_aleatoria = args.seed
    if args.founder is not None:
        cfg.nombre_fundador = args.founder
    if args.refuge is not None:
        cfg.nombre_refugio = args.refuge
    if args.civilization is not None:
        cfg.semilla_civilizacion = args.civilization
    if args.ticks is not None:
        cfg.ticks_cronica = args.ticks

    ticks_max = cfg.ticks_cronica
    metadata = {
        "semilla": cfg.semilla_aleatoria,
        "nombre_fundador": cfg.nombre_fundador,
        "nombre_refugio": cfg.nombre_refugio,
        "semilla_civilizacion": cfg.semilla_civilizacion,
    }

    if not args.quiet:
        print("Crónica fundacional — Iniciando...")
        print(f"  Semilla: {cfg.semilla_aleatoria}")
        print(f"  Fundador: {cfg.nombre_fundador}")
        print(f"  Refugio: {cfg.nombre_refugio}")
        print(f"  Ticks: {ticks_max}")

    sim = Simulacion(cfg)
    sim.inicializar()
    sim.crear_mundo()
    sim.crear_entidades_iniciales()
    sim.sistema_persistencia = None  # No guardar mundo durante cronica

    for _ in range(ticks_max):
        sim._ejecutar_tick_completo()

    cronica = generar_cronica(sim, metadata, ticks_max)

    if not args.quiet:
        print("")
        print("Crónica generada:")
        print(f"  Veredicto: {cronica.veredicto}")
        print(f"  Resumen: {cronica.resumen[:100]}...")
        print("  Archivos: cronica_fundacional.json, cronica_fundacional.md")

    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
