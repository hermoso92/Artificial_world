/**
 * API routes for Artificial Worlds.
 * RESTful design — internals in English, user-facing errors in Spanish.
 */
import { Router } from 'express';
import { getWorld, startSimulation, pauseSimulation, resetSimulation } from '../simulation/engine.js';
import { runDiagnostics } from '../services/diagnostics.js';
import { registrar as eventStoreRegistrar, obtener as eventStoreObtener, verificarIntegridad as eventStoreVerificarIntegridad } from '../audit/eventStore.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireBody, validateBlueprint } from '../middleware/validate.js';
import { ApiError } from '../middleware/errorHandler.js';
import { isValidFurnitureType, getCatalog } from '../simulation/furnitureCatalog.js';
import logger from '../utils/logger.js';
import { canAddAgents } from '../subscription/store.js';
// #region agent log
import { appendFileSync } from 'node:fs';
const _dbg = (msg, data) => { try { appendFileSync('debug-cc0b57.log', JSON.stringify({ sessionId: 'cc0b57', location: 'api.js', message: msg, data, timestamp: Date.now() }) + '\n'); } catch {} };
// #endregion

const router = Router();

// --- Health & Status ---

router.get('/health', (req, res) => {
  // #region agent log
  _dbg('GET /health', { hypothesisId: 'H-C' });
  // #endregion
  res.json({ success: true, data: { status: 'ok', service: 'artificial-world-api', ws: true } });
});

router.get('/diagnostics', asyncHandler((req, res) => {
  const data = runDiagnostics();
  res.json({ success: true, data });
}));

router.get('/status', asyncHandler((req, res) => {
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
}));

// --- World Data (read-only, no side effects) ---

