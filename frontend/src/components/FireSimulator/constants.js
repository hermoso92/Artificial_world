/** Constantes FireSimulator */
export const ROUTE_CANVAS_W = 960;
export const ROUTE_CANVAS_H = 600;
export const ROUTE_PADDING = 40;
export const TRUCK_W_ROUTE = 44;
export const TRUCK_H_ROUTE = 22;

export const MAP_W = 960;
export const MAP_H = 600;
export const CELL = 48;
export const TRUCK_W = 44;
export const TRUCK_H = 22;
export const FIRE_R = 24;
export const MAX_SPEED = 4.5;
export const ACCEL = 0.35;
export const FRICTION = 0.92;
export const TURN_RATE = 0.055;
export const FUEL_DRAIN = 0.012;

export const LEVELS = [
  { id: 1, name: 'Nivel 1', time: 90, fuel: 100, cars: 6, pedestrians: 4, accidents: 0, weather: 'clear', desc: 'Introducción' },
  { id: 2, name: 'Nivel 2', time: 75, fuel: 85, cars: 10, pedestrians: 8, accidents: 1, weather: 'clear', desc: 'Más tráfico' },
  { id: 3, name: 'Nivel 3', time: 70, fuel: 80, cars: 14, pedestrians: 12, accidents: 2, weather: 'rain', desc: 'Lluvia' },
  { id: 4, name: 'Nivel 4', time: 65, fuel: 75, cars: 18, pedestrians: 16, accidents: 3, weather: 'fog', desc: 'Niebla' },
  { id: 5, name: 'Nivel 5', time: 60, fuel: 70, cars: 22, pedestrians: 20, accidents: 4, weather: 'storm', desc: 'Tormenta' },
];

export const ACCESS_CODE_REGEX = /^DOBACK-[A-Z0-9]{4}-[A-Z0-9]{4}$/i;
export const DEMO_CODE = 'DEMO';
