/**
 * Event Store - append-only audit log for simulation events.
 * Integridad: cadena de hashes. Modo Competencia compatible.
 */
import Database from 'better-sqlite3';
import crypto from 'crypto';
import { randomUUID } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DB_PATH = process.env.NODE_ENV === 'test'
  ? ':memory:'
  : path.join(__dirname, '../../audit_simulacion.db');

let db = null;
let sessionId = null;
let prevHash = null;
let enabled = process.env.NODE_ENV !== 'test';

function getDb() {
  if (!db) {
    db = new Database(DEFAULT_DB_PATH);
    db.pragma('journal_mode = WAL');
    db.exec(`
      CREATE TABLE IF NOT EXISTS eventos_simulacion (
        event_id         TEXT PRIMARY KEY,
        timestamp        REAL NOT NULL,
        tick             INTEGER,
        session_id       TEXT,
        type             TEXT NOT NULL,
        payload          TEXT NOT NULL,
        risk_score       INTEGER DEFAULT 0,
        signals          TEXT,
        integrity_hash   TEXT NOT NULL,
        prev_hash        TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_eventos_tick ON eventos_simulacion(tick);
      CREATE INDEX IF NOT EXISTS idx_eventos_session ON eventos_simulacion(session_id);
      CREATE INDEX IF NOT EXISTS idx_eventos_type ON eventos_simulacion(type);
      CREATE INDEX IF NOT EXISTS idx_eventos_risk ON eventos_simulacion(risk_score);
    `);
    sessionId = randomUUID();
    const last = db.prepare('SELECT integrity_hash FROM eventos_simulacion ORDER BY timestamp DESC LIMIT 1').get();
    if (last) prevHash = last.integrity_hash;
  }
  return db;
}

function hashEvent(eventId, timestamp, type, payload, prevHash) {
  const str = `${eventId}|${timestamp}|${type}|${payload}|${prevHash ?? ''}`;
  return crypto.createHash('sha256').update(str).digest('hex');
}

/**
 * Registra un evento. Append-only. Thread-safe (sync).
 * @param {number} tick - Tick de simulación
 * @param {string} type - sim_start|sim_pause|sim_reset|tick|agent_death|agent_combat|agent_reproduce|agent_release
 * @param {object} payload - Datos del evento (será JSON stringified)
 * @param {object} opts - { riskScore, signals }
 * @returns {object|null} Evento registrado o null si deshabilitado
 */
export function registrar(tick, type, payload = {}, opts = {}) {
  if (!enabled) return null;

  try {
    const d = getDb();
    const eventId = randomUUID();
    const timestamp = Date.now() / 1000;
    const payloadStr = JSON.stringify(payload);
    const riskScore = opts.riskScore ?? 0;
    const signalsStr = opts.signals ? JSON.stringify(opts.signals) : null;

    const integrityHash = hashEvent(eventId, timestamp, type, payloadStr, prevHash);

    const prevHashForRecord = prevHash;
    d.prepare(`
      INSERT INTO eventos_simulacion (event_id, timestamp, tick, session_id, type, payload, risk_score, signals, integrity_hash, prev_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(eventId, timestamp, tick, sessionId, type, payloadStr, riskScore, signalsStr, integrityHash, prevHashForRecord);

    prevHash = integrityHash;

    return {
      event_id: eventId,
      timestamp,
      tick,
      session_id: sessionId,
      type,
      payload,
      risk_score: riskScore,
      integrity_hash: integrityHash,
      prev_hash: prevHashForRecord,
    };
  } catch (err) {
    logger.error('[eventStore] Error registrando evento:', err.message);
    return null;
  }
}

/**
 * Obtiene eventos por sesión, tick o tipo.
 */
export function obtener(opts = {}) {
  try {
    const d = getDb();
    let sql = 'SELECT * FROM eventos_simulacion WHERE 1=1';
    const params = [];

    if (opts.sessionId) {
      sql += ' AND session_id = ?';
      params.push(opts.sessionId);
    }
    if (opts.tickMin != null) {
      sql += ' AND tick >= ?';
      params.push(opts.tickMin);
    }
    if (opts.tickMax != null) {
      sql += ' AND tick <= ?';
      params.push(opts.tickMax);
    }
    if (opts.type) {
      sql += ' AND type = ?';
      params.push(opts.type);
    }
    if (opts.riskMin != null) {
      sql += ' AND risk_score >= ?';
      params.push(opts.riskMin);
    }

    sql += ' ORDER BY timestamp ASC';
    if (opts.limit) {
      sql += ' LIMIT ?';
      params.push(opts.limit);
    }

    const rows = d.prepare(sql).all(...params);
    return rows.map((r) => ({
      ...r,
      payload: JSON.parse(r.payload),
      signals: r.signals ? JSON.parse(r.signals) : null,
    }));
  } catch (err) {
    logger.error('[eventStore] Error obteniendo eventos:', err.message);
    return [];
  }
}

/**
 * Verifica integridad de la cadena de hashes.
 * @returns {string[]} IDs de eventos corruptos (vacío si OK)
 */
export function verificarIntegridad() {
  try {
    const d = getDb();
    const rows = d.prepare('SELECT * FROM eventos_simulacion ORDER BY rowid ASC').all();
    const corruptos = [];
    let prev = null;

    for (const r of rows) {
      const expected = hashEvent(r.event_id, r.timestamp, r.type, r.payload, prev);
      if (expected !== r.integrity_hash) {
        corruptos.push(r.event_id);
      }
      prev = r.integrity_hash;
    }
    return corruptos;
  } catch (err) {
    logger.error('[eventStore] Error verificando integridad:', err.message);
    return [];
  }
}

/**
 * Cuenta eventos totales.
 */
export function contar() {
  try {
    const d = getDb();
    const rows = d.prepare('SELECT COUNT(*) as n FROM eventos_simulacion').get();
    return rows?.n ?? 0;
  } catch (err) {
    logger.error('[eventStore] Error contando eventos:', err?.message);
    return 0;
  }
}

/**
 * Habilita o deshabilita el registro (útil para tests).
 */
export function setEnabled(value) {
  enabled = !!value;
}

/**
 * Obtiene el session_id actual.
 */
export function getSessionId() {
  if (!sessionId) getDb();
  return sessionId;
}
