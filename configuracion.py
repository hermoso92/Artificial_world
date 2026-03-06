"""
Configuración central del proyecto MUNDO_ARTIFICIAL.
No se deben usar números mágicos en el resto del sistema.
"""

from dataclasses import dataclass


@dataclass
class Configuracion:
    """Parámetros configurables del mundo y la simulación."""

    # Mundo
    ancho_mapa: int = 60
    alto_mapa: int = 60
    tamano_celda: int = 12

    # Simulación
    fps_objetivo: int = 30
    semilla_aleatoria: int = 42

    # Entidades
    cantidad_entidades_sociales: int = 6
    incluir_gato: bool = True

    # Recursos
    cantidad_comida_inicial: int = 80
    cantidad_material_inicial: int = 50
    cantidad_refugios: int = 4

    # Regeneración de recursos
    ticks_entre_regeneracion: int = 30
    cantidad_regeneracion_comida: int = 3
    cantidad_regeneracion_material: int = 1

    # Percepción y memoria
    radio_percepcion: int = 5
    capacidad_recuerdos_espaciales: int = 20
    capacidad_recuerdos_sociales: int = 15
    capacidad_eventos_recientes: int = 20

    # Estado interno
    incremento_hambre_por_tick: float = 0.02
    decremento_energia_por_movimiento: float = 0.03
    recuperacion_energia_descanso: float = 0.05
    recuperacion_energia_refugio: float = 0.08
    reduccion_hambre_por_comida: float = 0.30
    max_hambre: float = 1.0
    max_energia: float = 1.0
    max_salud: float = 1.0

    # UI
    max_eventos_recientes_ui: int = 12
    ancho_panel_control: int = 340

    # Persistencia
    persistencia_sqlite: bool = True
    auto_guardar_intervalo_ticks: int = 20

    # Debug
    debug_entidades_pilladas: bool = False
    debug_archivo_activo: bool = False  # Escribe estado a debug_live.json cada 5 ticks
    debug_archivo_ruta: str = "debug_live.json"
