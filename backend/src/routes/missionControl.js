import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { ApiError } from '../middleware/errorHandler.js';
import { getMissionControlSnapshot, getRunDetail, getTaskDetail } from '../services/missionControl/aggregator.js';
import { getGatesForTask, runQualityGate } from '../services/missionControl/qualityGateService.js';
import { appendDecision, getRun } from '../services/missionControl/repository.js';
import { getMissionControlMetrics } from '../services/missionControl/metricsService.js';
import { pauseTask, resumeTask } from '../services/missionControl/runtime.js';

const router = Router();

router.get('/health', asyncHandler((req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      service: 'mission-control',
      mode: 'hybrid',
      realtime: true,
      persistence: 'sqlite',
    },
  });
}));

router.get('/snapshot', asyncHandler((req, res) => {
  res.json({ success: true, data: getMissionControlSnapshot(req.query ?? {}) });
}));

router.get('/overview', asyncHandler((req, res) => {
  const snapshot = getMissionControlSnapshot(req.query ?? {});
  res.json({ success: true, data: snapshot.overview });
}));

router.get('/metrics', asyncHandler((req, res) => {
  res.json({ success: true, data: getMissionControlMetrics() });
}));

router.get('/agents', asyncHandler((req, res) => {
  const snapshot = getMissionControlSnapshot(req.query ?? {});
  res.json({ success: true, data: snapshot.agents });
}));

router.get('/tasks', asyncHandler((req, res) => {
  const snapshot = getMissionControlSnapshot(req.query ?? {});
  res.json({ success: true, data: snapshot.tasks });
}));

router.get('/tasks/:taskId', asyncHandler((req, res) => {
  const detail = getTaskDetail(req.params.taskId);
  if (!detail) {
    throw new ApiError('NOT_FOUND', 'Task no encontrada', 404);
  }

  res.json({ success: true, data: detail });
}));

router.post('/tasks/:taskId/pause', asyncHandler((req, res) => {
  const task = pauseTask(req.params.taskId);
  if (!task) {
    throw new ApiError('NOT_FOUND', 'Task no encontrada', 404);
  }

  res.json({ success: true, data: task });
}));

router.post('/tasks/:taskId/resume', asyncHandler((req, res) => {
  const task = resumeTask(req.params.taskId);
  if (!task) {
    throw new ApiError('NOT_FOUND', 'Task no encontrada', 404);
  }

  res.json({ success: true, data: task });
}));

router.get('/tasks/:taskId/gates', asyncHandler((req, res) => {
  const gates = getGatesForTask(req.params.taskId);
  res.json({ success: true, data: gates });
}));

router.post('/tasks/:taskId/gates/run', asyncHandler((req, res) => {
  const { gateType = 'guardrails' } = req.body ?? {};
  const result = runQualityGate(req.params.taskId, gateType);
  res.json({ success: true, data: result });
}));

router.get('/runs', asyncHandler((req, res) => {
  const snapshot = getMissionControlSnapshot(req.query ?? {});
  res.json({ success: true, data: snapshot.runs });
}));

router.get('/runs/:runId', asyncHandler((req, res) => {
  const detail = getRunDetail(req.params.runId);
  if (!detail) {
    throw new ApiError('NOT_FOUND', 'Run no encontrado', 404);
  }

  res.json({ success: true, data: detail });
}));

router.get('/runs/:runId/decisions', asyncHandler((req, res) => {
  const run = getRun(req.params.runId);
  if (!run) {
    throw new ApiError('NOT_FOUND', 'Run no encontrado', 404);
  }

  res.json({ success: true, data: run.decisions ?? [] });
}));

router.get('/events', asyncHandler((req, res) => {
  const snapshot = getMissionControlSnapshot(req.query ?? {});
  res.json({ success: true, data: snapshot.events });
}));

export default router;
