import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import awSyncRoutes from './awSync.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { playerContext } from '../middleware/playerContext.js';
import { getDb } from '../db/database.js';
import { signAwSessionToken } from '../services/awJwt.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(playerContext);
app.use('/api/aw', awSyncRoutes);
app.use(errorHandler);

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

describe('POST /api/aw/sync/batch', () => {
  beforeAll(() => {
    getDb();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns 401 without x-player-id', async () => {
    const res = await request(app).post('/api/aw/sync/batch').send(minimalEnvelope());
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 201 and batchId with valid envelope', async () => {
    const res = await request(app)
      .post('/api/aw/sync/batch')
      .set('x-player-id', 'test-player-aw-sync-1')
      .send(minimalEnvelope());
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('batchId');
    expect(res.body.data.acceptedEvents).toBe(1);
  });

  it('returns 403 when x-organization-id disagrees with body', async () => {
    const res = await request(app)
      .post('/api/aw/sync/batch')
      .set('x-player-id', 'test-player-aw-sync-2')
      .set('x-organization-id', 'org-a')
      .send(
        minimalEnvelope({
          organizationId: 'org-b',
        }),
      );
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('accepts organizationId from body when header absent', async () => {
    const res = await request(app)
      .post('/api/aw/sync/batch')
      .set('x-player-id', 'test-player-aw-sync-3')
      .send(
        minimalEnvelope({
          organizationId: 'org-from-body',
        }),
      );
    expect(res.status).toBe(201);
  });

  it('returns 401 when AW_NATIVE_SYNC_BEARER_TOKEN is set but Authorization is missing', async () => {
    vi.stubEnv('AW_NATIVE_SYNC_BEARER_TOKEN', 'secret-sync-token');
    const res = await request(app)
      .post('/api/aw/sync/batch')
      .set('x-player-id', 'test-player-aw-sync-bearer')
      .send(minimalEnvelope());
    expect(res.status).toBe(401);
  });

  it('returns 201 when bearer token matches', async () => {
    vi.stubEnv('AW_NATIVE_SYNC_BEARER_TOKEN', 'secret-sync-token');
    const res = await request(app)
      .post('/api/aw/sync/batch')
      .set('Authorization', 'Bearer secret-sync-token')
      .set('x-player-id', 'test-player-aw-sync-bearer-ok')
      .send(minimalEnvelope());
    expect(res.status).toBe(201);
  });

  it('returns 422 when AW_SYNC_REQUIRE_ORGANIZATION_ID is set and org is absent', async () => {
    vi.stubEnv('AW_SYNC_REQUIRE_ORGANIZATION_ID', '1');
    const res = await request(app)
      .post('/api/aw/sync/batch')
      .set('x-player-id', 'test-player-aw-sync-org-req')
      .send(minimalEnvelope({ organizationId: null }));
    expect(res.status).toBe(422);
  });

  it('accepts JWT Bearer when JWT_AUTH_SECRET is set', async () => {
    vi.stubEnv('JWT_AUTH_SECRET', 'unit-test-jwt-secret-native-sync');
    const token = signAwSessionToken({
      sub: 'jwt-player-sync-1',
      organizationId: null,
    });
    const res = await request(app)
      .post('/api/aw/sync/batch')
      .set('Authorization', `Bearer ${token}`)
      .set('x-player-id', 'jwt-player-sync-1')
      .send(minimalEnvelope());
    expect(res.status).toBe(201);
  });

  it('returns 403 when JWT sub disagrees with x-player-id', async () => {
    vi.stubEnv('JWT_AUTH_SECRET', 'unit-test-jwt-secret-native-sync-2');
    const token = signAwSessionToken({
      sub: 'jwt-sub-a',
      organizationId: null,
    });
    const res = await request(app)
      .post('/api/aw/sync/batch')
      .set('Authorization', `Bearer ${token}`)
      .set('x-player-id', 'jwt-sub-b')
      .send(minimalEnvelope());
    expect(res.status).toBe(403);
  });

  it('returns 403 when JWT org does not match envelope organizationId', async () => {
    vi.stubEnv('JWT_AUTH_SECRET', 'unit-test-jwt-secret-native-sync-3');
    const token = signAwSessionToken({
      sub: 'jwt-player-org',
      organizationId: 'org-jwt',
    });
    const res = await request(app)
      .post('/api/aw/sync/batch')
      .set('Authorization', `Bearer ${token}`)
      .set('x-player-id', 'jwt-player-org')
      .send(
        minimalEnvelope({
          organizationId: 'org-other',
        }),
      );
    expect(res.status).toBe(403);
  });
});

describe('GET /api/aw/sync/batches', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns 200 and filters by organizationId when bearer is configured', async () => {
    vi.stubEnv('AW_NATIVE_SYNC_BEARER_TOKEN', 'list-bearer-token');
    await request(app)
      .post('/api/aw/sync/batch')
      .set('Authorization', 'Bearer list-bearer-token')
      .set('x-player-id', 'test-player-list-filter')
      .send(
        minimalEnvelope({
          organizationId: 'org-filter-test',
        }),
      );
    const res = await request(app)
      .get('/api/aw/sync/batches')
      .query({ organizationId: 'org-filter-test', limit: '10' })
      .set('Authorization', 'Bearer list-bearer-token');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.batches)).toBe(true);
    const rows = res.body.data.batches.filter((b) => b.organization_id === 'org-filter-test');
    expect(rows.length).toBeGreaterThanOrEqual(1);
  });

  it('returns 200 with parsed events for GET /api/aw/sync/batches/:batchId', async () => {
    vi.stubEnv('AW_NATIVE_SYNC_BEARER_TOKEN', 'detail-bearer');
    const post = await request(app)
      .post('/api/aw/sync/batch')
      .set('Authorization', 'Bearer detail-bearer')
      .set('x-player-id', 'test-player-detail-batch')
      .send(minimalEnvelope({ organizationId: 'org-detail' }));
    expect(post.status).toBe(201);
    const batchId = post.body.data.batchId;
    const res = await request(app)
      .get(`/api/aw/sync/batches/${batchId}`)
      .set('Authorization', 'Bearer detail-bearer');
    expect(res.status).toBe(200);
    expect(res.body.data.batch.id).toBe(batchId);
    expect(Array.isArray(res.body.data.batch.events)).toBe(true);
    expect(res.body.data.batch.events).toHaveLength(1);
    expect(res.body.data.batch.events[0].kind).toBe('captureSuccess');
  });

  it('returns 404 for unknown batch id', async () => {
    vi.stubEnv('AW_NATIVE_SYNC_BEARER_TOKEN', 'detail-bearer-404');
    const res = await request(app)
      .get('/api/aw/sync/batches/999999991')
      .set('Authorization', 'Bearer detail-bearer-404');
    expect(res.status).toBe(404);
  });

  it('returns 404 when organizationId query does not match batch', async () => {
    vi.stubEnv('AW_NATIVE_SYNC_BEARER_TOKEN', 'detail-bearer-scope');
    const post = await request(app)
      .post('/api/aw/sync/batch')
      .set('Authorization', 'Bearer detail-bearer-scope')
      .set('x-player-id', 'test-player-scope-mismatch')
      .send(minimalEnvelope({ organizationId: 'org-real' }));
    expect(post.status).toBe(201);
    const batchId = post.body.data.batchId;
    const res = await request(app)
      .get(`/api/aw/sync/batches/${batchId}`)
      .query({ organizationId: 'org-other' })
      .set('Authorization', 'Bearer detail-bearer-scope');
    expect(res.status).toBe(404);
  });

  it('accepts JWT via Cookie only (no Authorization) for POST and GET', async () => {
    vi.stubEnv('JWT_AUTH_SECRET', 'jwt-secret-cookie-only-test');
    const token = signAwSessionToken({
      sub: 'player-jwt-cookie-only',
      organizationId: null,
    });
    const cookieHeader = `aw_access_token=${token}`;
    const post = await request(app)
      .post('/api/aw/sync/batch')
      .set('Cookie', cookieHeader)
      .set('x-player-id', 'player-jwt-cookie-only')
      .send(minimalEnvelope());
    expect(post.status).toBe(201);

    const list = await request(app)
      .get('/api/aw/sync/batches')
      .set('Cookie', cookieHeader)
      .query({ playerId: 'player-jwt-cookie-only', limit: '20' });
    expect(list.status).toBe(200);
    expect(
      list.body.data.batches.some((b) => b.player_id === 'player-jwt-cookie-only'),
    ).toBe(true);
  });
});
