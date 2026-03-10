import { API_BASE_URL } from '../../config/api';
import { getPlayerId } from '../../services/api';

const BASE = `${API_BASE_URL}/control-tower`;

async function req(path, options = {}) {
  const playerId = getPlayerId();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(playerId ? { 'x-player-id': playerId } : {}),
      ...options.headers,
    },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? `HTTP ${res.status}`);
  return json.data;
}

export const ctApi = {
  listMissions: () => req('/missions'),
  getMission: (id) => req(`/missions/${id}`),
  createMission: (body) => req('/missions', { method: 'POST', body: JSON.stringify(body) }),
  runMission: (id) => req(`/missions/${id}/run`, { method: 'POST' }),
  deleteMission: (id) => req(`/missions/${id}`, { method: 'DELETE' }),
  getSpecialists: (id) => req(`/missions/${id}/specialists`),
  getDossier: (id) => req(`/missions/${id}/dossier`),
};
