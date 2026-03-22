/**
 * JWT de sesión para `/api/aw/*` (sync nativo + login).
 * HS256; claims: `sub` (playerId), `org` (organizationId opcional).
 */
import jwt from 'jsonwebtoken';

export function getJwtAuthSecret() {
  return process.env.JWT_AUTH_SECRET?.trim() || '';
}

export function getJwtCookieName() {
  return process.env.JWT_COOKIE_NAME?.trim() || 'aw_access_token';
}

export function getJwtExpiresIn() {
  const raw = process.env.JWT_EXPIRES_IN?.trim();
  return raw || '7d';
}

/**
 * @param {{ sub: string, organizationId: string | null }} params
 * @returns {string}
 */
export function signAwSessionToken({ sub, organizationId }) {
  const secret = getJwtAuthSecret();
  if (!secret) {
    throw new Error('JWT_AUTH_SECRET no configurado');
  }
  return jwt.sign(
    {
      sub,
      org: organizationId,
    },
    secret,
    {
      algorithm: 'HS256',
      expiresIn: getJwtExpiresIn(),
    },
  );
}

/**
 * @param {string | null | undefined} token
 * @returns {{ sub: string, organizationId: string | null } | null}
 */
export function verifyAwSessionToken(token) {
  const secret = getJwtAuthSecret();
  if (!secret || !token || typeof token !== 'string') {
    return null;
  }
  try {
    const payload = jwt.verify(token.trim(), secret, { algorithms: ['HS256'] });
    const sub = typeof payload.sub === 'string' ? payload.sub.trim() : '';
    if (!sub) {
      return null;
    }
    const orgRaw = payload.org;
    const organizationId =
      orgRaw === undefined || orgRaw === null ? null : String(orgRaw).trim() || null;
    return { sub, organizationId };
  } catch {
    return null;
  }
}

/**
 * @param {string} signedToken
 * @returns {number} maxAge ms para Set-Cookie, mínimo 0
 */
export function cookieMaxAgeMsFromToken(signedToken) {
  const decoded = jwt.decode(signedToken);
  if (decoded && typeof decoded.exp === 'number') {
    return Math.max(0, decoded.exp * 1000 - Date.now());
  }
  return 7 * 24 * 60 * 60 * 1000;
}
