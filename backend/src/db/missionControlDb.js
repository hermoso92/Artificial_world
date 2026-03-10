import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';
import { ensureColumn } from './schemaUtils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IS_PROD = process.env.NODE_ENV === 'production';
const DB_PATH = IS_PROD
  ? path.join(__dirname, '../../data/mission-control.db')
  : path.join(__dirname, '../../../mission-control.db');

let dbInstance = null;

export function getMissionControlDb() {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = new Database(DB_PATH);
  dbInstance.pragma('journal_mode = WAL');
  dbInstance.pragma('foreign_keys = ON');

  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS gateways (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      kind TEXT NOT NULL,
      status TEXT NOT NULL,
      latency_ms INTEGER NOT NULL DEFAULT 0,
      retry_count INTEGER NOT NULL DEFAULT 0,
      health_score REAL NOT NULL DEFAULT 1,
      last_heartbeat_at TEXT,
      last_error TEXT,
      metadata TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS board_groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      kind TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS boards (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      gateway_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (group_id) REFERENCES board_groups(id) ON DELETE CASCADE,
      FOREIGN KEY (gateway_id) REFERENCES gateways(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      gateway_id TEXT NOT NULL,
      board_id TEXT,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      status TEXT NOT NULL,
      current_task_id TEXT,
      last_heartbeat_at TEXT,
      last_error TEXT,
      metadata TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (gateway_id) REFERENCES gateways(id) ON DELETE CASCADE,
      FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      board_id TEXT NOT NULL,
      gateway_id TEXT NOT NULL,
      agent_id TEXT,
      title TEXT NOT NULL,
      status TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      priority TEXT NOT NULL,
      work_type TEXT NOT NULL,
      requires_approval INTEGER NOT NULL DEFAULT 0,
      blocked INTEGER NOT NULL DEFAULT 0,
      tags TEXT NOT NULL DEFAULT '[]',
      summary TEXT,
      last_activity_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      metadata TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
      FOREIGN KEY (gateway_id) REFERENCES gateways(id) ON DELETE CASCADE,
      FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS runs (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      agent_id TEXT,
      gateway_id TEXT NOT NULL,
      status TEXT NOT NULL,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      summary TEXT,
      error_message TEXT,
      artifacts TEXT NOT NULL DEFAULT '[]',
      messages TEXT NOT NULL DEFAULT '[]',
      decisions TEXT NOT NULL DEFAULT '[]',
      metadata TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL,
      FOREIGN KEY (gateway_id) REFERENCES gateways(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS approvals (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      run_id TEXT,
      agent_id TEXT,
      gateway_id TEXT NOT NULL,
      action_type TEXT NOT NULL,
      status TEXT NOT NULL,
      risk_level TEXT NOT NULL,
      reason TEXT NOT NULL,
      diff_summary TEXT,
      context TEXT NOT NULL DEFAULT '{}',
      requested_at TEXT NOT NULL,
      resolved_at TEXT,
      resolved_by TEXT,
      resolution_note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE SET NULL,
      FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL,
      FOREIGN KEY (gateway_id) REFERENCES gateways(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      stream TEXT NOT NULL DEFAULT 'mission-control',
      event_name TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      severity TEXT NOT NULL,
      message TEXT NOT NULL,
      payload TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS quality_gates (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      gate_type TEXT NOT NULL,
      status TEXT NOT NULL,
      result_summary TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_mc_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_mc_tasks_board ON tasks(board_id);
    CREATE INDEX IF NOT EXISTS idx_mc_tasks_gateway ON tasks(gateway_id);
    CREATE INDEX IF NOT EXISTS idx_mc_tasks_agent ON tasks(agent_id);
    CREATE INDEX IF NOT EXISTS idx_mc_runs_task ON runs(task_id);
    CREATE INDEX IF NOT EXISTS idx_mc_runs_status ON runs(status);
    CREATE INDEX IF NOT EXISTS idx_mc_approvals_status ON approvals(status);
    CREATE INDEX IF NOT EXISTS idx_mc_approvals_task ON approvals(task_id);
    CREATE INDEX IF NOT EXISTS idx_mc_agents_status ON agents(status);
    CREATE INDEX IF NOT EXISTS idx_mc_events_created_at ON events(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_mc_events_name ON events(event_name);
    CREATE INDEX IF NOT EXISTS idx_mc_quality_gates_task ON quality_gates(task_id);
  `);

  ensureColumn(dbInstance, 'tasks', 'work_type', "TEXT NOT NULL DEFAULT 'analysis'");
  ensureColumn(dbInstance, 'tasks', 'sort_order', 'INTEGER NOT NULL DEFAULT 0');
  ensureColumn(dbInstance, 'tasks', 'metadata', "TEXT NOT NULL DEFAULT '{}'");
  ensureColumn(dbInstance, 'runs', 'metadata', "TEXT NOT NULL DEFAULT '{}'");

  logger.info(`[mission-control.db] SQLite initialized at ${DB_PATH}`);
  return dbInstance;
}

export function withMissionControlTransaction(work) {
  const db = getMissionControlDb();
  const transaction = db.transaction(work);
  return transaction();
}
