/**
 * API sync para cliente nativo Artificial World (`SyncEnvelopeV1`).
 * OpenAPI: `docs/openapi-artificial-world-native-sync.yaml`.
 *
 * Cabeceras:
 *   x-player-id           — obligatoria (aislamiento por jugador / instalación web)
 *   x-organization-id     — opcional; si viene y el cuerpo trae organizationId, deben coincidir
 *
 * Producción (env, opcional):
 *   AW_NATIVE_SYNC_BEARER_TOKEN — Bearer estático M2M; si está definido (o JWT), exige auth en POST/GET
 *   JWT_AUTH_SECRET — JWT HS256 (`POST /api/aw/auth/login`); envío por Bearer o cookie `JWT_COOKIE_NAME` (default `aw_access_token`)
 *   AW_SYNC_REQUIRE_ORGANIZATION_ID — si es 1/true/yes, el lote debe traer organizationId (cabecera o cuerpo)
 *
 * Con JWT válido: `x-player-id` debe coincidir con `sub`; si el token incluye `org`, el lote debe llevar ese `organizationId`.
 */
import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireBody } from '../middleware/validate.js';
import { ApiError } from '../middleware/errorHandler.js';
import { requireNativeSyncBearerIfConfigured, requireNativeSyncListAuth } from '../middleware/nativeSyncAuth.js';
import { parseAndAuthorizeSyncEnvelope } from '../services/awSyncIngest.js';
import { getAwSyncBatchById, insertAwSyncBatch, listAwSyncBatches } from '../db/database.js';
import logger from '../utils/logger.js';

const router = Router();

function isTruthyEnv(value) {
  const s = String(value ?? '').trim().toLowerCase();
  return s === '1' || s === 'true' || s === 'yes';
}

router.get(
  '/sync/batches',
  requireNativeSyncListAuth,
  asyncHandler((req, res) => {
    const organizationId = req.query.organizationId;
    const playerId = req.query.playerId;
    const limit = req.query.limit;
    const batches = listAwSyncBatches({
      organizationId: typeof organizationId === 'string' ? organizationId : undefined,
      playerId: typeof playerId === 'string' ? playerId : undefined,
      limit: typeof limit === 'string' ? Number(limit) : undefined,
    });
    res.json({
      success: true,
      data: { batches },
    });
  }),
);

router.get(
  '/sync/batches/:batchId',
  requireNativeSyncListAuth,
  asyncHandler((req, res) => {
    const raw = req.params.batchId;
    const batchId = Number(raw);
    if (!Number.isInteger(batchId) || batchId < 1) {
      throw new ApiError('VALIDATION_ERROR', 'batchId inválido', 422);
    }
    const batch = getAwSyncBatchById(batchId);
    if (!batch) {
      throw new ApiError('NOT_FOUND', 'Lote no encontrado', 404);
    }
    const scopeOrg = req.query.organizationId;
    if (typeof scopeOrg === 'string' && scopeOrg.trim()) {
      const expected = scopeOrg.trim();
      const actual = batch.organization_id ?? '';
      if (actual !== expected) {
        throw new ApiError('NOT_FOUND', 'Lote no encontrado', 404);
      }
    }
    res.json({
      success: true,
      data: { batch },
    });
  }),
);

router.post(
  '/sync/batch',
  requireBody,
  requireNativeSyncBearerIfConfigured,
  asyncHandler((req, res) => {
    const playerId = req.playerId ?? null;
    if (!playerId || typeof playerId !== 'string' || !playerId.trim()) {
      throw new ApiError(
        'UNAUTHORIZED',
        'Cabecera x-player-id obligatoria para ingesta de sync',
        401,
      );
    }

    const headerOrganizationId = req.headers['x-organization-id'] ?? null;
    const normalized = parseAndAuthorizeSyncEnvelope(req.body, {
      playerId,
      headerOrganizationId:
        typeof headerOrganizationId === 'string' ? headerOrganizationId : null,
    });

    if (isTruthyEnv(process.env.AW_SYNC_REQUIRE_ORGANIZATION_ID) && !normalized.organizationId) {
      throw new ApiError(
        'VALIDATION_ERROR',
        'organizationId obligatorio cuando AW_SYNC_REQUIRE_ORGANIZATION_ID está activo',
        422,
      );
    }

    if (req.nativeJwtAuth) {
      const pid = playerId.trim();
      if (pid !== req.nativeJwtAuth.sub) {
        throw new ApiError(
          'FORBIDDEN',
          'x-player-id debe coincidir con el sujeto del JWT (sub)',
          403,
        );
      }
      if (req.nativeJwtAuth.organizationId != null) {
        const effOrg = normalized.organizationId;
        if (!effOrg || effOrg !== req.nativeJwtAuth.organizationId) {
          throw new ApiError(
            'FORBIDDEN',
            'organizationId del lote debe coincidir con el JWT (org)',
            403,
          );
        }
      }
    }

    const batchId = insertAwSyncBatch({
      playerId: playerId.trim(),
      organizationId: normalized.organizationId,
      worldId: normalized.worldId,
      schemaVersion: normalized.schemaVersion,
      worldSeed: normalized.worldSeed,
      deviceInstallationId: normalized.deviceInstallationId,
      emittedAt: normalized.emittedAt,
      events: normalized.events,
    });

    logger.info('[awSync] batch ingested', {
      batchId,
      playerId: playerId.slice(0, 8),
      eventCount: normalized.events.length,
      organizationId: normalized.organizationId ?? undefined,
    });

    res.status(201).json({
      success: true,
      data: {
        batchId,
        acceptedEvents: normalized.events.length,
      },
    });
  }),
);

export default router;
