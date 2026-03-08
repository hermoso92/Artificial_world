/**
 * Singleton HeroRefuge — compartido por heroRefuge routes y admin routes.
 */
import { HeroRefuge } from './heroRefuge.js';

let _instance = null;

export function getHeroRefugeInstance(params = {}) {
  if (!_instance) {
    _instance = new HeroRefuge(params);
  }
  return _instance;
}

export function resetHeroRefugeInstance() {
  _instance = null;
}
