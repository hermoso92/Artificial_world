/**
 * DobackSoft — acceso por cupón limitado.
 * Primeros 1000 ciudadanos: €9,99/mes. Regular: €29/mes.
 */
import { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import logger from '../utils/logger.js';

const FEATURES = [
  { icon: '🗺️', label: 'Mapa de despacho en tiempo real', desc: 'Rutas dinámicas hacia la emergencia activa' },
  { icon: '🚒', label: 'Telemetría del vehículo', desc: 'Velocidad, combustible, estado del camión' },
  { icon: '🏙️', label: 'Paisajes 2D realistas', desc: 'Tráfico, semáforos, peatones y edificios' },
  { icon: '🌩️', label: 'Simulación de incidentes', desc: 'Incendios, accidentes y condiciones climáticas' },
  { icon: '📊', label: 'Progresión y niveles', desc: 'Escenarios de dificultad creciente' },
];

export function DobackSoft({ onBack }) {
  const [stats, setStats] = useState(null);
  const [coupon, setCoupon] = useState('');
  const [couponResult, setCouponResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    api.getDobackSoftStats()
      .then(setStats)
      .catch((err) => {
        logger.warn('DobackSoft stats failed', err.message);
        setStats({ citizensCount: 0, maxCitizens: 1000, slotsRemaining: 1000, priceEarly: 9.99, priceRegular: 29 });
      });
  }, [registered]);

  const handleValidateCoupon = async () => {
    setError(null);
    setCouponResult(null);
    if (!coupon.trim()) return;
    setLoading(true);
    try {
      const data = await api.validateDobackSoftCoupon(coupon);
      setCouponResult(data);
    } catch (err) {
      setError(err.message ?? 'Error al validar el cupón');
      logger.error('DobackSoft coupon validate', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!couponResult?.valid) return;
    setLoading(true);
    setError(null);
    try {
      await api.registerDobackSoftCitizen();
      setRegistered(true);
      setCouponResult(null);
    } catch (err) {
      setError(err.message ?? 'Error al registrar');
      logger.error('DobackSoft register', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dobacksoft">
      <div className="dobacksoft-header">
        <button className="back-btn" onClick={onBack}>← Hub</button>
      </div>

      <div className="dobacksoft-hero">
        <div className="dobacksoft-icon">🚒</div>
        <h1 className="dobacksoft-title">DobackSoft</h1>
        <p className="dobacksoft-tagline">Fire Simulator · Acceso por cupón</p>
        <span className="dobacksoft-badge">Primeros 1000 ciudadanos</span>
      </div>

      <p className="dobacksoft-desc">
        Conduce un camión de bomberos por paisajes 2D realistas. Tu objetivo: llegar a la
        emergencia antes de que sea demasiado tarde. Acceso limitado por cupón.
      </p>

      {stats && (
        <div className="dobacksoft-stats">
          <div className="dobacksoft-stat">
            <span className="dobacksoft-stat-value">{stats.citizensCount}</span>
            <span className="dobacksoft-stat-label">de {stats.maxCitizens} ciudadanos</span>
          </div>
          <div className="dobacksoft-stat dobacksoft-stat--highlight">
            <span className="dobacksoft-stat-value">€{stats.priceEarly}</span>
            <span className="dobacksoft-stat-label">/mes (cupón) vs €{stats.priceRegular}/mes</span>
          </div>
        </div>
      )}

      <div className="dobacksoft-coupon">
        <h3 className="dobacksoft-coupon-title">Introduce tu cupón</h3>
        <div className="dobacksoft-coupon-row">
          <input
            type="text"
            className="dobacksoft-coupon-input"
            placeholder="FUNDADOR1000"
            value={coupon}
            onChange={(e) => setCoupon(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleValidateCoupon()}
            disabled={loading}
          />
          <button
            className="dobacksoft-coupon-btn"
            onClick={handleValidateCoupon}
            disabled={loading || !coupon.trim()}
          >
            {loading ? '...' : 'Validar'}
          </button>
        </div>
        {couponResult && (
          <div className={`dobacksoft-coupon-result ${couponResult.valid ? 'valid' : 'invalid'}`}>
            <p>{couponResult.message}</p>
            {couponResult.valid && (
              <button
                className="dobacksoft-register-btn"
                onClick={handleRegister}
                disabled={loading}
              >
                Reservar por €{couponResult.price}/mes
              </button>
            )}
          </div>
        )}
        {error && <p className="dobacksoft-error">{error}</p>}
      </div>

      <div className="dobacksoft-features">
        {FEATURES.map((f) => (
          <div key={f.label} className="dobacksoft-feature">
            <span className="dobacksoft-feature-icon">{f.icon}</span>
            <div>
              <div className="dobacksoft-feature-label">{f.label}</div>
              <div className="dobacksoft-feature-desc">{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {registered && (
        <div className="dobacksoft-registered">
          ✓ ¡Bienvenido, ciudadano! Tu precio fundador está reservado.
        </div>
      )}
    </div>
  );
}
