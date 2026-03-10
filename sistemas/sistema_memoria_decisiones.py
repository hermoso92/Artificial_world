"""
Sistema de memoria de decisiones: persistencia SQLite de decisiones de agentes.
Trazabilidad de accion, score, motivo, energia, hambre y posicion.
"""

import os
import sqlite3
from pathlib import Path


class SistemaMemoriaDecisiones:
    """Persiste decisiones de entidades en SQLite para trazabilidad."""

    DB_NAME = "decision_memory.sqlite"

    def __init__(self, ruta_db: str | None = None):
        self._ruta: str | None = ruta_db
        self._conn: sqlite3.Connection | None = None
        self._activo = False
        self._init_db()

    def _ruta_db(self) -> str:
        if self._ruta:
            return self._ruta
        from utilidades.paths import obtener_base_path
        return os.path.join(obtener_base_path(), "data", self.DB_NAME)

    def _init_db(self) -> None:
        """Inicializa la BD. Si falla, el sistema queda inactivo."""
        try:
            ruta = self._ruta_db()
            Path(os.path.dirname(ruta)).mkdir(parents=True, exist_ok=True)
            conn = sqlite3.connect(ruta)
            conn.execute("PRAGMA journal_mode=WAL")
            conn.execute("""
                CREATE TABLE IF NOT EXISTS decisions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    tick INTEGER NOT NULL,
                    id_entidad INTEGER NOT NULL,
                    nombre_entidad TEXT NOT NULL,
                    accion TEXT NOT NULL,
                    score REAL,
                    motivo TEXT,
                    energia REAL,
                    hambre REAL,
                    posicion_x INTEGER,
                    posicion_y INTEGER,
                    created_at TEXT NOT NULL DEFAULT (datetime('now'))
                )
            """)
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_decisions_entidad ON decisions(id_entidad)"
            )
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_decisions_tick ON decisions(tick DESC)"
            )
            conn.commit()
            self._conn = conn
            self._activo = True
        except Exception:
            self._activo = False
            self._conn = None

    def registrar(
        self,
        decision_dict: dict,
        entidad,
        tick: int,
    ) -> None:
        """Inserta una decision en la BD."""
        if not self._activo or not self._conn:
            return
        try:
            accion = decision_dict.get("accion", "")
            score = decision_dict.get("score")
            motivo = decision_dict.get("motivo")
            energia = entidad.estado_interno.energia if entidad else None
            hambre = entidad.estado_interno.hambre if entidad else None
            pos = entidad.posicion if entidad else None
            self._conn.execute(
                """
                INSERT INTO decisions (tick, id_entidad, nombre_entidad, accion, score, motivo, energia, hambre, posicion_x, posicion_y)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    tick,
                    entidad.id_entidad,
                    entidad.nombre,
                    accion,
                    score,
                    motivo,
                    energia,
                    hambre,
                    pos.x if pos else None,
                    pos.y if pos else None,
                ),
            )
            self._conn.commit()
        except Exception:
            pass

    def obtener_recientes(
        self,
        id_entidad: int | None = None,
        limit: int = 50,
    ) -> list[dict]:
        """Obtiene las decisiones mas recientes."""
        if not self._activo or not self._conn:
            return []
        try:
            if id_entidad is not None:
                rows = self._conn.execute(
                    """
                    SELECT id, tick, id_entidad, nombre_entidad, accion, score, motivo, energia, hambre, posicion_x, posicion_y, created_at
                    FROM decisions WHERE id_entidad = ? ORDER BY tick DESC LIMIT ?
                    """,
                    (id_entidad, limit),
                ).fetchall()
            else:
                rows = self._conn.execute(
                    """
                    SELECT id, tick, id_entidad, nombre_entidad, accion, score, motivo, energia, hambre, posicion_x, posicion_y, created_at
                    FROM decisions ORDER BY tick DESC LIMIT ?
                    """,
                    (limit,),
                ).fetchall()
            return [
                {
                    "id": r[0],
                    "tick": r[1],
                    "id_entidad": r[2],
                    "nombre_entidad": r[3],
                    "accion": r[4],
                    "score": r[5],
                    "motivo": r[6],
                    "energia": r[7],
                    "hambre": r[8],
                    "posicion_x": r[9],
                    "posicion_y": r[10],
                    "created_at": r[11],
                }
                for r in rows
            ]
        except Exception:
            return []

    def obtener_resumen_entidad(self, id_entidad: int) -> dict:
        """Devuelve { accion -> count } para una entidad."""
        if not self._activo or not self._conn:
            return {}
        try:
            rows = self._conn.execute(
                "SELECT accion, COUNT(*) FROM decisions WHERE id_entidad = ? GROUP BY accion",
                (id_entidad,),
            ).fetchall()
            return {r[0]: r[1] for r in rows}
        except Exception:
            return {}
