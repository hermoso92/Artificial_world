"""
Entity: personajes, mascotas, NPCs, agentes.

Implementación en core; entidades/ reexporta para compatibilidad.
"""

from .entidad_base import EntidadBase
from .entidad_gato import EntidadGato
from .entidad_social import EntidadSocial
from .fabrica_entidades import FabricaEntidades

__all__ = ["EntidadBase", "EntidadGato", "EntidadSocial", "FabricaEntidades"]
