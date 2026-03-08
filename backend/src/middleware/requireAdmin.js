/**
 * requireAdmin — Solo permite acceso si playerId está en ADMIN_PLAYER_IDS.
 * Variable de entorno: ADMIN_PLAYER_IDS=id1,id2,id3 (comma-separated)
 */
import { ApiError } from './errorHandler.js';

const ADMIN_IDS = (process.env.ADMIN_PLAYER_IDS || '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export function requireAdmin(req, _res, next) {
  const playerId =
    req.playerId
    ?? req.headers['x-admin-player-id']
    ?? req.body?.playerId
    ?? req.query?.playerId;
  if (!playerId) {
    throw new ApiError('FORBIDDEN', 'playerId requerido (header x-player-id)', 403);
  }
  const normalized = String(playerId).trim().toLowerCase();
  if (!ADMIN_IDS.includes(normalized)) {
    throw new ApiError('FORBIDDEN', 'Acceso denegado. No eres administrador.', 403);
  }
  req.adminPlayerId = normalized;
  next();
}

export function getAdminIds() {
  return [...ADMIN_IDS];
}
