/**
 * Configuración centralizada del backend.
 * URLs y valores sensibles desde variables de entorno.
 */

export const OLLAMA_HOST = process.env.OLLAMA_HOST ?? process.env.OLLAMA_URL ?? 'http://127.0.0.1:11434';
export const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'llama3.2';
export const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS ?? 30000);
