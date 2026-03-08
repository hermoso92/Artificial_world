/**
 * Centralized API configuration.
 * Never hardcode URLs in components — always import from here.
 * Defaults match scripts/iniciar_fullstack.ps1 (backend 3001, frontend 5173).
 */

const BACKEND_PORT = import.meta.env.VITE_BACKEND_PORT ?? '3001';
const BACKEND_HOST = import.meta.env.VITE_BACKEND_HOST ?? window.location.hostname;

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? `/api`;

export const WS_URL = (() => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const frontendPort = import.meta.env.VITE_FRONTEND_PORT ?? '5173';
  const isDev = import.meta.env.DEV && (window.location.port === frontendPort || window.location.port === '5173' || window.location.port === '5174');
  const host = isDev ? `${BACKEND_HOST}:${BACKEND_PORT}` : window.location.host;
  return `${protocol}//${host}/ws`;
})();
