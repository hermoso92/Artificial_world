/**
 * Structured logger for backend.
 * Outputs ISO timestamp + level prefix to stdout/stderr.
 * Also broadcasts logs via WebSocket for live monitoring in the app.
 */

const LEVEL_RANK = { debug: 0, info: 1, warn: 2, error: 3 };
const MIN_LEVEL = LEVEL_RANK[process.env.LOG_LEVEL ?? 'info'] ?? 1;

let _broadcastLog = null;

export function setLogBroadcaster(fn) {
  _broadcastLog = fn;
}

function formatArgs(args) {
  return args.map((a) => {
    if (a instanceof Error) return a.message;
    if (typeof a === 'object') {
      try { return JSON.stringify(a); } catch { return String(a); }
    }
    return String(a);
  }).join(' ');
}

function extractSource(message) {
  const match = typeof message === 'string' ? message.match(/^\[(\w+)]/) : null;
  return match ? match[1] : 'server';
}

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

  if (_broadcastLog) {
    const fullMsg = args.length > 0
      ? `${message} ${formatArgs(args)}`
      : String(message);
    try { _broadcastLog(level, fullMsg, extractSource(String(message))); } catch { /* noop */ }
  }
}

const logger = {
  debug: (msg, ...a) => log('debug', msg, ...a),
  info:  (msg, ...a) => log('info', msg, ...a),
  warn:  (msg, ...a) => log('warn', msg, ...a),
  error: (msg, ...a) => log('error', msg, ...a),
};

export default logger;
