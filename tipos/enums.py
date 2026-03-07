"""
Enums fundamentales del proyecto MUNDO_ARTIFICIAL.
Evita strings descontrolados en todo el sistema.
"""

from enum import Enum


class TipoEntidad(Enum):
    """Tipo de entidad autónoma."""

    SOCIAL = "social"
    GATO = "gato"


class TipoRecurso(Enum):
    """Tipo de recurso en el mundo."""

    COMIDA = "comida"
    MATERIAL = "material"


class TipoRasgoSocial(Enum):
    """Rasgos de personalidad para entidades sociales."""

    COOPERATIVO = "cooperativo"
    NEUTRAL = "neutral"
    AGRESIVO = "agresivo"
    EXPLORADOR = "explorador"
    OPORTUNISTA = "oportunista"


class TipoRasgoGato(Enum):
    """Rasgos de personalidad para el gato."""

    CURIOSO = "curioso"
    APEGADO = "apegado"
    INDEPENDIENTE = "independiente"
    TERRITORIAL = "territorial"
    OPORTUNISTA = "oportunista"


class TipoAccion(Enum):
    """Tipos de acciones que pueden ejecutar las entidades."""

    MOVER = "mover"
    EXPLORAR = "explorar"
    RECOGER_COMIDA = "recoger_comida"
    RECOGER_MATERIAL = "recoger_material"
    COMER = "comer"
    DESCANSAR = "descansar"
    IR_REFUGIO = "ir_refugio"
    COMPARTIR = "compartir"
    ROBAR = "robar"
    HUIR = "huir"
    EVITAR = "evitar"
    SEGUIR = "seguir"
    ATACAR = "atacar"


class TipoEvento(Enum):
    """Tipos de eventos del sistema."""

    ENCONTRO_RECURSO = "encontro_recurso"
    RECOGIO_RECURSO = "recogio_recurso"
    COMIO = "comio"
    DESCANSO = "descanso"
    ENTRO_REFUGIO = "entro_refugio"
    COMPARTIO = "compartio"
    ROBO = "robo"
    HUYO = "huyo"
    EVITO = "evito"
    SIGUIO = "siguio"
    CAMBIO_RELACION = "cambio_relacion"
    DIRECTIVA_RECIBIDA = "directiva_recibida"
    DIRECTIVA_ACEPTADA = "directiva_aceptada"
    DIRECTIVA_APLAZADA = "directiva_aplazada"
    DIRECTIVA_REINTERPRETADA = "directiva_reinterpretada"
    DIRECTIVA_RECHAZADA = "directiva_rechazada"
    DIRECTIVA_COMPLETADA = "directiva_completada"
    # Eventos específicos del MODO SOMBRA
    MODO_SOMBRA_ACTIVADO     = "modo_sombra_activado"
    MODO_SOMBRA_DESACTIVADO  = "modo_sombra_desactivado"
    COMANDO_SOMBRA_EMITIDO   = "comando_sombra_emitido"
    COMANDO_SOMBRA_INICIADO  = "comando_sombra_iniciado"
    COMANDO_SOMBRA_COMPLETADO = "comando_sombra_completado"
    COMANDO_SOMBRA_CANCELADO = "comando_sombra_cancelado"
    DIRECTIVA_SOMBRA_EMITIDA   = "directiva_sombra_emitida"
    DIRECTIVA_SOMBRA_ACEPTADA  = "directiva_sombra_aceptada"
    DIRECTIVA_SOMBRA_RECHAZADA = "directiva_sombra_rechazada"
    ATAQUE_EJECUTADO           = "ataque_ejecutado"


class EstadoDirectiva(Enum):
    """Estado de una directiva externa."""

    PENDIENTE = "pendiente"
    ACEPTADA = "aceptada"
    EN_PROGRESO = "en_progreso"
    APLAZADA = "aplazada"
    REINTERPRETADA = "reinterpretada"
    RECHAZADA = "rechazada"
    COMPLETADA = "completada"
    EXPIRADA = "expirada"


class TipoDirectiva(Enum):
    """Tipos de directivas externas."""

    EXPLORAR_ZONA = "explorar_zona"
    EVITAR_ENTIDAD = "evitar_entidad"
    COOPERAR_CON_ENTIDAD = "cooperar_con_entidad"
    SEGUIR_ENTIDAD = "seguir_entidad"
    PRIORIZAR_SUPERVIVENCIA = "priorizar_supervivencia"
    RECOGER_EN_ZONA = "recoger_en_zona"
    VOLVER_A_REFUGIO = "volver_a_refugio"
    PROTEGER_ZONA = "proteger_zona"
    ACERCARSE_A_ENTIDAD = "acercarse_a_entidad"
    INVESTIGAR_OBJETIVO = "investigar_objetivo"
    IR_A_POSICION = "ir_a_posicion"       # Mover hacia coordenadas concretas
    QUEDARSE_AQUI = "quedarse_aqui"       # Anclar en posición actual


class ResultadoAccion(Enum):
    """Resultado de ejecutar una acción."""

    EXITO = "exito"
    FALLO = "fallo"
    NO_APLICA = "no_aplica"
    CANCELADA = "cancelada"


class ModoControl(Enum):
    """Modo de control de una entidad autónoma.

    AUTONOMO  – la IA decide libremente.
    DIRIGIDO  – la IA decide pero con directivas externas activas que modifican utilidades.
    POSEIDO   – la IA suspendida; la entidad ejecuta comandos forzados de la cola.
    """

    AUTONOMO = "autonomo"
    DIRIGIDO = "dirigido"
    POSEIDO  = "poseido"


class TipoComandoSombra(Enum):
    """Tipos de comandos forzados que puede emitir el modo POSEIDO."""

    MOVER_A_POSICION    = "mover_a_posicion"
    IR_A_REFUGIO        = "ir_a_refugio"
    QUEDARSE_EN_REFUGIO = "quedarse_en_refugio"
    RECOGER_OBJETIVO    = "recoger_objetivo"
    SEGUIR_OBJETIVO     = "seguir_objetivo"
    EVITAR_OBJETIVO     = "evitar_objetivo"
    ATACAR_OBJETIVO     = "atacar_objetivo"
    MATAR_OBJETIVO      = "matar_objetivo"   # reservado – requiere sistema de combate


class EstadoComandoSombra(Enum):
    """Estado de un comando sombra en la cola."""

    PENDIENTE   = "pendiente"
    EN_PROGRESO = "en_progreso"
    COMPLETADO  = "completado"
    CANCELADO   = "cancelado"
    FALLIDO     = "fallido"
