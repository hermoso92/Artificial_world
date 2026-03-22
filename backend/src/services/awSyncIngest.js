/**
 * Validación e ingesta de lotes `SyncEnvelopeV1` desde el cliente nativo Artificial World.
 */
import { ApiError } from '../middleware/errorHandler.js';

const MAX_EVENTS_PER_BATCH = 200;
const MAX_METADATA_KEYS = 32;
const MAX_METADATA_STRING_LEN = 512;
const SUPPORTED_SCHEMA_VERSION = 1;

/**
 * @param {unknown} body
 * @param {{ playerId: string | null, headerOrganizationId: string | null }} ctx
 * @returns {{
 *   organizationId: string | null,
 *   worldId: string | null,
 *   schemaVersion: number,
 *   worldSeed: string,
 *   deviceInstallationId: string,
 *   emittedAt: string,
 *   events: Array<{ localRowId: string, kind: string, metadata: Record<string, string>, createdAt: string }>
 * }}
 */
export function parseAndAuthorizeSyncEnvelope(body, ctx) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError('VALIDATION_ERROR', 'El cuerpo debe ser un objeto JSON', 400);
  }

  const schemaVersion = body.schemaVersion;
  if (schemaVersion !== SUPPORTED_SCHEMA_VERSION) {
    throw new ApiError(
      'VALIDATION_ERROR',
      `schemaVersion no soportada: ${schemaVersion} (se espera ${SUPPORTED_SCHEMA_VERSION})`,
      422,
    );
  }

  const organizationId =
    body.organizationId === undefined || body.organizationId === null
      ? null
      : String(body.organizationId).trim() || null;
  const worldId =
    body.worldId === undefined || body.worldId === null ? null : String(body.worldId).trim() || null;

  const headerOrg = ctx.headerOrganizationId?.trim() || null;
  if (headerOrg && organizationId && headerOrg !== organizationId) {
    throw new ApiError(
      'FORBIDDEN',
      'organizationId del cuerpo no coincide con la cabecera x-organization-id',
      403,
    );
  }

  const worldSeedRaw = body.worldSeed;
  if (worldSeedRaw === undefined || worldSeedRaw === null) {
    throw new ApiError('VALIDATION_ERROR', 'worldSeed es obligatorio', 422);
  }
  const worldSeed =
    typeof worldSeedRaw === 'number' ? String(Math.trunc(worldSeedRaw)) : String(worldSeedRaw).trim();
  if (!worldSeed) {
    throw new ApiError('VALIDATION_ERROR', 'worldSeed inválido', 422);
  }

  const deviceInstallationId = body.deviceInstallationId;
  if (typeof deviceInstallationId !== 'string' || !deviceInstallationId.trim()) {
    throw new ApiError('VALIDATION_ERROR', 'deviceInstallationId debe ser un string no vacío', 422);
  }

  const emittedAt = body.emittedAt;
  if (typeof emittedAt !== 'string' || !emittedAt.trim()) {
    throw new ApiError('VALIDATION_ERROR', 'emittedAt debe ser ISO8601 (string)', 422);
  }

  const events = body.events;
  if (!Array.isArray(events)) {
    throw new ApiError('VALIDATION_ERROR', 'events debe ser un array', 422);
  }
  if (events.length > MAX_EVENTS_PER_BATCH) {
    throw new ApiError(
      'VALIDATION_ERROR',
      `Demasiados eventos (máx. ${MAX_EVENTS_PER_BATCH})`,
      422,
    );
  }

  const normalized = [];
  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    if (!ev || typeof ev !== 'object' || Array.isArray(ev)) {
      throw new ApiError('VALIDATION_ERROR', `events[${i}] debe ser objeto`, 422);
    }
    const localRowId = ev.localRowId != null ? String(ev.localRowId) : '';
    const kind = typeof ev.kind === 'string' ? ev.kind.trim() : '';
    if (!kind) {
      throw new ApiError('VALIDATION_ERROR', `events[${i}].kind inválido`, 422);
    }
    const meta = ev.metadata;
    if (meta != null && (typeof meta !== 'object' || Array.isArray(meta))) {
      throw new ApiError('VALIDATION_ERROR', `events[${i}].metadata debe ser objeto`, 422);
    }
    const metadata = {};
    if (meta && typeof meta === 'object') {
      const keys = Object.keys(meta);
      if (keys.length > MAX_METADATA_KEYS) {
        throw new ApiError('VALIDATION_ERROR', `events[${i}]: demasiadas claves en metadata`, 422);
      }
      for (const k of keys) {
        const v = meta[k];
        if (v === undefined || v === null) continue;
        const sv = String(v);
        if (sv.length > MAX_METADATA_STRING_LEN) {
          throw new ApiError('VALIDATION_ERROR', `events[${i}].metadata: valor demasiado largo`, 422);
        }
        metadata[String(k).slice(0, 64)] = sv;
      }
    }
    const createdAt =
      typeof ev.createdAt === 'string' && ev.createdAt.trim()
        ? ev.createdAt.trim()
        : new Date().toISOString();
    normalized.push({ localRowId, kind, metadata, createdAt });
  }

  const effectiveOrg = headerOrg ?? organizationId ?? null;

  return {
    organizationId: effectiveOrg,
    worldId,
    schemaVersion,
    worldSeed,
    deviceInstallationId: deviceInstallationId.trim(),
    emittedAt: emittedAt.trim(),
    events: normalized,
  };
}
