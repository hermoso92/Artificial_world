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
import subscriptionRoutes from './routes/subscription.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initWebSocket } from './realtime/websocket.js';
import logger from './utils/logger.js';

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
app.use('/api/subscription', subscriptionRoutes);

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
  res.json({ status: 'ok', service: 'constructor-de-mundos', ws: true, env: process.env.NODE_ENV ?? 'development' });
});

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

server.listen(PORT, () => {
  logger.info(`Constructor de Mundos API at http://localhost:${PORT}`);
  logger.info(`  WebSocket: ws://localhost:${PORT}/ws`);
  logger.info(`  Mode: ${IS_PROD ? 'PRODUCTION' : 'development'}`);
});
