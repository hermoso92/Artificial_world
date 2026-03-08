/**
 * SubidaManualLite — Subida simplificada de archivos de telemetría.
 * Compatible con formato DobackSoft (ESTABILIDAD, GPS, ROTATIVO).
 * En modo standalone: backend mock procesa y crea sesión.
 */
import { useState, useCallback } from 'react';
import { api } from '../../services/api.js';
import logger from '../../utils/logger.js';

const MAX_FILE_MB = 50;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

const FILE_TYPES = [
  { key: 'ESTABILIDAD', label: 'Estabilidad', desc: 'CSV de estabilidad' },
  { key: 'GPS', label: 'GPS', desc: 'CSV o GPX con coordenadas' },
  { key: 'ROTATIVO', label: 'Rotativo', desc: 'CSV de rotativo (opcional)' },
];

export function SubidaManualLite({ onSuccess, onSwitchToRutas }) {
  const [vehicleName, setVehicleName] = useState('');
  const [files, setFiles] = useState({ ESTABILIDAD: null, GPS: null, ROTATIVO: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleFileChange = useCallback((key, file) => {
    if (file && file.size > MAX_FILE_BYTES) {
      setError(`El archivo supera el límite de ${MAX_FILE_MB} MB`);
      return;
    }
    setFiles((prev) => ({ ...prev, [key]: file }));
    setError(null);
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const name = (vehicleName || 'Vehículo subido').trim();
    const toUpload = Object.entries(files).filter(([, f]) => f != null);
    if (toUpload.length === 0) {
      setError('Selecciona al menos un archivo (Estabilidad o GPS)');
      return;
    }

    setLoading(true);
    try {
      const result = await api.uploadDobackSoftFiles(toUpload, name);
      setSuccess(result?.message ?? 'Archivos subidos correctamente. Revisa la pestaña "Ver rutas".');
      setFiles({ ESTABILIDAD: null, GPS: null, ROTATIVO: null });
      onSuccess?.(result);
    } catch (err) {
      const msg = err?.message ?? 'Error al subir archivos';
      setError(msg);
      logger.error('SubidaManualLite upload failed', err);
    } finally {
      setLoading(false);
    }
  }, [vehicleName, files, onSuccess]);

  return (
    <section className="subida-manual-lite">
      <h3 className="dobacksoft-section-title">Subir archivos de telemetría</h3>
      <p className="dobacksoft-game-desc">
        Sube archivos CSV o GPX de estabilidad, GPS y rotativo. Se crearán sesiones que podrás ver en &quot;Ver rutas&quot;.
      </p>

      <form className="subida-form" onSubmit={handleSubmit}>
        <div className="subida-field">
          <label htmlFor="vehicle-name">Nombre del vehículo</label>
          <input
            id="vehicle-name"
            type="text"
            className="subida-input"
            placeholder="Ej: Bombero 01"
            value={vehicleName}
            onChange={(e) => setVehicleName(e.target.value)}
          />
        </div>

        {FILE_TYPES.map(({ key, label, desc }) => (
          <div key={key} className="subida-field">
            <label htmlFor={`file-${key}`}>{label}</label>
            <input
              id={`file-${key}`}
              type="file"
              className="subida-file"
              accept=".csv,.gpx,.txt"
              onChange={(e) => handleFileChange(key, e.target.files?.[0] ?? null)}
            />
            {files[key] && (
              <span className="subida-file-name">{files[key].name}</span>
            )}
            <small className="subida-hint">{desc}</small>
          </div>
        ))}

        {error && <p className="subida-error">{error}</p>}
        {success && <p className="subida-success">{success}</p>}

        <div className="subida-actions">
          <button
            type="submit"
            className="dobacksoft-play-btn"
            disabled={loading}
          >
            {loading ? 'Subiendo...' : '📤 Subir archivos'}
          </button>
          {success && onSwitchToRutas && (
            <button
              type="button"
              className="subida-btn-secondary"
              onClick={onSwitchToRutas}
            >
              Ver rutas
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
