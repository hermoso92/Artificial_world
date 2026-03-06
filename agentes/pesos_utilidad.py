"""
Pesos y modificadores de utilidad.
Centraliza todos los parámetros del motor de decisión.
"""

PESOS_BASE_ACCIONES = {
    "mover":           0.30,  # base alta porque hay 4 candidatos → se promedia
    "explorar":        0.50,  # acción proactiva, debe ganar cuando el estado es normal
    "ir_refugio":      0.25,  # solo candidato con energía baja, así que puede ser alto
    "descansar":       0.30,  # solo candidato con energía < 0.60
    "recoger_comida":  0.55,  # prioridad alta cuando está disponible
    "recoger_material":0.30,
    "comer":           0.65,  # máxima prioridad cuando hay comida en inventario
    "compartir":       0.20,
    "robar":           0.20,
    "huir":            0.40,
    "evitar":          0.25,
    "seguir":          0.20,
    "construir":       0.18,
    "trabajar":        0.16,
    "socializar":      0.14,
}


def obtener_utilidad_base(tipo_accion: str) -> float:
    return PESOS_BASE_ACCIONES.get(tipo_accion, 0.10)


def calcular_modificador_hambre(entidad, accion_tipo: str) -> float:
    """Modificador por hambre. Hambre alta empuja a buscar/comer comida."""
    hambre = entidad.estado_interno.hambre
    energia = entidad.estado_interno.energia

    if accion_tipo == "comer":
        if hambre >= 0.80:
            return 0.60
        if hambre >= 0.50:
            return 0.30
        if hambre >= 0.20:
            return 0.10
        return -0.20  # sin hambre no come

    if accion_tipo == "recoger_comida":
        if hambre >= 0.80:
            return 0.40
        if hambre >= 0.50:
            return 0.20
        if hambre >= 0.20:
            return 0.05
        return -0.10

    if accion_tipo == "mover":
        # Con hambre alta, moverse puede llevar a comida
        if hambre >= 0.80:
            return 0.20
        if hambre >= 0.50:
            return 0.08
        return 0.0

    if accion_tipo == "explorar":
        # Hambre muy alta → no explorar sin rumbo, busca comida
        if hambre >= 0.85:
            return -0.35
        if hambre >= 0.65:
            return -0.15
        return 0.0

    if accion_tipo == "descansar":
        # Con hambre alta y energía suficiente → NO descansar, busca comida
        if hambre >= 0.80 and energia > 0.35:
            return -0.40
        if hambre >= 0.60 and energia > 0.50:
            return -0.20
        return 0.0

    if accion_tipo == "ir_refugio":
        # Con hambre alta no prioriza refugio
        if hambre >= 0.70:
            return -0.15
        return 0.0

    return 0.0


def calcular_modificador_energia(entidad, accion_tipo: str) -> float:
    """Modificador por energía. Energía baja fuerza descanso."""
    energia = entidad.estado_interno.energia

    if accion_tipo == "descansar":
        if energia <= 0.10:
            return 0.60  # urgente
        if energia <= 0.25:
            return 0.40
        if energia <= 0.40:
            return 0.20
        if energia <= 0.55:
            return 0.05
        # Energía alta → no merece descansar (ya es candidato solo si < 0.60)
        return 0.0

    if accion_tipo == "ir_refugio":
        if energia <= 0.15:
            return 0.50
        if energia <= 0.30:
            return 0.30
        if energia <= 0.45:
            return 0.10
        return 0.0  # energía alta → no necesita refugio

    if accion_tipo == "explorar":
        if energia >= 0.70:
            return 0.20  # lleno de energía → explora
        if energia <= 0.25:
            return -0.40  # muy cansado → no explora
        if energia <= 0.40:
            return -0.15
        return 0.0

    if accion_tipo == "mover":
        if energia <= 0.15:
            return -0.30  # casi sin energía no se mueve
        return 0.0

    if accion_tipo in ("compartir", "seguir"):
        if energia <= 0.30:
            return -0.25
        return 0.0

    return 0.0


def calcular_modificador_riesgo(entidad, accion_tipo: str) -> float:
    """Modificador por riesgo percibido."""
    riesgo = getattr(entidad.estado_interno, "riesgo_percibido", 0.0)

    if accion_tipo in ("huir", "evitar", "ir_refugio"):
        if riesgo >= 0.80:
            return 0.40
        if riesgo >= 0.55:
            return 0.20
        if riesgo >= 0.25:
            return 0.08
        return 0.0

    if accion_tipo in ("explorar", "mover", "compartir"):
        if riesgo >= 0.80:
            return -0.40
        if riesgo >= 0.55:
            return -0.20
        if riesgo >= 0.25:
            return -0.08
        return 0.0

    return 0.0
