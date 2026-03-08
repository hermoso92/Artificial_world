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

function requirePlayer(req) {
  if (!req.playerId) {
    throw new ApiError('VALIDATION_ERROR', 'playerId is required (x-player-id header)', 422);
  }
  return req.playerId;
}

function getOrCreateHero(playerId, params = {}) {
  if (_heroCache.has(playerId)) return _heroCache.get(playerId);
  const hero = HeroRefuge.loadOrCreate(playerId, params);
  _heroCache.set(playerId, hero);
  return hero;
}

router.get('/', asyncHandler((req, res) => {
  const playerId = requirePlayer(req);
  const hero = getOrCreateHero(playerId);
  res.json({ success: true, data: hero.toJSON() });
}));

router.post('/', requireBody, asyncHandler((req, res) => {
  const playerId = requirePlayer(req);
  const { name, title } = req.body ?? {};
  _heroCache.delete(playerId);
  const hero = HeroRefuge.loadOrCreate(playerId, { name: name ?? 'The Hero', title });
  _heroCache.set(playerId, hero);
  res.status(201).json({ success: true, data: hero.toJSON() });
}));

router.post('/mode', requireBody, asyncHandler((req, res) => {
  const playerId = requirePlayer(req);
  const hero = getOrCreateHero(playerId);
  const { modeId } = req.body ?? {};
  if (!modeId) throw new ApiError('VALIDATION_ERROR', 'modeId is required', 422);
  const ok = hero.switchMode(modeId);
  if (!ok) throw new ApiError('NOT_FOUND', `Mode "${modeId}" does not exist`, 404);
  res.json({ success: true, data: { activeMode: hero.activeMode, agent: hero.agent.toJSON() } });
}));

router.post('/query', requireBody, asyncHandler(async (req, res) => {
  const playerId = requirePlayer(req);
  const hero = getOrCreateHero(playerId);
  const { query, context } = req.body ?? {};
  if (!query) throw new ApiError('VALIDATION_ERROR', 'query is required', 422);
  const response = await hero.queryAgent(query, context ?? {});
  res.json({ success: true, data: response });
}));

router.get('/worlds', asyncHandler((req, res) => {
  const playerId = requirePlayer(req);
  const hero = getOrCreateHero(playerId);
  res.json({ success: true, data: hero.getAliveWorlds().map((w) => w.toJSON()) });
}));

router.post('/worlds', requireBody, asyncHandler((req, res) => {
  const playerId = requirePlayer(req);
  const { name, type, biomes, scale } = req.body ?? {};
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

router.delete('/worlds/:worldId', asyncHandler((req, res) => {
  const playerId = requirePlayer(req);
  const hero = getOrCreateHero(playerId);
  const { worldId } = req.params;
  const ok = hero.destroyWorld(worldId);
  if (!ok) throw new ApiError('NOT_FOUND', `World "${worldId}" not found or already destroyed`, 404);
  res.json({ success: true, data: { destroyed: worldId } });
}));

router.post('/worlds/tick', asyncHandler((req, res) => {
  const playerId = requirePlayer(req);
  const hero = getOrCreateHero(playerId);
  hero.tickAllWorlds();
  res.json({ success: true, data: { totalTicks: hero.stats.totalTicks } });
}));

router.get('/unified', asyncHandler((req, res) => {
  const playerId = requirePlayer(req);
  const hero = getOrCreateHero(playerId);
  res.json({ success: true, data: hero.toJSON() });
}));

export default router;
