/**
 * requireAdmin — Solo permite acceso si playerId está en ADMIN_PLAYER_IDS.
 * Opcional: si ADMIN_SECRET está definido, también exige header x-admin-secret.
 * Variables de entorno: ADMIN_PLAYER_IDS=id1,id2,id3 | ADMIN_SECRET=secreto
 */
import { ApiError } from './errorHandler.js';

const ADMIN_IDS = (process.env.ADMIN_PLAYER_IDS || '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

const ADMIN_SECRET = process.env.ADMIN_SECRET?.trim() || null;

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
  if (ADMIN_SECRET) {
    const secret = req.headers['x-admin-secret'] ?? req.body?.adminSecret ?? req.query?.adminSecret;
    if (secret !== ADMIN_SECRET) {
      throw new ApiError('FORBIDDEN', 'Secreto de administrador inválido.', 403);
    }
  }
  req.adminPlayerId = normalized;
  next();
}

export function getAdminIds() {
  return [...ADMIN_IDS];
}
