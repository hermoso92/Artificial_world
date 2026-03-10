import { useState } from 'react';
import { ctApi } from './api';

const STATUS_LABELS = {
  created: { label: 'Creada', color: '#64748b' },
  ingesting: { label: 'Ingiriendo', color: '#3b82f6' },
  recognized: { label: 'Reconocida', color: '#06b6d4' },
  analyzing: { label: 'Analizando', color: '#f59e0b' },
  consolidating: { label: 'Consolidando', color: '#a78bfa' },
  completed: { label: 'Completada', color: '#22c55e' },
  failed: { label: 'Fallida', color: '#ef4444' },
};

const ACTIVE_STATUSES = new Set(['ingesting', 'recognized', 'analyzing', 'consolidating']);

function StatusBadge({ status }) {
  const meta = STATUS_LABELS[status] ?? { label: status, color: '#64748b' };
  return (
    <span style={{
      padding: '2px 8px',
      borderRadius: 4,
      fontSize: '0.75rem',
      fontWeight: 600,
      background: meta.color + '22',
      color: meta.color,
      border: `1px solid ${meta.color}44`,
    }}>
      {ACTIVE_STATUSES.has(status) && '⟳ '}{meta.label}
    </span>
  );
}

export function MissionList({ missions, onSelect, onDelete, onCreate }) {
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newDocs, setNewDocs] = useState('');
  const [creating, setCreating] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState(null);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !newUrl.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const mission = await ctApi.createMission({
        name: newName.trim(),
        repo_url: newUrl.trim(),
        docs_path: newDocs.trim() || undefined,
      });
      setNewName('');
      setNewUrl('');
      setNewDocs('');
      setFormOpen(false);
      onCreate(mission);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ padding: '0 0 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#e2e8f0' }}>Misiones</h2>
        <button
          type="button"
          onClick={() => setFormOpen(!formOpen)}
          style={{
            padding: '6px 14px', borderRadius: 6,
            background: '#3b82f6', border: 'none', color: '#fff',
            cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
          }}
        >
          + Nueva misión
        </button>
      </div>

      {formOpen && (
        <form onSubmit={handleCreate} style={{
          background: '#1e293b', border: '1px solid #334155',
          borderRadius: 8, padding: 16, marginBottom: 16,
        }}>
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 4 }}>Nombre de la misión *</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ej: Auditoría Q1 2025"
              required
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 4 }}>URL del repositorio * (HTTPS público)</label>
            <input
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://github.com/usuario/repo"
              required
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 4 }}>Ruta de documentación adicional (opcional)</label>
            <input
              value={newDocs}
              onChange={(e) => setNewDocs(e.target.value)}
              placeholder="/ruta/local/a/docs (opcional)"
              style={inputStyle}
            />
          </div>
          {error && <div style={{ color: '#ef4444', fontSize: '0.8rem', marginBottom: 10 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" disabled={creating} style={btnPrimaryStyle}>
              {creating ? 'Creando...' : 'Crear misión'}
            </button>
            <button type="button" onClick={() => setFormOpen(false)} style={btnSecondaryStyle}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {missions.length === 0 ? (
        <div style={{ color: '#64748b', fontSize: '0.9rem', padding: '24px 0', textAlign: 'center' }}>
          No hay misiones. Crea una para comenzar.
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155', color: '#64748b' }}>
              <th style={thStyle}>Nombre</th>
              <th style={thStyle}>Repositorio</th>
              <th style={thStyle}>Estado</th>
              <th style={thStyle}>Creada</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {missions.map((m) => (
              <tr
                key={m.id}
                onClick={() => onSelect(m)}
                style={{ borderBottom: '1px solid #1e293b', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#1e293b'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <td style={tdStyle}><strong style={{ color: '#e2e8f0' }}>{m.name}</strong></td>
                <td style={{ ...tdStyle, color: '#64748b', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.repo_url}
                </td>
                <td style={tdStyle}><StatusBadge status={m.status} /></td>
                <td style={{ ...tdStyle, color: '#64748b' }}>{new Date(m.created_at).toLocaleDateString('es-ES')}</td>
                <td style={tdStyle} onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => onDelete(m.id)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '7px 10px',
  background: '#0f172a', border: '1px solid #334155',
  borderRadius: 5, color: '#e2e8f0', fontSize: '0.85rem',
  boxSizing: 'border-box',
};

const btnPrimaryStyle = {
  padding: '7px 16px', borderRadius: 6,
  background: '#3b82f6', border: 'none', color: '#fff',
  cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
};

const btnSecondaryStyle = {
  padding: '7px 16px', borderRadius: 6,
  background: 'transparent', border: '1px solid #334155', color: '#94a3b8',
  cursor: 'pointer', fontSize: '0.85rem',
};

const thStyle = { textAlign: 'left', padding: '8px 12px', fontWeight: 500, fontSize: '0.78rem' };
const tdStyle = { padding: '10px 12px', color: '#cbd5e1' };
