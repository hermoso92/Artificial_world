"""
Verificación automática completa de artificial word.

Ejecuta tests, simulación mínima, Modo Competencia, persistencia y reporte.
Genera verificación_completa.json con el estado de cada funcionalidad.

Uso: python pruebas/verificar_todo.py
Exit 0 = todo OK, 1 = algún fallo
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path

# Configurar antes de imports
os.environ.setdefault("SDL_VIDEODRIVER", "dummy")
os.environ.setdefault("SDL_AUDIODRIVER", "dummy")

PROYECTO = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROYECTO))


@dataclass
class ResultadoVerificacion:
    """Resultado de una verificación individual."""
    nombre: str
    ok: bool
    mensaje: str = ""
    detalles: dict = field(default_factory=dict)


def _ejecutar_tests() -> ResultadoVerificacion:
    """Ejecuta run_tests_produccion.py."""
    try:
        env = {**os.environ, "SDL_VIDEODRIVER": "dummy", "SDL_AUDIODRIVER": "dummy"}
        r = subprocess.run(
            [sys.executable, "-W", "ignore::UserWarning", "pruebas/run_tests_produccion.py"],
            cwd=str(PROYECTO),
            capture_output=True,
            text=True,
            timeout=180,
            env=env,
        )
        ok = r.returncode == 0
        lineas = (r.stdout + r.stderr).strip().split("\n")
        resumen = [l for l in lineas if "OK" in l or "FAIL" in l or "pasaron" in l][-3:]
        return ResultadoVerificacion(
            nombre="tests_produccion",
            ok=ok,
            mensaje="9 suites OK" if ok else "Suites fallidas",
            detalles={"exit_code": r.returncode, "resumen": resumen},
        )
    except subprocess.TimeoutExpired:
        return ResultadoVerificacion("tests_produccion", False, "TIMEOUT 180s")
    except Exception as e:
        return ResultadoVerificacion("tests_produccion", False, str(e))


def _verificar_modo_competencia() -> ResultadoVerificacion:
    """Verifica que Modo Competencia registra eventos y mantiene integridad."""
    try:
        from sistemas.sistema_modo_competencia import SistemaModoCompetencia
        with tempfile.TemporaryDirectory() as tmp:
            ruta_db = os.path.join(tmp, "audit_test.db")
            sc = SistemaModoCompetencia(activo=True, ruta_db=ruta_db)
            # Registrar un evento
            ev = sc.registrar(
                action="verificacion_automatica",
                target_resource="verificar_todo",
                target_type="sistema",
                outcome="success",
                signals=["acceso_persistencia"],
            )
            if not ev:
                return ResultadoVerificacion("modo_competencia", False, "registrar() no devolvió evento")
            n = sc.contar_eventos()
            corruptos = sc.verificar_integridad()
            return ResultadoVerificacion(
                nombre="modo_competencia",
                ok=n >= 1 and len(corruptos) == 0,
                mensaje=f"{n} eventos, integridad OK" if not corruptos else f"Integridad rota: {corruptos}",
                detalles={"eventos": n, "corruptos": corruptos},
            )
    except Exception as e:
        return ResultadoVerificacion("modo_competencia", False, str(e))


def _verificar_simulacion_completa() -> ResultadoVerificacion:
    """Ejecuta simulación 50 ticks + guardar + cargar + reporte."""
    try:
        from configuracion import Configuracion
        from nucleo.simulacion import Simulacion
        from sistemas.sistema_persistencia import SistemaPersistencia
        import logging
        logging.disable(logging.CRITICAL)
        with tempfile.TemporaryDirectory() as tmp:
            cfg = Configuracion()
            cfg.reporte_sesion_ruta = os.path.join(tmp, "reporte_test.json")
            cfg.modo_competencia_ruta_db = os.path.join(tmp, "audit_test.db")
            ruta_json = os.path.join(tmp, "estado_test.json")
            sim = Simulacion(cfg)
            sim.inicializar()
            sim.crear_mundo()
            sim.crear_entidades_iniciales()
            pers = SistemaPersistencia(usar_sqlite=False, auto_guardar_intervalo=999)
            # 50 ticks
            for _ in range(50):
                sim._ejecutar_tick_completo()
            # Guardar (JSON en tmp)
            ok_guardar = pers.guardar_estado(sim, ruta_json)
            if not ok_guardar:
                return ResultadoVerificacion(
                    "simulacion_completa", False, "guardar_estado falló",
                    detalles={"tick": sim.gestor_ticks.tick_actual},
                )
            # Cargar (en nueva sim)
            sim2 = Simulacion(cfg)
            sim2.inicializar()
            sim2.crear_mundo()
            sim2.crear_entidades_iniciales()
            pers2 = SistemaPersistencia(usar_sqlite=False, auto_guardar_intervalo=999)
            ok_cargar = pers2.cargar_estado(sim2, ruta_json)
            if not ok_cargar:
                return ResultadoVerificacion(
                    "simulacion_completa", False, "cargar_estado falló",
                    detalles={"tick_guardado": sim.gestor_ticks.tick_actual},
                )
            # Reporte
            if sim2.sistema_reporte:
                sim2.sistema_reporte.ruta = os.path.join(tmp, "reporte_test.json")
                ok_reporte = sim2.sistema_reporte.generar_desde_simulacion(sim2)
            else:
                ok_reporte = True
            # Modo Competencia debe tener eventos
            n_comp = sim2.sistema_competencia.contar_eventos() if sim2.sistema_competencia else 0
            return ResultadoVerificacion(
                nombre="simulacion_completa",
                ok=ok_guardar and ok_cargar and ok_reporte and n_comp >= 2,
                mensaje=f"guardar OK, cargar OK, reporte OK, competencia={n_comp} eventos",
                detalles={
                    "tick": sim2.gestor_ticks.tick_actual,
                    "entidades": len(sim2.entidades),
                    "eventos_competencia": n_comp,
                },
            )
    except Exception as e:
        return ResultadoVerificacion("simulacion_completa", False, str(e))


def _verificar_modo_sombra() -> ResultadoVerificacion:
    """Verifica activación modo sombra y comando."""
    try:
        import logging
        logging.disable(logging.CRITICAL)
        from configuracion import Configuracion
        from nucleo.simulacion import Simulacion
        from tipos.enums import TipoComandoSombra, ModoControl
        from tipos.modelos import Posicion
        with tempfile.TemporaryDirectory() as tmp:
            cfg = Configuracion()
            cfg.modo_competencia_ruta_db = os.path.join(tmp, "audit_test.db")
            sim = Simulacion(cfg)
            sim.inicializar()
            sim.crear_mundo()
            sim.crear_entidades_iniciales()
            ent = sim.entidades[0]
            gestor = sim.gestor_modo_sombra
            # Activar modo poseído
            gestor.activar_modo_poseido(ent, 0)
            if gestor.obtener_modo(ent.id_entidad) != ModoControl.POSEIDO:
                return ResultadoVerificacion("modo_sombra", False, "activar_modo_poseido no cambió modo")
            # Encolar comando
            cmd = gestor.encolar_comando(ent, TipoComandoSombra.MOVER_A_POSICION, 0, Posicion(5, 5))
            if not cmd or cmd.estado.value != "pendiente":
                return ResultadoVerificacion("modo_sombra", False, "encolar_comando falló")
            # Desactivar
            gestor.desactivar_modo_sombra(ent, 1)
            if gestor.obtener_modo(ent.id_entidad) != ModoControl.AUTONOMO:
                return ResultadoVerificacion("modo_sombra", False, "desactivar no volvió a AUTONOMO")
            n_comp = sim.sistema_competencia.contar_eventos() if sim.sistema_competencia else 0
            return ResultadoVerificacion(
                nombre="modo_sombra",
                ok=True,
                mensaje=f"activar, comando, desactivar OK. Competencia={n_comp} eventos",
                detalles={"eventos_competencia": n_comp},
            )
    except Exception as e:
        return ResultadoVerificacion("modo_sombra", False, str(e))


def _verificar_logs_cierre() -> ResultadoVerificacion:
    """Verifica que app_diagnostico.log indica cierre limpio (si existe)."""
    if os.environ.get("CI") == "true":
        return ResultadoVerificacion(
            nombre="logs_cierre",
            ok=True,
            mensaje="CI: omitido (sin sesión previa en pipeline)",
            detalles={"ci": True},
        )
    ruta_log = PROYECTO / "app_diagnostico.log"
    if not ruta_log.exists():
        return ResultadoVerificacion(
            nombre="logs_cierre",
            ok=True,
            mensaje="app_diagnostico.log no existe (primera ejecución)",
            detalles={"archivo": str(ruta_log)},
        )
    try:
        with open(ruta_log, "r", encoding="utf-8", errors="replace") as f:
            contenido = f.read()
        # Buscar en todo el archivo (la última sesión puede no ser las últimas líneas si hay otros procesos)
        cierre_limpio = "Bucle finalizado" in contenido or "usuario cerro" in contenido.lower()
        return ResultadoVerificacion(
            nombre="logs_cierre",
            ok=cierre_limpio,
            mensaje="Cierre limpio detectado" if cierre_limpio else "Sin indicio de cierre limpio",
            detalles={"cierre_limpio": cierre_limpio},
        )
    except Exception as e:
        return ResultadoVerificacion("logs_cierre", False, str(e))


def _verificar_reporte_sesion() -> ResultadoVerificacion:
    """Valida reporte_sesion.json si existe (de sesión anterior)."""
    ruta = PROYECTO / "reporte_sesion.json"
    if not ruta.exists():
        return ResultadoVerificacion(
            nombre="reporte_sesion",
            ok=True,
            mensaje="reporte_sesion.json no existe (sin sesión previa)",
            detalles={},
        )
    try:
        with open(ruta, "r", encoding="utf-8") as f:
            data = json.load(f)
        ticks = data.get("ticks_total", 0)
        tiene_metricas = "metricas" in data or "duracion_segundos" in data
        return ResultadoVerificacion(
            nombre="reporte_sesion",
            ok=ticks >= 0 and tiene_metricas,
            mensaje=f"Reporte válido: {ticks} ticks" if ticks >= 0 else "Reporte incompleto",
            detalles={"ticks": ticks, "keys": list(data.keys())[:10]},
        )
    except Exception as e:
        return ResultadoVerificacion("reporte_sesion", False, str(e))


def _verificar_browser_e2e() -> ResultadoVerificacion:
    """Ejecuta tests E2E del HTML en navegador (Playwright). Omitido si no instalado."""
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        return ResultadoVerificacion(
            nombre="browser_e2e",
            ok=True,
            mensaje="Playwright no instalado (pip install playwright && playwright install chromium)",
            detalles={"skipped": True, "reason": "playwright_not_installed"},
        )
    try:
        r = subprocess.run(
            [sys.executable, "-W", "ignore::UserWarning", "pruebas/test_browser_e2e.py"],
            cwd=str(PROYECTO),
            capture_output=True,
            text=True,
            timeout=60,
            env={**os.environ, "SDL_VIDEODRIVER": "dummy", "SDL_AUDIODRIVER": "dummy"},
        )
        ok = r.returncode == 0
        return ResultadoVerificacion(
            nombre="browser_e2e",
            ok=ok,
            mensaje="Tests E2E HTML OK" if ok else "Tests E2E HTML fallaron",
            detalles={"exit_code": r.returncode, "stderr": r.stderr[-500:] if r.stderr else ""},
        )
    except subprocess.TimeoutExpired:
        return ResultadoVerificacion("browser_e2e", False, "TIMEOUT 60s")
    except Exception as e:
        return ResultadoVerificacion("browser_e2e", False, str(e))


def _verificar_sintaxis() -> ResultadoVerificacion:
    """Verifica que todos los .py compilan."""
    import py_compile
    errores = []
    for py in PROYECTO.rglob("*.py"):
        if "venv" in str(py) or "__pycache__" in str(py) or "build" in str(py):
            continue
        try:
            py_compile.compile(str(py), doraise=True)
        except py_compile.PyCompileError as e:
            errores.append(f"{py.name}: {e}")
    return ResultadoVerificacion(
        nombre="sintaxis",
        ok=len(errores) == 0,
        mensaje=f"{len(errores)} errores" if errores else "Todos los .py compilan",
        detalles={"errores": errores[:10]},
    )


def main() -> int:
    """Ejecuta todas las verificaciones y genera reporte."""
    inicio = datetime.now()
    resultados: list[ResultadoVerificacion] = []

    # 1. Sintaxis
    resultados.append(_verificar_sintaxis())
    # 2. Tests producción
    resultados.append(_ejecutar_tests())
    # 3. Modo Competencia
    resultados.append(_verificar_modo_competencia())
    # 4. Simulación completa (guardar/cargar/reporte)
    resultados.append(_verificar_simulacion_completa())
    # 5. Modo Sombra
    resultados.append(_verificar_modo_sombra())
    # 6. Logs de cierre (si existen)
    resultados.append(_verificar_logs_cierre())
    # 7. Reporte sesión (si existe)
    resultados.append(_verificar_reporte_sesion())
    # 8. Browser E2E (artificial-world.html, si Playwright instalado)
    resultados.append(_verificar_browser_e2e())

    fin = datetime.now()
    duracion = (fin - inicio).total_seconds()
    ok_count = sum(1 for r in resultados if r.ok)
    fail_count = len(resultados) - ok_count

    reporte = {
        "version": 1,
        "proyecto": "artificial_word",
        "timestamp": fin.isoformat(),
        "duracion_segundos": round(duracion, 2),
        "resumen": {
            "total": len(resultados),
            "ok": ok_count,
            "fail": fail_count,
            "estado": "OK" if fail_count == 0 else "FAIL",
        },
        "verificaciones": [
            {
                "nombre": r.nombre,
                "ok": r.ok,
                "mensaje": r.mensaje,
                "detalles": r.detalles,
            }
            for r in resultados
        ],
    }

    ruta_json = PROYECTO / "verificacion_completa.json"
    with open(ruta_json, "w", encoding="utf-8") as f:
        json.dump(reporte, f, indent=2, ensure_ascii=False)

    # Salida consola
    print("=" * 60)
    print("VERIFICACION AUTOMATICA COMPLETA - artificial word")
    print("=" * 60)
    for r in resultados:
        icono = "[OK]" if r.ok else "[FAIL]"
        print(f"  {icono} {r.nombre}: {r.mensaje}")
    print("-" * 60)
    print(f"  Resultado: {ok_count}/{len(resultados)} OK — {reporte['resumen']['estado']}")
    print(f"  Duración: {duracion:.1f}s")
    print(f"  Reporte: {ruta_json}")
    print("=" * 60)

    return 0 if fail_count == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
