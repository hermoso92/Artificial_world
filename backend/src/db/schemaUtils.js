/**
 * Schema utilities for SQLite — whitelist-based to prevent SQL injection.
 * Table and column names must be in the allowed lists.
 */

const ALLOWED_TABLES = new Set([
  'players',
  'heroes',
  'hero_worlds',
  'subscriptions',
  'gateways',
  'board_groups',
  'boards',
  'agents',
  'tasks',
  'runs',
  'approvals',
  'events',
]);

function ensureColumn(db, tableName, columnName, definition) {
  if (!ALLOWED_TABLES.has(tableName)) {
    throw new Error(`[schemaUtils] Invalid table name: ${tableName}`);
  }
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  const exists = columns.some((column) => column.name === columnName);
  if (!exists) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

export { ensureColumn };
