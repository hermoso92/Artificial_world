import { useState, useEffect, useCallback } from 'react';
import { ctApi } from './api';
import { DossierViewer } from './DossierViewer';

const STATES = ['created', 'ingesting', 'recognized', 'analyzing', 'consolidating', 'completed'];
const ACTIVE_STATES = new Set(['ingesting', 'recognized', 'analyzing', 'consolidating']);

const STATE_LABELS = {
  created: 'Creada',
  ingesting: 'Ingiriendo repositorio',
  recognized: 'Sistema reconocido',
  analyzing: 'Analizando con especialistas',
  consolidating: 'Consolidando hallazgos',
  completed: 'Completada',
  failed: 'Fallida',
};

const SPECIALIST_LABELS = {
  architecture: 'Arquitectura',
  documentation: 'Documentación',
  dependencies: 'Dependencias',
  app: 'Aplicación',
  security: 'Seguridad',
  executive_synthesis: 'Síntesis Ejecutiva',
};

const STATUS_COLORS = {
  completed: '#22c55e',
  failed: '#ef4444',
  skipped: '#f59e0b',
  pending: '#64748b',
  running: '#3b82f6',
};

function StateTimeline({ status }) {
  if (status === 'failed') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ef4444', fontSize: '0.85rem' }}>
        <span>❌</span> <span>Pipeline fallido</span>
      </div>
    );
  }

  const currentIndex = STATES.indexOf(status);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap', rowGap: 8 }}>
      {STATES.map((state, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        const pending = i > currentIndex;
        const color = done ? '#22c55e' : active ? '#3b82f6' : '#334155';
        const textColor = done ? '#22c55e' : active ? '#3b82f6' : '#64748b';

        return (
          <div key={state} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: color + '22', border: `2px solid ${color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', fontWeight: 700, color,
                ...(active ? { boxShadow: `0 0 8px ${color}66` } : {}),
              }}>
                {done ? '✓' : active ? '●' : '○'}
              </div>
              <div style={{ fontSize: '0.65rem', color: textColor, marginTop: 3, whiteSpace: 'nowrap' }}>
                {STATE_LABELS[state]}
              </div>
            </div>
            {i < STATES.length - 1 && (
              <div style={{
                width: 24, height: 2, marginBottom: 16,
                background: done ? '#22c55e44' : '#334155',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function SpecialistResults({ specialists }) {
  if (!specialists || specialists.length === 0) return null;

  return (
    <div style={{ marginTop: 24 }}>
      <h3 style={{ margin: '0 0 12px', fontSize: '0.95rem', color: '#94a3b8' }}>Resultados de especialistas</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
        {specialists.map((sr) => {
          const color = STATUS_COLORS[sr.status] ?? '#64748b';
          const result = sr.result ?? {};
          return (
            <div key={sr.specialist} style={{
              background: '#1e293b', border: `1px solid ${color}33`,
              borderRadius: 8, padding: 12,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.85rem' }}>
                  {SPECIALIST_LABELS[sr.specialist] ?? sr.specialist}
                </span>
                <span style={{ fontSize: '0.72rem', color, fontWeight: 600 }}>
                  {sr.status?.toUpperCase()}
                </span>
              </div>
              {result.summary && (
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.4 }}>
                  {result.summary.slice(0, 120)}{result.summary.length > 120 ? '…' : ''}
                </p>
              )}
              {result.status_assessment && (
                <div style={{ marginTop: 6, fontSize: '0.72rem' }}>
                  Estado:{' '}
                  <span style={{
                    color: result.status_assessment === 'healthy' ? '#22c55e'
                      : result.status_assessment === 'critical' ? '#ef4444'
                      : '#f59e0b',
                    fontWeight: 600,
                  }}>
                    {result.status_assessment}
                  </span>
                </div>
              )}
              {sr.duration_ms && (
                <div style={{ marginTop: 4, fontSize: '0.68rem', color: '#475569' }}>
                  {(sr.duration_ms / 1000).toFixed(1)}s
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MissionDetail({ mission: initialMission, onBack }) {
  const [mission, setMission] = useState(initialMission);
  const [specialists, setSpecialists] = useState([]);
  const [dossier, setDossier] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState('detail'); // 'detail' | 'dossier'

  const refresh = useCallback(async () => {
    try {
      const updated = await ctApi.getMission(mission.id);
      setMission(updated);

      if (['analyzing', 'consolidating', 'completed'].includes(updated.status)) {
        const sps = await ctApi.getSpecialists(mission.id).catch(() => []);
        setSpecialists(sps);
      }

      if (updated.status === 'completed') {
        const d = await ctApi.getDossier(mission.id).catch(() => null);
        setDossier(d);
      }
    } catch (err) {
      // ignore polling errors
    }
  }, [mission.id]);

  useEffect(() => {
    if (ACTIVE_STATES.has(mission.status)) {
      refresh();
      const interval = setInterval(refresh, 5000);
      return () => clearInterval(interval);
    }
    if (mission.status === 'completed') {
      refresh();
    }
  }, [mission.status, refresh]);

  const handleRun = async () => {
    setRunning(true);
    setError(null);
    try {
      await ctApi.runMission(mission.id);
      setMission((m) => ({ ...m, status: 'ingesting' }));
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  };

  const recon = mission.recon_data ?? {};
  const ingestion = mission.ingestion_data ?? {};

  return (
    <div style={{ padding: '0 0 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button
          type="button"
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.85rem', padding: 0 }}
        >
          ← Volver
        </button>
        <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#e2e8f0' }}>{mission.name}</h2>
      </div>

      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: 4 }}>Repositorio</div>
            <a href={mission.repo_url} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', fontSize: '0.85rem', wordBreak: 'break-all' }}>
              {mission.repo_url}
            </a>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(mission.status === 'created' || mission.status === 'failed' || mission.status === 'completed') && (
              <button
                type="button"
                onClick={handleRun}
                disabled={running}
                style={{
                  padding: '7px 16px', borderRadius: 6,
                  background: mission.status === 'completed' ? '#0f172a' : '#3b82f6',
                  border: mission.status === 'completed' ? '1px solid #334155' : 'none',
                  color: mission.status === 'completed' ? '#94a3b8' : '#fff',
                  cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                }}
              >
                {running ? 'Iniciando...' : mission.status === 'completed' ? 'Re-analizar' : 'Ejecutar análisis'}
              </button>
            )}
            {mission.status === 'completed' && dossier && (
              <button
                type="button"
                onClick={() => setView(view === 'dossier' ? 'detail' : 'dossier')}
                style={{
                  padding: '7px 16px', borderRadius: 6,
                  background: '#22c55e22', border: '1px solid #22c55e44',
                  color: '#22c55e', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                }}
              >
                {view === 'dossier' ? 'Ver estado' : 'Ver dossier'}
              </button>
            )}
          </div>
        </div>

        {error && <div style={{ color: '#ef4444', fontSize: '0.82rem', marginBottom: 12 }}>{error}</div>}

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: 10 }}>Progreso</div>
          <StateTimeline status={mission.status} />
        </div>

        {mission.error_message && (
          <div style={{
            background: '#7f1d1d22', border: '1px solid #ef444444',
            borderRadius: 6, padding: 12, fontSize: '0.82rem', color: '#fca5a5',
          }}>
            {mission.error_message}
          </div>
        )}
      </div>

      {view === 'dossier' && dossier ? (
        <DossierViewer dossier={dossier} />
      ) : (
        <>
          {recon.stack && recon.stack.length > 0 && (
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: 20, marginBottom: 16 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '0.95rem', color: '#94a3b8' }}>Sistema Reconocido</h3>
              <div style={{ marginBottom: 10 }}>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Stack: </span>
                {recon.stack.map((s) => (
                  <span key={s} style={{
                    display: 'inline-block', margin: '2px 4px 2px 0',
                    padding: '2px 8px', borderRadius: 4,
                    background: '#334155', color: '#94a3b8', fontSize: '0.75rem',
                  }}>{s}</span>
                ))}
              </div>
              {recon.entry_points?.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Entrypoints: </span>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{recon.entry_points.join(', ')}</span>
                </div>
              )}
              {recon.structure && (
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  {recon.structure.total_files} archivos · Dirs: {recon.structure.top_level_dirs?.join(', ')}
                </div>
              )}
            </div>
          )}

          <SpecialistResults specialists={specialists} />
        </>
      )}
    </div>
  );
}
