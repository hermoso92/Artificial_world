/**
 * Centralized API configuration.
 * Never hardcode URLs in components — always import from here.
 */

const BACKEND_PORT = import.meta.env.VITE_BACKEND_PORT ?? '3001';
const BACKEND_HOST = import.meta.env.VITE_BACKEND_HOST ?? window.location.hostname;

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? `/api`;

export const WS_URL = (() => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const isDev = import.meta.env.DEV && window.location.port === '5173';
  const host = isDev ? `${BACKEND_HOST}:${BACKEND_PORT}` : window.location.host;
  return `${protocol}//${host}/ws`;
})();
