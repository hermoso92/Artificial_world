/**
 * Subscription API — Constructor de Mundos.
 */
import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireBody } from '../middleware/validate.js';
import { ApiError } from '../middleware/errorHandler.js';
import {
  getTiers,
  getSubscription,
  getLimits,
  validateCoupon,
  subscribe,
  cancelSubscription,
} from '../subscription/store.js';

const router = Router();

router.get('/tiers', asyncHandler((req, res) => {
  res.json({ success: true, data: getTiers() });
}));

router.get('/me', asyncHandler((req, res) => {
  const playerId = req.playerId;
  if (!playerId) throw new ApiError('VALIDATION_ERROR', 'playerId required', 422);
  const sub = getSubscription(playerId);
  const limits = getLimits(playerId);
  res.json({ success: true, data: { ...sub, limits } });
}));

router.post('/coupon/validate', requireBody, asyncHandler((req, res) => {
  const { code } = req.body ?? {};
  if (typeof code !== 'string') throw new ApiError('VALIDATION_ERROR', 'code must be a string', 422);
  res.json({ success: true, data: validateCoupon(code) });
}));

router.post('/subscribe', requireBody, asyncHandler((req, res) => {
  const playerId = req.playerId;
  const { tier, coupon } = req.body ?? {};
  if (!playerId || !tier) throw new ApiError('VALIDATION_ERROR', 'playerId and tier required', 422);
  const result = subscribe(playerId, tier, coupon);
  if (!result.success) throw new ApiError('VALIDATION_ERROR', result.message, 422);
  res.status(201).json({ success: true, data: result });
}));

router.post('/cancel', requireBody, asyncHandler((req, res) => {
  const playerId = req.playerId;
  if (!playerId) throw new ApiError('VALIDATION_ERROR', 'playerId required', 422);
  const result = cancelSubscription(playerId);
  if (!result.success) throw new ApiError('VALIDATION_ERROR', result.message, 422);
  res.json({ success: true, data: result });
}));

export default router;
