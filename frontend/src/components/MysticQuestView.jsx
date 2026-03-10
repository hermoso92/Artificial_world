/**
 * Mystic Quest — Serie de visiones.
 * Vinculada a la semilla Comunidad espiritual. Ritual, memoria y presagios.
 */
import { useTranslation } from 'react-i18next';

const MYSTIC_ACCENT = '#a78bfa';
const MYSTIC_AMBER = '#f59e0b';
const MYSTIC_BG = '#0f0a1a';

export function MysticQuestView({ onBack, onNavigate }) {
  const { t } = useTranslation();

  return (
    <div
      className="mysticquest"
      style={{
        '--mystic-accent': MYSTIC_ACCENT,
        '--mystic-amber': MYSTIC_AMBER,
        '--mystic-bg': MYSTIC_BG,
      }}
    >
      <div className="mysticquest-header">
        <h2 className="mysticquest-title">🔮 Mystic Quest</h2>
      </div>

      <div className="mysticquest-hero">
        <p className="mysticquest-tagline">{t('mysticquest.tagline', 'Serie de visiones')}</p>
        <p className="mysticquest-desc">
          {t('mysticquest.desc', 'Crea un santuario con la semilla Comunidad espiritual. Velas, piedra y símbolos. Tu guía visionario te espera.')}
        </p>
      </div>

      <div className="mysticquest-content">
        <section className="mysticquest-section">
          <h3 className="mysticquest-section-title">{t('mysticquest.how_title', 'Cómo empezar')}</h3>
          <ul className="mysticquest-list">
            <li>{t('mysticquest.step1', 'Elige la semilla Comunidad espiritual al crear tu mundo')}</li>
            <li>{t('mysticquest.step2', 'Construye tu santuario y observa cómo emerge la historia')}</li>
            <li>{t('mysticquest.step3', 'Los presagios y rituales darán forma a tus quests')}</li>
          </ul>
        </section>

        <section className="mysticquest-section mysticquest-quests">
          <h3 className="mysticquest-section-title">{t('mysticquest.quests_title', 'Quests de la serie')}</h3>
          <div className="mysticquest-quest-grid">
            <div className="mysticquest-quest-card">
              <span className="mysticquest-quest-icon">🕯️</span>
              <h4 className="mysticquest-quest-name">{t('mysticquest.quest1_title', 'Encuentra el símbolo')}</h4>
              <p className="mysticquest-quest-desc">{t('mysticquest.quest1_desc', 'El santuario guarda un símbolo oculto. Explora, construye y deja que la memoria del mundo te guíe.')}</p>
            </div>
            <div className="mysticquest-quest-card">
              <span className="mysticquest-quest-icon">🛡️</span>
              <h4 className="mysticquest-quest-name">{t('mysticquest.quest2_title', 'Protege el santuario')}</h4>
              <p className="mysticquest-quest-desc">{t('mysticquest.quest2_desc', 'Tu refugio es el centro ritual. Mantén a tus habitantes vivos, alimentados y en paz. La cohesión es la clave.')}</p>
            </div>
            <div className="mysticquest-quest-card">
              <span className="mysticquest-quest-icon">📜</span>
              <h4 className="mysticquest-quest-name">{t('mysticquest.quest3_title', 'La crónica del ritual')}</h4>
              <p className="mysticquest-quest-desc">{t('mysticquest.quest3_desc', 'Observa cómo la historia emerge de los eventos. Cada tick es una línea en la crónica de tu civilización.')}</p>
            </div>
          </div>
        </section>

        {onNavigate && (
          <div className="mysticquest-actions">
            <button
              type="button"
              className="mysticquest-cta"
              onClick={() => onNavigate('simulation')}
            >
              {t('mysticquest.enter_world', 'Entrar en tu mundo →')}
            </button>
            <p className="mysticquest-hint">
              {t('mysticquest.hint', 'Si aún no tienes mundo, crea uno con la semilla espiritual desde el onboarding.')}
            </p>
          </div>
        )}
      </div>

      <div className="mysticquest-footer">
        <span className="mysticquest-badge">{t('mysticquest.badge', 'Serie')}</span>
        <span>{t('mysticquest.footer', 'Comunidad espiritual · Guía visionario · Memoria y ritual')}</span>
      </div>
    </div>
  );
}
