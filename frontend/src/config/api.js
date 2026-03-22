/**
 * Centralized API configuration.
 * Never hardcode URLs in components — always import from here.
 * Defaults match scripts/iniciar_fullstack.ps1 (backend 3001, frontend 5173).
 */

const BACKEND_PORT = import.meta.env.VITE_BACKEND_PORT ?? '3001';
const BACKEND_HOST = import.meta.env.VITE_BACKEND_HOST ?? window.location.hostname;

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? `/api`;
export const MISSION_CONTROL_API_BASE = `${API_BASE_URL}/mission-control`;
/** Emisión de JWT (cookie httpOnly + `data.token` para nativos). Opcional `x-aw-bootstrap-secret`. */
export const AW_NATIVE_AUTH_LOGIN_URL = `${API_BASE_URL}/aw/auth/login`;
/** Expira cookie JWT bajo `/api/aw`; clientes nativos borran Bearer local tras éxito. */
export const AW_NATIVE_AUTH_LOGOUT_URL = `${API_BASE_URL}/aw/auth/logout`;

/** Ingesta de lotes `SyncEnvelopeV1` desde el cliente nativo (iOS) o herramientas. Requiere `x-player-id`. */
export const AW_NATIVE_SYNC_BATCH_URL = `${API_BASE_URL}/aw/sync/batch`;
/** Listado de lotes ingeridos (Bearer o admin). Query: organizationId, playerId, limit */
export const AW_NATIVE_SYNC_BATCHES_URL = `${API_BASE_URL}/aw/sync/batches`;

/** Detalle de un lote ingerido (misma auth que el listado). Query opcional: organizationId (debe coincidir). */
export function awNativeSyncBatchDetailUrl(batchId) {
  return `${API_BASE_URL}/aw/sync/batches/${encodeURIComponent(String(batchId))}`;
}

export const WS_URL = (() => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const frontendPort = import.meta.env.VITE_FRONTEND_PORT ?? '5173';
  const isDev = import.meta.env.DEV && (window.location.port === frontendPort || window.location.port === '5173' || window.location.port === '5174');
  const host = isDev ? `${BACKEND_HOST}:${BACKEND_PORT}` : window.location.host;
  return `${protocol}//${host}/ws`;
})();

export const MISSION_CONTROL_WS_MESSAGE_TYPES = {
  SNAPSHOT: 'mission-control:snapshot',
  EVENT: 'mission-control:event',
};
