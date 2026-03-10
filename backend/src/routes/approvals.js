import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { ApiError } from '../middleware/errorHandler.js';
import { requireBody } from '../middleware/validate.js';
import {
  approveRequest,
  getApprovalRequest,
  listApprovalRequests,
  rejectRequest,
} from '../services/missionControl/approvalsService.js';

const router = Router();

router.get('/', asyncHandler((req, res) => {
  const approvals = listApprovalRequests();
  res.json({ success: true, data: approvals });
}));

router.get('/:approvalId', asyncHandler((req, res) => {
  const approval = getApprovalRequest(req.params.approvalId);
  if (!approval) {
    throw new ApiError('NOT_FOUND', 'Approval no encontrada', 404);
  }

  res.json({ success: true, data: approval });
}));

router.post('/:approvalId/approve', requireBody, asyncHandler((req, res) => {
  const approval = approveRequest(req.params.approvalId, req.body.actor ?? req.playerId ?? 'operator', req.body.note ?? null);
  if (!approval) {
    throw new ApiError('NOT_FOUND', 'Approval no encontrada', 404);
  }

  res.json({ success: true, data: approval });
}));

router.post('/:approvalId/reject', requireBody, asyncHandler((req, res) => {
  const approval = rejectRequest(req.params.approvalId, req.body.actor ?? req.playerId ?? 'operator', req.body.note ?? null);
  if (!approval) {
    throw new ApiError('NOT_FOUND', 'Approval no encontrada', 404);
  }

  res.json({ success: true, data: approval });
}));

export default router;
