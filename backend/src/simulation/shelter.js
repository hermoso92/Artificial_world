/**
 * Modelo de refugio.
 * Zona donde los agentes recuperan energía más rápido.
 */
export class Shelter {
  static nextId = 1;

  constructor(x, y) {
    this.id = Shelter.nextId++;
    this.x = x;
    this.y = y;
    this.radius = 30;
    this.restBonus = 0.02;
  }

  toJSON() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      radius: this.radius,
    };
  }
}
