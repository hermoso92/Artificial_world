/**
 * DobackSoft API — early-adopter access by coupon.
 * First 1000 citizens: €9.99/mo. Regular: €29/mo.
 */
import { Router } from 'express';
import { getStats, validateCoupon, registerCitizen } from '../dobacksoft/store.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireBody } from '../middleware/validate.js';
import { ApiError } from '../middleware/errorHandler.js';

const router = Router();

router.get('/stats', asyncHandler((req, res) => {
  const stats = getStats();
  res.json({ success: true, data: stats });
}));

router.post('/coupon/validate', requireBody, asyncHandler((req, res) => {
  const { code } = req.body ?? {};
  if (typeof code !== 'string') {
    throw new ApiError('VALIDATION_ERROR', 'code must be a string', 422);
  }
  const result = validateCoupon(code);
  res.json({ success: true, data: result });
}));

router.post('/citizens', asyncHandler((req, res) => {
  const result = registerCitizen();
  if (!result.success) {
    throw new ApiError('VALIDATION_ERROR', result.message, 422);
  }
  res.status(201).json({ success: true, data: result });
}));

export default router;
