"""
Motor de decisión utility-based.
Genera acciones candidatas, puntúa y selecciona la mejor.
"""

import random
from typing import TYPE_CHECKING

from tipos.enums import TipoAccion, TipoRecurso
from tipos.modelos import AccionPuntuada, PercepcionLocal

from acciones.accion_comer import AccionComer
from acciones.accion_compartir import AccionCompartir
from acciones.accion_descansar import AccionDescansar
from acciones.accion_evitar import AccionEvitar
from acciones.accion_explorar import AccionExplorar
from acciones.accion_huir import AccionHuir
from acciones.accion_ir_refugio import AccionIrRefugio
from acciones.accion_mover import AccionMover
from acciones.accion_recoger_comida import AccionRecogerComida
from acciones.accion_recoger_material import AccionRecogerMaterial
from acciones.accion_robar import AccionRobar
from acciones.accion_seguir import AccionSeguir

from .rasgos import obtener_modificador_rasgo_entidad
from .pesos_utilidad import (
    calcular_modificador_energia,
    calcular_modificador_hambre,
    calcular_modificador_riesgo,
    obtener_utilidad_base,
)

if TYPE_CHECKING:
    from entidades.entidad_base import EntidadBase
    from nucleo.contexto import ContextoDecision


class MotorDecision:
    """Motor de decisión basado en utilidad."""

    def __init__(self):
        pass

    def generar_acciones_candidatas(
        self, entidad: "EntidadBase", contexto: "ContextoDecision"
    ) -> list:
        """Genera las acciones que la entidad puede considerar."""
        acciones = []
        energia = entidad.estado_interno.energia
        hambre = entidad.estado_interno.hambre
        rasgo = getattr(entidad, "rasgo_principal", None)
        rasgo_val = rasgo.value if rasgo else ""
        inv = entidad.estado_interno.inventario
        comida_inv = getattr(inv, "comida", 0) if inv else 0

        # --- Recoger recurso en celda actual ---
        if contexto.mapa:
            celda_actual = contexto.mapa.obtener_celda(entidad.posicion)
            if celda_actual and celda_actual.tiene_recurso() and celda_actual.recurso:
                if celda_actual.recurso.tipo == TipoRecurso.COMIDA:
                    acc = AccionRecogerComida(entidad.id_entidad)
                    if acc.es_viable(entidad, contexto):
                        acciones.append(acc)
                elif celda_actual.recurso.tipo == TipoRecurso.MATERIAL:
                    acc = AccionRecogerMaterial(entidad.id_entidad)
                    if acc.es_viable(entidad, contexto):
                        acciones.append(acc)

        # --- Comer si tiene comida en inventario ---
        if entidad.estado_interno.inventario.tiene(TipoRecurso.COMIDA, 1):
            acc = AccionComer(entidad.id_entidad)
            if acc.es_viable(entidad, contexto):
                acciones.append(acc)

        # --- Descansar: solo si realmente necesita energía ---
        if energia < 0.60:
            acc_descansar = AccionDescansar(entidad.id_entidad)
            if acc_descansar.es_viable(entidad, contexto):
                acciones.append(acc_descansar)

        # --- Huir/Evitar: solo si hay amenaza ---
        riesgo = getattr(entidad.estado_interno, "riesgo_percibido", 0.0)
        if riesgo > 0.3:
            acc_huir = AccionHuir(entidad.id_entidad)
            if acc_huir.es_viable(entidad, contexto):
                acciones.append(acc_huir)
            acc_evitar = AccionEvitar(entidad.id_entidad)
            if acc_evitar.es_viable(entidad, contexto):
                acciones.append(acc_evitar)

        # --- Explorar: siempre que haya energía mínima ---
        if energia > 0.20:
            acc_explorar = AccionExplorar(entidad.id_entidad)
            if acc_explorar.es_viable(entidad, contexto):
                acciones.append(acc_explorar)

        # --- Compartir: cooperativos con inventario lleno ---
        if comida_inv >= 3 or (rasgo_val == "cooperativo" and comida_inv >= 1 and hambre < 0.5):
            acc_comp = AccionCompartir(entidad.id_entidad)
            if acc_comp.es_viable(entidad, contexto):
                acciones.append(acc_comp)

        # --- Seguir: sociales con otros cerca ---
        if rasgo_val in ("cooperativo", "neutral") and contexto.percepcion_local:
            entidades_cercanas = getattr(contexto.percepcion_local, "entidades_visibles", [])
            if entidades_cercanas:
                id_obj = entidades_cercanas[0].id_entidad if hasattr(entidades_cercanas[0], "id_entidad") else 0
                acc_seguir = AccionSeguir(entidad.id_entidad, id_obj)
                if acc_seguir.es_viable(entidad, contexto):
                    acciones.append(acc_seguir)

        # --- Robar: oportunistas/agresivos con hambre y sin comida ---
        # Solo si hay energía para moverse (evita bucle robar-sin-objetivo)
        if rasgo_val in ("oportunista", "agresivo") and hambre >= 0.75 and comida_inv == 0 and energia > 0.30:
            acc_robar = AccionRobar(entidad.id_entidad)
            if acc_robar.es_viable(entidad, contexto):
                acciones.append(acc_robar)

        # --- Mover e ir al refugio por vecinos ---
        if contexto.percepcion_local and contexto.percepcion_local.posiciones_vecinas:
            for pos in contexto.percepcion_local.posiciones_vecinas:
                celda = contexto.mapa.obtener_celda(pos) if contexto.mapa else None
                # IrRefugio: SOLO si energía baja o en peligro
                if celda and celda.tiene_refugio() and (energia < 0.45 or riesgo > 0.5):
                    acc = AccionIrRefugio(entidad.id_entidad, pos.x, pos.y)
                    if acc.es_viable(entidad, contexto):
                        acciones.append(acc)
                acc_mover = AccionMover(entidad.id_entidad, pos.x, pos.y)
                if acc_mover.es_viable(entidad, contexto):
                    acciones.append(acc_mover)

        # --- Fallback garantizado ---
        if not acciones:
            acciones.append(AccionDescansar(entidad.id_entidad))
        return acciones

    def puntuar_acciones(
        self, entidad: "EntidadBase", contexto: "ContextoDecision", acciones: list
    ) -> list[AccionPuntuada]:
        """Puntúa cada acción candidata."""
        resultado = []
        for accion in acciones:
            base = obtener_utilidad_base(
                accion.tipo_accion.value if hasattr(accion.tipo_accion, "value") else str(accion.tipo_accion)
            )
            mod_hambre = calcular_modificador_hambre(entidad, accion.tipo_accion.value)
            mod_energia = calcular_modificador_energia(entidad, accion.tipo_accion.value)
            mod_riesgo = calcular_modificador_riesgo(entidad, accion.tipo_accion.value)
            mod_rasgo = self.aplicar_modificadores_por_rasgo(entidad, accion, contexto)
            mod_oscillacion = self.aplicar_modificador_anti_oscilacion(entidad, accion)
            mod_memoria = self.aplicar_modificadores_por_memoria(entidad, accion, contexto)
            mod_relaciones = self.aplicar_modificadores_por_relaciones(entidad, accion, contexto)
            mod_directivas = self.aplicar_modificadores_por_directivas(entidad, accion, contexto)
            mod_autonomia = self.aplicar_reglas_de_autonomia(entidad, accion, contexto)
            modificadores = {
                "hambre": mod_hambre,
                "energia": mod_energia,
                "riesgo": mod_riesgo,
                "rasgo": mod_rasgo,
                "oscillacion": mod_oscillacion,
                "memoria": mod_memoria,
                "relaciones": mod_relaciones,
                "directivas": mod_directivas,
                "autonomia": mod_autonomia,
            }
            final = base + sum(modificadores.values())
            rng = random.Random(entidad.id_entidad * 1000 + contexto.tick_actual)
            final += rng.uniform(-0.08, 0.08)
            motivo = self._construir_motivo(base, modificadores)
            resultado.append(
                AccionPuntuada(
                    accion=accion,
                    puntuacion_base=base,
                    modificadores=modificadores,
                    puntuacion_final=final,
                    motivo_principal=motivo,
                )
            )
        return resultado

    def aplicar_modificador_anti_oscilacion(self, entidad, accion) -> float:
        """Penaliza volver a la celda anterior para evitar oscilación en bordes."""
        if accion.tipo_accion != TipoAccion.MOVER:
            return 0.0
        if not hasattr(entidad, "posicion_anterior") or entidad.posicion_anterior is None:
            return 0.0
        from tipos.modelos import Posicion
        destino = Posicion(accion.destino_x, accion.destino_y)
        if destino == entidad.posicion_anterior:
            return -0.40
        return 0.0

    def aplicar_modificadores_por_rasgo(self, entidad, accion, contexto) -> float:
        """Modificador por rasgo (social o gato)."""
        tipo_str = accion.tipo_accion.value
        return obtener_modificador_rasgo_entidad(entidad, tipo_str)

    def aplicar_modificadores_por_memoria(self, entidad, accion, contexto) -> float:
        """Modificador por memoria y percepción.

        Para MOVER:
        - Bonus fuerte si destino ES la celda de comida (llegar).
        - Bonus por acercarse a comida visible/recordada (reducir distancia).
        """
        from tipos.modelos import Posicion

        if accion.tipo_accion == TipoAccion.MOVER:
            destino = Posicion(accion.destino_x, accion.destino_y)
            hambre = entidad.estado_interno.hambre

            # 1) Bonus al llegar a celda con comida
            if contexto.percepcion_local:
                for pos, recurso in contexto.percepcion_local.recursos_visibles:
                    if pos == destino and recurso.tipo == TipoRecurso.COMIDA:
                        if hambre >= 0.6:
                            return 0.15
                        if hambre >= 0.25:
                            return 0.05
            recuerdos_comida = entidad.memoria.obtener_recursos_recientes("comida")
            for rec in recuerdos_comida:
                if rec.posicion == destino and hambre >= 0.25:
                    return 0.08

            # 2) Bonus por acercarse a comida visible/recordada
            posiciones_comida: list[Posicion] = []
            if contexto.percepcion_local:
                for pos, recurso in contexto.percepcion_local.recursos_visibles:
                    if recurso.tipo == TipoRecurso.COMIDA:
                        posiciones_comida.append(pos)
            for rec in recuerdos_comida:
                posiciones_comida.append(rec.posicion)

            if posiciones_comida and hambre >= 0.25:
                dist_actual = min(
                    entidad.posicion.distancia_manhattan(p) for p in posiciones_comida
                )
                dist_destino = min(
                    destino.distancia_manhattan(p) for p in posiciones_comida
                )
                if dist_destino < dist_actual:
                    if hambre >= 0.5:
                        return 0.25
                    return 0.12

            # 3) Bonus refugio (sin cambios)
            recuerdos_refugio = entidad.memoria.obtener_refugios_conocidos()
            for rec in recuerdos_refugio:
                if rec.posicion == destino and entidad.estado_interno.energia < 0.5:
                    return 0.10
        return 0.0

    def aplicar_modificadores_por_relaciones(self, entidad, accion, contexto) -> float:
        """Modificador por relaciones sociales activas.

        Reglas:
        - Alta confianza con entidad cercana → bonus COMPARTIR/SEGUIR
        - Alta hostilidad con entidad cercana → bonus HUIR/EVITAR, penaliza COMPARTIR
        - Alto miedo a entidad cercana → bonus HUIR/IR_REFUGIO
        """
        relaciones = getattr(entidad, "relaciones", None)
        if relaciones is None:
            return 0.0
        if contexto is None or contexto.percepcion_local is None:
            return 0.0

        entidades_cercanas = getattr(contexto.percepcion_local, "entidades_visibles", [])
        if not entidades_cercanas:
            return 0.0

        # entidades_visibles puede ser (pos, list[int]) del mapa o list[Entidad]
        ids_cercanos: list[int] = []
        for item in entidades_cercanas:
            if hasattr(item, "id_entidad"):
                ids_cercanos.append(item.id_entidad)
            elif isinstance(item, (list, tuple)) and len(item) >= 2:
                _, ids = item[0], item[1]
                ids_cercanos.extend(ids if isinstance(ids, list) else [ids])

        mod = 0.0
        for id_otra in ids_cercanos:
            if id_otra == entidad.id_entidad:
                continue
            rel = relaciones.obtener_relacion(id_otra)

            confianza = rel.confianza
            hostilidad = rel.hostilidad
            miedo = rel.miedo

            # Confianza alta → quiero cooperar
            if confianza >= 0.4:
                if accion.tipo_accion == TipoAccion.COMPARTIR:
                    mod += 0.30 * confianza
                elif accion.tipo_accion == TipoAccion.SEGUIR:
                    mod += 0.20 * confianza

            # Hostilidad alta → quiero evitar / huir / robar
            if hostilidad >= 0.4:
                if accion.tipo_accion in (TipoAccion.HUIR, TipoAccion.EVITAR):
                    mod += 0.35 * hostilidad
                elif accion.tipo_accion == TipoAccion.COMPARTIR:
                    mod -= 0.40 * hostilidad
                elif accion.tipo_accion == TipoAccion.ROBAR:
                    mod += 0.15 * hostilidad

            # Miedo alto → huir / ir al refugio
            if miedo >= 0.3:
                if accion.tipo_accion in (TipoAccion.HUIR, TipoAccion.IR_REFUGIO):
                    mod += 0.25 * miedo
                elif accion.tipo_accion == TipoAccion.MOVER:
                    mod -= 0.10 * miedo

        return mod

    def aplicar_modificadores_por_directivas(self, entidad, accion, contexto) -> float:
        """Modificador por directivas activas. Las órdenes tienen prioridad alta."""
        from tipos.enums import TipoDirectiva
        from tipos.modelos import Posicion
        directivas = contexto.directivas_activas if contexto and contexto.directivas_activas else []
        mod = 0.0
        for d in directivas:
            if d.id_entidad_objetivo != entidad.id_entidad:
                continue

            if d.tipo_directiva == TipoDirectiva.PRIORIZAR_SUPERVIVENCIA:
                if accion.tipo_accion in (TipoAccion.COMER, TipoAccion.RECOGER_COMIDA,
                                          TipoAccion.DESCANSAR, TipoAccion.IR_REFUGIO):
                    mod += 0.85 * d.intensidad

            elif d.tipo_directiva == TipoDirectiva.VOLVER_A_REFUGIO:
                if accion.tipo_accion == TipoAccion.IR_REFUGIO:
                    mod += 1.0 * d.intensidad
                elif accion.tipo_accion in (TipoAccion.MOVER, TipoAccion.EXPLORAR):
                    mod += 0.5 * d.intensidad

            elif d.tipo_directiva == TipoDirectiva.EXPLORAR_ZONA:
                if accion.tipo_accion in (TipoAccion.MOVER, TipoAccion.EXPLORAR):
                    mod += 0.8 * d.intensidad

            elif d.tipo_directiva == TipoDirectiva.RECOGER_EN_ZONA:
                if accion.tipo_accion in (TipoAccion.RECOGER_COMIDA, TipoAccion.RECOGER_MATERIAL):
                    mod += 0.9 * d.intensidad

            elif d.tipo_directiva == TipoDirectiva.IR_A_POSICION:
                # Bonificar el movimiento vecino que más se acerca al objetivo
                objetivo = d.objetivo_posicion
                if objetivo and accion.tipo_accion in (TipoAccion.MOVER, TipoAccion.EXPLORAR,
                                                        TipoAccion.IR_REFUGIO):
                    destino_x = getattr(accion, "destino_x", None)
                    destino_y = getattr(accion, "destino_y", None)
                    if destino_x is not None and destino_y is not None:
                        dist_desde_destino = abs(destino_x - objetivo.x) + abs(destino_y - objetivo.y)
                        dist_actual = abs(entidad.posicion.x - objetivo.x) + abs(entidad.posicion.y - objetivo.y)
                        if dist_desde_destino < dist_actual:
                            # Este movimiento nos acerca al objetivo → bonificación fuerte
                            mod += 1.5 * d.intensidad
                        else:
                            # Este movimiento nos aleja → penalización
                            mod -= 0.8 * d.intensidad
                    else:
                        # explorar sin destino fijo también bonificar si hay objetivo
                        mod += 0.3 * d.intensidad
                elif objetivo and accion.tipo_accion == TipoAccion.DESCANSAR:
                    # Llegar primero, descansar después
                    dist_actual = abs(entidad.posicion.x - objetivo.x) + abs(entidad.posicion.y - objetivo.y)
                    if dist_actual > 2:
                        mod -= 0.6 * d.intensidad  # no descanses, muévete

            elif d.tipo_directiva == TipoDirectiva.QUEDARSE_AQUI:
                # Anclar: penalizar cualquier movimiento
                if accion.tipo_accion in (TipoAccion.MOVER, TipoAccion.EXPLORAR):
                    mod -= 2.0 * d.intensidad  # penalización muy fuerte
                if accion.tipo_accion == TipoAccion.DESCANSAR:
                    mod += 0.5 * d.intensidad  # quedarse descansando está bien

        return mod

    def aplicar_reglas_de_autonomia(self, entidad, accion, contexto) -> float:
        """Capa correctora: supervivencia sobre directivas."""
        mod = 0.0
        if entidad.estado_interno.hambre > 0.85:
            if accion.tipo_accion in (TipoAccion.MOVER, TipoAccion.EXPLORAR, TipoAccion.SEGUIR):
                mod -= 0.25
        if entidad.estado_interno.energia < 0.15:
            if accion.tipo_accion in (TipoAccion.MOVER, TipoAccion.EXPLORAR, TipoAccion.ROBAR):
                mod -= 0.35
        if entidad.estado_interno.riesgo_percibido > 0.8:
            if accion.tipo_accion in (TipoAccion.MOVER, TipoAccion.EXPLORAR, TipoAccion.COMPARTIR):
                mod -= 0.20
            if accion.tipo_accion in (TipoAccion.HUIR, TipoAccion.EVITAR, TipoAccion.IR_REFUGIO):
                mod += 0.20
        return mod

    def seleccionar_mejor_accion(
        self, acciones_puntuadas: list[AccionPuntuada]
    ) -> AccionPuntuada | None:
        """Selecciona la acción con mayor puntuación final. Sin preferencia por MOVER en empates."""
        if not acciones_puntuadas:
            return None
        return max(acciones_puntuadas, key=lambda a: a.puntuacion_final)

    def decidir(self, entidad: "EntidadBase", contexto: "ContextoDecision") -> AccionPuntuada | None:
        """Decide la mejor acción para la entidad."""
        acciones = self.generar_acciones_candidatas(entidad, contexto)
        if not acciones:
            return None
        puntuadas = self.puntuar_acciones(entidad, contexto, acciones)
        return self.seleccionar_mejor_accion(puntuadas)

    def _construir_motivo(self, base: float, modificadores: dict) -> str:
        """Construye descripción del motivo principal."""
        dominante = max(modificadores.items(), key=lambda x: abs(x[1]))
        if abs(dominante[1]) < 0.01:
            return "base"
        return f"{dominante[0]}: {dominante[1]:+.2f}"
