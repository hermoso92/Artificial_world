/**
 * Central database module — Constructor de Mundos.
 * Single SQLite file for all persistent data.
 *
 * Tables:
 *   players       — registered player identities
 *   heroes        — hero profiles (one per player)
 *   hero_worlds   — artificial worlds owned by heroes
 *   subscriptions — subscription tiers
 *   audit_events  — append-only simulation event log
 */
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IS_PROD = process.env.NODE_ENV === 'production';
const DB_PATH = IS_PROD
  ? path.join(__dirname, '../../data/constructor.db')
  : path.join(__dirname, '../../../constructor.db');

let _db = null;

export function getDb() {
  if (_db) return _db;

  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');

  _db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL DEFAULT 'Explorador',
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      last_seen   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS heroes (
      id            TEXT PRIMARY KEY,
      player_id     TEXT NOT NULL UNIQUE,
      name          TEXT NOT NULL DEFAULT 'The Hero',
      title         TEXT NOT NULL DEFAULT 'Architect of Worlds',
      active_mode   TEXT NOT NULL DEFAULT 'refugio',
      companion_id  TEXT,
      companion_name TEXT,
      companion_traits TEXT,
      companion_interactions INTEGER NOT NULL DEFAULT 0,
      stats_worlds_created   INTEGER NOT NULL DEFAULT 0,
      stats_worlds_destroyed INTEGER NOT NULL DEFAULT 0,
      stats_total_ticks      INTEGER NOT NULL DEFAULT 0,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (player_id) REFERENCES players(id)
    );

    CREATE TABLE IF NOT EXISTS hero_worlds (
      id          TEXT PRIMARY KEY,
      hero_id     TEXT NOT NULL,
      name        TEXT NOT NULL,
      type        TEXT NOT NULL DEFAULT 'standard',
      scale       TEXT NOT NULL DEFAULT 'mundo',
      biomes      TEXT NOT NULL DEFAULT '["forest","plains"]',
      population  INTEGER NOT NULL DEFAULT 0,
      resources   TEXT NOT NULL DEFAULT '{"energy":1000,"matter":500,"information":200}',
      tick        INTEGER NOT NULL DEFAULT 0,
      alive       INTEGER NOT NULL DEFAULT 1,
      history     TEXT NOT NULL DEFAULT '[]',
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      destroyed_at TEXT,
      FOREIGN KEY (hero_id) REFERENCES heroes(id)
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      player_id   TEXT PRIMARY KEY,
      tier        TEXT NOT NULL DEFAULT 'free',
      fundador    INTEGER NOT NULL DEFAULT 0,
      since_ms    INTEGER,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (player_id) REFERENCES players(id)
    );

    CREATE INDEX IF NOT EXISTS idx_heroes_player ON heroes(player_id);
    CREATE INDEX IF NOT EXISTS idx_hero_worlds_hero ON hero_worlds(hero_id);
    CREATE INDEX IF NOT EXISTS idx_hero_worlds_alive ON hero_worlds(alive);
  `);

  logger.info(`[db] SQLite initialized at ${DB_PATH}`);
  return _db;
}

export function ensurePlayer(playerId, name) {
  const db = getDb();
  db.prepare(`
    INSERT INTO players (id, name) VALUES (?, ?)
    ON CONFLICT(id) DO UPDATE SET last_seen = datetime('now')
  `).run(playerId, name ?? 'Explorador');
}

export function getPlayer(playerId) {
  const db = getDb();
  return db.prepare('SELECT * FROM players WHERE id = ?').get(playerId) ?? null;
}

// ─── Hero persistence ────────────────────────────────────────────

export function getHeroByPlayer(playerId) {
  const db = getDb();
  return db.prepare('SELECT * FROM heroes WHERE player_id = ?').get(playerId) ?? null;
}

export function upsertHero(hero) {
  const db = getDb();
  db.prepare(`
    INSERT INTO heroes (id, player_id, name, title, active_mode, companion_id, companion_name, companion_traits, companion_interactions, stats_worlds_created, stats_worlds_destroyed, stats_total_ticks)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(player_id) DO UPDATE SET
      name = excluded.name,
      title = excluded.title,
      active_mode = excluded.active_mode,
      companion_id = excluded.companion_id,
      companion_name = excluded.companion_name,
      companion_traits = excluded.companion_traits,
      companion_interactions = excluded.companion_interactions,
      stats_worlds_created = excluded.stats_worlds_created,
      stats_worlds_destroyed = excluded.stats_worlds_destroyed,
      stats_total_ticks = excluded.stats_total_ticks
  `).run(
    hero.id,
    hero.playerId,
    hero.name,
    hero.title,
    hero.activeMode,
    hero.companionId,
    hero.companionName,
    JSON.stringify(hero.companionTraits),
    hero.companionInteractions ?? 0,
    hero.statsWorldsCreated ?? 0,
    hero.statsWorldsDestroyed ?? 0,
    hero.statsTotalTicks ?? 0,
  );
}

// ─── Hero Worlds persistence ─────────────────────────────────────

export function getWorldsByHero(heroId) {
  const db = getDb();
  return db.prepare('SELECT * FROM hero_worlds WHERE hero_id = ?').all(heroId).map(deserializeWorld);
}

export function getAliveWorldsByHero(heroId) {
  const db = getDb();
  return db.prepare('SELECT * FROM hero_worlds WHERE hero_id = ? AND alive = 1').all(heroId).map(deserializeWorld);
}

export function upsertWorld(world) {
  const db = getDb();
  db.prepare(`
    INSERT INTO hero_worlds (id, hero_id, name, type, scale, biomes, population, resources, tick, alive, history, destroyed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      population = excluded.population,
      resources = excluded.resources,
      tick = excluded.tick,
      alive = excluded.alive,
      history = excluded.history,
      destroyed_at = excluded.destroyed_at
  `).run(
    world.id,
    world.heroId,
    world.name,
    world.type,
    world.scale,
    JSON.stringify(world.biomes),
    world.population,
    JSON.stringify(world.resources),
    world.tick,
    world.alive ? 1 : 0,
    JSON.stringify(world.history ?? []),
    world.destroyedAt ?? null,
  );
}

export function deleteWorld(worldId) {
  const db = getDb();
  db.prepare('DELETE FROM hero_worlds WHERE id = ?').run(worldId);
}

function deserializeWorld(row) {
  return {
    ...row,
    biomes: JSON.parse(row.biomes),
    resources: JSON.parse(row.resources),
    history: JSON.parse(row.history),
    alive: Boolean(row.alive),
  };
}

// ─── Batch save (called periodically by engine) ──────────────────

export function saveHeroState(hero) {
  const db = getDb();
  const tx = db.transaction(() => {
    upsertHero({
      id: hero.id,
      playerId: hero.playerId,
      name: hero.name,
      title: hero.title,
      activeMode: hero.activeMode,
      companionId: hero.agent?.id,
      companionName: hero.agent?.name,
      companionTraits: hero.agent?.traits,
      companionInteractions: hero.agent?.interactions ?? 0,
      statsWorldsCreated: hero.stats?.worldsCreated ?? 0,
      statsWorldsDestroyed: hero.stats?.worldsDestroyed ?? 0,
      statsTotalTicks: hero.stats?.totalTicks ?? 0,
    });

    for (const w of hero.worlds ?? []) {
      upsertWorld({
        id: w.id,
        heroId: hero.id,
        name: w.name,
        type: w.type,
        scale: w.scale,
        biomes: w.biomes,
        population: w.population,
        resources: w.resources,
        tick: w.tick,
        alive: w.alive,
        history: w.history,
        destroyedAt: w.destroyedAt,
      });
    }
  });
  tx();
}
