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
    incluir_tryndamere: bool = True  # Rey y fundador de Artificial World (personaje jugable)

    # Combate (activar para permitir atacar/eliminar entidades)
    modo_combate_activo: bool = False  # True = se puede atacar y eliminar; False = no violencia

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

    # Logging y reporte (observabilidad para demos y desarrollo)
    nivel_log: str = "INFO"  # DEBUG, INFO, WARNING, ERROR, CRITICAL
    log_estructurado: bool = False  # JSON para parsing
    log_consola: bool = False  # Salida a stdout
    reporte_sesion_activo: bool = True  # Genera reporte_sesion.json al finalizar
    reporte_sesion_ruta: str = "reporte_sesion.json"

    # Modo Competencia (observabilidad defensiva y forense)
    modo_competencia_activo: bool = True
    modo_competencia_ruta_db: str = "audit_competencia.db"
    modo_competencia_umbral_alerta: int = 60
    modo_competencia_umbral_legal: int = 80

    # Crónica fundacional (flujo headless reproducible)
    nombre_fundador: str = "Tryndamere"
    nombre_refugio: str = "Refugio Fundador"
    semilla_civilizacion: str = "default"
    ticks_cronica: int = 200

    def __post_init__(self) -> None:
        """Valida rangos para evitar fallos silenciosos."""
        if self.ancho_mapa < 2 or self.alto_mapa < 2:
            raise ValueError(
                f"Mapa minimo 2x2: ancho={self.ancho_mapa}, alto={self.alto_mapa}"
            )
        if self.fps_objetivo <= 0:
            raise ValueError(f"fps_objetivo debe ser > 0: {self.fps_objetivo}")
        if self.cantidad_comida_inicial < 0 or self.cantidad_material_inicial < 0:
            raise ValueError("Recursos iniciales no pueden ser negativos")
        if not (0 < self.incremento_hambre_por_tick <= 1):
            raise ValueError(
                f"incremento_hambre_por_tick debe estar en (0,1]: {self.incremento_hambre_por_tick}"
            )
        if not (0 < self.max_hambre <= 1) or not (0 < self.max_energia <= 1):
            raise ValueError("max_hambre y max_energia deben estar en (0,1]")
