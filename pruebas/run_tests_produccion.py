"""
Runner de tests para produccion.
Ejecuta todos los tests, loguea control total y genera reporte.

Uso: python pruebas/run_tests_produccion.py
Salida: reporte en pruebas/reporte_produccion.log y consola
"""

from __future__ import annotations

import os
import sys
import subprocess
import datetime
from pathlib import Path

# Configurar antes de cualquier import
os.environ.setdefault("SDL_VIDEODRIVER", "dummy")
os.environ.setdefault("SDL_AUDIODRIVER", "dummy")

PROYECTO = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROYECTO))

REPORTE_PATH = PROYECTO / "pruebas" / "reporte_produccion.log"

SUITES = [
    ("test_estructural", "pruebas/test_estructural.py", "Tests estructurales (imports, config, modulos)"),
    ("test_core", "pruebas/test_core.py", "Tests nucleo (motor, directivas, watchdog)"),
    ("test_modo_sombra_completo", "pruebas/test_modo_sombra_completo.py", "Tests Modo Sombra completo"),
    ("test_perseguir_hasta_matar", "pruebas/test_perseguir_hasta_matar.py", "Tests persecucion hasta matar (combate)"),
    ("test_interacciones_sociales", "pruebas/test_interacciones_sociales.py", "Tests interacciones sociales"),
    ("test_bug_robar", "pruebas/test_bug_robar.py", "Tests regresion robar"),
    ("test_watchdog_fixes", "pruebas/test_watchdog_fixes.py", "Tests fixes watchdog"),
    ("test_watchdog_integracion", "pruebas/test_watchdog_integracion.py", "Tests integracion watchdog"),
    ("test_arranque_limpio", "pruebas/test_arranque_limpio.py", "Test arranque limpio"),
    ("test_integracion_produccion", "pruebas/test_integracion_produccion.py", "Tests integracion produccion"),
]


def _log(msg: str, f: object) -> None:
    ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}\n"
    f.write(line)
    f.flush()
    print(msg, flush=True)


def _ejecutar_suite(nombre: str, script: str, desc: str, log_file) -> tuple[bool, str]:
    """Ejecuta una suite y devuelve (exito, salida)."""
    ruta = PROYECTO / script
    if not ruta.exists():
        return False, f"Script no encontrado: {ruta}"
    try:
        env = {
            **os.environ,
            "SDL_VIDEODRIVER": "dummy",
            "SDL_AUDIODRIVER": "dummy",
            "PYTHONWARNINGS": "ignore::UserWarning",
        }
        result = subprocess.run(
            [sys.executable, "-W", "ignore::UserWarning", str(ruta)],
            cwd=str(PROYECTO),
            capture_output=True,
            text=True,
            timeout=120,
            env=env,
        )
        out = result.stdout + result.stderr
        if result.returncode != 0:
            return False, out or f"Exit code {result.returncode}"
        return True, out
    except subprocess.TimeoutExpired:
        return False, "TIMEOUT 120s"
    except Exception as e:
        return False, str(e)


def main() -> int:
    inicio = datetime.datetime.now()
    resultados: list[tuple[str, bool, str]] = []

    with open(REPORTE_PATH, "w", encoding="utf-8") as log:
        _log("=" * 70, log)
        _log("MUNDO_ARTIFICIAL - TESTS PRODUCCION", log)
        _log(f"Inicio: {inicio.isoformat()}", log)
        _log("=" * 70, log)

        for nombre, script, desc in SUITES:
            _log(f"\n--- {nombre}: {desc} ---", log)
            ok, salida = _ejecutar_suite(nombre, script, desc, log)
            resultados.append((nombre, ok, salida))

            if ok:
                _log(f"OK {nombre}", log)
                # Resumen de salida (ultimas lineas)
                lineas = [l for l in salida.strip().split("\n") if l and "OK" in l or "pasaron" in l or "PASADOS" in l][-5:]
                for l in lineas:
                    _log(f"  {l}", log)
            else:
                _log(f"FAIL {nombre}", log)
                for l in salida.strip().split("\n")[-30:]:
                    _log(f"  {l}", log)

        # Resumen final
        fin = datetime.datetime.now()
        duracion = (fin - inicio).total_seconds()
        ok_count = sum(1 for _, ok, _ in resultados if ok)
        fail_count = len(resultados) - ok_count

        _log("\n" + "=" * 70, log)
        _log("RESUMEN", log)
        _log(f"Suites: {ok_count} OK, {fail_count} FAIL de {len(resultados)}", log)
        _log(f"Duracion: {duracion:.1f}s", log)
        _log(f"Reporte: {REPORTE_PATH}", log)
        _log("=" * 70, log)

        if fail_count > 0:
            _log("\nSUITES FALLIDAS:", log)
            for nombre, ok, salida in resultados:
                if not ok:
                    _log(f"  - {nombre}", log)
            return 1
        return 0


if __name__ == "__main__":
    sys.exit(main())
