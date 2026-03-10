import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { ApiError } from '../middleware/errorHandler.js';
import { requireBody } from '../middleware/validate.js';
import { listBoardsView, reorderTask } from '../services/missionControl/boardsService.js';

const router = Router();

router.get('/', asyncHandler((req, res) => {
  res.json({ success: true, data: listBoardsView(req.query ?? {}) });
}));

router.post('/tasks/:taskId/move', requireBody, asyncHandler((req, res) => {
  const nextStatus = req.body.status;
  const beforeTaskId = req.body.beforeTaskId ?? null;
  const allowedStatuses = ['backlog', 'in_progress', 'review', 'done', 'blocked'];
  if (!allowedStatuses.includes(nextStatus)) {
    throw new ApiError('VALIDATION_ERROR', 'Estado de board invalido', 422);
  }

  const task = reorderTask(req.params.taskId, nextStatus, beforeTaskId);
  if (!task) {
    throw new ApiError('NOT_FOUND', 'Task no encontrada', 404);
  }

  res.json({ success: true, data: task });
}));

export default router;
