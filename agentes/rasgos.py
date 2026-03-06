"""
Rasgos y sus efectos sobre pesos de utilidad.
Traduce rasgos a modificadores por acción.
"""

from tipos.enums import TipoRasgoGato, TipoRasgoSocial


def obtener_pesos_rasgo_social(tipo_rasgo: TipoRasgoSocial) -> dict[str, float]:
    """Devuelve modificadores por acción para un rasgo social."""
    # Pesos base por rasgo (especificación Parte 6)
    tabla = {
        TipoRasgoSocial.COOPERATIVO: {
            "mover": 0.00,
            "explorar": 0.00,
            "ir_refugio": 0.00,
            "descansar": 0.00,
            "recoger_comida": 0.00,
            "recoger_material": 0.00,
            "comer": 0.00,
            "compartir": 0.25,
            "robar": -0.25,
            "huir": 0.00,
            "evitar": -0.05,
            "seguir": 0.10,
        },
        TipoRasgoSocial.NEUTRAL: {k: 0.00 for k in [
            "mover", "explorar", "ir_refugio", "descansar", "recoger_comida",
            "recoger_material", "comer", "compartir", "robar",
            "huir", "evitar", "seguir"
        ]},
        TipoRasgoSocial.AGRESIVO: {
            "mover": 0.00,
            "explorar": 0.00,
            "ir_refugio": -0.05,
            "descansar": -0.05,
            "recoger_comida": 0.00,
            "recoger_material": 0.00,
            "comer": 0.00,
            "compartir": -0.20,
            "robar": 0.30,
            "huir": -0.10,
            "evitar": -0.10,
            "seguir": 0.05,
        },
        TipoRasgoSocial.EXPLORADOR: {
            "mover": 0.35,
            "explorar": 0.35,
            "ir_refugio": -0.05,
            "descansar": -0.03,
            "recoger_comida": 0.00,
            "recoger_material": 0.03,
            "comer": 0.00,
            "compartir": 0.00,
            "robar": 0.00,
            "huir": -0.03,
            "evitar": 0.00,
            "seguir": -0.05,
        },
        TipoRasgoSocial.OPORTUNISTA: {
            "mover": 0.05,
            "explorar": 0.05,
            "ir_refugio": 0.00,
            "descansar": 0.00,
            "recoger_comida": 0.05,
            "recoger_material": 0.08,
            "comer": 0.00,
            "compartir": 0.10,
            "robar": 0.15,
            "huir": 0.00,
            "evitar": 0.00,
            "seguir": 0.10,
        },
    }
    return tabla.get(tipo_rasgo, tabla[TipoRasgoSocial.NEUTRAL])


def obtener_pesos_rasgo_gato(tipo_rasgo: TipoRasgoGato) -> dict[str, float]:
    """Devuelve modificadores por acción para un rasgo del gato."""
    tabla = {
        TipoRasgoGato.CURIOSO: {
            "mover": 0.35,
            "explorar": 0.35,
            "ir_refugio": -0.05,
            "descansar": -0.03,
            "recoger_comida": 0.05,
            "recoger_material": 0.00,
            "comer": 0.00,
            "huir": 0.00,
            "evitar": 0.00,
            "seguir": 0.05,
        },
        TipoRasgoGato.APEGADO: {
            "mover": -0.05,
            "explorar": -0.05,
            "ir_refugio": 0.05,
            "descansar": 0.05,
            "recoger_comida": 0.00,
            "recoger_material": 0.00,
            "comer": 0.00,
            "huir": 0.00,
            "evitar": -0.05,
            "seguir": 0.25,
        },
        TipoRasgoGato.INDEPENDIENTE: {
            "mover": 0.20,
            "explorar": 0.20,
            "ir_refugio": 0.00,
            "descansar": 0.00,
            "recoger_comida": 0.00,
            "recoger_material": 0.00,
            "comer": 0.00,
            "huir": 0.00,
            "evitar": 0.00,
            "seguir": -0.25,
        },
        TipoRasgoGato.TERRITORIAL: {
            "mover": -0.05,
            "explorar": -0.05,
            "ir_refugio": 0.15,
            "descansar": 0.10,
            "recoger_comida": 0.00,
            "recoger_material": 0.00,
            "comer": 0.00,
            "huir": -0.05,
            "evitar": 0.10,
            "seguir": -0.10,
        },
        TipoRasgoGato.OPORTUNISTA: {
            "mover": 0.10,
            "explorar": 0.10,
            "ir_refugio": 0.00,
            "descansar": 0.00,
            "recoger_comida": 0.10,
            "recoger_material": 0.00,
            "comer": 0.00,
            "huir": 0.00,
            "evitar": 0.00,
            "seguir": 0.10,
        },
    }
    return tabla.get(tipo_rasgo, tabla[TipoRasgoGato.CURIOSO])


def obtener_modificador_rasgo_entidad(entidad, tipo_accion: str) -> float:
    """Obtiene el modificador por rasgo para una entidad y acción."""
    if not hasattr(entidad, "rasgo_principal"):
        return 0.0
    from tipos.enums import TipoEntidad
    if entidad.tipo_entidad == TipoEntidad.GATO:
        pesos = obtener_pesos_rasgo_gato(entidad.rasgo_principal)
    else:
        pesos = obtener_pesos_rasgo_social(entidad.rasgo_principal)
    return pesos.get(tipo_accion, 0.0)
