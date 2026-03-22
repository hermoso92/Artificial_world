"""
Tests para la crónica fundacional.

Verifica: ejecución headless reproducible, generación de artefactos,
presencia de metadata, hitos y veredicto.
"""

import json
import os
import sys
import tempfile

os.environ.setdefault("SDL_VIDEODRIVER", "dummy")
os.environ.setdefault("SDL_AUDIODRIVER", "dummy")
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def test_cronica_genera_archivos():
    """La crónica genera JSON y MD con estructura esperada."""
    import logging
    logging.disable(logging.CRITICAL)

    from configuracion import Configuracion
    from nucleo.simulacion import Simulacion
    from sistemas.cronica_fundacional import generar_cronica

    with tempfile.TemporaryDirectory() as tmp:
        cfg = Configuracion()
        cfg.semilla_aleatoria = 999
        cfg.nombre_fundador = "TestFundador"
        cfg.nombre_refugio = "TestRefugio"
        cfg.ticks_cronica = 30

        sim = Simulacion(cfg)
        sim.inicializar()
        sim.crear_mundo()
        sim.crear_entidades_iniciales()
        sim.sistema_persistencia = None

        for _ in range(30):
            sim._ejecutar_tick_completo()

        metadata = {
            "semilla": 999,
            "nombre_fundador": "TestFundador",
            "nombre_refugio": "TestRefugio",
            "semilla_civilizacion": "test",
        }
        ruta_json = os.path.join(tmp, "cronica.json")
        ruta_md = os.path.join(tmp, "cronica.md")

        cronica = generar_cronica(sim, metadata, 30, ruta_json=ruta_json, ruta_md=ruta_md)

        assert os.path.exists(ruta_json)
        assert os.path.exists(ruta_md)

        with open(ruta_json, encoding="utf-8") as f:
            data = json.load(f)

        assert data["version"] == 1
        assert "timestamp" in data
        assert data["metadata"]["semilla"] == 999
        assert data["metadata"]["nombre_fundador"] == "TestFundador"
        assert data["metadata"]["nombre_refugio"] == "TestRefugio"
        assert data["metadata"]["ticks_ejecutados"] == 30
        assert "hitos" in data and len(data["hitos"]) >= 2
        assert "entidades_finales" in data
        assert data["veredicto"] in ("supervivencia", "tension", "colapso")
        assert len(data["resumen"]) > 0

        with open(ruta_md, encoding="utf-8") as f:
            md = f.read()
        assert "Crónica Fundacional" in md
        assert "TestFundador" in md
        assert data["veredicto"] in md

    print("OK test_cronica_genera_archivos")


def test_cronica_reproducible_misma_semilla():
    """Misma semilla produce mismo veredicto y mismas entidades finales."""
    import logging
    logging.disable(logging.CRITICAL)

    from configuracion import Configuracion
    from nucleo.simulacion import Simulacion
    from sistemas.cronica_fundacional import generar_cronica

    cfg = Configuracion()
    cfg.semilla_aleatoria = 12345
    cfg.ticks_cronica = 40

    with tempfile.TemporaryDirectory() as tmp:
        rj = os.path.join(tmp, "c.json")
        rm = os.path.join(tmp, "c.md")

        def run_once():
            sim = Simulacion(cfg)
            sim.inicializar()
            sim.crear_mundo()
            sim.crear_entidades_iniciales()
            sim.sistema_persistencia = None
            for _ in range(40):
                sim._ejecutar_tick_completo()
            meta = {"semilla": 12345, "nombre_fundador": "X", "nombre_refugio": "Y", "semilla_civilizacion": "z"}
            c = generar_cronica(sim, meta, 40, ruta_json=rj, ruta_md=rm)
            return c.veredicto, tuple((e["nombre"], tuple(e["posicion"])) for e in c.entidades_finales)

        v1, e1 = run_once()
        v2, e2 = run_once()
        assert v1 == v2, f"Veredictos distintos: {v1} vs {v2}"
        assert e1 == e2, "Entidades finales distintas con misma semilla"
    print("OK test_cronica_reproducible_misma_semilla")


def test_script_cronica_ejecuta():
    """El script cronica_fundacional.py ejecuta sin error."""
    import subprocess
    result = subprocess.run(
        [sys.executable, "cronica_fundacional.py", "--ticks", "20", "--quiet"],
        cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        capture_output=True,
        text=True,
        timeout=60,
        env={**os.environ, "SDL_VIDEODRIVER": "dummy", "SDL_AUDIODRIVER": "dummy"},
    )
    assert result.returncode == 0, f"Script falló: {result.stderr}"
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    assert os.path.exists(os.path.join(base, "cronica_fundacional.json"))
    print("OK test_script_cronica_ejecuta")


if __name__ == "__main__":
    test_cronica_genera_archivos()
    test_cronica_reproducible_misma_semilla()
    test_script_cronica_ejecuta()
    print("Todas las pruebas de crónica pasaron.")
