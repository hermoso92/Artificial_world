/**
 * Middleware: extract playerId from x-player-id header.
 * Attaches req.playerId for downstream use.
 * Registers the player in the DB on first sight.
 */
import { ensurePlayer } from '../db/database.js';
import logger from '../utils/logger.js';

export function playerContext(req, _res, next) {
  req.playerId =
    req.headers['x-player-id']
    ?? req.body?.playerId
    ?? req.query?.playerId
    ?? null;

  if (req.playerId) {
    try {
      ensurePlayer(req.playerId);
    } catch (err) {
      logger.warn('[playerContext] ensurePlayer failed', { playerId: req.playerId, err: err.message });
    }
  }

  next();
}
