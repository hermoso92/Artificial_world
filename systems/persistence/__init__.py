"""
Persistence: guardado y carga del estado.

Reexporta desde sistemas.sistema_persistencia durante la migración incremental.
"""

from sistemas.sistema_persistencia import SistemaPersistencia

__all__ = ["SistemaPersistencia"]
