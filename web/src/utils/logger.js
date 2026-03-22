/**
 * Structured logger for web app.
 * debug/info are no-ops in production to keep the console clean.
 */
const IS_PROD = import.meta.env.PROD;

function format(level, message, ...args) {
  const ts = new Date().toISOString();
  return [`[${ts}] [${level}] ${message}`, ...args];
}

const logger = {
  debug: IS_PROD ? () => {} : (msg, ...a) => console.debug(...format('DEBUG', msg, ...a)),
  info: IS_PROD ? () => {} : (msg, ...a) => console.info(...format('INFO', msg, ...a)),
  warn: (msg, ...a) => console.warn(...format('WARN', msg, ...a)),
  error: (msg, ...a) => console.error(...format('ERROR', msg, ...a)),
};

export default logger;
