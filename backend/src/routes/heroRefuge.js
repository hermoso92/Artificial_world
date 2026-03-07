/**
 * Hero Refuge API routes.
 * Manages the hero's personal refuge, their AI companion, and artificial worlds.
 */
import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireBody } from '../middleware/validate.js';
import { ApiError } from '../middleware/errorHandler.js';
import { HeroRefuge } from '../simulation/heroRefuge.js';

const router = Router();

// Singleton hero refuge per server session
let _heroRefuge = null;

function getOrCreateHero(params = {}) {
  if (!_heroRefuge) {
    _heroRefuge = new HeroRefuge(params);
  }
  return _heroRefuge;
}

// GET /api/hero — get or auto-create the hero refuge
router.get('/', asyncHandler((req, res) => {
  const hero = getOrCreateHero();
  res.json({ success: true, data: hero.toJSON() });
}));

// POST /api/hero — create/reinitialize hero with custom name
router.post('/', requireBody, asyncHandler((req, res) => {
  const { name, title } = req.body ?? {};
  _heroRefuge = new HeroRefuge({ name: name ?? 'The Hero', title });
  res.status(201).json({ success: true, data: _heroRefuge.toJSON() });
}));

// POST /api/hero/mode — switch the hero's active mode
router.post('/mode', requireBody, asyncHandler((req, res) => {
  const hero = getOrCreateHero();
  const { modeId } = req.body ?? {};
  if (!modeId) throw new ApiError('VALIDATION_ERROR', 'modeId is required', 422);
  const ok = hero.switchMode(modeId);
  if (!ok) throw new ApiError('NOT_FOUND', `Mode "${modeId}" does not exist`, 404);
  res.json({ success: true, data: { activeMode: hero.activeMode, agent: hero.agent.toJSON() } });
}));

// POST /api/hero/query — ask the personal agent
router.post('/query', requireBody, asyncHandler(async (req, res) => {
  const hero = getOrCreateHero();
  const { query, context } = req.body ?? {};
  if (!query) throw new ApiError('VALIDATION_ERROR', 'query is required', 422);
  const response = await hero.queryAgent(query, context ?? {});
  res.json({ success: true, data: response });
}));

// GET /api/hero/worlds — list alive artificial worlds
router.get('/worlds', asyncHandler((req, res) => {
  const hero = getOrCreateHero();
  res.json({ success: true, data: hero.getAliveWorlds().map((w) => w.toJSON()) });
}));

// POST /api/hero/worlds — create a new artificial world
router.post('/worlds', requireBody, asyncHandler((req, res) => {
  const hero = getOrCreateHero();
  const { name, type, biomes, scale } = req.body ?? {};
  const world = hero.createWorld({ name, type, biomes, scale });
  if (!world) throw new ApiError('LIMIT_EXCEEDED', 'Maximum number of worlds reached', 429);
  res.status(201).json({ success: true, data: world.toJSON() });
}));

// DELETE /api/hero/worlds/:worldId — destroy an artificial world
router.delete('/worlds/:worldId', asyncHandler((req, res) => {
  const hero = getOrCreateHero();
  const { worldId } = req.params;
  const ok = hero.destroyWorld(worldId);
  if (!ok) throw new ApiError('NOT_FOUND', `World "${worldId}" not found or already destroyed`, 404);
  res.json({ success: true, data: { destroyed: worldId } });
}));

// POST /api/hero/worlds/tick — advance all alive worlds by one tick
router.post('/worlds/tick', asyncHandler((req, res) => {
  const hero = getOrCreateHero();
  hero.tickAllWorlds();
  res.json({ success: true, data: { totalTicks: hero.stats.totalTicks } });
}));

export default router;
