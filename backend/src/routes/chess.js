/**
 * Rutas Chess — aceptación de términos, registro de auditorías
 */
import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireBody } from '../middleware/validate.js';
import logger from '../utils/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../../data');
const ACCEPTANCES_FILE = path.join(DATA_DIR, 'chess_acceptances.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readAcceptances() {
  ensureDataDir();
  if (!fs.existsSync(ACCEPTANCES_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(ACCEPTANCES_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeAcceptances(arr) {
  ensureDataDir();
  fs.writeFileSync(ACCEPTANCES_FILE, JSON.stringify(arr, null, 2), 'utf8');
}

const router = Router();

router.post('/terms/accept', requireBody, asyncHandler((req, res) => {
  const { link, email } = req.body ?? {};
  const record = {
    timestamp: new Date().toISOString(),
    ip: req.ip ?? req.connection?.remoteAddress ?? 'unknown',
    link: link ?? null,
    email: email ?? null,
  };
  const acceptances = readAcceptances();
  acceptances.push(record);
  writeAcceptances(acceptances);
  logger.info('Chess terms accepted', record);
  res.status(201).json({ success: true, data: { accepted: true, timestamp: record.timestamp } });
}));

export default router;
