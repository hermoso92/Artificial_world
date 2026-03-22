import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import awAuthRoutes from './awAuth.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { getDb } from '../db/database.js';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/aw', awAuthRoutes);
app.use(errorHandler);

describe('POST /api/aw/auth/login', () => {
  beforeAll(() => {
    getDb();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns 500 when JWT_AUTH_SECRET is missing', async () => {
    const res = await request(app).post('/api/aw/auth/login').send({ playerId: 'p1' });
    expect(res.status).toBe(500);
  });

  it('returns 401 when bootstrap secret is required but header is wrong', async () => {
    vi.stubEnv('JWT_AUTH_SECRET', 'jwt-secret-bootstrap-test');
    vi.stubEnv('AW_AUTH_BOOTSTRAP_SECRET', 'expected-boot');
    const res = await request(app)
      .post('/api/aw/auth/login')
      .set('x-aw-bootstrap-secret', 'wrong')
      .send({ playerId: 'p1' });
    expect(res.status).toBe(401);
  });

  it('returns 200, Set-Cookie httpOnly and token in body when bootstrap matches', async () => {
    vi.stubEnv('JWT_AUTH_SECRET', 'jwt-secret-login-ok');
    vi.stubEnv('AW_AUTH_BOOTSTRAP_SECRET', 'boot-match');
    const res = await request(app)
      .post('/api/aw/auth/login')
      .set('x-aw-bootstrap-secret', 'boot-match')
      .send({ playerId: 'login-player-aw', organizationId: 'org-login' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.token).toBe('string');
    expect(res.body.data.token.length).toBeGreaterThan(20);
    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    expect(String(setCookie)).toContain('HttpOnly');
  });

  it('returns 422 without playerId', async () => {
    vi.stubEnv('JWT_AUTH_SECRET', 'jwt-secret-validation');
    const res = await request(app).post('/api/aw/auth/login').send({});
    expect(res.status).toBe(422);
  });

  it('returns 200 without bootstrap when AW_AUTH_BOOTSTRAP_SECRET is unset (solo desarrollo)', async () => {
    vi.stubEnv('JWT_AUTH_SECRET', 'jwt-secret-dev-login');
    const res = await request(app)
      .post('/api/aw/auth/login')
      .send({ playerId: 'dev-login-player' });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeTruthy();
  });
});

describe('POST /api/aw/auth/logout', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns 200 and Set-Cookie clears the JWT cookie', async () => {
    vi.stubEnv('JWT_AUTH_SECRET', 'jwt-for-logout-test');
    const agent = request.agent(app);
    const login = await agent.post('/api/aw/auth/login').send({ playerId: 'logout-test-player' });
    expect(login.status).toBe(200);
    const res = await agent.post('/api/aw/auth/logout');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.loggedOut).toBe(true);
    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    const joined = Array.isArray(setCookie) ? setCookie.join(';') : String(setCookie);
    expect(joined.toLowerCase()).toMatch(/max-age=0|expires=/);
  });
});
