/**
 * Agent model for Artificial Worlds.
 * Artificial life forms with genetic traits, energy, matter.
 * Movement, metabolism, attack, defense, gathering from blueprint.
 */
export class Agent {
  static nextId = 1;

  constructor(gridX, gridY, blueprint, lineageId = null) {
    this.id = Agent.nextId++;
    this.gridX = gridX;
    this.gridY = gridY;
    this.blueprintId = blueprint?.id ?? null;
    this.lineageId = lineageId ?? this.id;
    this.traits = { ...(blueprint?.traits ?? { movementSpeed: 1, metabolism: 0.5, attack: 0, defense: 0, gatheringRate: 1, reproductionThreshold: 0.8 }) };
    this.energy = 0.5 + Math.random() * 0.3;
    this.matter = 0.2 + Math.random() * 0.2;
    this.maxEnergy = 1;
    this.maxMatter = 1;
    this.state = 'idle';
    this.birthTick = 0;
    this.dead = false;
  }

  get movementSpeed() {
    return this.traits.movementSpeed ?? 1;
  }

  get metabolism() {
    return this.traits.metabolism ?? 0.5;
  }

  get attack() {
    return this.traits.attack ?? 0;
  }

  get defense() {
    return this.traits.defense ?? 0;
  }

  get gatheringRate() {
    return this.traits.gatheringRate ?? 1;
  }

  get reproductionThreshold() {
    return this.traits.reproductionThreshold ?? 0.8;
  }

  get canReproduce() {
    return this.energy >= this.reproductionThreshold * this.maxEnergy &&
           this.matter >= 0.3 * this.maxMatter;
  }

  toJSON() {
    return {
      id: this.id,
      gridX: this.gridX,
      gridY: this.gridY,
      blueprintId: this.blueprintId,
      lineageId: this.lineageId,
      traits: { ...this.traits },
      energy: Math.round(this.energy * 100) / 100,
      matter: Math.round(this.matter * 100) / 100,
      maxEnergy: this.maxEnergy,
      maxMatter: this.maxMatter,
      state: this.state,
      birthTick: this.birthTick,
      dead: this.dead,
    };
  }
}
