import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { ApiError } from '../middleware/errorHandler.js';
import { requireBody } from '../middleware/validate.js';
import {
  aiChat,
  analyzeSession,
  analyzeTestFailure,
  getAiHealth,
  summarize,
} from '../services/aiCore.js';

const router = Router();

router.get('/health', asyncHandler(async (req, res) => {
  const result = await getAiHealth();
  res.json(result);
}));

router.post('/chat', requireBody, asyncHandler(async (req, res) => {
  const { prompt, systemPrompt, context, memoryKeys } = req.body ?? {};
  if (!prompt || typeof prompt !== 'string') {
    throw new ApiError('VALIDATION_ERROR', 'prompt is required', 422);
  }

  const result = await aiChat({
    prompt,
    systemPrompt: typeof systemPrompt === 'string' ? systemPrompt : '',
    context: typeof context === 'object' && !Array.isArray(context) ? context : {},
    memoryKeys: Array.isArray(memoryKeys) ? memoryKeys : [],
  });
  res.json(result);
}));

router.post('/summarize', requireBody, asyncHandler(async (req, res) => {
  const { input, context, memoryKeys } = req.body ?? {};
  if (!input || typeof input !== 'string') {
    throw new ApiError('VALIDATION_ERROR', 'input is required', 422);
  }

  const result = await summarize({
    input,
    context: typeof context === 'object' && !Array.isArray(context) ? context : {},
    memoryKeys: Array.isArray(memoryKeys) ? memoryKeys : ['technicalDecisions', 'reports'],
  });
  res.json(result);
}));

router.post('/analyze-test-failure', requireBody, asyncHandler(async (req, res) => {
  const { suite, output, context } = req.body ?? {};
  if (!output || typeof output !== 'string') {
    throw new ApiError('VALIDATION_ERROR', 'output is required', 422);
  }

  const result = await analyzeTestFailure({
    suite: typeof suite === 'string' ? suite : 'suite_desconocida',
    output,
    context: typeof context === 'object' && !Array.isArray(context) ? context : {},
  });
  res.json(result);
}));

router.post('/analyze-session', requireBody, asyncHandler(async (req, res) => {
  const { session, route, events, context } = req.body ?? {};
  const hasSessionObject = session && typeof session === 'object' && !Array.isArray(session);
  const hasRoute = Array.isArray(route);
  const hasEvents = Array.isArray(events);

  if (!hasSessionObject && !hasRoute && !hasEvents) {
    throw new ApiError('VALIDATION_ERROR', 'session, route or events are required', 422);
  }

  const result = await analyzeSession({
    session: hasSessionObject ? session : {},
    route: hasRoute ? route : [],
    events: hasEvents ? events : [],
    context: typeof context === 'object' && !Array.isArray(context) ? context : {},
  });
  res.json(result);
}));

export default router;
