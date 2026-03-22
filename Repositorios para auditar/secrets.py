"""
Carga segura de secretos desde variables de entorno o .env.
NUNCA hardcodear API keys en el código.
"""

import os
from pathlib import Path

# Cargar .env si existe (python-dotenv)
try:
    from dotenv import load_dotenv
    _env_path = Path(__file__).resolve().parent.parent / ".env"
    if _env_path.exists():
        load_dotenv(_env_path)
except ImportError:
    pass  # python-dotenv opcional


def obtener_secreto(nombre: str, default: str | None = None) -> str | None:
    """
    Obtiene un secreto desde variable de entorno.
    Ejemplo: obtener_secreto("OPENAI_API_KEY")
    """
    return os.environ.get(nombre, default)


def obtener_secreto_requerido(nombre: str) -> str:
    """
    Obtiene un secreto o lanza ValueError si no existe.
    Usar para APIs que son obligatorias en producción.
    """
    val = os.environ.get(nombre)
    if not val or not val.strip():
        raise ValueError(f"Variable de entorno requerida no definida: {nombre}")
    return val.strip()
