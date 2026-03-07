"""
Directives: directivas externas que modifican el comportamiento.

Reexporta desde agentes.directivas durante la migración incremental.
"""

from agentes.directivas import GestorDirectivas

__all__ = ["GestorDirectivas"]
