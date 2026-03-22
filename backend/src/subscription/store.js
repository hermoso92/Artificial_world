/**
 * Subscription store — Constructor de Mundos.
 * Persists to SQLite via better-sqlite3.
 *
 * Tiers:
 *   free       — 1 mundo, 10 habitantes, compañero básico
 *   constructor — mundos ilimitados, habitantes ilimitados, compañero IA avanzado
 *   fundador   — todo constructor + badge permanente (primeros 500)
 */
import Database from 'better-sqlite3';
import path from 'path';
import { mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IS_PROD = process.env.NODE_ENV === 'production';
const DB_PATH = IS_PROD
  ? path.join(__dirname, '../../data/subscriptions.db')
  : path.join(__dirname, '../../../subscriptions.db');

const dbDir = path.dirname(DB_PATH);
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS subscriptions (
    player_id TEXT PRIMARY KEY,
    tier TEXT NOT NULL DEFAULT 'free',
    fundador INTEGER NOT NULL DEFAULT 0,
    since_ms INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

const TIERS = {
  free: {
    id: 'free',
    name: 'Explorador',
    price: 0,
    interval: null,
    limits: { maxWorlds: 1, maxAgentsPerRefuge: 10, companionLevel: 'basic' },
    features: [
      '1 mundo',
      '10 habitantes',
      'Compañero IA básico',
      'Tu primer refugio',
    ],
  },
  constructor: {
    id: 'constructor',
    name: 'Constructor',
    price: 4.99,
    interval: 'month',
    limits: { maxWorlds: -1, maxAgentsPerRefuge: -1, companionLevel: 'advanced' },
    features: [
      'Mundos ilimitados',
      'Habitantes ilimitados',
      'Compañero IA avanzado',
      'Legado persistente',
      'Todos los biomas',
      'Exportar tu mundo',
    ],
  },
  fundador: {
    id: 'fundador',
    name: 'Fundador',
    price: 2.99,
    interval: 'month',
    limits: { maxWorlds: -1, maxAgentsPerRefuge: -1, companionLevel: 'advanced' },
    features: [
      'Todo lo de Constructor',
      'Badge Fundador permanente',
      'Acceso anticipado a novedades',
      'Nombre en los créditos',
    ],
    maxSlots: 500,
  },
};

function getFundadorCount() {
  const row = db.prepare("SELECT COUNT(*) as cnt FROM subscriptions WHERE fundador = 1").get();
  return row?.cnt ?? 0;
}

export function getTiers() {
  const fundadorCount = getFundadorCount();
  return Object.values(TIERS).map((t) => ({
    ...t,
    ...(t.id === 'fundador' ? { slotsRemaining: Math.max(0, t.maxSlots - fundadorCount) } : {}),
  }));
}

export function getTier(tierId) {
  return TIERS[tierId] ?? null;
}

export function getSubscription(playerId) {
  const row = db.prepare("SELECT tier, fundador, since_ms FROM subscriptions WHERE player_id = ?").get(playerId);
  if (!row) return { tier: 'free', since: null, fundador: false };
  return { tier: row.tier, since: row.since_ms, fundador: Boolean(row.fundador) };
}

export function getLimits(playerId) {
  const sub = getSubscription(playerId);
  const tier = TIERS[sub.tier] ?? TIERS.free;
  return {
    tier: sub.tier,
    tierName: tier.name,
    fundador: sub.fundador,
    ...tier.limits,
  };
}

export function canCreateWorld(playerId, currentWorldCount) {
  const limits = getLimits(playerId);
  if (limits.maxWorlds === -1) return { allowed: true };
  if (currentWorldCount >= limits.maxWorlds) {
    return {
      allowed: false,
      reason: `Tu plan ${limits.tierName} permite ${limits.maxWorlds} mundo${limits.maxWorlds === 1 ? '' : 's'}. Mejora tu plan para crear más.`,
    };
  }
  return { allowed: true };
}

export function canAddAgents(playerId, currentAgentCount, addCount) {
  const limits = getLimits(playerId);
  if (limits.maxAgentsPerRefuge === -1) return { allowed: true };
  const total = currentAgentCount + addCount;
  if (total > limits.maxAgentsPerRefuge) {
    return {
      allowed: false,
      reason: `Tu plan ${limits.tierName} permite ${limits.maxAgentsPerRefuge} habitantes. Mejora tu plan para traer más.`,
      maxAllowed: limits.maxAgentsPerRefuge - currentAgentCount,
    };
  }
  return { allowed: true };
}

const FUNDADOR_COUPON = process.env.FUNDADOR_COUPON || 'MUNDOFUNDADOR500';

export function validateCoupon(code) {
  const trimmed = (code || '').trim().toUpperCase();

  if (trimmed === FUNDADOR_COUPON) {
    const slotsRemaining = Math.max(0, TIERS.fundador.maxSlots - getFundadorCount());
    if (slotsRemaining > 0) {
      return {
        valid: true,
        tier: 'fundador',
        price: TIERS.fundador.price,
        slotsRemaining,
        message: `Cupón Fundador válido. Tu precio: €${TIERS.fundador.price}/mes para siempre. Quedan ${slotsRemaining} plazas.`,
      };
    }
    return { valid: false, message: 'Las 500 plazas de fundador están agotadas.' };
  }

  return { valid: false, message: 'Cupón no válido.' };
}

const upsertStmt = db.prepare(`
  INSERT INTO subscriptions (player_id, tier, fundador, since_ms)
  VALUES (?, ?, ?, ?)
  ON CONFLICT(player_id) DO UPDATE SET tier = excluded.tier, fundador = excluded.fundador, since_ms = excluded.since_ms
`);

export function subscribe(playerId, tierId, couponCode) {
  if (!TIERS[tierId] || tierId === 'free') {
    return { success: false, message: 'Tier no válido.' };
  }

  const isFundador = tierId === 'fundador';

  if (isFundador) {
    const couponResult = validateCoupon(couponCode);
    if (!couponResult.valid) {
      return { success: false, message: couponResult.message };
    }
  }

  upsertStmt.run(playerId, tierId, isFundador ? 1 : 0, Date.now());
  logger.info(`Subscription: ${playerId} -> ${tierId}`);

  const tier = TIERS[tierId];
  return {
    success: true,
    tier: tierId,
    tierName: tier.name,
    price: tier.price,
    message: `¡Bienvenido, ${tier.name}! Tu mundo no tiene límites.`,
  };
}

export function cancelSubscription(playerId) {
  const sub = getSubscription(playerId);
  if (!sub || sub.tier === 'free') {
    return { success: false, message: 'No tienes suscripción activa.' };
  }
  db.prepare("UPDATE subscriptions SET tier = 'free', since_ms = NULL WHERE player_id = ?").run(playerId);
  logger.info(`Subscription cancelled: ${playerId}`);
  return { success: true, message: 'Suscripción cancelada. Mantienes tu mundo actual, pero los límites del plan gratuito se aplican.' };
}
