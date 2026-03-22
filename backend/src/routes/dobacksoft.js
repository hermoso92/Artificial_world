/**
 * DobackSoft API — early-adopter access by coupon.
 * First 1000 citizens: €9.99/mo. Regular: €29/mo.
 */
import { Router } from 'express';
import multer from 'multer';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { getStats, validateCoupon, registerCitizen } from '../dobacksoft/store.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireBody } from '../middleware/validate.js';
import { ApiError } from '../middleware/errorHandler.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024, files: 6 },
});

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
  const trimmed = String(code).trim().toUpperCase();
  if (trimmed === 'DEMO') {
    const stats = getStats();
    return res.json({
      success: true,
      data: {
        valid: true,
        price: 9.99,
        isEarlyAdopter: true,
        slotsRemaining: stats.slotsRemaining,
        message: 'Cupón válido. Tu precio: €9.99/mes (en lugar de €29).',
        accessCode: `DOBACK-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      },
    });
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

// Sesiones y rutas (mock para visor 2D; conectar DobackSoft real para datos reales)
const sessionsStore = [
  {
    id: 'mock-session-1',
    vehicleId: 'v1',
    vehicleName: 'Vehículo demo',
    startTime: '2025-03-08T10:00:00Z',
    endTime: '2025-03-08T10:30:00Z',
    distanceKm: 12.5,
    durationSeconds: 1800,
  },
];

router.post('/upload', upload.fields([
  { name: 'ESTABILIDAD', maxCount: 2 },
  { name: 'GPS', maxCount: 2 },
  { name: 'ROTATIVO', maxCount: 2 },
]), asyncHandler((req, res) => {
  const files = req.files ?? {};
  const vehicleName = (req.body?.vehicleName || 'Vehículo subido').trim().slice(0, 80);
  const count = Object.values(files).flat().length;
  if (count === 0) {
    throw new ApiError('VALIDATION_ERROR', 'Selecciona al menos un archivo', 422);
  }
  const id = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const session = {
    id,
    vehicleId: id,
    vehicleName,
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString(),
    distanceKm: 0,
    durationSeconds: 0,
  };
  sessionsStore.push(session);
  res.status(201).json({
    success: true,
    data: {
      sessionId: id,
      message: `${count} archivo(s) recibidos. Sesión creada. Revisa "Ver rutas".`,
    },
  });
}));

const MOCK_ROUTE = {
  route: [
    { lat: 40.4168, lng: -3.7038, speed: 0, timestamp: '2025-03-08T10:00:00Z' },
    { lat: 40.418, lng: -3.702, speed: 25, timestamp: '2025-03-08T10:05:00Z' },
    { lat: 40.42, lng: -3.698, speed: 45, timestamp: '2025-03-08T10:10:00Z' },
    { lat: 40.422, lng: -3.695, speed: 50, timestamp: '2025-03-08T10:15:00Z' },
    { lat: 40.424, lng: -3.692, speed: 35, timestamp: '2025-03-08T10:20:00Z' },
    { lat: 40.426, lng: -3.688, speed: 40, timestamp: '2025-03-08T10:25:00Z' },
    { lat: 40.428, lng: -3.685, speed: 0, timestamp: '2025-03-08T10:30:00Z' },
  ],
  events: [
    { lat: 40.42, lng: -3.698, type: 'EXCESO_VELOCIDAD', severity: 'moderate' },
    { lat: 40.424, lng: -3.692, type: 'FRENAZO', severity: 'high' },
  ],
  session: sessionsStore[0],
};

router.get('/sessions', asyncHandler((req, res) => {
  res.json({ success: true, data: sessionsStore });
}));

router.get('/session-route/:id', asyncHandler((req, res) => {
  const { id } = req.params;
  const session = sessionsStore.find((s) => s.id === id);
  if (!session) {
    throw new ApiError('NOT_FOUND', 'Sesión no encontrada', 404);
  }
  res.json({ success: true, data: { ...MOCK_ROUTE, session } });
}));

export default router;
