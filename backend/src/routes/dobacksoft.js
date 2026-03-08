/**
 * DobackSoft API — early-adopter access by coupon.
 * First 1000 citizens: €9.99/mo. Regular: €29/mo.
 */
import { Router } from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { getStats, validateCoupon, registerCitizen } from '../dobacksoft/store.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireBody } from '../middleware/validate.js';
import { ApiError } from '../middleware/errorHandler.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TRAILER_PATH = join(__dirname, '../../../assets/dobacksoft/fire_truck_trailer.mp4');

const router = Router();

router.get('/trailer', (req, res) => {
  if (!existsSync(TRAILER_PATH)) {
    return res.status(404).json({ error: { message: 'Trailer no disponible' } });
  }
  res.sendFile(TRAILER_PATH, { headers: { 'Content-Type': 'video/mp4' } });
});

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
