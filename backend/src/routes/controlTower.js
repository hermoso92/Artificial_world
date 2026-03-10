import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { ApiError } from '../middleware/errorHandler.js';
import {
  createMission,
  getMission,
  listMissions,
  deleteMission,
  getSpecialistResults,
  getDossier,
} from '../services/controlTower/missionRepository.js';

const router = Router();

// POST /api/control-tower/missions
router.post('/missions', asyncHandler((req, res) => {
  const { name, repo_url, docs_path } = req.body ?? {};

  if (!name || typeof name !== 'string' || !name.trim()) {
    throw new ApiError('VALIDATION_ERROR', 'name es obligatorio', 422);
  }
  if (!repo_url || typeof repo_url !== 'string' || !repo_url.trim()) {
    throw new ApiError('VALIDATION_ERROR', 'repo_url es obligatorio', 422);
  }

  const mission = createMission({
    name: name.trim(),
    repo_url: repo_url.trim(),
    docs_path: docs_path?.trim() ?? null,
  });

  res.status(201).json({ success: true, data: mission });
}));

// GET /api/control-tower/missions
router.get('/missions', asyncHandler((req, res) => {
  res.json({ success: true, data: listMissions() });
}));

// GET /api/control-tower/missions/:id
router.get('/missions/:id', asyncHandler((req, res) => {
  const mission = getMission(req.params.id);
  if (!mission) throw new ApiError('NOT_FOUND', 'Misión no encontrada', 404);
  res.json({ success: true, data: mission });
}));

// POST /api/control-tower/missions/:id/run
router.post('/missions/:id/run', asyncHandler(async (req, res) => {
  const mission = getMission(req.params.id);
  if (!mission) throw new ApiError('NOT_FOUND', 'Misión no encontrada', 404);

  if (['ingesting', 'recognized', 'analyzing', 'consolidating'].includes(mission.status)) {
    throw new ApiError('VALIDATION_ERROR', 'La misión ya está en ejecución', 422);
  }

  // Lazy import para evitar carga circular en fase inicial
  const { runPipeline } = await import('../services/controlTower/orchestrator.js');
  // Lanzar pipeline de forma asíncrona — no bloqueante
  setImmediate(() => {
    runPipeline(mission.id).catch((err) => {
      console.error(`[control-tower] Pipeline error for mission ${mission.id}:`, err.message);
    });
  });

  res.json({ success: true, data: { mission_id: mission.id, status: 'pipeline_started' } });
}));

// GET /api/control-tower/missions/:id/specialists
router.get('/missions/:id/specialists', asyncHandler((req, res) => {
  const mission = getMission(req.params.id);
  if (!mission) throw new ApiError('NOT_FOUND', 'Misión no encontrada', 404);
  res.json({ success: true, data: getSpecialistResults(req.params.id) });
}));

// GET /api/control-tower/missions/:id/dossier
router.get('/missions/:id/dossier', asyncHandler((req, res) => {
  const mission = getMission(req.params.id);
  if (!mission) throw new ApiError('NOT_FOUND', 'Misión no encontrada', 404);

  const dossier = getDossier(req.params.id);
  if (!dossier) throw new ApiError('NOT_FOUND', 'Dossier no disponible aún', 404);

  res.json({ success: true, data: dossier });
}));

// DELETE /api/control-tower/missions/:id
router.delete('/missions/:id', asyncHandler((req, res) => {
  const mission = getMission(req.params.id);
  if (!mission) throw new ApiError('NOT_FOUND', 'Misión no encontrada', 404);
  deleteMission(req.params.id);
  res.json({ success: true, data: { deleted: true } });
}));

export default router;
