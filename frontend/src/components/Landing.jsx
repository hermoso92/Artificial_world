/**
 * Landing — Primera experiencia. De visitante a constructor en 30 segundos.
 */
import { useState } from 'react';
import { api } from '../services/api';

const STEPS = ['welcome', 'name', 'refuge', 'ready'];

export function Landing({ onEnter }) {
  const [step, setStep] = useState('welcome');
  const [name, setName] = useState('');
  const [refugeName, setRefugeName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleStart = () => setStep('name');

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

  const handleEnter = () => onEnter?.();

  return (
    <div className="landing">
      <div className="landing-bg" />

      {step === 'welcome' && (
        <div className="landing-panel landing-welcome">
          <p className="landing-eyebrow">Constructor de Mundos</p>
          <h1 className="landing-headline">
            Crea tu refugio.<br />
            Hazlo crecer.<br />
            Construye tu mundo.
          </h1>
          <p className="landing-body">
            No es un juego. No es una herramienta. Es un lugar que puedes habitar,
            llenar de vida y convertir en algo que no esperabas.
          </p>
          <button className="landing-cta" onClick={handleStart}>
            Empezar a construir
          </button>
          <button className="landing-skip" onClick={onEnter}>
            Ya tengo un mundo →
          </button>
        </div>
      )}

      {step === 'name' && (
        <div className="landing-panel landing-step">
          <p className="landing-step-number">1 de 2</p>
          <h2 className="landing-step-title">¿Cómo te llamas?</h2>
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
          <p className="landing-step-number">2 de 2</p>
          <h2 className="landing-step-title">Dale nombre a tu refugio</h2>
          <p className="landing-step-desc">
            Es el primer lugar de tu mundo. Donde todo empieza.
            Puedes cambiarlo después.
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
            Ahora toca habitarlo, darle vida y hacerlo crecer.
          </p>
          <button className="landing-cta landing-cta-glow" onClick={handleEnter}>
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
