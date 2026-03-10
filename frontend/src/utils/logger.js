/**
 * Structured logger for frontend.
 * Level controllable at runtime via localStorage 'aw_log_level' or VITE_LOG_LEVEL.
 * debug/info are no-ops in production unless aw_log_level is set.
 */
function getLevel() {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('aw_log_level');
    if (stored) return stored.toLowerCase();
  }
  return (import.meta.env.VITE_LOG_LEVEL ?? 'warn').toLowerCase();
}

function format(level, message, ...args) {
  const ts = new Date().toISOString();
  return [`[${ts}] [${level}] ${message}`, ...args];
}

const levels = { debug: 0, info: 1, warn: 2, error: 3 };

function shouldLog(level) {
  const current = levels[getLevel()] ?? 2;
  return (levels[level] ?? 2) >= current;
}

const logger = {
  debug: (msg, ...a) => shouldLog('debug') && console.debug(...format('DEBUG', msg, ...a)),
  info: (msg, ...a) => shouldLog('info') && console.info(...format('INFO', msg, ...a)),
  warn: (msg, ...a) => console.warn(...format('WARN', msg, ...a)),
  error: (msg, ...a) => console.error(...format('ERROR', msg, ...a)),
};

export default logger;
