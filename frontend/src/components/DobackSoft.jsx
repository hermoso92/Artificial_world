/**
 * DobackSoft — acceso por cupón limitado.
 * Primeros 1000 ciudadanos: €9,99/mes. Regular: €29/mes.
 * El código de acceso es para el simulador DobackSoft (bomberos), no para Damas (gratis).
 */
import { useState, useEffect, useCallback } from 'react';
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
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    api.getDobackSoftStats()
      .then(setStats)
      .catch((err) => {
        logger.warn('DobackSoft stats failed', err.message);
        setStats({ citizensCount: 0, maxCitizens: 1000, slotsRemaining: 1000, priceEarly: 9.99, priceRegular: 29 });
      });
  }, [registered]);

  useEffect(() => {
    if (couponResult?.valid) setVideoError(false);
  }, [couponResult?.valid]);

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

  const handleCopyCode = useCallback(() => {
    if (couponResult?.accessCode) {
      navigator.clipboard.writeText(couponResult.accessCode);
    }
  }, [couponResult?.accessCode]);

  return (
    <div className="dobacksoft">
      <div className="dobacksoft-header">
        <button className="back-btn" onClick={onBack}>← Constructor de Mundos</button>
      </div>

      <div className="dobacksoft-hero">
        <div className="dobacksoft-icon">🚒</div>
        <h1 className="dobacksoft-title">DobackSoft</h1>
        <p className="dobacksoft-tagline">Protege tu comunidad · Acceso anticipado</p>
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
              <>
                {couponResult.accessCode && (
                  <div className="dobacksoft-access-code">
                    <span className="dobacksoft-access-label">Código de acceso a DobackSoft (Fire Simulator):</span>
                    <div className="dobacksoft-access-row">
                      <code className="dobacksoft-access-value">{couponResult.accessCode}</code>
                      <button
                        type="button"
                        className="dobacksoft-copy-btn"
                        onClick={handleCopyCode}
                        title="Copiar código"
                      >
                        Copiar
                      </button>
                    </div>
                  </div>
                )}
                <button
                  className="dobacksoft-register-btn"
                  onClick={handleRegister}
                  disabled={loading}
                >
                  Reservar por €{couponResult.price}/mes
                </button>
              </>
            )}
          </div>
        )}
        {error && <p className="dobacksoft-error">{error}</p>}
      </div>

      {couponResult?.valid && (
        <div className="dobacksoft-promo-content">
          <section className="dobacksoft-video-section">
            <h3 className="dobacksoft-section-title">Trailer</h3>
            <div className="dobacksoft-video-wrapper">
              {videoError ? (
                <div className="dobacksoft-video-fallback">
                  <span>Trailer próximamente.</span>
                  <small>Ejecuta <code>python scripts/crear_video_dobacksoft.py</code> para generarlo.</small>
                </div>
              ) : (
                <video
                  className="dobacksoft-video"
                  controls
                  preload="metadata"
                  onError={() => setVideoError(true)}
                >
                  <source src="/api/dobacksoft/trailer" type="video/mp4" />
                </video>
              )}
            </div>
          </section>
          <section className="dobacksoft-game-section">
            <h3 className="dobacksoft-section-title">Tu código de acceso</h3>
            <p className="dobacksoft-game-desc">
              Conserva este código para acceder al simulador DobackSoft (camión de bomberos) cuando esté disponible.
              Las Damas y otros minijuegos son gratis desde el Hub.
            </p>
          </section>
        </div>
      )}

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
