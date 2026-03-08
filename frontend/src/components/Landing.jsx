/**
 * Landing — Onboarding flow for new users.
 * Steps: choose world → name your hero → name your refuge → welcome screen.
 */
import { useState } from 'react';
import { api } from '../services/api';

export function Landing({ onEnter }) {
  const [step, setStep] = useState('world');
  const [name, setName] = useState('');
  const [refugeName, setRefugeName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleNameSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setStep('refuge');
  };

  const handleRefugeSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.createHero(name.trim(), 'Constructor de Mundos');
      await api.createRefuge(refugeName.trim() || 'Mi refugio');
      setStep('ready');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing">
      <div className="landing-bg" />

      {step === 'world' && (
        <div className="landing-panel landing-step">
          <p className="landing-step-number">1 / 3</p>
          <h2 className="landing-step-title">Tu mundo empieza aquí</h2>
          <p className="landing-step-desc">
            Crea tu propio mundo, dale vida con habitantes que piensan y sienten,
            y observa cómo crece.
          </p>
          <div className="landing-options">
            <button
              type="button"
              className="landing-option active"
              onClick={() => setStep('name')}
            >
              <span className="landing-option-icon">🌍</span>
              <span>Crear mi mundo</span>
            </button>
          </div>
          <button className="landing-skip" onClick={onEnter}>
            Ya tengo un mundo →
          </button>
        </div>
      )}

      {step === 'name' && (
        <div className="landing-panel landing-step">
          <p className="landing-step-number">2 / 3</p>
          <h2 className="landing-step-title">¿Cómo te llamas, constructor?</h2>
          <p className="landing-step-desc">
            Cada mundo necesita un constructor. Tú eres el primero.
          </p>
          <form onSubmit={handleNameSubmit} className="landing-form">
            <input
              className="landing-input"
              type="text"
              placeholder="Tu nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              maxLength={30}
            />
            <button className="landing-cta" type="submit" disabled={!name.trim()}>
              Continuar
            </button>
          </form>
        </div>
      )}

      {step === 'refuge' && (
        <div className="landing-panel landing-step">
          <p className="landing-step-number">3 / 3</p>
          <h2 className="landing-step-title">Nombra tu refugio</h2>
          <p className="landing-step-desc">
            Es el primer lugar de tu mundo. Donde todo empieza.
          </p>
          <form onSubmit={handleRefugeSubmit} className="landing-form">
            <input
              className="landing-input"
              type="text"
              placeholder="Mi refugio"
              value={refugeName}
              onChange={(e) => setRefugeName(e.target.value)}
              autoFocus
              maxLength={40}
            />
            {error && <p className="landing-error">{error}</p>}
            <button className="landing-cta" type="submit" disabled={loading}>
              {loading ? 'Construyendo…' : 'Crear mi refugio'}
            </button>
          </form>
        </div>
      )}

      {step === 'ready' && (
        <div className="landing-panel landing-ready">
          <div className="landing-ready-icon">🌍</div>
          <h2 className="landing-step-title">Tu mundo está listo, {name}</h2>
          <p className="landing-step-desc">
            Tu refugio <strong>{refugeName || 'Mi refugio'}</strong> te espera.
            Entra, pulsa <strong>Editar</strong> debajo del mapa y coloca muebles para decorar tu casa.
          </p>
          <div className="landing-tips">
            <span>🛏️ Cama → Dormitorio</span>
            <span>🍽️ Mesa → Cocina</span>
            <span>🛋️ Sofá → Salón</span>
          </div>
          <button className="landing-cta landing-cta-glow" onClick={onEnter}>
            Entrar en mi mundo →
          </button>
        </div>
      )}

      <footer className="landing-footer">
        <span>Constructor de Mundos</span>
        <span className="landing-footer-dot">·</span>
        <span>No persigas la IA. Construye un mundo que la necesite.</span>
      </footer>
    </div>
  );
}
