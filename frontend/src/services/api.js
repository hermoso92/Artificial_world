/**
 * Cliente API para Artificial World.
 * Usa rutas relativas para aprovechar el proxy de Vite.
 */
const API_BASE = '/api';

async function fetchApi(path, options = {}) {
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
  } catch (err) {
    throw new Error(`No se pudo conectar al backend. Asegúrate de que esté en ejecución en el puerto 3001.`);
  }

  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(
      res.ok
        ? 'Respuesta inválida del servidor.'
        : `Error del servidor (${res.status}). Comprueba que el backend esté en ejecución en el puerto 3001.`
    );
  }

  if (!res.ok) {
    const msg = json?.error?.message ?? json?.message ?? `Error del servidor (${res.status}). Comprueba que el backend esté en ejecución.`;
    throw new Error(msg);
  }
  return json?.data ?? json;
}

export const api = {
  getStatus: () => fetchApi('/status'),
  getDiagnostics: () => fetchApi('/diagnostics'),
  getWorld: () => fetchApi('/world'),
  getAgents: () => fetchApi('/agents'),
  getRefuges: () => fetchApi('/refuges'),
  getBlueprints: () => fetchApi('/blueprints'),
  getLogs: () => fetchApi('/logs'),
  createBlueprint: (name, traits) =>
    fetchApi('/blueprints', {
      method: 'POST',
      body: JSON.stringify({ name, traits }),
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
    fetchApi('/hero/worlds', { method: 'POST', body: JSON.stringify(params) }),
  destroyHeroWorld: (worldId) =>
    fetchApi(`/hero/worlds/${worldId}`, { method: 'DELETE' }),
  tickHeroWorlds: () =>
    fetchApi('/hero/worlds/tick', { method: 'POST' }),

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
