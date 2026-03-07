/**
 * Modelo de recurso consumible.
 * Los agentes se acercan y consumen recursos para recuperar energía.
 */
export class Resource {
  static nextId = 1;

  constructor(x, y, type = 'food') {
    this.id = Resource.nextId++;
    this.x = x;
    this.y = y;
    this.type = type; // food | material
    this.consumed = false;
    this.respawnAt = 0;
  }

  toJSON() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      type: this.type,
      consumed: this.consumed,
    };
  }
}
