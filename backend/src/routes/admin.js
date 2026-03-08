/**
 * Admin API — Modo dios. Solo ADMIN_PLAYER_IDS.
 * Operaciones auditadas: sin DROP, sin DELETE sin WHERE.
 */
import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireBody } from '../middleware/validate.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { ApiError } from '../middleware/errorHandler.js';
import { getWorld, resetSimulation } from '../simulation/engine.js';
import { HeroRefuge } from '../simulation/heroRefuge.js';
import { getStats as getDobackSoftStats, resetCitizens as resetDobackSoftCitizens } from '../dobacksoft/store.js';
import { obtener as eventStoreObtener, contar as eventStoreContar } from '../audit/eventStore.js';
import logger from '../utils/logger.js';

const router = Router();

router.use(requireAdmin);

router.get('/overview', asyncHandler((req, res) => {
  const world = getWorld();
  const playerId = req.query.targetPlayerId ?? req.adminPlayerId;
  const hero = playerId ? HeroRefuge.loadOrCreate(playerId) : null;
  const doback = getDobackSoftStats();
  const auditCount = eventStoreContar();
  res.json({
    success: true,
    data: {
      simulation: {
        tick: world.tick,
        running: world.running,
        refugeCount: world.refuges.length,
        blueprintsCount: world.blueprints.length,
      },
      hero: hero ? {
        worldsCount: hero.getAliveWorlds().length,
        totalWorlds: hero.worlds.length,
      } : null,
      dobacksoft: {
        citizensCount: doback.citizensCount,
        maxCitizens: doback.maxCitizens,
      },
      audit: { eventCount: auditCount },
    },
  });
}));

router.post('/simulation/reset', asyncHandler((req, res) => {
  resetSimulation();
  logger.info('[admin] Simulation reset', { by: req.adminPlayerId });
  res.json({ success: true, data: { message: 'Simulación reiniciada' } });
}));

router.delete('/hero/worlds/:worldId', asyncHandler((req, res) => {
  const playerId = req.query.targetPlayerId ?? req.adminPlayerId;
  if (!playerId) throw new ApiError('VALIDATION_ERROR', 'targetPlayerId required', 422);
  const hero = HeroRefuge.loadOrCreate(playerId);
  const ok = hero.destroyWorld(req.params.worldId);
  if (!ok) throw new ApiError('NOT_FOUND', 'Mundo no encontrado o ya destruido', 404);
  logger.info('[admin] Hero world destroyed', { worldId: req.params.worldId, by: req.adminPlayerId });
  res.json({ success: true, data: { destroyed: req.params.worldId } });
}));

router.post('/hero/worlds/wipe', asyncHandler((req, res) => {
  const playerId = req.body?.targetPlayerId ?? req.adminPlayerId;
  if (!playerId) throw new ApiError('VALIDATION_ERROR', 'targetPlayerId required', 422);
  const hero = HeroRefuge.loadOrCreate(playerId);
  const alive = hero.getAliveWorlds();
  for (const w of alive) {
    hero.destroyWorld(w.id);
  }
  logger.info('[admin] All hero worlds wiped', { count: alive.length, by: req.adminPlayerId });
  res.json({ success: true, data: { destroyed: alive.length } });
}));

router.post('/refuges/remove', requireBody, asyncHandler((req, res) => {
  const world = getWorld();
  const index = Number(req.body.refugeIndex ?? req.body.index);
  if (isNaN(index) || index < 0 || index >= world.refuges.length) {
    throw new ApiError('VALIDATION_ERROR', 'refugeIndex inválido', 422);
  }
  if (world.refuges.length <= 1) {
    throw new ApiError('VALIDATION_ERROR', 'No se puede eliminar el último refugio', 422);
  }
  world.refuges.splice(index, 1);
  if (world.activeRefugeIndex >= world.refuges.length) {
    world.activeRefugeIndex = Math.max(0, world.refuges.length - 1);
  } else if (world.activeRefugeIndex > index) {
    world.activeRefugeIndex--;
  }
  world.addLog(`Refugio ${index} eliminado (admin)`, 'system');
  logger.info('[admin] Refuge removed', { index, by: req.adminPlayerId });
  res.json({ success: true, data: { removed: index } });
}));

router.post('/dobacksoft/reset', asyncHandler((req, res) => {
  const before = getDobackSoftStats().citizensCount;
  resetDobackSoftCitizens();
  logger.info('[admin] DobackSoft citizens reset', { before, by: req.adminPlayerId });
  res.json({ success: true, data: { before, message: 'Ciudadanos DobackSoft reiniciados' } });
}));

router.get('/audit/events', asyncHandler((req, res) => {
  const { sessionId, tickMin, tickMax, type, limit } = req.query;
  const opts = {};
  if (sessionId) opts.sessionId = sessionId;
  if (tickMin != null) opts.tickMin = parseInt(tickMin, 10);
  if (tickMax != null) opts.tickMax = parseInt(tickMax, 10);
  if (type) opts.type = type;
  opts.limit = Math.min(parseInt(limit, 10) || 100, 500);
  const events = eventStoreObtener(opts);
  res.json({ success: true, data: events });
}));

export default router;
