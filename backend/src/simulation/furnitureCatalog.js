/**
 * Furniture catalog for refuge interiors.
 * Each type defines visual, spatial and gameplay properties.
 * Effects apply to playerStats when the furniture is used (interact).
 *
 * NOTE: prices are intentionally omitted — no economy system yet.
 * When a shop is needed, add `price: { mineral: N }` per entry.
 */

const CATALOG = {
  bed: {
    name: 'Cama',
    emoji: '\u{1F6CF}\uFE0F',
    zone: 'bedroom',
    effect: { energy: 30 },
    cooldownMs: 5000,
  },
  table: {
    name: 'Mesa',
    emoji: '\u{1F37D}\uFE0F',
    zone: 'kitchen',
    effect: { hunger: 25 },
    cooldownMs: 4000,
  },
  fireplace: {
    name: 'Chimenea',
    emoji: '\u{1F525}',
    zone: 'living',
    effect: { mood: 20 },
    cooldownMs: 3000,
  },
  sofa: {
    name: 'Sofá',
    emoji: '\u{1F6CB}\uFE0F',
    zone: 'living',
    effect: { mood: 15, energy: 10 },
    cooldownMs: 3000,
  },
};

export function getCatalog() {
  return CATALOG;
}

export function getFurnitureType(type) {
  return CATALOG[type] ?? null;
}

export function isValidFurnitureType(type) {
  return type in CATALOG;
}

export function applyEffect(playerStats, effect) {
  const changes = {};
  for (const [stat, delta] of Object.entries(effect)) {
    if (stat in playerStats) {
      const prev = playerStats[stat];
      playerStats[stat] = Math.min(100, Math.max(0, prev + delta));
      changes[stat] = { prev, now: playerStats[stat], delta };
    }
  }
  return changes;
}