router.get('/world', asyncHandler((req, res) => {
  const world = getWorld();
  // #region agent log
  _dbg('GET /world', { activeRefugeIndex: world.activeRefugeIndex, refugeCount: world.refuges.length, activeRefugeName: world.getActiveRefuge()?.name, activeRefugeOwnerId: world.getActiveRefuge()?.ownerId, hypothesisId: 'H-A' });
  // #endregion
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
  // #region agent log
  _dbg('GET /refuges', { count: world.refuges.length, owners: world.refuges.map((r, i) => ({ i, name: r.name, ownerId: r.ownerId || null })).filter(x => x.ownerId), hypothesisId: 'H-A' });
  // #endregion
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

// --- Blueprints & Refuges ---

router.post('/blueprints', requireBody, validateBlueprint, asyncHandler((req, res) => {
  const world = getWorld();
  const { name, traits } = req.body ?? {};
  const bp = world.createBlueprint(name ?? 'New Species', traits);
  res.status(201).json({ success: true, data: bp.toJSON() });
}));

router.post('/refuges', requireBody, asyncHandler((req, res) => {
  const world = getWorld();
  const { name, ownerId } = req.body ?? {};
  // #region agent log
  _dbg('POST /refuges', { name, ownerId, currentRefugeCount: world.refuges.length, hypothesisId: 'H-B' });
  // #endregion
  const refuge = world.createRefuge({
    name: typeof name === 'string' ? name : 'Mi casa',
    ownerId: ownerId ?? null,
  });
  if (!refuge) {
    throw new ApiError('LIMIT_EXCEEDED', 'Se alcanzó el límite de refugios', 429);
  }
  world.setActiveRefuge(world.refuges.length - 1);
  res.status(201).json({ success: true, data: refuge.toJSON() });
}));

router.post('/refuge/node', requireBody, asyncHandler((req, res) => {
  const { type, gridX, gridY } = req.body ?? {};
  const { refuge, idx } = getOwnedRefuge(req.body);
  const world = getWorld();
  const result = world.addRefugeNode(idx, type ?? 'solar', Number(gridX), Number(gridY));
  if (!result) throw new ApiError('VALIDATION_ERROR', 'No se pudo colocar el nodo (celda ocupada o inválida)', 422);
  res.status(201).json({ success: true, data: result });
}));

router.post('/refuge/select', requireBody, asyncHandler((req, res) => {
  const world = getWorld();
  const { index } = req.body ?? {};
  const idx = Number(index);
  // #region agent log
  _dbg('POST /refuge/select', { requestedIndex: idx, refugeCount: world.refuges.length, targetName: world.refuges[idx]?.name, targetOwnerId: world.refuges[idx]?.ownerId, hypothesisId: 'H-B' });
  // #endregion
  if (isNaN(idx) || idx < 0 || idx >= world.refuges.length) {
    throw new ApiError('VALIDATION_ERROR', 'Índice de refugio inválido', 422);
  }
  world.setActiveRefuge(idx);
  res.json({ success: true, data: { activeRefugeIndex: world.activeRefugeIndex } });
}));

router.post('/release', requireBody, asyncHandler((req, res) => {
  const world = getWorld();
  const { refugeIndex, blueprintId, count, playerId } = req.body ?? {};
  const bpId = typeof blueprintId === 'string' ? parseInt(blueprintId, 10) : blueprintId;
  const blueprint = world.blueprints.find((b) => b.id === bpId);
  if (!blueprint) {
    throw new ApiError('NOT_FOUND', 'Blueprint no encontrado', 404);
  }

  const rIdx = refugeIndex ?? 0;
  const requestedCount = count ?? 5;

  if (playerId) {
    const currentAgents = world.refuges[rIdx]?.agents?.length ?? 0;
    const check = canAddAgents(playerId, currentAgents, requestedCount);
    if (!check.allowed) {
      throw new ApiError('LIMIT_EXCEEDED', check.reason, 429);
    }
  }

  const added = world.releaseAgents(rIdx, bpId, requestedCount);
  if (added > 0) {
    eventStoreRegistrar(world.tick, 'agent_release', {
      refugeIndex: rIdx,
      blueprintId: bpId,
      blueprintName: blueprint.name,
      count: added,
    }, { riskScore: 10, signals: ['directiva_emitida'] });
  }
  res.status(201).json({ success: true, data: { added } });
}));

// --- Refuge Interior: Ownership helper ---

function getOwnedRefuge(body) {
  const world = getWorld();
  const idx = Number(body.refugeIndex ?? world.activeRefugeIndex ?? 0);
  const refuge = world.refuges[idx];
  if (!refuge) throw new ApiError('NOT_FOUND', 'Refugio no encontrado', 404);
  if (!refuge.ownerId) throw new ApiError('FORBIDDEN', 'Este refugio no tiene dueño', 403);
  if (body.ownerId && refuge.ownerId !== body.ownerId) {
    throw new ApiError('FORBIDDEN', 'Este refugio no es tuyo', 403);
  }
  return { refuge, idx };
}

// --- Refuge Interior: Furniture ---

router.get('/refuge/furniture/catalog', (req, res) => {
  res.json({ success: true, data: getCatalog() });
});

router.post('/refuge/furniture', requireBody, asyncHandler((req, res) => {
  const { type, gridX, gridY } = req.body ?? {};
  const { refuge } = getOwnedRefuge(req.body);
  if (!isValidFurnitureType(type)) {
    throw new ApiError('VALIDATION_ERROR', `Tipo de mueble inválido: ${type}`, 422);
  }
  const item = refuge.placeFurniture(type, Number(gridX), Number(gridY));
  if (!item) throw new ApiError('VALIDATION_ERROR', 'No se pudo colocar (celda ocupada o fuera de rango)', 422);
  logger.info('Furniture placed', { type, gridX: item.gridX, gridY: item.gridY, refugeId: refuge.id });
  res.status(201).json({ success: true, data: item });
}));

router.post('/refuge/interact', requireBody, asyncHandler((req, res) => {
  const { furnitureId } = req.body ?? {};
  const { refuge } = getOwnedRefuge(req.body);
  const fId = Number(furnitureId);
  if (isNaN(fId)) throw new ApiError('VALIDATION_ERROR', 'furnitureId requerido', 422);
  const result = refuge.useFurniture(fId);
  if (!result) throw new ApiError('NOT_FOUND', 'Mueble no encontrado', 404);
  if (result.cooldown) {
    return res.status(429).json({ success: false, error: 'COOLDOWN', remainingMs: result.remainingMs });
  }
  logger.info('Furniture used', { type: result.type, changes: result.changes, refugeId: refuge.id });
  res.json({ success: true, data: result });
}));

router.delete('/refuge/furniture/:id', asyncHandler((req, res) => {
  const { refuge } = getOwnedRefuge({ ownerId: req.query.ownerId, refugeIndex: req.query.refugeIndex });
  const fId = Number(req.params.id);
  const removed = refuge.removeFurniture(fId);
  if (!removed) throw new ApiError('NOT_FOUND', 'Mueble no encontrado', 404);
  logger.info('Furniture removed', { type: removed.type, furnitureId: fId, refugeId: refuge.id });
  res.json({ success: true, data: removed });
}));

// --- Refuge Interior: Pets ---

router.post('/refuge/pet/adopt', requireBody, asyncHandler((req, res) => {
  const { species } = req.body ?? {};
  const { refuge } = getOwnedRefuge(req.body);
  const pet = refuge.adoptPet(species ?? 'cat');
  if (!pet) throw new ApiError('VALIDATION_ERROR', 'Ya tienes una mascota de ese tipo', 422);
  logger.info('Pet adopted', { species: pet.species, refugeId: refuge.id });
  res.status(201).json({ success: true, data: pet });
}));

// NOTE: transitional endpoint — pet tick should eventually be part of the
// simulation loop once the backend tracks player position natively.
router.post('/refuge/pet/tick', requireBody, asyncHandler((req, res) => {
  const { playerX, playerY } = req.body ?? {};
  const { refuge } = getOwnedRefuge(req.body);
  refuge.tickPets(Number(playerX ?? 16), Number(playerY ?? 16));
  res.json({ success: true, data: { pets: refuge.pets, stats: refuge.getPlayerStats() } });
}));

// --- Simulation controls ---

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

// --- Audit ---

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
