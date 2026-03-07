/**
 * API routes for Artificial Worlds.
 * RESTful design per express-rest-api skill.
 */
import { Router } from 'express';
import { getWorld, startSimulation, pauseSimulation, resetSimulation } from '../simulation/engine.js';
import { runDiagnostics } from '../services/diagnostics.js';
import { registrar as eventStoreRegistrar, obtener as eventStoreObtener, verificarIntegridad as eventStoreVerificarIntegridad } from '../audit/eventStore.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireBody, validateBlueprint } from '../middleware/validate.js';
import { ApiError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

const router = Router();

router.get('/diagnostics', asyncHandler((req, res) => {
  const data = runDiagnostics();
  res.json({ success: true, data });
}));

router.get('/status', asyncHandler((req, res) => {
  try {
    const world = getWorld();
    const refuge = world.getActiveRefuge();
    const agentCount = (refuge?.agents ?? []).filter((a) => !a.dead).length;
    res.json({
      success: true,
      data: {
        tick: world.tick,
        running: world.running,
        agentCount,
        refugeCount: world.refuges.length,
        uptime: Math.floor(process.uptime()),
      },
    });
  } catch (err) {
    logger.error('GET /status failed:', err.message, err.stack);
    throw new ApiError('INTERNAL_ERROR', err.message || 'Error al obtener estado', 500);
  }
}));

router.get('/world', asyncHandler((req, res) => {
  const world = getWorld();
  res.json({ success: true, data: world.toJSON() });
}));

router.get('/agents', asyncHandler((req, res) => {
  const world = getWorld();
  const refuge = world.getActiveRefuge();
  const agents = (refuge?.agents ?? []).filter((a) => !a.dead).map((a) => a.toJSON());
  res.json({ success: true, data: agents });
}));

router.get('/refuges', asyncHandler((req, res) => {
  const world = getWorld();
  res.json({ success: true, data: world.refuges.map((r) => r.toJSON()) });
}));

router.get('/blueprints', asyncHandler((req, res) => {
  const world = getWorld();
  res.json({ success: true, data: world.blueprints.map((b) => b.toJSON()) });
}));

router.get('/logs', asyncHandler((req, res) => {
  const world = getWorld();
  res.json({ success: true, data: world.logs });
}));

router.post('/blueprints', requireBody, validateBlueprint, asyncHandler((req, res) => {
  const world = getWorld();
  const { name, traits } = req.body ?? {};
  const bp = world.createBlueprint(name ?? 'New Species', traits);
  res.status(201).json({ success: true, data: bp.toJSON() });
}));

router.post('/refuge/select', requireBody, asyncHandler((req, res) => {
  const world = getWorld();
  const { index } = req.body ?? {};
  const idx = Number(index);
  if (isNaN(idx) || idx < 0 || idx >= world.refuges.length) {
    throw new ApiError('VALIDATION_ERROR', 'Invalid refuge index', 422);
  }
  world.setActiveRefuge(idx);
  res.json({ success: true, data: { activeRefugeIndex: world.activeRefugeIndex } });
}));

router.post('/release', requireBody, asyncHandler((req, res) => {
  const world = getWorld();
  const { refugeIndex, blueprintId, count } = req.body ?? {};
  const bpId = typeof blueprintId === 'string' ? parseInt(blueprintId, 10) : blueprintId;
  const blueprint = world.blueprints.find((b) => b.id === bpId);
  if (!blueprint) {
    throw new ApiError('NOT_FOUND', 'Blueprint not found', 404);
  }
  const added = world.releaseAgents(refugeIndex ?? 0, bpId, count ?? 5);
  if (added > 0) {
    eventStoreRegistrar(world.tick, 'agent_release', {
      refugeIndex: refugeIndex ?? 0,
      blueprintId: bpId,
      blueprintName: blueprint.name,
      count: added,
    }, { riskScore: 10, signals: ['directiva_emitida'] });
  }
  res.status(201).json({ success: true, data: { added } });
}));

router.post('/simulation/start', asyncHandler((req, res) => {
  startSimulation();
  res.json({ success: true, data: { message: 'Simulation started' } });
}));

router.post('/simulation/pause', asyncHandler((req, res) => {
  pauseSimulation();
  res.json({ success: true, data: { message: 'Simulation paused' } });
}));

router.post('/simulation/reset', asyncHandler((req, res) => {
  resetSimulation();
  res.json({ success: true, data: { message: 'World reset' } });
}));

router.get('/audit/events', asyncHandler((req, res) => {
  const { sessionId, tickMin, tickMax, type, riskMin, limit } = req.query;
  const opts = {};
  if (sessionId) opts.sessionId = sessionId;
  if (tickMin != null) opts.tickMin = parseInt(tickMin, 10);
  if (tickMax != null) opts.tickMax = parseInt(tickMax, 10);
  if (type) opts.type = type;
  if (riskMin != null) opts.riskMin = parseInt(riskMin, 10);
  if (limit != null) opts.limit = Math.min(parseInt(limit, 10) || 100, 500);
  const events = eventStoreObtener(opts);
  res.json({ success: true, data: events });
}));

router.get('/audit/integrity', asyncHandler((req, res) => {
  const corruptos = eventStoreVerificarIntegridad();
  res.json({ success: true, data: { ok: corruptos.length === 0, corruptos } });
}));

export default router;
