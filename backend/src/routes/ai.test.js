import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';

vi.mock('../services/aiCore.js', () => ({
  getAiHealth: vi.fn(),
  aiChat: vi.fn(),
  summarize: vi.fn(),
  analyzeTestFailure: vi.fn(),
  analyzeSession: vi.fn(),
}));

import aiRoutes from './ai.js';
import { errorHandler } from '../middleware/errorHandler.js';
import {
  aiChat,
  analyzeSession,
  analyzeTestFailure,
  getAiHealth,
  summarize,
} from '../services/aiCore.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/ai', aiRoutes);
app.use(errorHandler);

describe('AI routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAiHealth).mockResolvedValue({
      success: true,
      data: { available: true, provider: 'ollama', model: 'llama3.2' },
      meta: { operation: 'health', success: true, fallback: false },
    });
    vi.mocked(aiChat).mockResolvedValue({
      success: true,
      data: { text: 'hola', operation: 'chat' },
      meta: { operation: 'chat', success: true, fallback: false },
    });
    vi.mocked(summarize).mockResolvedValue({
      success: true,
      data: { text: 'resumen', operation: 'summarize' },
      meta: { operation: 'summarize', success: true, fallback: false },
    });
    vi.mocked(analyzeTestFailure).mockResolvedValue({
      success: true,
      data: { text: 'analisis test', operation: 'analyzeTestFailure' },
      meta: { operation: 'analyzeTestFailure', success: true, fallback: false },
    });
    vi.mocked(analyzeSession).mockResolvedValue({
      success: true,
      data: { text: 'analisis sesion', operation: 'analyzeSession' },
      meta: { operation: 'analyzeSession', success: true, fallback: false },
    });
  });

  it('GET /api/ai/health returns ai status', async () => {
    const res = await request(app).get('/api/ai/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('provider', 'ollama');
  });

  it('POST /api/ai/chat validates prompt', async () => {
    const res = await request(app).post('/api/ai/chat').send({});
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/ai/chat forwards prompt and memory keys', async () => {
    const res = await request(app).post('/api/ai/chat').send({
      prompt: 'hola',
      memoryKeys: ['glossary'],
    });
    expect(res.status).toBe(200);
    expect(vi.mocked(aiChat)).toHaveBeenCalledWith({
      prompt: 'hola',
      systemPrompt: '',
      context: {},
      memoryKeys: ['glossary'],
    });
  });

  it('POST /api/ai/summarize validates input', async () => {
    const res = await request(app).post('/api/ai/summarize').send({});
    expect(res.status).toBe(422);
  });

  it('POST /api/ai/analyze-test-failure validates output', async () => {
    const res = await request(app).post('/api/ai/analyze-test-failure').send({ suite: 'core' });
    expect(res.status).toBe(422);
  });

  it('POST /api/ai/analyze-session accepts session payload', async () => {
    const res = await request(app).post('/api/ai/analyze-session').send({
      session: { id: 'demo-session-001' },
      route: [],
      events: [],
    });
    expect(res.status).toBe(200);
    expect(vi.mocked(analyzeSession)).toHaveBeenCalled();
  });
});
