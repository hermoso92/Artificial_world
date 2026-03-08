import { useState, useEffect } from 'react';
import { Landing } from './components/Landing';
import { Hub } from './components/Hub';
import { SimulationView } from './components/SimulationView';
import { MinigamesLobby } from './components/MinigamesLobby';
import { DobackSoft } from './components/DobackSoft';
import { MissionControl } from './components/MissionControl';

const ONBOARDED_KEY = 'aw_onboarded';
const VALID_ROUTES = ['landing', 'hub', 'simulation', 'minigames', 'dobacksoft', 'missioncontrol'];

function hasOnboarded() {
  return typeof window !== 'undefined' && localStorage.getItem(ONBOARDED_KEY) === '1';
}

function getInitialRoute() {
  const hash = window.location.hash.replace('#', '');
  if (VALID_ROUTES.includes(hash)) return hash;
  return hasOnboarded() ? 'hub' : 'landing';
}

export default function App() {
  const [route, setRoute] = useState(getInitialRoute);

  useEffect(() => {
    const onHashChange = () => setRoute(getInitialRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (target) => {
    if (!VALID_ROUTES.includes(target)) return;
    setRoute(target);
    window.location.hash = target === 'hub' ? '' : target;
  };

  const handleOnboardingComplete = () => {
    localStorage.setItem(ONBOARDED_KEY, '1');
    navigate('hub');
  };

  if (route === 'landing')        return <Landing onEnter={handleOnboardingComplete} />;
  if (route === 'simulation')     return <SimulationView onBack={() => navigate('hub')} onNavigate={navigate} />;
  if (route === 'minigames')      return <MinigamesLobby onBack={() => navigate('hub')} />;
  if (route === 'dobacksoft')     return <DobackSoft onBack={() => navigate('hub')} />;
  if (route === 'missioncontrol') return <MissionControl onBack={() => navigate('hub')} onNavigate={navigate} />;

  return <Hub onNavigate={navigate} />;
}
