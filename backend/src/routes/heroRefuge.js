/**
 * Hero Refuge API routes.
 * Manages the hero's personal refuge, their AI companion, and artificial worlds.
 * Heroes are persisted in SQLite and scoped by playerId.
 */
import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireBody } from '../middleware/validate.js';
import { ApiError } from '../middleware/errorHandler.js';
import { HeroRefuge } from '../simulation/heroRefuge.js';
import { canCreateWorld } from '../subscription/store.js';

const router = Router();

const _heroCache = new Map();

function resolvePlayerId(req) {
  return req.body?.playerId
    ?? req.query?.playerId
    ?? req.headers['x-player-id']
    ?? null;
}

function getOrCreateHero(playerId, params = {}) {
  if (!playerId) {
    throw new ApiError('VALIDATION_ERROR', 'playerId is required', 422);
  }
  if (_heroCache.has(playerId)) return _heroCache.get(playerId);
  const hero = HeroRefuge.loadOrCreate(playerId, params);
  _heroCache.set(playerId, hero);
  return hero;
}

// GET /api/hero — get or auto-create the hero refuge
router.get('/', asyncHandler((req, res) => {
  const playerId = resolvePlayerId(req);
  if (!playerId) throw new ApiError('VALIDATION_ERROR', 'playerId is required (query or x-player-id header)', 422);
  const hero = getOrCreateHero(playerId);
  res.json({ success: true, data: hero.toJSON() });
}));

// POST /api/hero — create/reinitialize hero with custom name
router.post('/', requireBody, asyncHandler((req, res) => {
  const { name, title, playerId } = req.body ?? {};
  if (!playerId) throw new ApiError('VALIDATION_ERROR', 'playerId is required', 422);
  _heroCache.delete(playerId);
  const hero = HeroRefuge.loadOrCreate(playerId, { name: name ?? 'The Hero', title });
  _heroCache.set(playerId, hero);
  res.status(201).json({ success: true, data: hero.toJSON() });
}));

// POST /api/hero/mode — switch the hero's active mode
router.post('/mode', requireBody, asyncHandler((req, res) => {
  const playerId = resolvePlayerId(req);
  const hero = getOrCreateHero(playerId);
  const { modeId } = req.body ?? {};
  if (!modeId) throw new ApiError('VALIDATION_ERROR', 'modeId is required', 422);
  const ok = hero.switchMode(modeId);
  if (!ok) throw new ApiError('NOT_FOUND', `Mode "${modeId}" does not exist`, 404);
  res.json({ success: true, data: { activeMode: hero.activeMode, agent: hero.agent.toJSON() } });
}));

// POST /api/hero/query — ask the personal agent
router.post('/query', requireBody, asyncHandler(async (req, res) => {
  const playerId = resolvePlayerId(req);
  const hero = getOrCreateHero(playerId);
  const { query, context } = req.body ?? {};
  if (!query) throw new ApiError('VALIDATION_ERROR', 'query is required', 422);
  const response = await hero.queryAgent(query, context ?? {});
  res.json({ success: true, data: response });
}));

// GET /api/hero/worlds — list alive artificial worlds
router.get('/worlds', asyncHandler((req, res) => {
  const playerId = resolvePlayerId(req);
  if (!playerId) throw new ApiError('VALIDATION_ERROR', 'playerId is required', 422);
  const hero = getOrCreateHero(playerId);
  res.json({ success: true, data: hero.getAliveWorlds().map((w) => w.toJSON()) });
}));

// POST /api/hero/worlds — create a new artificial world (subscription limits apply)
router.post('/worlds', requireBody, asyncHandler((req, res) => {
  const { name, type, biomes, scale, playerId } = req.body ?? {};
  const hero = getOrCreateHero(playerId);

  const currentCount = hero.getAliveWorlds().length;
  const check = canCreateWorld(playerId, currentCount);
  if (!check.allowed) {
    throw new ApiError('LIMIT_EXCEEDED', check.reason, 429);
  }

  const world = hero.createWorld({ name, type, biomes, scale });
  if (!world) throw new ApiError('LIMIT_EXCEEDED', 'No se pueden crear más mundos.', 429);
  res.status(201).json({ success: true, data: world.toJSON() });
}));

// DELETE /api/hero/worlds/:worldId — destroy an artificial world
router.delete('/worlds/:worldId', asyncHandler((req, res) => {
  const playerId = resolvePlayerId(req);
  const hero = getOrCreateHero(playerId);
  const { worldId } = req.params;
  const ok = hero.destroyWorld(worldId);
  if (!ok) throw new ApiError('NOT_FOUND', `World "${worldId}" not found or already destroyed`, 404);
  res.json({ success: true, data: { destroyed: worldId } });
}));

// POST /api/hero/worlds/tick — advance all alive worlds by one tick
router.post('/worlds/tick', asyncHandler((req, res) => {
  const playerId = resolvePlayerId(req);
  const hero = getOrCreateHero(playerId);
  hero.tickAllWorlds();
  res.json({ success: true, data: { totalTicks: hero.stats.totalTicks } });
}));

export default router;
