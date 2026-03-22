import { describe, it, expect } from 'vitest';
import { parseAndAuthorizeSyncEnvelope } from './awSyncIngest.js';
import { ApiError } from '../middleware/errorHandler.js';

/** @returns {{ playerId: string | null, headerOrganizationId: string | null }} */
function ctx(overrides = {}) {
  return {
    playerId: null,
    headerOrganizationId: null,
    ...overrides,
  };
}

function minimalEnvelope(overrides = {}) {
  return {
    schemaVersion: 1,
    organizationId: null,
    worldId: 'w-test',
    worldSeed: '9007199254740991',
    deviceInstallationId: 'device-unit-test',
    emittedAt: new Date().toISOString(),
    events: [
      {
        localRowId: '1',
        kind: 'captureSuccess',
        metadata: { gain: '10' },
        createdAt: new Date().toISOString(),
      },
    ],
    ...overrides,
  };
}

/**
 * @param {unknown} body
 * @param {{ playerId: string | null, headerOrganizationId: string | null }} c
 * @param {{ code?: string, statusCode?: number, messageIncludes?: string }} exp
 */
function expectParseError(body, c, exp) {
  let err;
  try {
    parseAndAuthorizeSyncEnvelope(body, c);
  } catch (e) {
    err = e;
  }
  expect(err, 'expected parseAndAuthorizeSyncEnvelope to throw').toBeDefined();
  expect(err).toBeInstanceOf(ApiError);
  if (exp.code !== undefined) expect(err.code).toBe(exp.code);
  if (exp.statusCode !== undefined) expect(err.statusCode).toBe(exp.statusCode);
  if (exp.messageIncludes !== undefined) expect(err.message).toContain(exp.messageIncludes);
}

