/**
 * Resource nodes for Artificial Worlds.
 * Solar Flux = energy source (radius-based, shared, no depletion)
 * Mineral Deposit = matter source (finite, depletable)
 */
export class SolarFluxNode {
  static nextId = 1;

  constructor(gridX, gridY, radius = 2) {
    this.id = `solar-${SolarFluxNode.nextId++}`;
    this.type = 'solar_flux';
    this.gridX = gridX;
    this.gridY = gridY;
    this.radius = radius;
    this.energyPerTick = 0.18;
  }

  /** Check if cell (gx, gy) is within radius */
  contains(gx, gy) {
    const dx = gx - this.gridX;
    const dy = gy - this.gridY;
    return dx * dx + dy * dy <= this.radius * this.radius;
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      gridX: this.gridX,
      gridY: this.gridY,
      radius: this.radius,
    };
  }
}

export class MineralDeposit {
  static nextId = 1;

  constructor(gridX, gridY, capacity = 50) {
    this.id = `mineral-${MineralDeposit.nextId++}`;
    this.type = 'mineral';
    this.gridX = gridX;
    this.gridY = gridY;
    this.capacity = capacity;
    this.remaining = capacity;
  }

  /** Extract matter; returns amount extracted */
  extract(amount = 1) {
    const taken = Math.min(amount, this.remaining);
    this.remaining -= taken;
    return taken;
  }

  get depleted() {
    return this.remaining <= 0;
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      gridX: this.gridX,
      gridY: this.gridY,
      capacity: this.capacity,
      remaining: this.remaining,
    };
  }
}
