/**
 * Structured logger for backend.
 * Outputs ISO timestamp + level prefix to stdout/stderr.
 */

const LEVEL_RANK = { debug: 0, info: 1, warn: 2, error: 3 };
const MIN_LEVEL = LEVEL_RANK[process.env.LOG_LEVEL ?? 'info'] ?? 1;

function log(level, message, ...args) {
  if (LEVEL_RANK[level] < MIN_LEVEL) return;
  const ts = new Date().toISOString();
  const prefix = `[${ts}] [${level.toUpperCase()}]`;
  if (level === 'error') {
    console.error(prefix, message, ...args);
  } else if (level === 'warn') {
    console.warn(prefix, message, ...args);
  } else {
    console.log(prefix, message, ...args);
  }
}

const logger = {
  debug: (msg, ...a) => log('debug', msg, ...a),
  info:  (msg, ...a) => log('info', msg, ...a),
  warn:  (msg, ...a) => log('warn', msg, ...a),
  error: (msg, ...a) => log('error', msg, ...a),
};

export default logger;
