/**
 * DobackSoft — Vertical demo integrada en Artificial World.
 * Producto comercial completo en repo dobackv2. Ver docs/OWNERSHIP_ESTRATEGICO.md.
 * Acceso por cupón. FireSimulator = superficie de demo/entrenamiento, no núcleo. Ver docs/SUPERFICIE_JUEGO.md.
 */
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api.js';
import logger from '../utils/logger.js';
import { VisorRuta2D } from './DobackSoft/VisorRuta2D.jsx';
import { SubidaManualLite } from './DobackSoft/SubidaManualLite.jsx';

const ACCESS_CODE_KEY = 'dobacksoft_access_code';

export function DobackSoft({ onBack, onNavigate }) {
  const { t } = useTranslation();

  const FEATURES = [
    { icon: '🗺️', label: t('dobacksoft.features.map_label'), desc: t('dobacksoft.features.map_desc') },
    { icon: '🚒', label: t('dobacksoft.features.telemetry_label'), desc: t('dobacksoft.features.telemetry_desc') },
    { icon: '🏙️', label: t('dobacksoft.features.landscape_label'), desc: t('dobacksoft.features.landscape_desc') },
    { icon: '🌩️', label: t('dobacksoft.features.incidents_label'), desc: t('dobacksoft.features.incidents_desc') },
    { icon: '📊', label: t('dobacksoft.features.progression_label'), desc: t('dobacksoft.features.progression_desc') },
  ];
  const [stats, setStats] = useState(null);
  const [coupon, setCoupon] = useState('');
  const [couponResult, setCouponResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [registered, setRegistered] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [activeTab, setActiveTab] = useState('rutas');

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

  useEffect(() => {
    if (couponResult?.valid && couponResult?.accessCode && typeof window !== 'undefined') {
      window.localStorage.setItem(ACCESS_CODE_KEY, couponResult.accessCode);
    }
  }, [couponResult?.valid, couponResult?.accessCode]);

  const handleValidateCoupon = async () => {
    setError(null);
    setCouponResult(null);
    if (!coupon.trim()) return;
    setLoading(true);
    try {
      const data = await api.validateDobackSoftCoupon(coupon);
      setCouponResult(data);
    } catch (err) {
      setError(err.message ?? t('dobacksoft.error_coupon'));
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
      setError(err.message ?? t('dobacksoft.error_register'));
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

  const handlePlayRoute = useCallback((sessionId, routeData) => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('dobacksoft_route_session', sessionId);
        sessionStorage.setItem('dobacksoft_route_data', JSON.stringify(routeData));
      } catch (_) { /* ignore */ }
    }
    onNavigate?.('firesimulator');
  }, [onNavigate]);

  return (
    <div className="dobacksoft">
      <div className="dobacksoft-hero">
        <div className="dobacksoft-icon">🚒</div>
        <h1 className="dobacksoft-title">DobackSoft</h1>
        <p className="dobacksoft-tagline">{t('dobacksoft.tagline')}</p>
        <span className="dobacksoft-badge">{t('dobacksoft.badge')}</span>
      </div>

      <p className="dobacksoft-desc">{t('dobacksoft.desc')}</p>

      {stats && (
        <div className="dobacksoft-stats">
          <div className="dobacksoft-stat">
            <span className="dobacksoft-stat-value">{stats.citizensCount}</span>
            <span className="dobacksoft-stat-label">{t('dobacksoft.citizens_of', { max: stats.maxCitizens })}</span>
          </div>
          <div className="dobacksoft-stat dobacksoft-stat--highlight">
            <span className="dobacksoft-stat-value">€{stats.priceEarly}</span>
            <span className="dobacksoft-stat-label">{t('dobacksoft.price_vs', { regular: stats.priceRegular })}</span>
          </div>
        </div>
      )}

      <div className="dobacksoft-coupon">
        <h3 className="dobacksoft-coupon-title">{t('dobacksoft.coupon_title')}</h3>
        <div className="dobacksoft-coupon-row">
          <input
            type="text"
            className="dobacksoft-coupon-input"
            placeholder="DEMO o FUNDADOR1000"
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
            {loading ? t('common.loading') : t('dobacksoft.validate')}
          </button>
        </div>
        {couponResult && (
          <div className={`dobacksoft-coupon-result ${couponResult.valid ? 'valid' : 'invalid'}`}>
            <p>{couponResult.message}</p>
            {couponResult.valid && (
              <>
                {couponResult.accessCode && (
                  <div className="dobacksoft-access-code">
                    <span className="dobacksoft-access-label">{t('dobacksoft.access_label')}</span>
                    <div className="dobacksoft-access-row">
                      <code className="dobacksoft-access-value">{couponResult.accessCode}</code>
                      <button
                        type="button"
                        className="dobacksoft-copy-btn"
                        onClick={handleCopyCode}
                        title={t('common.copy')}
                      >
                        {t('common.copy')}
                      </button>
                    </div>
                  </div>
                )}
                <button
                  className="dobacksoft-register-btn"
                  onClick={handleRegister}
                  disabled={loading}
                >
                  {t('dobacksoft.reserve', { price: couponResult.price })}
                </button>
              </>
            )}
          </div>
        )}
        {error && <p className="dobacksoft-error">{error}</p>}
      </div>

      {(couponResult?.valid || registered) && (
        <div className="dobacksoft-promo-content">
          <section className="dobacksoft-video-section">
            <h3 className="dobacksoft-section-title">{t('dobacksoft.trailer')}</h3>
            {registered && (
              <p className="dobacksoft-game-desc">{t('dobacksoft.has_access')}</p>
            )}
            <div className="dobacksoft-video-wrapper">
              {videoError ? (
                <div className="dobacksoft-video-fallback">
                  <span>{t('dobacksoft.trailer_soon')}</span>
                  <small dangerouslySetInnerHTML={{ __html: t('dobacksoft.trailer_generate') }} />
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

          <nav className="dobacksoft-tabs">
            <button
              type="button"
              className={`dobacksoft-tab ${activeTab === 'subir' ? 'active' : ''}`}
              onClick={() => setActiveTab('subir')}
            >
              {t('dobacksoft.tab_upload')}
            </button>
            <button
              type="button"
              className={`dobacksoft-tab ${activeTab === 'rutas' ? 'active' : ''}`}
              onClick={() => setActiveTab('rutas')}
            >
              {t('dobacksoft.tab_routes')}
            </button>
            <button
              type="button"
              className={`dobacksoft-tab ${activeTab === 'jugar' ? 'active' : ''}`}
              onClick={() => setActiveTab('jugar')}
            >
              {t('dobacksoft.tab_play')}
            </button>
          </nav>

          {activeTab === 'subir' && (
            <SubidaManualLite
              onSwitchToRutas={() => setActiveTab('rutas')}
            />
          )}

          {activeTab === 'rutas' && (
            <VisorRuta2D onPlayRoute={handlePlayRoute} />
          )}

          {activeTab === 'jugar' && (
            <section className="dobacksoft-game-section">
              <h3 className="dobacksoft-section-title">{t('dobacksoft.access_code_section')}</h3>
              <p className="dobacksoft-game-desc">{t('dobacksoft.access_code_desc')}</p>
              {onNavigate && (
                <button
                  type="button"
                  className="dobacksoft-play-btn"
                  onClick={() => {
                    if (couponResult?.accessCode) {
                      window.localStorage.setItem(ACCESS_CODE_KEY, couponResult.accessCode);
                    }
                    onNavigate('firesimulator');
                  }}
                >
                  {t('dobacksoft.play_fire')}
                </button>
              )}
            </section>
          )}
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
          {t('dobacksoft.welcome_citizen')}
        </div>
      )}
    </div>
  );
}
