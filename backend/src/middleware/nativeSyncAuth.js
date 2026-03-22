/**
 * Auth para la API de sync nativo (iOS / herramientas / navegador).
 *
 * Modos (lectura en cada petición):
 * - `AW_NATIVE_SYNC_BEARER_TOKEN`: Bearer estático (M2M).
 * - `JWT_AUTH_SECRET`: JWT HS256 en `Authorization: Bearer` o cookie httpOnly (`JWT_COOKIE_NAME`, default `aw_access_token`).
 *
 * Si ambos están definidos, vale cualquiera de los dos. Si ninguno, no se exige capa extra (solo `x-player-id` en POST).
 */
import { ApiError } from './errorHandler.js';
import { requireAdmin } from './requireAdmin.js';
import { verifyAwSessionToken, getJwtAuthSecret, getJwtCookieName } from '../services/awJwt.js';

function expectedStaticBearer() {
  return process.env.AW_NATIVE_SYNC_BEARER_TOKEN?.trim() || '';
}

export function extractBearerToken(req) {
  const auth = req.headers.authorization ?? '';
  const match = /^Bearer\s+(\S+)\s*$/i.exec(auth);
  return match ? match[1].trim() : '';
}

/**
 * @returns {{ type: 'static' } | { type: 'jwt', sub: string, organizationId: string | null } | null}
 */
export function authenticateNativeSyncRequest(req) {
  const staticT = expectedStaticBearer();
  const secret = getJwtAuthSecret();
  const bearer = extractBearerToken(req);
  const cookieName = getJwtCookieName();
  const cookieTok =
    req.cookies && typeof req.cookies[cookieName] === 'string' ? req.cookies[cookieName] : null;

  if (staticT && bearer === staticT) {
    return { type: 'static' };
  }

  if (secret) {
    const raw = bearer || cookieTok;
    if (raw) {
      const jwtAuth = verifyAwSessionToken(raw);
      if (jwtAuth) {
        return { type: 'jwt', sub: jwtAuth.sub, organizationId: jwtAuth.organizationId };
      }
    }
  }

  if (staticT) {
    return null;
  }
  if (secret) {
    return null;
  }
  return { type: 'open' };
}

/**
 * Middleware para POST ingesta: token opcional según env.
 * Adjunta `req.nativeJwtAuth = { sub, organizationId }` si el JWT fue válido.
 */
export function requireNativeSyncBearerIfConfigured(req, _res, next) {
  const staticT = expectedStaticBearer();
  const secret = getJwtAuthSecret();
  if (!staticT && !secret) {
    next();
    return;
  }

  const result = authenticateNativeSyncRequest(req);
  if (!result || (result.type !== 'static' && result.type !== 'jwt')) {
    throw new ApiError(
      'UNAUTHORIZED',
      'Autenticación requerida: Bearer sync (AW_NATIVE_SYNC_BEARER_TOKEN), JWT (Authorization o cookie httpOnly), o configure el servidor en modo abierto',
      401,
    );
  }

  if (result.type === 'jwt') {
    req.nativeJwtAuth = {
      sub: result.sub,
      organizationId: result.organizationId,
    };
  }
  next();
}

/**
 * Listado / detalle: si hay Bearer estático o JWT configurados, misma regla que POST; si no, administradores.
 */
export function requireNativeSyncListAuth(req, res, next) {
  const staticT = expectedStaticBearer();
  const secret = getJwtAuthSecret();
  if (staticT || secret) {
    return requireNativeSyncBearerIfConfigured(req, res, next);
  }
  return requireAdmin(req, res, next);
}
