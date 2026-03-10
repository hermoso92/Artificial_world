import { useState, useEffect, useCallback } from 'react';
import { ctApi } from './api';
import { MissionList } from './MissionList';
import { MissionDetail } from './MissionDetail';

export function ControlTowerPanel({ onBack }) {
  const [missions, setMissions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMissions = useCallback(async () => {
    try {
      const data = await ctApi.listMissions();
      setMissions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMissions();
  }, [fetchMissions]);

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta misión y todos sus resultados?')) return;
    try {
      await ctApi.deleteMission(id);
      setMissions((prev) => prev.filter((m) => m.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f172a',
      color: '#e2e8f0',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        borderBottom: '1px solid #1e293b',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            background: 'none', border: 'none', color: '#64748b',
            cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1, padding: 0,
          }}
        >
          ←
        </button>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#e2e8f0' }}>
            AW Control Tower
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Análisis técnico-ejecutivo de repositorios
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 24px' }}>
        {loading ? (
          <div style={{ color: '#64748b', padding: '40px 0', textAlign: 'center' }}>
            Cargando misiones...
          </div>
        ) : error ? (
          <div style={{ color: '#ef4444', padding: '20px 0' }}>
            Error: {error}
            <button
              type="button"
              onClick={fetchMissions}
              style={{ marginLeft: 12, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Reintentar
            </button>
          </div>
        ) : selected ? (
          <MissionDetail
            mission={selected}
            onBack={() => {
              setSelected(null);
              fetchMissions(); // refresh list on back
            }}
          />
        ) : (
          <MissionList
            missions={missions}
            onSelect={setSelected}
            onDelete={handleDelete}
            onCreate={(mission) => {
              setMissions((prev) => [mission, ...prev]);
              setSelected(mission);
            }}
          />
        )}
      </div>
    </div>
  );
}
