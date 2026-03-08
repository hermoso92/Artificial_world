/**
 * Cliente API — Constructor de Mundos.
 * Usa rutas relativas para aprovechar el proxy de Vite.
 */
import { API_BASE_URL } from '../config/api';

const API_BASE = API_BASE_URL;

const PLAYER_ID_KEY = 'aw_player_id';

/** Obtiene o genera un ID de jugador persistente (localStorage). */
export function getPlayerId() {
  if (typeof window === 'undefined') return null;
  let id = localStorage.getItem(PLAYER_ID_KEY);
  if (!id) {
    id = `player_${crypto.randomUUID?.() ?? Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem(PLAYER_ID_KEY, id);
  }
  return id;
}

function getErrorMessage(res, json, path = '') {
  if (res.status === 500) {
    return json?.error?.message ?? 'Error interno del servidor. Revisa la consola del backend o reinicia con iniciar_fullstack.ps1.';
  }
  if (res.status === 502 || res.status === 503 || res.status === 504) {
    return 'Backend no disponible. Ejecuta .\\scripts\\iniciar_fullstack.ps1 para iniciar backend y frontend.';
  }
  if (res.status === 404) {
    const detail = json?.error?.message ?? (path ? `Ruta ${path} no encontrada` : 'Recurso no encontrado');
    return `${detail} (404)`;
  }
  return json?.error?.message ?? `Error API: ${res.status}`;
}

async function fetchApi(path, options = {}) {
  const fullPath = `${API_BASE}${path}`;
  let res;
  try {
    res = await fetch(fullPath, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
  } catch (err) {
    throw new Error('No se pudo conectar al backend. Ejecuta .\\scripts\\iniciar_fullstack.ps1 para iniciar el sistema.');
  }

  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(
      res.ok
        ? 'Respuesta inválida del servidor.'
        : getErrorMessage(res, {}, fullPath)
    );
  }

  if (!res.ok) {
    throw new Error(getErrorMessage(res, json, fullPath));
  }
  return json?.data ?? json;
}

export const api = {
  /** Comprueba si el backend está disponible (endpoint ligero). */
  checkHealth: () => fetchApi('/health'),
  getStatus: () => fetchApi('/status'),
  getDiagnostics: () => fetchApi('/diagnostics'),
  getWorld: () => fetchApi('/world'),
  getAgents: () => fetchApi('/agents'),
  getRefuges: () => fetchApi('/refuges'),
  createRefuge: (name, ownerId) =>
    fetchApi('/refuges', {
      method: 'POST',
      body: JSON.stringify({ name: name ?? 'Mi refugio', ownerId: ownerId ?? getPlayerId() }),
    }),
  getBlueprints: () => fetchApi('/blueprints'),
  getLogs: () => fetchApi('/logs'),
  createBlueprint: (name, traits) =>
    fetchApi('/blueprints', {
      method: 'POST',
      body: JSON.stringify({ name, traits }),
    }),
  addRefugeNode: (refugeIndex, type, gridX, gridY) =>
    fetchApi('/refuge/node', {
      method: 'POST',
      body: JSON.stringify({ refugeIndex, type, gridX, gridY, ownerId: getPlayerId() }),
    }),
  selectRefuge: (index) =>
    fetchApi('/refuge/select', {
      method: 'POST',
      body: JSON.stringify({ index }),
    }),
  releaseAgents: (refugeIndex, blueprintId, count) =>
    fetchApi('/release', {
      method: 'POST',
      body: JSON.stringify({ refugeIndex, blueprintId, count, playerId: getPlayerId() }),
    }),
  // Refuge Interior
  getFurnitureCatalog: () => fetchApi('/refuge/furniture/catalog'),
  placeFurniture: (refugeIndex, type, gridX, gridY) =>
    fetchApi('/refuge/furniture', {
      method: 'POST',
      body: JSON.stringify({ refugeIndex, type, gridX, gridY, ownerId: getPlayerId() }),
    }),
  removeFurniture: (furnitureId) =>
    fetchApi(`/refuge/furniture/${furnitureId}`, { method: 'DELETE' }),
  interactFurniture: (refugeIndex, furnitureId) =>
    fetchApi('/refuge/interact', {
      method: 'POST',
      body: JSON.stringify({ refugeIndex, furnitureId, ownerId: getPlayerId() }),
    }),
  adoptPet: (refugeIndex, species) =>
    fetchApi('/refuge/pet/adopt', {
      method: 'POST',
      body: JSON.stringify({ refugeIndex, species: species ?? 'cat', ownerId: getPlayerId() }),
    }),
  tickPets: (refugeIndex, playerX, playerY) =>
    fetchApi('/refuge/pet/tick', {
      method: 'POST',
      body: JSON.stringify({ refugeIndex, playerX, playerY, ownerId: getPlayerId() }),
    }),

  startSimulation: () => fetchApi('/simulation/start', { method: 'POST' }),
  pauseSimulation: () => fetchApi('/simulation/pause', { method: 'POST' }),
  resetSimulation: () => fetchApi('/simulation/reset', { method: 'POST' }),

  getAuditEvents: (opts = {}) => {
    const params = new URLSearchParams(opts).toString();
    return fetchApi(`/audit/events${params ? `?${params}` : ''}`);
  },

  // Hero Refuge API
  getHero: () => fetchApi('/hero'),
  createHero: (name, title) =>
    fetchApi('/hero', { method: 'POST', body: JSON.stringify({ name, title }) }),
  switchHeroMode: (modeId) =>
    fetchApi('/hero/mode', { method: 'POST', body: JSON.stringify({ modeId }) }),
  queryHeroAgent: (query, context) =>
    fetchApi('/hero/query', { method: 'POST', body: JSON.stringify({ query, context }) }),
  getHeroWorlds: () => fetchApi('/hero/worlds'),
  createHeroWorld: (params) =>
    fetchApi('/hero/worlds', { method: 'POST', body: JSON.stringify({ ...params, playerId: getPlayerId() }) }),
  destroyHeroWorld: (worldId) =>
    fetchApi(`/hero/worlds/${worldId}`, { method: 'DELETE' }),
  tickHeroWorlds: () =>
    fetchApi('/hero/worlds/tick', { method: 'POST' }),

  // Suscripciones — Constructor de Mundos
  getSubscriptionTiers: () => fetchApi('/subscription/tiers'),
  getMySubscription: () =>
    fetchApi(`/subscription/me?playerId=${getPlayerId()}`),
  validateSubscriptionCoupon: (code) =>
    fetchApi('/subscription/coupon/validate', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),
  subscribe: (tier, coupon) =>
    fetchApi('/subscription/subscribe', {
      method: 'POST',
      body: JSON.stringify({ playerId: getPlayerId(), tier, coupon }),
    }),
  cancelSubscription: () =>
    fetchApi('/subscription/cancel', {
      method: 'POST',
      body: JSON.stringify({ playerId: getPlayerId() }),
    }),

  // DobackSoft — acceso por cupón limitado
  getDobackSoftStats: () => fetchApi('/dobacksoft/stats'),
  validateDobackSoftCoupon: (code) =>
    fetchApi('/dobacksoft/coupon/validate', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),
  registerDobackSoftCitizen: () =>
    fetchApi('/dobacksoft/citizens', { method: 'POST' }),
};
