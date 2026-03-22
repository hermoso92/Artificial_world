"""Módulo de entidades autónomas.

Reexporta desde core.entity para compatibilidad.
"""

from core.entity import EntidadBase, EntidadGato, EntidadSocial, FabricaEntidades

__all__ = ["EntidadBase", "EntidadSocial", "EntidadGato", "FabricaEntidades"]
