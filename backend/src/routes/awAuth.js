/**
 * JWT para clientes nativos (Bearer) y navegador (cookie httpOnly).
 * POST /api/aw/auth/login | POST /api/aw/auth/logout
 */
import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireBody } from '../middleware/validate.js';
import { ApiError } from '../middleware/errorHandler.js';
import { ensurePlayer } from '../db/database.js';
import {
  signAwSessionToken,
  getJwtAuthSecret,
  getJwtCookieName,
  cookieMaxAgeMsFromToken,
} from '../services/awJwt.js';
import logger from '../utils/logger.js';

const router = Router();

function bootstrapSecret() {
  return process.env.AW_AUTH_BOOTSTRAP_SECRET?.trim() || '';
}

router.post(
  '/auth/login',
  requireBody,
  asyncHandler((req, res) => {
    const expectedBootstrap = bootstrapSecret();
    if (expectedBootstrap) {
      const sent = req.headers['x-aw-bootstrap-secret'];
      if (sent !== expectedBootstrap) {
        throw new ApiError('UNAUTHORIZED', 'Cabecera x-aw-bootstrap-secret inválida o ausente', 401);
      }
    }

    const { playerId, organizationId } = req.body ?? {};
    if (!playerId || typeof playerId !== 'string' || !playerId.trim()) {
      throw new ApiError('VALIDATION_ERROR', 'playerId es obligatorio (string no vacío)', 422);
    }

    const sub = playerId.trim();
    const org =
      organizationId === undefined || organizationId === null
        ? null
        : String(organizationId).trim() || null;

    if (!getJwtAuthSecret()) {
      throw new ApiError(
        'INTERNAL_ERROR',
        'JWT_AUTH_SECRET no está configurado en el servidor',
        500,
      );
    }

    try {
      ensurePlayer(sub);
    } catch (err) {
      logger.warn('[awAuth] ensurePlayer failed', { playerId: sub.slice(0, 8), err: err.message });
    }

    const token = signAwSessionToken({ sub, organizationId: org });
    const maxAge = cookieMaxAgeMsFromToken(token);
    const cookieName = getJwtCookieName();
    const isProd = process.env.NODE_ENV === 'production';

    res.cookie(cookieName, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      maxAge,
      path: '/api/aw',
    });

    logger.info('[awAuth] session minted', {
      playerId: sub.slice(0, 8),
      hasOrg: Boolean(org),
    });

    res.status(200).json({
      success: true,
      data: {
        expiresInMs: maxAge,
        token,
      },
    });
  }),
);

router.post(
  '/auth/logout',
  asyncHandler((req, res) => {
    const cookieName = getJwtCookieName();
    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie(cookieName, {
      path: '/api/aw',
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
    });
    logger.info('[awAuth] cookie cleared (logout)');
    res.status(200).json({
      success: true,
      data: { loggedOut: true },
    });
  }),
);

export default router;
