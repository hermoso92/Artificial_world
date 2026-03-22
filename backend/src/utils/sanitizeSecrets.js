/**
 * Sanitización de secretos antes de persistir.
 * Inspirado en alfred-dev-main/core/memory.py.
 * Reemplaza credenciales detectadas por [REDACTED:<tipo>] para evitar fugas.
 */

const SECRET_PATTERNS = [
  // Orden: más específicos primero
  [/AKIA[0-9A-Z]{16}/g, 'AWS_KEY'],
  [/sk-ant-[a-zA-Z0-9\-]{20,}/g, 'ANTHROPIC_KEY'],
  [/sk-[a-zA-Z0-9]{20,}/g, 'SK_KEY'],
  [/(?:ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{20,})/g, 'GITHUB_TOKEN'],
  [/xox[bpsa]-[a-zA-Z0-9\-]{10,}/g, 'SLACK_TOKEN'],
  [/AIza[0-9A-Za-z\-_]{35}/g, 'GOOGLE_KEY'],
  [/SG\.[a-zA-Z0-9\-_]{22,}\.[a-zA-Z0-9\-_]{22,}/g, 'SENDGRID_KEY'],
  [/-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END/gi, 'PRIVATE_KEY'],
  [/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, 'JWT'],
  [/(?:mysql|postgresql|postgres|mongodb(?:\+srv)?|redis|amqp):\/\/[^\s"'']{10,}@/g, 'CONNECTION_STRING'],
  [/https:\/\/hooks\.slack\.com\/services\/[A-Za-z0-9/]+/g, 'SLACK_WEBHOOK'],
  [/https:\/\/discord\.com\/api\/webhooks\/[0-9]+\/[A-Za-z0-9_-]+/g, 'DISCORD_WEBHOOK'],
  [/(?:password|passwd|api_key|apikey|api_secret|secret_key|auth_token|access_token|private_key)\s*[:=]\s*["'][^"']{8,}["']/gi, 'HARDCODED_CREDENTIAL'],
];

/**
 * Sanitiza un string reemplazando secretos por marcadores.
 * @param {string} text - Texto a sanitizar
 * @returns {string} Texto con secretos reemplazados por [REDACTED:<tipo>]
 */
export function sanitizeContent(text) {
  if (text == null || typeof text !== 'string') return text;
  let result = text;
  for (const [pattern, label] of SECRET_PATTERNS) {
    result = result.replace(pattern, `[REDACTED:${label}]`);
  }
  return result;
}

/**
 * Sanitiza recursivamente los strings de un objeto.
 * @param {unknown} obj - Objeto a sanitizar (objeto, array, string, primitivo)
 * @returns {unknown} Copia del objeto con strings sanitizados
 */
export function sanitizeObject(obj) {
  if (obj == null) return obj;
  if (typeof obj === 'string') return sanitizeContent(obj);
  if (Array.isArray(obj)) return obj.map((item) => sanitizeObject(item));
  if (typeof obj === 'object') {
    const out = {};
    for (const [key, value] of Object.entries(obj)) {
      out[key] = sanitizeObject(value);
    }
    return out;
  }
  return obj;
}
