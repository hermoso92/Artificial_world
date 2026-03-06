"""Módulo de entidades autónomas."""

from .entidad_base import EntidadBase
from .entidad_social import EntidadSocial
from .entidad_gato import EntidadGato
from .fabrica_entidades import FabricaEntidades

__all__ = ["EntidadBase", "EntidadSocial", "EntidadGato", "FabricaEntidades"]
