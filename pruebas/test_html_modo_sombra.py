"""
Test del HTML artificial-world.html: Modo Sombra, flechas, resto avanza.
Ejecutar: python pruebas/test_html_modo_sombra.py
          python pruebas/test_html_modo_sombra.py --visible   # navegador visible para debug
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
SLEEP = 0.4 if HEADLESS else 0.15


def _start_http_server():
    """Inicia servidor HTTP. Devuelve (server, url)."""
    os.chdir(ROOT)
    server = HTTPServer(("127.0.0.1", 0), SimpleHTTPRequestHandler)
    port = server.server_address[1]
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server, f"http://127.0.0.1:{port}/artificial-world.html"


def run_test():
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("Instala playwright: pip install playwright && python -m playwright install chromium")
        sys.exit(1)

    server = None
    try:
        server, url = _start_http_server()
    except Exception as e:
        print(f"Servidor HTTP falló ({e}), usando file://")
        url = HTML_PATH.as_uri()

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=HEADLESS)
            page = browser.new_page()

            # Cargar HTML
            try:
                page.goto(url, timeout=10000)
            except Exception:
                page.goto(HTML_PATH.as_uri(), timeout=10000)

            # Esperar a que cargue
            page.wait_for_selector("#simCanvas", timeout=5000)

            # Tick inicial
            tick0 = page.locator("#tickCount").text_content()
            print(f"Tick inicial: {tick0}")

            # Ir a pestaña Sombra
            page.click('[data-tab="sombra"]')
            time.sleep(SLEEP)

            # Activar Modo Sombra
            page.click("#btnActivarSombra")
            time.sleep(SLEEP)

            # Verificar que Modo Sombra está activo
            status = page.locator("#simStatus").text_content()
            assert "Sombra" in (status or ""), f"Estado esperado 'Modo Sombra', obtuve: {status}"
            print(f"Modo Sombra activo: {status}")

            tick1 = page.locator("#tickCount").text_content()
            eventLog = page.locator("#eventLog").inner_text()
            print(f"Tick tras activar: {tick1}")
            print(f"Eventos: {eventLog[:200] if eventLog else '(vacío)'}")

            # Pulsar flecha derecha
            page.keyboard.press("ArrowRight")
            time.sleep(SLEEP)
            tick2 = page.locator("#tickCount").text_content()
            eventLog2 = page.locator("#eventLog").inner_text()
            print(f"Tick tras ArrowRight: {tick2}")
            print(f"Eventos tras mover: {eventLog2[:300] if eventLog2 else '(vacío)'}")

            assert int(tick2 or 0) > int(tick1 or 0), f"Tick debería avanzar: {tick1} -> {tick2}"
            assert "movio" in (eventLog2 or "").lower() or "sombra" in (eventLog2 or "").lower(), \
                f"Debería haber evento de movimiento: {eventLog2}"

            # Pulsar Espacio (esperar)
            page.keyboard.press(" ")
            time.sleep(SLEEP)
            tick3 = page.locator("#tickCount").text_content()
            print(f"Tick tras Espacio: {tick3}")

            assert int(tick3 or 0) > int(tick2 or 0), f"Tick debería avanzar con Espacio: {tick2} -> {tick3}"

            # Pulsar varias flechas
            for _ in range(3):
                page.keyboard.press("ArrowUp")
                time.sleep(SLEEP)
            tick4 = page.locator("#tickCount").text_content()
            print(f"Tick tras 3x ArrowUp: {tick4}")

            assert int(tick4 or 0) >= int(tick3 or 0) + 3, \
                f"Ticks deberían avanzar: {tick3} + 3 <= {tick4}"

            browser.close()
        if server:
            try:
                server.shutdown()
            except Exception:
                pass
        print("\nOK: Modo Sombra funciona, flechas y Espacio avanzan tick, resto no bloqueado.")
        return True

    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()
        if server:
            try:
                server.shutdown()
            except Exception:
                pass
        return False


if __name__ == "__main__":
    ok = run_test()
    sys.exit(0 if ok else 1)
