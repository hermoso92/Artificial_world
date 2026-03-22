"""
AI: motor de decisión, percepción, directivas, relaciones.

Reexporta desde agentes/ durante la migración incremental.
"""

from agentes.directivas import GestorDirectivas
from agentes.estado_interno import EstadoInterno
from agentes.inventario import Inventario
from agentes.motor_decision import MotorDecision
from agentes.percepcion import SistemaPercepcion
from agentes.pesos_utilidad import obtener_utilidad_base
from agentes.relaciones import GestorRelaciones

__all__ = [
    "GestorDirectivas",
    "EstadoInterno",
    "Inventario",
    "MotorDecision",
    "SistemaPercepcion",
    "obtener_utilidad_base",
    "GestorRelaciones",
]
