import { randomUUID } from 'crypto';
import { getMissionControlDb } from '../../db/missionControlDb.js';

function db() {
  return getMissionControlDb();
}

export function createMission({ name, repo_url, docs_path = null }) {
  const id = randomUUID();
  const now = new Date().toISOString();
  db().prepare(`
    INSERT INTO ct_missions (id, name, repo_url, docs_path, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'created', ?, ?)
  `).run(id, name, repo_url, docs_path, now, now);
  return getMission(id);
}

export function getMission(id) {
  const mission = db().prepare('SELECT * FROM ct_missions WHERE id = ?').get(id);
  if (!mission) return null;
  return hydrateMission(mission);
}

export function listMissions() {
  return db().prepare('SELECT * FROM ct_missions ORDER BY created_at DESC').all().map(hydrateMission);
}

export function updateMissionStatus(id, status, extra = {}) {
  const now = new Date().toISOString();
  const fields = ['status = ?', 'updated_at = ?'];
  const values = [status, now];

  if (extra.error_message !== undefined) {
    fields.push('error_message = ?');
    values.push(extra.error_message);
  }
  if (extra.ingestion_data !== undefined) {
    fields.push('ingestion_data = ?');
    values.push(JSON.stringify(extra.ingestion_data));
  }
  if (extra.recon_data !== undefined) {
    fields.push('recon_data = ?');
    values.push(JSON.stringify(extra.recon_data));
  }

  values.push(id);
  db().prepare(`UPDATE ct_missions SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getMission(id);
}

export function deleteMission(id) {
  db().prepare('DELETE FROM ct_missions WHERE id = ?').run(id);
}

export function saveSpecialistResult(missionId, specialist, result, durationMs, errorMessage = null) {
  const existing = db().prepare(
    'SELECT id FROM ct_specialist_results WHERE mission_id = ? AND specialist = ?'
  ).get(missionId, specialist);

  const now = new Date().toISOString();
  const status = errorMessage ? 'failed' : 'completed';

  if (existing) {
    db().prepare(`
      UPDATE ct_specialist_results
      SET status = ?, result = ?, duration_ms = ?, error_message = ?, updated_at = ?
      WHERE mission_id = ? AND specialist = ?
    `).run(status, JSON.stringify(result), durationMs, errorMessage, now, missionId, specialist);
  } else {
    db().prepare(`
      INSERT INTO ct_specialist_results (id, mission_id, specialist, status, result, duration_ms, error_message, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(randomUUID(), missionId, specialist, status, JSON.stringify(result), durationMs, errorMessage, now, now);
  }
}

export function markSpecialistSkipped(missionId, specialist) {
  const now = new Date().toISOString();
  const existing = db().prepare(
    'SELECT id FROM ct_specialist_results WHERE mission_id = ? AND specialist = ?'
  ).get(missionId, specialist);

  if (existing) {
    db().prepare(
      'UPDATE ct_specialist_results SET status = ?, updated_at = ? WHERE mission_id = ? AND specialist = ?'
    ).run('skipped', now, missionId, specialist);
  } else {
    db().prepare(`
      INSERT INTO ct_specialist_results (id, mission_id, specialist, status, result, created_at, updated_at)
      VALUES (?, ?, ?, 'skipped', '{}', ?, ?)
    `).run(randomUUID(), missionId, specialist, now, now);
  }
}

export function getSpecialistResults(missionId) {
  return db().prepare(
    'SELECT * FROM ct_specialist_results WHERE mission_id = ? ORDER BY created_at ASC'
  ).all(missionId).map((r) => ({
    ...r,
    result: JSON.parse(r.result || '{}'),
  }));
}

export function saveDossier(missionId, content, markdown) {
  const now = new Date().toISOString();
  const existing = db().prepare('SELECT id FROM ct_dossiers WHERE mission_id = ?').get(missionId);

  if (existing) {
    db().prepare(
      'UPDATE ct_dossiers SET content = ?, markdown = ? WHERE mission_id = ?'
    ).run(JSON.stringify(content), markdown, missionId);
  } else {
    db().prepare(`
      INSERT INTO ct_dossiers (id, mission_id, content, markdown, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(randomUUID(), missionId, JSON.stringify(content), markdown, now);
  }
}

export function getDossier(missionId) {
  const row = db().prepare('SELECT * FROM ct_dossiers WHERE mission_id = ?').get(missionId);
  if (!row) return null;
  return {
    ...row,
    content: JSON.parse(row.content || '{}'),
  };
}

function hydrateMission(row) {
  return {
    ...row,
    ingestion_data: JSON.parse(row.ingestion_data || '{}'),
    recon_data: JSON.parse(row.recon_data || '{}'),
  };
}
