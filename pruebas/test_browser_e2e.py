"""
Suite E2E de tests para artificial-world.html con Playwright.

Ejecutar: python pruebas/test_browser_e2e.py
          python pruebas/test_browser_e2e.py --visible   # navegador visible

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
SLEEP = 0.3 if HEADLESS else 0.2


def _start_server():
    """Inicia servidor HTTP en puerto aleatorio. Devuelve (server, port)."""
    os.chdir(ROOT)
    server = HTTPServer(("127.0.0.1", 0), SimpleHTTPRequestHandler)
    port = server.server_address[1]
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server, port


def _run_tests():
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("Instala: pip install playwright && python -m playwright install chromium")
        return False, 0, 1

    server, port = _start_server()
    url = f"http://127.0.0.1:{port}/artificial-world.html"
    passed = 0
    failed = 0

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=HEADLESS)
            page = browser.new_page()
            page.set_default_timeout(8000)

            try:
                page.goto(url, timeout=10000)
            except Exception:
                page.goto(HTML_PATH.as_uri(), timeout=10000)

            page.wait_for_selector("#simCanvas", timeout=5000)

            # --- Test 1: Canvas y tick inicial ---
            try:
                tick0 = page.locator("#tickCount").text_content()
                assert tick0 is not None
                print(f"  OK: Canvas cargado, tick={tick0}")
                passed += 1
            except Exception as e:
                print(f"  FAIL: Canvas/tick inicial: {e}")
                failed += 1

            # --- Test 2: Iniciar simulación ---
            try:
                page.click("#btnPlay")
                time.sleep(SLEEP * 2)
                status = page.locator("#simStatus").text_content()
                assert status and "Pausado" not in status
                tick1 = page.locator("#tickCount").text_content()
                assert int(tick1 or 0) >= 0
                print(f"  OK: Play iniciado, status={status}, tick={tick1}")
                passed += 1
            except Exception as e:
                print(f"  FAIL: Iniciar simulación: {e}")
                failed += 1

            # --- Test 3: Modo Sombra ---
            try:
                page.click('[data-tab="sombra"]')
                time.sleep(SLEEP)
                page.click("#btnActivarSombra")
                time.sleep(SLEEP)
                status = page.locator("#simStatus").text_content()
                assert "Sombra" in (status or ""), f"Estado: {status}"
                print(f"  OK: Modo Sombra activo")
                passed += 1
            except Exception as e:
                print(f"  FAIL: Modo Sombra: {e}")
                failed += 1

            # --- Test 4: Flechas avanzan tick ---
            try:
                tick_before = int(page.locator("#tickCount").text_content() or 0)
                page.keyboard.press("ArrowRight")
                time.sleep(SLEEP)
                tick_after = int(page.locator("#tickCount").text_content() or 0)
                assert tick_after > tick_before, f"Tick no avanzó: {tick_before} -> {tick_after}"
                print(f"  OK: Flecha avanza tick ({tick_before} -> {tick_after})")
                passed += 1
            except Exception as e:
                print(f"  FAIL: Flechas: {e}")
                failed += 1

            # --- Test 5: Espacio (esperar) ---
            try:
                tick_before = int(page.locator("#tickCount").text_content() or 0)
                page.keyboard.press(" ")
                time.sleep(SLEEP)
                tick_after = int(page.locator("#tickCount").text_content() or 0)
                assert tick_after > tick_before
                print(f"  OK: Espacio avanza tick")
                passed += 1
            except Exception as e:
                print(f"  FAIL: Espacio: {e}")
                failed += 1

            # --- Test 6: Pestañas ---
            try:
                for tab in ["entidades", "eventos", "archivo", "control"]:
                    page.click(f'[data-tab="{tab}"]')
                    time.sleep(SLEEP * 0.5)
                page.click('[data-tab="sombra"]')
                print(f"  OK: Pestañas navegables")
                passed += 1
            except Exception as e:
                print(f"  FAIL: Pestañas: {e}")
                failed += 1

            # --- Test 7: Reset ---
            try:
                page.click('[data-tab="control"]')
                time.sleep(SLEEP)
                page.click("#btnReset")
                time.sleep(SLEEP)
                tick_reset = page.locator("#tickCount").text_content()
                assert tick_reset == "0" or int(tick_reset or 0) == 0
                print(f"  OK: Reset funciona")
                passed += 1
            except Exception as e:
                print(f"  FAIL: Reset: {e}")
                failed += 1

            browser.close()
    finally:
        try:
            server.shutdown()
        except Exception:
            pass

    return (failed == 0, passed, failed)


if __name__ == "__main__":
    print("=" * 60)
    print("TESTS E2E NAVEGADOR - artificial-world.html")
    print("=" * 60)
    ok, p, f = _run_tests()
    print("=" * 60)
    print(f"Resultado: {p} OK, {f} FAIL")
    print("=" * 60)
    sys.exit(0 if ok else 1)
