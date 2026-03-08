import { useState, useEffect } from 'react';
import { Landing } from './components/Landing';
import { LandingPublic } from './components/LandingPublic';
import { Hub } from './components/Hub';
import { SimulationView } from './components/SimulationView';
import { MinigamesLobby } from './components/MinigamesLobby';
import { DobackSoft } from './components/DobackSoft';
import { FireSimulator } from './components/FireSimulator';
import { MissionControl } from './components/MissionControl';
import { MysticQuestView } from './components/MysticQuestView';
import { AdminPanel } from './components/AdminPanel';
import { Docs } from './components/Docs';

const ONBOARDED_KEY = 'aw_onboarded';
const VALID_ROUTES = ['home', 'landing', 'hub', 'simulation', 'minigames', 'dobacksoft', 'firesimulator', 'missioncontrol', 'mysticquest', 'admin', 'docs'];

function hasOnboarded() {
  return typeof window !== 'undefined' && localStorage.getItem(ONBOARDED_KEY) === '1';
}

function getInitialRoute() {
  const hash = window.location.hash.replace('#', '');
  if (VALID_ROUTES.includes(hash)) return hash;
  if (hasOnboarded()) return 'hub';
  return 'home';
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

  const handleEnterDirect = () => {
    localStorage.setItem(ONBOARDED_KEY, '1');
    navigate('hub');
  };

  if (route === 'home') {
    return (
      <LandingPublic
        onStartOnboarding={() => navigate('landing')}
        onEnterDirect={handleEnterDirect}
      />
    );
  }

  if (route === 'landing' || (!hasOnboarded() && route !== 'admin' && route !== 'docs')) {
    return <Landing onEnter={handleOnboardingComplete} />;
  }

  if (route === 'simulation')     return <SimulationView onBack={() => navigate('hub')} onNavigate={navigate} />;
  if (route === 'minigames')      return <MinigamesLobby onBack={() => navigate('hub')} />;
  if (route === 'dobacksoft')     return <DobackSoft onBack={() => navigate('hub')} onNavigate={navigate} />;
  if (route === 'firesimulator')  return <FireSimulator onBack={() => navigate('dobacksoft')} />;
  if (route === 'missioncontrol') return <MissionControl onBack={() => navigate('hub')} onNavigate={navigate} />;
  if (route === 'mysticquest') return <MysticQuestView onBack={() => navigate('hub')} onNavigate={navigate} />;
  if (route === 'admin') return <AdminPanel onBack={() => navigate('hub')} />;
  if (route === 'docs') return <Docs onBack={() => navigate('hub')} />;

  return <Hub onNavigate={navigate} />;
}
