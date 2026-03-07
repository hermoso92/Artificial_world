/**
 * Genetic blueprint for Artificial Worlds.
 * Defines trait values for agents created via the Genetic Assembler.
 */
export class Blueprint {
  static nextId = 1;

  constructor(name = 'New Species', traits = null) {
    this.id = Blueprint.nextId++;
    this.name = name;
    this.traits = traits ?? {
      movementSpeed: 1,
      metabolism: 0.5,
      attack: 0,
      defense: 0,
      gatheringRate: 1,
      reproductionThreshold: 0.8,
    };
  }

  /** Apply mutation variance to a copy of traits (for offspring) */
  mutate(variance = 0.1) {
    const mutated = { ...this.traits };
    for (const key of Object.keys(mutated)) {
      const v = mutated[key];
      const delta = (Math.random() - 0.5) * 2 * variance * Math.max(0.1, v);
      mutated[key] = Math.max(0, Math.min(2, v + delta));
    }
    return mutated;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      traits: { ...this.traits },
    };
  }
}
