/**
 * HubPersonalSummary — Greeting, stats, and primary CTA for the hero.
 */
import { useTranslation } from 'react-i18next';

const TIER_LABELS = {
  free: 'Explorador',
  constructor: 'Constructor',
  fundador: 'Fundador',
};

export function HubPersonalSummary({
  hero,
  status,
  subscription,
  seedAccent,
  activeWorld,
  onEnterWorld,
  onUpgradePlan,
}) {
  const { t } = useTranslation();
  const worldCount = hero?.aliveWorlds?.length ?? 0;
  const heroName = hero?.name;
  const modeName = hero?.modes?.find((m) => m.id === hero?.activeMode)?.label ?? hero?.activeMode;

  return (
    <div
      className="hub-personal"
      style={seedAccent ? { '--seed-accent': seedAccent.color, '--seed-bg': seedAccent.bg } : undefined}
    >
      {seedAccent && activeWorld?.civilizationSeed?.label && (
        <span className="hub-seed-badge" style={{ background: seedAccent.bg, color: seedAccent.color }}>
          {activeWorld.civilizationSeed.label}
        </span>
      )}
      <div className="hub-personal-greeting">
        {heroName ? (
          <>
            {t('hub.welcome_prefix', 'Bienvenido, ')} <strong>{heroName}</strong>
          </>
        ) : (
          <span dangerouslySetInnerHTML={{ __html: t('hub.no_world') }} />
        )}
      </div>
      {(heroName || worldCount > 0 || status) && (
        <div className="hub-personal-stats">
          <span className="hub-stat">{t('hub.stat_worlds', { count: worldCount })}</span>
          {modeName && (
            <span className="hub-stat">{t('hub.stat_scale', { mode: modeName })}</span>
          )}
          {status && (
            <span className="hub-stat">{t('hub.stat_inhabitants', { count: status.agentCount ?? 0 })}</span>
          )}
        </div>
      )}
      <div className="hub-personal-actions">
        <button type="button" className="hub-personal-cta" onClick={onEnterWorld}>
          {t('hub.enter_world')}
        </button>
        {subscription && (
          <button type="button" className="hub-plan-btn" onClick={onUpgradePlan}>
            {subscription.tier === 'free'
              ? t('hub.upgrade_plan')
              : `✓ ${TIER_LABELS[subscription.tier] ?? subscription.tier}`}
          </button>
        )}
      </div>
    </div>
  );
}
