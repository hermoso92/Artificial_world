import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import apiRoutes from './api.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { resetWorld } from '../simulation/worldManager.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', apiRoutes);
app.use(errorHandler);

describe('API', () => {
  beforeAll(() => {
    resetWorld();
  });

  it('GET /api/status returns tick, running, agentCount, refugeCount, uptime', async () => {
    const res = await request(app).get('/api/status');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('tick');
    expect(res.body.data).toHaveProperty('running');
    expect(res.body.data).toHaveProperty('agentCount');
    expect(res.body.data).toHaveProperty('refugeCount');
    expect(res.body.data).toHaveProperty('uptime');
  });

  it('GET /api/world returns world state', async () => {
    const res = await request(app).get('/api/world');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('worldClass', 'AW-256');
    expect(res.body.data).toHaveProperty('tick');
    expect(res.body.data).toHaveProperty('refuge');
  });

  it('GET /api/agents returns array', async () => {
    const res = await request(app).get('/api/agents');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/diagnostics returns health, issues, tick, agentCount', async () => {
    const res = await request(app).get('/api/diagnostics');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('health');
    expect(res.body.data).toHaveProperty('issues');
    expect(res.body.data).toHaveProperty('tick');
    expect(res.body.data).toHaveProperty('agentCount');
    expect(['ok', 'warning', 'error']).toContain(res.body.data.health);
  });

  it('POST /api/blueprints creates blueprint', async () => {
    const res = await request(app)
      .post('/api/blueprints')
      .send({ name: 'TestSpecies', traits: { movementSpeed: 1, metabolism: 0.5 } });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('name', 'TestSpecies');
    expect(res.body.data).toHaveProperty('traits');
  });

  it('POST /api/blueprints validates body', async () => {
    const res = await request(app)
      .post('/api/blueprints')
      .send({ traits: 'invalid' });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toHaveProperty('code');
  });

  it('POST /api/release returns added count', async () => {
    const bpRes = await request(app)
      .post('/api/blueprints')
      .send({ name: 'ReleaseTest', traits: {} });
    const blueprintId = bpRes.body.data.id;

    const res = await request(app)
      .post('/api/release')
      .send({ blueprintId, count: 3 });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.added).toBeGreaterThanOrEqual(0);
  });

  it('POST /api/release returns 404 for unknown blueprint', async () => {
    const res = await request(app)
      .post('/api/release')
      .send({ blueprintId: 99999, count: 1 });
    expect(res.status).toBe(404);
  });

  it('POST /api/simulation/start starts simulation', async () => {
    const res = await request(app).post('/api/simulation/start');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /api/simulation/pause pauses simulation', async () => {
    const res = await request(app).post('/api/simulation/pause');
    expect(res.status).toBe(200);
  });

  it('POST /api/simulation/reset resets world', async () => {
    const res = await request(app).post('/api/simulation/reset');
    expect(res.status).toBe(200);
  });
});
