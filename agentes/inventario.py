"""
Inventario de recursos de una entidad.
"""

from tipos.enums import TipoRecurso


class Inventario:
    """Almacena comida y material de una entidad."""

    def __init__(self, comida: int = 0, material: int = 0):
        self.comida = comida
        self.material = material

    def agregar(self, tipo_recurso: TipoRecurso, cantidad: int = 1) -> None:
        """Añade recurso al inventario."""
        if tipo_recurso == TipoRecurso.COMIDA:
            self.comida += cantidad
        elif tipo_recurso == TipoRecurso.MATERIAL:
            self.material += cantidad

    def quitar(self, tipo_recurso: TipoRecurso, cantidad: int = 1) -> bool:
        """Quita recurso si hay suficiente. Devuelve True si se pudo."""
        if not self.tiene(tipo_recurso, cantidad):
            return False
        if tipo_recurso == TipoRecurso.COMIDA:
            self.comida -= cantidad
        elif tipo_recurso == TipoRecurso.MATERIAL:
            self.material -= cantidad
        return True

    def tiene(self, tipo_recurso: TipoRecurso, cantidad: int = 1) -> bool:
        """Indica si tiene al menos la cantidad indicada."""
        if tipo_recurso == TipoRecurso.COMIDA:
            return self.comida >= cantidad
        elif tipo_recurso == TipoRecurso.MATERIAL:
            return self.material >= cantidad
        return False

    def esta_vacio(self) -> bool:
        """Indica si no tiene ningún recurso."""
        return self.comida == 0 and self.material == 0

    def total_recursos(self) -> int:
        """Total de unidades de recursos."""
        return self.comida + self.material

    def como_dict(self) -> dict:
        """Representación como diccionario."""
        return {"comida": self.comida, "material": self.material}
