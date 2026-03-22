/**
 * PricingModal — Elige tu plan. De explorador a constructor.
 * Supports Stripe Checkout (when enabled) and local coupon flow.
 */
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import logger from '../utils/logger';

export function PricingModal({ open, onClose, onSubscribed, currentTier }) {
  const { t } = useTranslation();
  const [tiers, setTiers] = useState([]);
  const [coupon, setCoupon] = useState('');
  const [couponResult, setCouponResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [stripeEnabled, setStripeEnabled] = useState(false);

  useEffect(() => {
    if (open) {
      api.getSubscriptionTiers().then(setTiers).catch(() => {});
      api.getStripeStatus().then((s) => setStripeEnabled(s?.enabled ?? false)).catch(() => {});
      setCouponResult(null);
      setCoupon('');
      setError(null);
      setSuccess(null);
    }
  }, [open]);

  if (!open) return null;

  const handleValidateCoupon = async () => {
    if (!coupon.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.validateSubscriptionCoupon(coupon.trim());
      setCouponResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (tierId) => {
    setLoading(true);
    setError(null);
    try {
      if (stripeEnabled && tierId !== 'fundador') {
        const checkout = await api.createCheckout(tierId);
        if (checkout?.url) {
          window.location.href = checkout.url;
          return;
        }
      }

      const result = await api.subscribe(tierId, coupon.trim() || undefined);
      setSuccess(result.message);
      onSubscribed?.(result);
    } catch (err) {
      logger.warn('PricingModal: subscribe error', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);
    setError(null);
    try {
      const portal = await api.createPortalSession();
      if (portal?.url) {
        window.location.href = portal.url;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const tierOrder = ['free', 'constructor', 'fundador'];
  const sortedTiers = tierOrder
    .map((id) => tiers.find((t) => t.id === id))
    .filter(Boolean);

  return (
    <div className="pricing-overlay" onClick={onClose}>
      <div className="pricing-modal" onClick={(e) => e.stopPropagation()}>
        <button className="pricing-close" onClick={onClose}>✕</button>

        <div className="pricing-header">
          <h2 className="pricing-title">{t('pricing.title')}</h2>
          <p className="pricing-subtitle">{t('pricing.subtitle')}</p>
        </div>

        {success ? (
          <div className="pricing-success">
            <div className="pricing-success-icon">🌍</div>
            <p className="pricing-success-msg">{success}</p>
            <button className="pricing-cta" onClick={onClose}>
              {t('pricing.return_world')}
            </button>
          </div>
        ) : (
          <>
            <div className="pricing-tiers">
              {sortedTiers.map((tier) => {
                const isCurrent = tier.id === currentTier;
                const isFundador = tier.id === 'fundador';
                const needsCoupon = isFundador && !couponResult?.valid;

                return (
                  <div
                    key={tier.id}
                    className={`pricing-tier ${isCurrent ? 'pricing-tier--current' : ''} ${tier.id === 'constructor' ? 'pricing-tier--featured' : ''}`}
                  >
                    {tier.id === 'constructor' && (
                      <div className="pricing-tier-badge">{t('pricing.recommended')}</div>
                    )}
                    {isFundador && tier.slotsRemaining != null && (
                      <div className="pricing-tier-badge pricing-tier-badge--fundador">
                        {t('pricing.slots', { count: tier.slotsRemaining })}
                      </div>
                    )}

                    <div className="pricing-tier-name">{tier.name}</div>
                    <div className="pricing-tier-price">
                      {tier.price === 0 ? (
                        <span className="pricing-price-free">{t('pricing.free')}</span>
                      ) : (
                        <>
                          <span className="pricing-price-amount">€{tier.price}</span>
                          <span className="pricing-price-interval">{t('pricing.per_month')}</span>
                        </>
                      )}
                    </div>

                    <ul className="pricing-tier-features">
                      {tier.features.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>

                    {isCurrent ? (
                      <div className="pricing-current-label">
                        {t('pricing.current_plan')}
                        {stripeEnabled && tier.price > 0 && (
                          <button
                            className="pricing-manage-btn"
                            onClick={handleManageSubscription}
                            disabled={loading}
                          >
                            {t('pricing.manage_subscription')}
                          </button>
                        )}
                      </div>
                    ) : tier.price === 0 ? null : (
                      <button
                        className="pricing-cta"
                        onClick={() => handleSubscribe(tier.id)}
                        disabled={loading || (needsCoupon)}
                        title={needsCoupon ? t('pricing.coupon_hint') : ''}
                      >
                        {loading
                          ? t('pricing.processing')
                          : stripeEnabled && tier.id !== 'fundador'
                            ? t('pricing.pay_stripe', { price: tier.price })
                            : t('pricing.become', { name: tier.name })}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pricing-coupon">
              <p className="pricing-coupon-label">{t('pricing.coupon_label')}</p>
              <div className="pricing-coupon-row">
                <input
                  className="pricing-coupon-input"
                  type="text"
                  placeholder="MUNDOFUNDADOR500"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleValidateCoupon()}
                />
                <button
                  className="pricing-coupon-btn"
                  onClick={handleValidateCoupon}
                  disabled={loading || !coupon.trim()}
                >
                  {t('pricing.validate')}
                </button>
              </div>
              {couponResult && (
                <p className={`pricing-coupon-msg ${couponResult.valid ? 'valid' : 'invalid'}`}>
                  {couponResult.message}
                </p>
              )}
            </div>

            {error && <p className="pricing-error">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}
