/**
 * World manager - singleton access to AW-256 world.
 */
import { World } from './world.js';

let world = null;

export function getWorld() {
  if (!world) {
    world = new World();
  }
  return world;
}

export function resetWorld() {
  world = null;
  return getWorld();
}
