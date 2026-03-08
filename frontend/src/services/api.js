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
  const playerId = getPlayerId();
  let res;
  try {
    res = await fetch(fullPath, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(playerId ? { 'x-player-id': playerId } : {}),
        ...options.headers,
      },
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
  createRefuge: (name) =>
    fetchApi('/refuges', {
      method: 'POST',
      body: JSON.stringify({ name: name ?? 'Mi refugio' }),
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
      body: JSON.stringify({ refugeIndex, type, gridX, gridY }),
    }),
  selectRefuge: (index) =>
    fetchApi('/refuge/select', {
      method: 'POST',
      body: JSON.stringify({ index }),
    }),
  releaseAgents: (refugeIndex, blueprintId, count) =>
    fetchApi('/release', {
      method: 'POST',
      body: JSON.stringify({ refugeIndex, blueprintId, count }),
    }),
  // Refuge Interior
  getFurnitureCatalog: () => fetchApi('/refuge/furniture/catalog'),
  placeFurniture: (refugeIndex, type, gridX, gridY, refugeId) =>
    fetchApi('/refuge/furniture', {
      method: 'POST',
      body: JSON.stringify({ refugeIndex, refugeId, type, gridX, gridY }),
    }),
  removeFurniture: (furnitureId, opts = {}) => {
    const q = new URLSearchParams();
    if (opts.refugeIndex != null) q.set('refugeIndex', opts.refugeIndex);
    if (opts.refugeId != null) q.set('refugeId', opts.refugeId);
    const suffix = q.toString() ? `?${q.toString()}` : '';
    return fetchApi(`/refuge/furniture/${furnitureId}${suffix}`, { method: 'DELETE' });
  },
  interactFurniture: (refugeIndex, furnitureId, refugeId) =>
    fetchApi('/refuge/interact', {
      method: 'POST',
      body: JSON.stringify({ refugeIndex, refugeId, furnitureId }),
    }),
  adoptPet: (refugeIndex, species, refugeId) =>
    fetchApi('/refuge/pet/adopt', {
      method: 'POST',
      body: JSON.stringify({ refugeIndex, refugeId, species: species ?? 'cat' }),
    }),
  tickPets: (refugeIndex, playerX, playerY, refugeId) =>
    fetchApi('/refuge/pet/tick', {
      method: 'POST',
      body: JSON.stringify({ refugeIndex, refugeId, playerX, playerY }),
    }),

  startSimulation: () => fetchApi('/simulation/start', { method: 'POST' }),
  pauseSimulation: () => fetchApi('/simulation/pause', { method: 'POST' }),
  resetSimulation: () => fetchApi('/simulation/reset', { method: 'POST' }),

  getAuditEvents: (opts = {}) => {
    const params = new URLSearchParams(opts).toString();
    return fetchApi(`/audit/events${params ? `?${params}` : ''}`);
  },

  // Hero Refuge API
  getHero: () => fetchApi(`/hero?playerId=${getPlayerId()}`),
  createHero: (name, title) =>
    fetchApi('/hero', { method: 'POST', body: JSON.stringify({ name, title, playerId: getPlayerId() }) }),
  switchHeroMode: (modeId) =>
    fetchApi('/hero/mode', { method: 'POST', body: JSON.stringify({ modeId, playerId: getPlayerId() }) }),
  queryHeroAgent: (query, context) =>
    fetchApi('/hero/query', { method: 'POST', body: JSON.stringify({ query, context, playerId: getPlayerId() }) }),
  getHeroCivilizationSeeds: () => fetchApi('/hero/civilization-seeds'),
  getHeroWorlds: () => fetchApi(`/hero/worlds?playerId=${getPlayerId()}`),
  createHeroWorld: (params) =>
    fetchApi('/hero/worlds', { method: 'POST', body: JSON.stringify(params) }),
  destroyHeroWorld: (worldId) =>
    fetchApi(`/hero/worlds/${worldId}?playerId=${getPlayerId()}`, { method: 'DELETE' }),
  tickHeroWorlds: () =>
    fetchApi('/hero/worlds/tick', { method: 'POST', body: JSON.stringify({ playerId: getPlayerId() }) }),

  // Suscripciones — Constructor de Mundos
  getSubscriptionTiers: () => fetchApi('/subscription/tiers'),
  getMySubscription: () =>
    fetchApi('/subscription/me'),
  validateSubscriptionCoupon: (code) =>
    fetchApi('/subscription/coupon/validate', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),
  subscribe: (tier, coupon) =>
    fetchApi('/subscription/subscribe', {
      method: 'POST',
      body: JSON.stringify({ tier, coupon }),
    }),
  cancelSubscription: () =>
    fetchApi('/subscription/cancel', {
      method: 'POST',
      body: JSON.stringify({}),
    }),
  createCheckout: (tier) =>
    fetchApi('/subscription/checkout', {
      method: 'POST',
      body: JSON.stringify({ tier }),
    }),
  createPortalSession: () =>
    fetchApi('/subscription/portal', {
      method: 'POST',
      body: JSON.stringify({}),
    }),
  getStripeStatus: () => fetchApi('/subscription/stripe-status'),

  // DobackSoft — acceso por cupón limitado
  getDobackSoftStats: () => fetchApi('/dobacksoft/stats'),
  getDobackSoftSessions: () => fetchApi('/dobacksoft/sessions'),
  getDobackSoftSessionRoute: (sessionId) => fetchApi(`/dobacksoft/session-route/${sessionId}`),
  uploadDobackSoftFiles: async (fileEntries, vehicleName) => {
    const formData = new FormData();
    formData.append('vehicleName', vehicleName || 'Vehículo');
    fileEntries.forEach(([key, file]) => {
      if (file) formData.append(key, file);
    });
    const playerId = getPlayerId();
    const res = await fetch(`${API_BASE}/dobacksoft/upload`, {
      method: 'POST',
      headers: { ...(playerId ? { 'x-player-id': playerId } : {}) },
      body: formData,
    });
    const text = await res.text();
    const json = text ? JSON.parse(text) : {};
    if (!res.ok) throw new Error(json?.error?.message ?? `Error ${res.status}`);
    return json?.data ?? json;
  },
  validateDobackSoftCoupon: (code) =>
    fetchApi('/dobacksoft/coupon/validate', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),
  registerDobackSoftCitizen: () =>
    fetchApi('/dobacksoft/citizens', { method: 'POST' }),

  // Admin (modo dios) — requiere playerId en ADMIN_PLAYER_IDS
  adminOverview: () =>
    fetchApi('/admin/overview', { headers: { 'X-Admin-Player-Id': getPlayerId() } }),
  adminSimulationReset: () =>
    fetchApi('/admin/simulation/reset', {
      method: 'POST',
      headers: { 'X-Admin-Player-Id': getPlayerId() },
    }),
  adminHeroWorldDestroy: (worldId) =>
    fetchApi(`/admin/hero/worlds/${worldId}`, {
      method: 'DELETE',
      headers: { 'X-Admin-Player-Id': getPlayerId() },
    }),
  adminHeroWorldsWipe: () =>
    fetchApi('/admin/hero/worlds/wipe', {
      method: 'POST',
      headers: { 'X-Admin-Player-Id': getPlayerId() },
    }),
  adminRefugeRemove: (refugeIndex) =>
    fetchApi('/admin/refuges/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Player-Id': getPlayerId() },
      body: JSON.stringify({ refugeIndex }),
    }),
  adminDobackSoftReset: () =>
    fetchApi('/admin/dobacksoft/reset', {
      method: 'POST',
      headers: { 'X-Admin-Player-Id': getPlayerId() },
    }),
  adminAuditEvents: (opts = {}) => {
    const params = new URLSearchParams(opts).toString();
    return fetchApi(`/admin/audit/events${params ? `?${params}` : ''}`, {
      headers: { 'X-Admin-Player-Id': getPlayerId() },
    });
  },
};
