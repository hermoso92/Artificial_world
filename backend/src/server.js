/**
 * Artificial Worlds API + WebSocket server.
 * In production, also serves the compiled frontend from ../frontend/dist.
 */
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import apiRoutes from './routes/api.js';
import heroRefugeRoutes from './routes/heroRefuge.js';
import dobacksoftRoutes from './routes/dobacksoft.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initWebSocket } from './realtime/websocket.js';
import logger from './utils/logger.js';

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception:', err.message, err.stack);
});
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection:', reason);
});

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const IS_PROD = process.env.NODE_ENV === 'production';

const app = express();
const server = createServer(app);

app.use(cors());
app.use(express.json());

app.use('/api', apiRoutes);
app.use('/api/hero', heroRefugeRoutes);
app.use('/api/dobacksoft', dobacksoftRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'artificial-world-api', ws: true, env: process.env.NODE_ENV ?? 'development' });
});

// Serve compiled frontend in production
const distPath = join(__dirname, '../../frontend/dist');
if (IS_PROD && existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });
  logger.info(`Serving frontend from ${distPath}`);
}

app.use(errorHandler);

initWebSocket(server);

server.listen(PORT, () => {
  logger.info(`Artificial Worlds API at http://localhost:${PORT}`);
  logger.info(`  WebSocket: ws://localhost:${PORT}/ws`);
  logger.info(`  Mode: ${IS_PROD ? 'PRODUCTION' : 'development'}`);
});
