"""
Sistema Modo Competencia: observabilidad defensiva y forense.

Registra eventos sensibles con risk_score, integridad y correlación.
Diseñado para proteger frente a hackeos, scraping, espionaje competitivo
y preservar evidencia para auditoría o investigación.

Ver docs/DESIGN_MODO_COMPETENCIA.md para el diseño completo.
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
import sqlite3
import time
import uuid
from dataclasses import dataclass, field
from typing import TYPE_CHECKING

from utilidades.paths import obtener_base_path

if TYPE_CHECKING:
    pass

_logger = logging.getLogger("mundo_artificial.competencia")

# Pesos por señal para cálculo de risk_score (0-100)
PESOS_SENAL: dict[str, int] = {
    "acceso_persistencia": 25,
    "modo_sombra_activado": 15,
    "directiva_emitida": 10,
    "exportacion_reporte": 20,
    "carga_externa": 30,
    "fuera_horario": 15,
    "alta_frecuencia": 25,
    "recurso_sensible": 20,
    "borrado_masivo": 40,
    "error_deliberado": 15,
    "comando_sombra": 12,
}
PESO_DEFAULT = 10

# Umbrales
UMBRAL_REVISION = 60
UMBRAL_LEGAL = 80


@dataclass
class EventoCompetencia:
    """Evento del Modo Competencia con metadatos forenses."""

    event_id: str
    timestamp: float
    actor_id: str | None
    actor_role: str
    actor_ip: str
    actor_user_agent: str
    target_resource: str
    target_type: str
    action: str
    outcome: str | None
    risk_score: int
    severity: str
    session_id: str | None
    correlation_id: str | None
    tick: int | None
    signals: list[str]
    requires_review: bool
    legal_relevance: bool
    integrity_hash: str
    prev_hash: str | None
    mode: str = "competencia"

    def a_dict(self) -> dict:
        """Serializa a dict para persistencia."""
        return {
            "event_id": self.event_id,
            "timestamp": self.timestamp,
            "mode": self.mode,
            "actor_id": self.actor_id,
            "actor_role": self.actor_role,
            "actor_ip": self.actor_ip,
            "actor_user_agent": self.actor_user_agent,
            "target_resource": self.target_resource,
            "target_type": self.target_type,
            "action": self.action,
            "outcome": self.outcome,
            "risk_score": self.risk_score,
            "severity": self.severity,
            "session_id": self.session_id,
            "correlation_id": self.correlation_id,
            "tick": self.tick,
            "signals": json.dumps(self.signals, ensure_ascii=False),
            "requires_review": 1 if self.requires_review else 0,
            "legal_relevance": 1 if self.legal_relevance else 0,
            "integrity_hash": self.integrity_hash,
            "prev_hash": self.prev_hash,
        }


def _calcular_risk_score(signals: list[str]) -> int:
    """Calcula risk_score (0-100) a partir de las señales."""
    total = 0
    for s in signals:
        total += PESOS_SENAL.get(s, PESO_DEFAULT)
    return min(100, total)


def _severidad_desde_score(score: int) -> str:
    """Mapea risk_score a severidad."""
    if score >= UMBRAL_LEGAL:
        return "critical"
    if score >= UMBRAL_REVISION:
        return "high"
    if score >= 30:
        return "medium"
    return "low"


def _hash_evento(event_id: str, timestamp: float, action: str, target: str, prev: str | None) -> str:
    """Genera hash de integridad para el evento."""
    payload = f"{event_id}|{timestamp}|{action}|{target}|{prev or 'genesis'}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


class SistemaModoCompetencia:
    """
    Registra eventos sensibles con integridad y scoring de riesgo.
    Append-only; no modifica ni elimina eventos.
    """

    RUTA_DB = "audit_competencia.db"

    def __init__(
        self,
        activo: bool = True,
        ruta_db: str | None = None,
        session_id: str | None = None,
        umbral_alerta: int = UMBRAL_REVISION,
        umbral_legal: int = UMBRAL_LEGAL,
    ):
        self.activo = activo
        self.ruta_db = ruta_db or os.path.join(obtener_base_path(), self.RUTA_DB)
        self.session_id = session_id or str(uuid.uuid4())
        self.umbral_alerta = umbral_alerta
        self.umbral_legal = umbral_legal
        self._prev_hash: str | None = None
        self._conexion: sqlite3.Connection | None = None
        if self.activo:
            self._crear_esquema()

    def _crear_esquema(self) -> None:
        """Crea la tabla y triggers si no existen."""
        conn = sqlite3.connect(self.ruta_db)
        try:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS eventos_competencia (
                    event_id         TEXT PRIMARY KEY,
                    timestamp        REAL NOT NULL,
                    mode             TEXT NOT NULL DEFAULT 'competencia',
                    actor_id         TEXT,
                    actor_role       TEXT,
                    actor_ip         TEXT,
                    actor_user_agent TEXT,
                    target_resource TEXT NOT NULL,
                    target_type      TEXT NOT NULL,
                    action           TEXT NOT NULL,
                    outcome          TEXT,
                    risk_score       INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
                    severity         TEXT NOT NULL,
                    session_id       TEXT,
                    correlation_id   TEXT,
                    tick             INTEGER,
                    signals          TEXT,
                    requires_review  INTEGER NOT NULL DEFAULT 0,
                    legal_relevance  INTEGER NOT NULL DEFAULT 0,
                    integrity_hash   TEXT NOT NULL,
                    prev_hash        TEXT
                )
            """)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_competencia_ts ON eventos_competencia(timestamp)
            """)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_competencia_actor ON eventos_competencia(actor_id)
            """)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_competencia_target ON eventos_competencia(target_resource)
            """)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_competencia_risk ON eventos_competencia(risk_score)
            """)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_competencia_review ON eventos_competencia(requires_review)
            """)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_competencia_session ON eventos_competencia(session_id)
            """)
            conn.execute("""
                CREATE TRIGGER IF NOT EXISTS trg_no_update_competencia
                BEFORE UPDATE ON eventos_competencia
                BEGIN
                    SELECT RAISE(ABORT, 'eventos_competencia es append-only');
                END
            """)
            conn.execute("""
                CREATE TRIGGER IF NOT EXISTS trg_no_delete_competencia
                BEFORE DELETE ON eventos_competencia
                BEGIN
                    SELECT RAISE(ABORT, 'eventos_competencia es append-only');
                END
            """)
            conn.commit()
            # Obtener último prev_hash para encadenar
            row = conn.execute(
                "SELECT integrity_hash FROM eventos_competencia ORDER BY timestamp DESC LIMIT 1"
            ).fetchone()
            if row:
                self._prev_hash = row[0]
        finally:
            conn.close()

    def registrar(
        self,
        action: str,
        target_resource: str,
        target_type: str,
        *,
        outcome: str | None = None,
        signals: list[str] | None = None,
        actor_id: str | None = None,
        actor_role: str = "sistema",
        actor_ip: str = "local",
        actor_user_agent: str = "pygame",
        tick: int | None = None,
        correlation_id: str | None = None,
    ) -> EventoCompetencia | None:
        """
        Registra un evento en el Modo Competencia.
        Devuelve el evento registrado o None si está inactivo.
        """
        if not self.activo:
            return None

        signals = signals or []
        risk_score = _calcular_risk_score(signals)
        severity = _severidad_desde_score(risk_score)
        requires_review = risk_score >= self.umbral_alerta
        legal_relevance = risk_score >= self.umbral_legal

        event_id = str(uuid.uuid4())
        timestamp = time.time()
        integrity_hash = _hash_evento(
            event_id, timestamp, action, target_resource, self._prev_hash
        )

        evento = EventoCompetencia(
            event_id=event_id,
            timestamp=timestamp,
            mode="competencia",
            actor_id=actor_id,
            actor_role=actor_role,
            actor_ip=actor_ip,
            actor_user_agent=actor_user_agent,
            target_resource=target_resource,
            target_type=target_type,
            action=action,
            outcome=outcome,
            risk_score=risk_score,
            severity=severity,
            session_id=self.session_id,
            correlation_id=correlation_id,
            tick=tick,
            signals=signals,
            requires_review=requires_review,
            legal_relevance=legal_relevance,
            integrity_hash=integrity_hash,
            prev_hash=self._prev_hash,
        )

        try:
            conn = sqlite3.connect(self.ruta_db)
            try:
                d = evento.a_dict()
                conn.execute(
                    """
                    INSERT INTO eventos_competencia (
                        event_id, timestamp, mode, actor_id, actor_role, actor_ip, actor_user_agent,
                        target_resource, target_type, action, outcome, risk_score, severity,
                        session_id, correlation_id, tick, signals, requires_review, legal_relevance,
                        integrity_hash, prev_hash
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        d["event_id"], d["timestamp"], d["mode"], d["actor_id"], d["actor_role"],
                        d["actor_ip"], d["actor_user_agent"], d["target_resource"], d["target_type"],
                        d["action"], d["outcome"], d["risk_score"], d["severity"],
                        d["session_id"], d["correlation_id"], d["tick"], d["signals"],
                        d["requires_review"], d["legal_relevance"], d["integrity_hash"], d["prev_hash"],
                    ),
                )
                conn.commit()
                self._prev_hash = integrity_hash
            finally:
                conn.close()
        except sqlite3.OperationalError as e:
            _logger.warning("Modo Competencia: no se pudo registrar evento: %s", e)
            return None

        if legal_relevance:
            _logger.warning(
                "COMPETENCIA [%s] risk=%d action=%s target=%s requires_review",
                event_id[:8], risk_score, action, target_resource,
            )
        elif requires_review:
            _logger.info(
                "COMPETENCIA [%s] risk=%d action=%s target=%s",
                event_id[:8], risk_score, action, target_resource,
            )

        return evento

    def obtener_por_rango(
        self, desde_ts: float, hasta_ts: float, limite: int = 500
    ) -> list[EventoCompetencia]:
        """Eventos en ventana temporal."""
        if not self.activo:
            return []
        conn = sqlite3.connect(self.ruta_db)
        try:
            rows = conn.execute(
                """
                SELECT event_id, timestamp, mode, actor_id, actor_role, actor_ip, actor_user_agent,
                       target_resource, target_type, action, outcome, risk_score, severity,
                       session_id, correlation_id, tick, signals, requires_review, legal_relevance,
                       integrity_hash, prev_hash
                FROM eventos_competencia
                WHERE timestamp >= ? AND timestamp <= ?
                ORDER BY timestamp DESC
                LIMIT ?
                """,
                (desde_ts, hasta_ts, limite),
            ).fetchall()
            return [self._row_a_evento(r) for r in rows]
        finally:
            conn.close()

    def obtener_para_revision(self, limite: int = 50) -> list[EventoCompetencia]:
        """Eventos con requires_review=1."""
        if not self.activo:
            return []
        conn = sqlite3.connect(self.ruta_db)
        try:
            rows = conn.execute(
                """
                SELECT event_id, timestamp, mode, actor_id, actor_role, actor_ip, actor_user_agent,
                       target_resource, target_type, action, outcome, risk_score, severity,
                       session_id, correlation_id, tick, signals, requires_review, legal_relevance,
                       integrity_hash, prev_hash
                FROM eventos_competencia
                WHERE requires_review = 1
                ORDER BY timestamp DESC
                LIMIT ?
                """,
                (limite,),
            ).fetchall()
            return [self._row_a_evento(r) for r in rows]
        finally:
            conn.close()

    def obtener_por_riesgo(self, min_score: int, limite: int = 100) -> list[EventoCompetencia]:
        """Eventos con risk_score >= min_score."""
        if not self.activo:
            return []
        conn = sqlite3.connect(self.ruta_db)
        try:
            rows = conn.execute(
                """
                SELECT event_id, timestamp, mode, actor_id, actor_role, actor_ip, actor_user_agent,
                       target_resource, target_type, action, outcome, risk_score, severity,
                       session_id, correlation_id, tick, signals, requires_review, legal_relevance,
                       integrity_hash, prev_hash
                FROM eventos_competencia
                WHERE risk_score >= ?
                ORDER BY timestamp DESC
                LIMIT ?
                """,
                (min_score, limite),
            ).fetchall()
            return [self._row_a_evento(r) for r in rows]
        finally:
            conn.close()

    def _row_a_evento(self, row: tuple) -> EventoCompetencia:
        """Convierte fila SQL a EventoCompetencia."""
        signals_raw = row[16] or "[]"
        try:
            signals = json.loads(signals_raw)
        except json.JSONDecodeError:
            signals = []
        return EventoCompetencia(
            event_id=row[0],
            timestamp=row[1],
            mode=row[2] or "competencia",
            actor_id=row[3],
            actor_role=row[4] or "sistema",
            actor_ip=row[5] or "local",
            actor_user_agent=row[6] or "pygame",
            target_resource=row[7],
            target_type=row[8],
            action=row[9],
            outcome=row[10],
            risk_score=row[11],
            severity=row[12] or "low",
            session_id=row[13],
            correlation_id=row[14],
            tick=row[15],
            signals=signals,
            requires_review=bool(row[17]),
            legal_relevance=bool(row[18]),
            integrity_hash=row[19] or "",
            prev_hash=row[20],
        )

    def verificar_integridad(self) -> list[str]:
        """
        Verifica la cadena de hashes.
        Devuelve lista de event_ids con integridad rota.
        """
        if not self.activo:
            return []
        conn = sqlite3.connect(self.ruta_db)
        corruptos: list[str] = []
        try:
            rows = conn.execute(
                """
                SELECT event_id, timestamp, action, target_resource, prev_hash, integrity_hash
                FROM eventos_competencia
                ORDER BY timestamp ASC
                """
            ).fetchall()
            prev = "genesis"
            for r in rows:
                event_id, ts, action, target, prev_hash, stored_hash = r
                prev_hash_val = prev_hash if prev_hash is not None else "genesis"
                if prev_hash_val != prev:
                    corruptos.append(event_id)
                esperado = _hash_evento(event_id, ts, action, target, prev_hash_val)
                if esperado != stored_hash:
                    corruptos.append(event_id)
                prev = stored_hash
        finally:
            conn.close()
        return corruptos

    def contar_eventos(self) -> int:
        """Total de eventos registrados."""
        if not self.activo:
            return 0
        conn = sqlite3.connect(self.ruta_db)
        try:
            row = conn.execute("SELECT COUNT(*) FROM eventos_competencia").fetchone()
            return row[0] if row else 0
        finally:
            conn.close()