describe('parseAndAuthorizeSyncEnvelope', () => {
  const base = ctx();

  it('rejects null body with 400 VALIDATION_ERROR', () => {
    expectParseError(null, base, {
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      messageIncludes: 'objeto JSON',
    });
  });

  it('rejects array body with 400', () => {
    expectParseError([], base, { code: 'VALIDATION_ERROR', statusCode: 400 });
  });

  it('rejects primitive string body with 400', () => {
    expectParseError('not-json', base, { code: 'VALIDATION_ERROR', statusCode: 400 });
  });

  it('rejects unsupported schemaVersion with 422', () => {
    expectParseError(minimalEnvelope({ schemaVersion: 2 }), base, {
      code: 'VALIDATION_ERROR',
      statusCode: 422,
      messageIncludes: 'schemaVersion',
    });
  });

  it('rejects header/body organization mismatch with 403', () => {
    expectParseError(
      minimalEnvelope({ organizationId: 'org-b' }),
      ctx({ headerOrganizationId: 'org-a' }),
      {
        code: 'FORBIDDEN',
        statusCode: 403,
        messageIncludes: 'x-organization-id',
      },
    );
  });

  it('rejects missing worldSeed with 422', () => {
    const { worldSeed: _w, ...rest } = minimalEnvelope();
    expectParseError(rest, base, {
      code: 'VALIDATION_ERROR',
      statusCode: 422,
      messageIncludes: 'worldSeed',
    });
  });

  it('rejects empty worldSeed with 422', () => {
    expectParseError(minimalEnvelope({ worldSeed: '   ' }), base, {
      code: 'VALIDATION_ERROR',
      statusCode: 422,
      messageIncludes: 'worldSeed',
    });
  });

  it('rejects non-string deviceInstallationId with 422', () => {
    expectParseError(minimalEnvelope({ deviceInstallationId: 123 }), base, {
      code: 'VALIDATION_ERROR',
      statusCode: 422,
      messageIncludes: 'deviceInstallationId',
    });
  });

  it('rejects empty deviceInstallationId with 422', () => {
    expectParseError(minimalEnvelope({ deviceInstallationId: '  ' }), base, {
      code: 'VALIDATION_ERROR',
      statusCode: 422,
      messageIncludes: 'deviceInstallationId',
    });
  });

  it('rejects non-string emittedAt with 422', () => {
    expectParseError(minimalEnvelope({ emittedAt: 12345 }), base, {
      code: 'VALIDATION_ERROR',
      statusCode: 422,
      messageIncludes: 'emittedAt',
    });
  });

  it('rejects empty emittedAt with 422', () => {
    expectParseError(minimalEnvelope({ emittedAt: '   ' }), base, {
      code: 'VALIDATION_ERROR',
      statusCode: 422,
      messageIncludes: 'emittedAt',
    });
  });

  it('rejects non-array events with 422', () => {
    expectParseError(minimalEnvelope({ events: {} }), base, {
      code: 'VALIDATION_ERROR',
      statusCode: 422,
      messageIncludes: 'array',
    });
  });

  it('rejects more than 200 events with 422', () => {
    const events = Array.from({ length: 201 }, (_, i) => ({
      localRowId: String(i),
      kind: 'tick',
      metadata: {},
      createdAt: new Date().toISOString(),
    }));
    expectParseError(minimalEnvelope({ events }), base, {
      code: 'VALIDATION_ERROR',
      statusCode: 422,
      messageIncludes: 'Demasiados eventos',
    });
  });

  it('rejects event that is not a plain object with 422 and index', () => {
    expectParseError(minimalEnvelope({ events: [null] }), base, {
      code: 'VALIDATION_ERROR',
      statusCode: 422,
      messageIncludes: 'events[0]',
    });
  });

  it('rejects event with invalid kind with 422', () => {
    expectParseError(
      minimalEnvelope({
        events: [
          {
            localRowId: '1',
            kind: '  ',
            metadata: {},
            createdAt: new Date().toISOString(),
          },
        ],
      }),
      base,
      {
        code: 'VALIDATION_ERROR',
        statusCode: 422,
        messageIncludes: 'events[0].kind',
      },
    );
  });

  it('rejects metadata that is array with 422', () => {
    expectParseError(
      minimalEnvelope({
        events: [
          {
            localRowId: '1',
            kind: 'captureSuccess',
            metadata: [],
            createdAt: new Date().toISOString(),
          },
        ],
      }),
      base,
      {
        code: 'VALIDATION_ERROR',
        statusCode: 422,
        messageIncludes: 'metadata debe ser objeto',
      },
    );
  });

  it('rejects metadata with too many keys with 422', () => {
    const metadata = {};
    for (let k = 0; k < 33; k += 1) {
      metadata[`k${k}`] = 'v';
    }
    expectParseError(
      minimalEnvelope({
        events: [
          {
            localRowId: '1',
            kind: 'captureSuccess',
            metadata,
            createdAt: new Date().toISOString(),
          },
        ],
      }),
      base,
      {
        code: 'VALIDATION_ERROR',
        statusCode: 422,
        messageIncludes: 'demasiadas claves',
      },
    );
  });

  it('rejects metadata string value longer than 512 with 422', () => {
    expectParseError(
      minimalEnvelope({
        events: [
          {
            localRowId: '1',
            kind: 'captureSuccess',
            metadata: { big: 'x'.repeat(513) },
            createdAt: new Date().toISOString(),
          },
        ],
      }),
      base,
      {
        code: 'VALIDATION_ERROR',
        statusCode: 422,
        messageIncludes: 'demasiado largo',
      },
    );
  });

  it('accepts minimal valid envelope and normalizes one event', () => {
    const body = minimalEnvelope();
    const out = parseAndAuthorizeSyncEnvelope(body, base);
    expect(out.schemaVersion).toBe(1);
    expect(out.worldSeed).toBe('9007199254740991');
    expect(out.deviceInstallationId).toBe('device-unit-test');
    expect(out.events).toHaveLength(1);
    expect(out.events[0].kind).toBe('captureSuccess');
    expect(out.events[0].metadata).toEqual({ gain: '10' });
    expect(out.organizationId).toBeNull();
  });

  it('uses header organization when body organization is null', () => {
    const out = parseAndAuthorizeSyncEnvelope(
      minimalEnvelope({ organizationId: null }),
      ctx({ headerOrganizationId: 'org-from-header' }),
    );
    expect(out.organizationId).toBe('org-from-header');
  });
});
