/**
 * OnboardingTutorial — Tutorial obligatorio para nuevos usuarios.
 * Guía: Unirse o crear mundo → Crear héroe → Crear refugio y comunidad → Acceder a casa → Decorar.
 */
import { useState } from 'react';
import { api, getPlayerId } from '../services/api';

const TUTORIAL_COMPLETED_KEY = 'aw_tutorial_completed';

export function getTutorialCompleted() {
  return typeof window !== 'undefined' && localStorage.getItem(TUTORIAL_COMPLETED_KEY) === '1';
}

export function setTutorialCompleted() {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TUTORIAL_COMPLETED_KEY, '1');
  }
}

const STEPS = [
  { id: 'world', title: 'Unirse o crear mundo', stepNum: 1 },
  { id: 'hero', title: 'Crear héroe', stepNum: 2 },
  { id: 'refuge', title: 'Crear refugio y comunidad', stepNum: 3 },
  { id: 'access', title: 'Acceder a tu casa', stepNum: 4 },
  { id: 'decorate', title: 'Decorar tu casa', stepNum: 5 },
];

export function OnboardingTutorial({ onComplete }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [worldChoice, setWorldChoice] = useState('create');
  const [heroName, setHeroName] = useState('');
  const [heroTitle, setHeroTitle] = useState('Constructor de Mundos');
  const [refugeName, setRefugeName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const step = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      setTutorialCompleted();
      onComplete?.();
      return;
    }
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
    setError(null);
  };

  const handleHeroSubmit = async (e) => {
    e.preventDefault();
    if (!heroName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await api.createHero(heroName.trim(), heroTitle.trim() || 'Constructor de Mundos');
      setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
    } catch (err) {
      setError(err.message);
      return;
    } finally {
      setLoading(false);
    }
  };

  const handleRefugeSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.createRefuge(refugeName.trim() || 'Mi refugio');
      setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
    } catch (err) {
      setError(err.message);
      return;
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    setTutorialCompleted();
    onComplete?.();
  };

  return (
    <div className="onboarding-tutorial">
      <div className="onboarding-tutorial-bg" />
      <div className="onboarding-tutorial-panel">
        <div className="onboarding-tutorial-header">
          <span className="onboarding-tutorial-step-badge">
            Paso {step.stepNum} de {STEPS.length}
          </span>
          <h1 className="onboarding-tutorial-title">{step.title}</h1>
        </div>

        {step.id === 'world' && (
          <div className="onboarding-tutorial-content">
            <p className="onboarding-tutorial-desc">
              Empieza creando tu propio mundo o únete a uno existente con un código de invitación.
            </p>
            <div className="onboarding-tutorial-options">
              <button
                type="button"
                className={`onboarding-tutorial-option ${worldChoice === 'create' ? 'active' : ''}`}
                onClick={() => setWorldChoice('create')}
              >
                <span className="onboarding-tutorial-option-icon">🌍</span>
                <span className="onboarding-tutorial-option-label">Crear mi mundo</span>
                <span className="onboarding-tutorial-option-hint">Empezar desde cero</span>
              </button>
              <button
                type="button"
                className="onboarding-tutorial-option onboarding-tutorial-option--disabled"
                disabled
                title="Próximamente"
              >
                <span className="onboarding-tutorial-option-icon">🔗</span>
                <span className="onboarding-tutorial-option-label">Unirme con código</span>
                <span className="onboarding-tutorial-option-hint">Próximamente</span>
              </button>
            </div>
            <button type="button" className="onboarding-tutorial-cta" onClick={handleNext}>
              Continuar
            </button>
          </div>
        )}

        {step.id === 'hero' && (
          <form onSubmit={handleHeroSubmit} className="onboarding-tutorial-content">
            <p className="onboarding-tutorial-desc">
              Cada mundo necesita un constructor. Tú eres el primero. Dale un nombre y un título a tu héroe.
            </p>
            <div className="onboarding-tutorial-form">
              <input
                type="text"
                placeholder="Tu nombre"
                value={heroName}
                onChange={(e) => setHeroName(e.target.value)}
                className="onboarding-tutorial-input"
                autoFocus
                maxLength={30}
                required
              />
              <input
                type="text"
                placeholder="Título (ej. Constructor de Mundos)"
                value={heroTitle}
                onChange={(e) => setHeroTitle(e.target.value)}
                className="onboarding-tutorial-input"
                maxLength={50}
              />
            </div>
            {error && <p className="onboarding-tutorial-error">{error}</p>}
            <button type="submit" className="onboarding-tutorial-cta" disabled={loading || !heroName.trim()}>
              {loading ? 'Creando…' : 'Crear héroe'}
            </button>
          </form>
        )}

        {step.id === 'refuge' && (
          <form onSubmit={handleRefugeSubmit} className="onboarding-tutorial-content">
            <p className="onboarding-tutorial-desc">
              Tu refugio es el primer lugar de tu mundo. Donde todo empieza. Dale un nombre a tu casa y comunidad.
            </p>
            <div className="onboarding-tutorial-form">
              <input
                type="text"
                placeholder="Mi refugio"
                value={refugeName}
                onChange={(e) => setRefugeName(e.target.value)}
                className="onboarding-tutorial-input"
                autoFocus
                maxLength={40}
              />
            </div>
            {error && <p className="onboarding-tutorial-error">{error}</p>}
            <button type="submit" className="onboarding-tutorial-cta" disabled={loading}>
              {loading ? 'Construyendo…' : 'Crear refugio y comunidad'}
            </button>
          </form>
        )}

        {step.id === 'access' && (
          <div className="onboarding-tutorial-content">
            <p className="onboarding-tutorial-desc">
              Entra en <strong>Tu Mundo</strong> desde el Hub. Tu refugio te espera. Desde ahí podrás controlar todo: simulación, agentes, Mission Control, Arena y Emergencias.
            </p>
            <div className="onboarding-tutorial-highlight">
              <span className="onboarding-tutorial-highlight-icon">🏠</span>
              <p>Hub → Tu Mundo → Tu refugio</p>
            </div>
            <button type="button" className="onboarding-tutorial-cta" onClick={handleNext}>
              Continuar
            </button>
          </div>
        )}

        {step.id === 'decorate' && (
          <div className="onboarding-tutorial-content">
            <p className="onboarding-tutorial-desc">
              Tu casa está vacía. Pulsa <strong>"Editar"</strong> debajo del mapa para colocar muebles.
            </p>
            <p className="onboarding-tutorial-desc">
              Prueba a poner una <strong>Cama</strong> en el Dormitorio, una <strong>Mesa</strong> en la Cocina o un <strong>Sofá</strong> en el Salón.
            </p>
            <div className="onboarding-tutorial-tips">
              <span>🛏️ Cama → Dormitorio</span>
              <span>🍽️ Mesa → Cocina</span>
              <span>🛋️ Sofá → Salón</span>
            </div>
            <p className="onboarding-tutorial-desc" style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
              Serás llevado directamente a tu refugio.
            </p>
            <button type="button" className="onboarding-tutorial-cta onboarding-tutorial-cta--glow" onClick={handleNext}>
              Entrar en mi mundo →
            </button>
          </div>
        )}

        <button type="button" className="onboarding-tutorial-skip" onClick={handleSkip}>
          Saltar tutorial
        </button>
      </div>
      <footer className="onboarding-tutorial-footer">
        <span>Constructor de Mundos</span>
        <span className="onboarding-tutorial-footer-dot">·</span>
        <span>No persigas la IA. Construye un mundo que la necesite.</span>
      </footer>
    </div>
  );
}
