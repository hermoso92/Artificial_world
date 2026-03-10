/**
 * Artificial Worlds API + WebSocket server.
 * In production, also serves the compiled frontend from ../frontend/dist.
 */
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __serverDir = dirname(fileURLToPath(import.meta.url));
const envPaths = [
  join(__serverDir, '../../.env'),
  join(__serverDir, '../.env'),
  '/app/.env',
];
for (const p of envPaths) {
  if (existsSync(p)) { dotenv.config({ path: p }); break; }
}
import apiRoutes from './routes/api.js';
import aiRoutes from './routes/ai.js';
import heroRefugeRoutes from './routes/heroRefuge.js';
import dobacksoftRoutes from './routes/dobacksoft.js';
import subscriptionRoutes from './routes/subscription.js';
import adminRoutes from './routes/admin.js';
import chessRoutes from './routes/chess.js';
import missionControlRoutes from './routes/missionControl.js';
import approvalsRoutes from './routes/approvals.js';
import boardsRoutes from './routes/boards.js';
import gatewaysRoutes from './routes/gateways.js';
import { errorHandler } from './middleware/errorHandler.js';
import { playerContext } from './middleware/playerContext.js';
import logger, { setLogBroadcaster } from './utils/logger.js';
import { initStripe } from './services/stripeService.js';
import { getDb } from './db/database.js';
import { initOpenClawConnectors, cleanupOpenClawConnectors } from './services/missionControl/connectors.js';
import { initMissionControlRuntime, stopMissionControlRuntime, isRuntimeStarted } from './services/missionControl/runtime.js';
import { pauseSimulation } from './simulation/engine.js';
import { initWebSocket, broadcastLog, broadcastMissionControlMessage, closeWebSocket } from './realtime/websocket.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const IS_PROD = process.env.NODE_ENV === 'production';

const app = express();
const server = createServer(app);

// CORS: denegar por defecto en producción si ALLOWED_ORIGINS no está definida
if (IS_PROD && !process.env.ALLOWED_ORIGINS) {
  throw new Error('ALLOWED_ORIGINS must be set in production');
}

const corsOrigins = process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors(corsOrigins?.length ? { origin: corsOrigins } : {}));
app.use((req, res, next) => {
  if (req.originalUrl === '/api/subscription/webhook') return next();
  express.json()(req, res, next);
});
app.use(playerContext);

app.use('/api', apiRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/hero', heroRefugeRoutes);
app.use('/api/dobacksoft', dobacksoftRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chess', chessRoutes);
app.use('/api/mission-control', missionControlRoutes);
app.use('/api/approvals', approvalsRoutes);
app.use('/api/boards', boardsRoutes);
app.use('/api/gateways', gatewaysRoutes);

// 404 para rutas API no registradas
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Ruta API no encontrada: ${req.method} ${req.originalUrl}`,
      code: 'NOT_FOUND',
      statusCode: 404,
    },
  });
});

app.get('/health', (req, res) => {
  let dbOk = false;
  try {
    const db = getDb();
    dbOk = db.prepare('SELECT 1').get()?.['1'] === 1;
  } catch {
    dbOk = false;
  }
  const status = dbOk ? 'ok' : 'degraded';
  res.status(dbOk ? 200 : 503).json({
    status,
    service: 'constructor-de-mundos',
    db: dbOk ? 'ok' : 'error',
    runtime: isRuntimeStarted(),
    ws: true,
    env: process.env.NODE_ENV ?? 'development',
  });
});

// Serve docs (PDF, HTML, MD) from project root
const docsPath = join(__dirname, '../../docs');
if (existsSync(docsPath)) {
  app.use('/docs', express.static(docsPath));
  logger.info(`Serving docs from ${docsPath}`);
}

// Serve compiled frontend in production
const distPath = IS_PROD
  ? join(__dirname, '../frontend/dist')
  : join(__dirname, '../../frontend/dist');
if (IS_PROD && existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });
  logger.info(`Serving frontend from ${distPath}`);
}

app.use(errorHandler);

initWebSocket(server);
setLogBroadcaster(broadcastLog);
initMissionControlRuntime({ publish: broadcastMissionControlMessage });
initOpenClawConnectors({ publish: broadcastMissionControlMessage });

async function shutdown(signal) {
  logger.info(`[server] ${signal} received — shutting down`);
  stopMissionControlRuntime();
  pauseSimulation();
  cleanupOpenClawConnectors();
  closeWebSocket();
  server.close(() => {
    logger.info('[server] HTTP server closed');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

await initStripe();
server.listen(PORT, () => {
  logger.info(`Constructor de Mundos API at http://localhost:${PORT}`);
  logger.info(`  WebSocket: ws://localhost:${PORT}/ws`);
  logger.info(`  Mission Control API: http://localhost:${PORT}/api/mission-control`);
  logger.info(`  Mode: ${IS_PROD ? 'PRODUCTION' : 'development'}`);
});
