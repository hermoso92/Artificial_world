"""
Configuración compartida para tests de navegador (Playwright).

Uso: importar desde test_html_*.py
"""

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HTML_PATH = ROOT / "artificial-world.html"


def get_html_url(port: int | None = None) -> str:
    """Devuelve URL para cargar artificial-world.html."""
    if port is not None:
        return f"http://127.0.0.1:{port}/artificial-world.html"
    return HTML_PATH.as_uri()


def check_playwright() -> bool:
    """Comprueba si Playwright está instalado."""
    try:
        from playwright.sync_api import sync_playwright
        return True
    except ImportError:
        return False
