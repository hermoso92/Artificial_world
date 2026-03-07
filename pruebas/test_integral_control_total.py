"""
Test integral del control total (modo sombra): verifica que la comida/material
desaparezca al recoger en TODAS las formas posibles (WASD, clic, botón recoger).

Ejecutar: python pruebas/test_integral_control_total.py
          python pruebas/test_integral_control_total.py --visible

Requiere: pip install playwright && python -m playwright install chromium
"""

import os
import sys
import time
import threading
from pathlib import Path
from http.server import HTTPServer, SimpleHTTPRequestHandler

ROOT = Path(__file__).resolve().parent.parent
HTML_PATH = ROOT / "artificial-world.html"

if not HTML_PATH.exists():
    print("ERROR: No existe artificial-world.html")
    sys.exit(1)

HEADLESS = "--visible" not in sys.argv
SLEEP = 0.25 if HEADLESS else 0.15


def _start_server():
    os.chdir(ROOT)
    server = HTTPServer(("127.0.0.1", 0), SimpleHTTPRequestHandler)
    port = server.server_address[1]
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server, f"http://127.0.0.1:{port}/artificial-world.html"


def run_tests():
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("Instala: pip install playwright && python -m playwright install chromium")
        return False, 0, 1

    server = None
    try:
        server, url = _start_server()
    except Exception as e:
        print(f"Servidor HTTP falló ({e}), usando file://")
        url = HTML_PATH.as_uri()

    passed = 0
    failed = 0

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=HEADLESS)
            page = browser.new_page()
            page.set_default_timeout(10000)

            try:
                page.goto(url, timeout=10000)
            except Exception:
                page.goto(HTML_PATH.as_uri(), timeout=10000)

            page.wait_for_selector("#simCanvas", timeout=5000)
            time.sleep(SLEEP * 2)  # Dejar que init() termine

            # Verificar que existe API de test
            has_api = page.evaluate("typeof window.__awTest !== 'undefined'")
            if not has_api:
                print("  FAIL: No existe window.__awTest (API de test)")
                failed += 1
                browser.close()
                return (failed == 0, passed, failed)

            # --- Test 1: Recoger con triggerRecoger (agente encima de comida) ---
            try:
                page.click('[data-tab="sombra"]')
                time.sleep(SLEEP)
                page.click("#btnActivarSombra")
                time.sleep(SLEEP)

                state = page.evaluate("window.__awTest.getState()")
                foods = state["foods"]
                agent_id = state["entidadSombraId"]
                agent = next(a for a in state["agents"] if a["id"] == agent_id)
                inv_antes = agent["inventario"]["comida"]

                # Buscar comida no recogida
                food = next((f for f in foods if not f["collected"]), None)
                assert food, "No hay comida disponible para test"

                # Teleportar agente encima de la comida
                page.evaluate(
                    f"window.__awTest.setAgentPos({agent_id}, {food['x']}, {food['y']})"
                )
                page.evaluate(f"window.__awTest.triggerRecoger({agent_id})")
                time.sleep(SLEEP)

                state2 = page.evaluate("window.__awTest.getState()")
                food_after = next(f for f in state2["foods"] if f["id"] == food["id"])
                agent2 = next(a for a in state2["agents"] if a["id"] == agent_id)

                assert food_after["collected"], f"Comida debería estar collected: {food_after}"
                assert agent2["inventario"]["comida"] == inv_antes + 1, (
                    f"Inventario debería tener +1 comida: {inv_antes} -> {agent2['inventario']['comida']}"
                )
                print("  OK: Recoger en posición (triggerRecoger) - comida desaparece")
                passed += 1
            except Exception as e:
                print(f"  FAIL: Recoger triggerRecoger: {e}")
                failed += 1

            # --- Test 2: Recoger con WASD (mover sobre comida) ---
            try:
                page.click('[data-tab="control"]')
                time.sleep(SLEEP)
                page.click("#btnReset")
                time.sleep(SLEEP)
                page.click('[data-tab="sombra"]')
                page.click("#btnActivarSombra")
                time.sleep(SLEEP)

                state = page.evaluate("window.__awTest.getState()")
                foods = state["foods"]
                agent_id = state["entidadSombraId"]
                food = next((f for f in foods if not f["collected"]), None)
                assert food, "No hay comida para test WASD"

                # Posicionar agente 20px a la izquierda de la comida (step=20 en WASD)
                page.evaluate(
                    f"window.__awTest.setAgentPos({agent_id}, {food['x'] - 20}, {food['y']})"
                )
                time.sleep(SLEEP)

                # Pulsar flecha derecha = mover 20px a la derecha = caer sobre la comida
                page.keyboard.press("ArrowRight")
                time.sleep(SLEEP)

                state2 = page.evaluate("window.__awTest.getState()")
                food_after = next(f for f in state2["foods"] if f["id"] == food["id"])
                agent2 = next(a for a in state2["agents"] if a["id"] == agent_id)

                assert food_after["collected"], (
                    f"Comida debería recogerse con WASD: collected={food_after['collected']}"
                )
                assert agent2["inventario"]["comida"] >= 1, (
                    f"Inventario debería tener comida tras WASD: {agent2['inventario']}"
                )
                print("  OK: Recoger con WASD - comida desaparece al pasar encima")
                passed += 1
            except Exception as e:
                print(f"  FAIL: Recoger WASD: {e}")
                failed += 1

            # --- Test 3: Botón Recoger (flujo existente) ---
            try:
                page.click('[data-tab="control"]')
                time.sleep(SLEEP)
                page.click("#btnReset")
                time.sleep(SLEEP)
                page.click('[data-tab="sombra"]')
                page.click("#btnActivarSombra")
                time.sleep(SLEEP)

                state = page.evaluate("window.__awTest.getState()")
                food = next((f for f in state["foods"] if not f["collected"]), None)
                agent_id = state["entidadSombraId"]
                # Posicionar agente al lado de comida (dentro de collectRadius)
                if food:
                    page.evaluate(
                        f"window.__awTest.setAgentPos({agent_id}, {food['x']}, {food['y']})"
                    )
                    time.sleep(SLEEP)
                # Un clic en Recoger debería recoger si ya está encima
                page.click("#btnRecoger")
                time.sleep(SLEEP)

                state = page.evaluate("window.__awTest.getState()")
                collected = sum(1 for f in state["foods"] if f["collected"])
                agent = next(
                    a for a in state["agents"] if a["id"] == state["entidadSombraId"]
                )
                assert collected >= 1 or agent["inventario"]["comida"] >= 1, (
                    "Botón Recoger debería recoger al menos 1 comida"
                )
                print("  OK: Botón Recoger - flujo correcto")
                passed += 1
            except Exception as e:
                print(f"  FAIL: Botón Recoger: {e}")
                failed += 1

            # --- Test 4: Contador UI comida vs estado real ---
            try:
                state = page.evaluate("window.__awTest.getState()")
                real_count = sum(1 for f in state["foods"] if not f["collected"])
                ui_count = int(page.locator("#foodCount").text_content() or 0)
                assert real_count == ui_count, (
                    f"UI foodCount ({ui_count}) debería coincidir con estado ({real_count})"
                )
                print("  OK: Contador UI comida coherente con estado")
                passed += 1
            except Exception as e:
                print(f"  FAIL: Contador UI: {e}")
                failed += 1

            browser.close()
    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()
        failed += 1
    finally:
        if server:
            try:
                server.shutdown()
            except Exception:
                pass

    return (failed == 0, passed, failed)


if __name__ == "__main__":
    print("=" * 60)
    print("TEST INTEGRAL - Control total, recoger comida en todas las formas")
    print("=" * 60)
    ok, p, f = run_tests()
    print("=" * 60)
    print(f"Resultado: {p} OK, {f} FAIL")
    print("=" * 60)
    sys.exit(0 if ok else 1)
