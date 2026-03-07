"""
Sistema de persistencia: SQLite (principal) + JSON (respaldo).
Auto-guardado en tiempo real cada N ticks.
"""

import json
import os
import sqlite3
import time
from pathlib import Path

from tipos.enums import TipoRecurso, TipoRasgoSocial, TipoRasgoGato
from tipos.modelos import Posicion


class SistemaPersistencia:
    """Persistencia con SQLite y auto-guardado en tiempo real."""

    RUTA_JSON = "estado_simulacion.json"
    RUTA_SQLITE = "mundo_artificial.db"

    @classmethod
    def _ruta(cls, nombre: str) -> str:
        from utilidades.paths import obtener_base_path
        return os.path.join(obtener_base_path(), nombre)

    def __init__(self, usar_sqlite: bool = True, auto_guardar_intervalo: int = 20):
        self.usar_sqlite = usar_sqlite
        self.auto_guardar_intervalo = auto_guardar_intervalo
        self._ultimo_auto_guardado = 0

    def _ruta_proyecto(self, nombre: str) -> str:
        return self._ruta(nombre)

    def _conexion_sqlite(self) -> sqlite3.Connection:
        ruta = self._ruta(self.RUTA_SQLITE)
        conn = sqlite3.connect(ruta)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS estado (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                tick INTEGER NOT NULL,
                datos TEXT NOT NULL,
                actualizado_at REAL NOT NULL
            )
        """)
        return conn

    def guardar_estado(self, simulacion, ruta: str | None = None) -> bool:
        """Guarda el estado (SQLite o JSON)."""
        datos = self._serializar(simulacion)
        try:
            if self.usar_sqlite:
                conn = self._conexion_sqlite()
                try:
                    conn.execute(
                        "INSERT OR REPLACE INTO estado (id, tick, datos, actualizado_at) VALUES (1, ?, ?, ?)",
                        (simulacion.gestor_ticks.tick_actual, json.dumps(datos, ensure_ascii=False), time.time()),
                    )
                    conn.commit()
                finally:
                    conn.close()
            else:
                ruta = ruta or self.RUTA_JSON
                ruta = self._ruta_proyecto(ruta) if not os.path.isabs(ruta) else ruta
                with open(ruta, "w", encoding="utf-8") as f:
                    json.dump(datos, f, indent=2, ensure_ascii=False)
            ok = True
        except Exception as e:
            ok = False
            if getattr(simulacion, "estado_panel", None):
                simulacion.estado_panel.mensaje_feedback = f"Error guardar: {e}"
                simulacion.estado_panel.mensaje_feedback_tick = 60
        sc = getattr(simulacion, "sistema_competencia", None)
        if sc and sc.activo:
            sc.registrar(
                action="guardar_estado",
                target_resource="estado",
                target_type="persistencia",
                outcome="success" if ok else "failure",
                signals=["acceso_persistencia"],
                tick=simulacion.gestor_ticks.tick_actual,
            )
        return ok

    def auto_guardar_si_procede(self, simulacion) -> bool:
        """Auto-guarda cada N ticks. Devuelve True si guardó."""
        tick = simulacion.gestor_ticks.tick_actual
        if tick - self._ultimo_auto_guardado >= self.auto_guardar_intervalo and tick > 0:
            ok = self.guardar_estado(simulacion)
            if ok:
                self._ultimo_auto_guardado = tick
            return ok
        return False

    def cargar_estado(self, simulacion, ruta: str | None = None) -> bool:
        """Carga el estado (SQLite o JSON)."""
        try:
            if self.usar_sqlite:
                conn = self._conexion_sqlite()
                try:
                    row = conn.execute("SELECT datos FROM estado WHERE id = 1").fetchone()
                    if not row:
                        self._mensaje_error(simulacion, "No hay estado guardado")
                        return False
                    datos = json.loads(row[0])
                finally:
                    conn.close()
            else:
                ruta = ruta or self.RUTA_JSON
                ruta = self._ruta_proyecto(ruta) if not os.path.isabs(ruta) else ruta
                if not Path(ruta).exists():
                    self._mensaje_error(simulacion, "No existe archivo guardado")
                    return False
                with open(ruta, "r", encoding="utf-8") as f:
                    datos = json.load(f)
            self._deserializar(simulacion, datos)
            self._ultimo_auto_guardado = simulacion.gestor_ticks.tick_actual
            ok = True
        except Exception as e:
            ok = False
            self._mensaje_error(simulacion, f"Error cargar: {e}")
        sc = getattr(simulacion, "sistema_competencia", None)
        if sc and sc.activo:
            tick = simulacion.gestor_ticks.tick_actual if ok and simulacion.gestor_ticks else None
            sc.registrar(
                action="cargar_estado",
                target_resource="estado",
                target_type="persistencia",
                outcome="success" if ok else "failure",
                signals=["carga_externa", "acceso_persistencia"],
                tick=tick,
            )
        return ok

    def _mensaje_error(self, simulacion, msg: str) -> None:
        if getattr(simulacion, "estado_panel", None):
            simulacion.estado_panel.mensaje_feedback = msg
            simulacion.estado_panel.mensaje_feedback_tick = 60

    def existe_estado_guardado(self) -> bool:
        """Indica si hay estado persistido para cargar."""
        if self.usar_sqlite:
            ruta = self._ruta_proyecto(self.RUTA_SQLITE)
            if not Path(ruta).exists():
                return False
            try:
                conn = sqlite3.connect(ruta)
                row = conn.execute("SELECT 1 FROM estado WHERE id = 1").fetchone()
                conn.close()
                return row is not None
            except Exception:
                return False
        return Path(self._ruta_proyecto(self.RUTA_JSON)).exists()

    def _serializar(self, sim) -> dict:
        """Serializa el estado completo."""
        mapa = sim.mapa
        entidades = sim.entidades

        celdas_data = []
        for (x, y), celda in mapa.celdas.items():
            if not celda.recurso and not celda.refugio:
                continue
            celda_dict = {"x": x, "y": y}
            if celda.recurso and not celda.recurso.esta_agotado():
                celda_dict["recurso"] = {
                    "tipo": celda.recurso.tipo.name,
                    "cantidad": celda.recurso.cantidad,
                }
            if celda.refugio:
                celda_dict["refugio"] = {
                    "id_refugio": celda.refugio.id_refugio,
                    "bonus_descanso": celda.refugio.bonus_descanso,
                }
            celdas_data.append(celda_dict)

        entidades_data = []
        for e in entidades:
            ent_dict = {
                "id_entidad": e.id_entidad,
                "tipo": e.tipo_entidad.name,
                "nombre": e.nombre,
                "color": list(e.color),
                "posicion": [e.posicion.x, e.posicion.y],
                "posicion_anterior": (
                    [e.posicion_anterior.x, e.posicion_anterior.y]
                    if hasattr(e, "posicion_anterior") and e.posicion_anterior
                    else None
                ),
                "estado": {
                    "hambre": e.estado_interno.hambre,
                    "energia": e.estado_interno.energia,
                    "salud": e.estado_interno.salud,
                    "comida": e.estado_interno.inventario.comida,
                    "material": e.estado_interno.inventario.material,
                },
            }
            if hasattr(e, "rasgo_principal"):
                ent_dict["rasgo"] = e.rasgo_principal.name
            entidades_data.append(ent_dict)

        return {
            "version": 1,
            "tick_actual": sim.gestor_ticks.tick_actual,
            "mapa": {
                "ancho": mapa.ancho,
                "alto": mapa.alto,
                "celdas": celdas_data,
            },
            "entidades": entidades_data,
        }

    def _deserializar(self, sim, datos: dict) -> None:
        """Deserializa y restaura el estado."""
        from mundo.mapa import Mapa
        from mundo.recurso import Recurso
        from mundo.refugio import Refugio
        from entidades.entidad_social import EntidadSocial
        from entidades.entidad_gato import EntidadGato
        from agentes.estado_interno import EstadoInterno
        from agentes.inventario import Inventario

        mapa_data = datos["mapa"]
        mapa = Mapa(mapa_data["ancho"], mapa_data["alto"])

        for celda_dict in mapa_data.get("celdas", []):
            x, y = celda_dict["x"], celda_dict["y"]
            pos = Posicion(x, y)
            celda = mapa.obtener_celda(pos)
            if not celda:
                continue
            if "recurso" in celda_dict:
                r = celda_dict["recurso"]
                tipo = TipoRecurso[r["tipo"]]
                celda.recurso = Recurso(tipo, r.get("cantidad", 1))
            if "refugio" in celda_dict:
                ref = celda_dict["refugio"]
                celda.refugio = Refugio(ref["id_refugio"], ref.get("bonus_descanso", 0.08))

        entidades_nuevas = []
        for ent_dict in datos.get("entidades", []):
            pos = Posicion(ent_dict["posicion"][0], ent_dict["posicion"][1])
            pos_ant = None
            if ent_dict.get("posicion_anterior"):
                pos_ant = Posicion(ent_dict["posicion_anterior"][0], ent_dict["posicion_anterior"][1])
            estado = ent_dict.get("estado", {})
            inv = Inventario(estado.get("comida", 0), estado.get("material", 0))
            est_interno = EstadoInterno(
                hambre=estado.get("hambre", 0),
                energia=estado.get("energia", 1.0),
                salud=estado.get("salud", 1.0),
                inventario=inv,
            )
            color = tuple(ent_dict.get("color", [100, 150, 200]))

            if ent_dict["tipo"] == "SOCIAL":
                rasgo = TipoRasgoSocial[ent_dict.get("rasgo", "NEUTRAL")]
                ent = EntidadSocial(
                    id_entidad=ent_dict["id_entidad"],
                    nombre=ent_dict["nombre"],
                    rasgo_principal=rasgo,
                    posicion=pos,
                    color=color,
                    estado_interno=est_interno,
                )
            else:
                rasgo = TipoRasgoGato[ent_dict.get("rasgo", "CURIOSO")]
                ent = EntidadGato(
                    id_entidad=ent_dict["id_entidad"],
                    nombre=ent_dict["nombre"],
                    rasgo_principal=rasgo,
                    posicion=pos,
                    color=color,
                    estado_interno=est_interno,
                )
            ent.posicion_anterior = pos_ant
            mapa.colocar_entidad(ent, pos)
            entidades_nuevas.append(ent)

        sim.mapa = mapa
        sim.entidades = entidades_nuevas
        sim.gestor_ticks.tick_actual = datos.get("tick_actual", 0)
