import { lazy, Suspense, useState, useEffect } from 'react';
import { Landing } from './components/Landing';
import { LandingPublic } from './components/LandingPublic';
import { Hub } from './components/Hub';
import { SimulationView } from './components/SimulationView';
import { MinigamesLobby } from './components/MinigamesLobby';
import { DobackSoft } from './components/DobackSoft';
import { FireSimulator } from './components/FireSimulator';
import { MysticQuestView } from './components/MysticQuestView';
import { AdminPanel } from './components/AdminPanel';
import { Docs } from './components/Docs';
import { AppShell } from './components/layout/AppShell';
import { VALID_ROUTES } from './config/ecosystemRoutes';

const MissionControl = lazy(() => import('./components/MissionControl').then((module) => ({ default: module.MissionControl })));
const ControlTower = lazy(() => import('./components/ControlTower/ControlTowerPanel').then((module) => ({ default: module.ControlTowerPanel })));

const ONBOARDED_KEY = 'aw_onboarded';

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

  if (route === 'firesimulator') return <FireSimulator onBack={() => navigate('dobacksoft')} />;

  const shellContent = (() => {
    if (route === 'simulation') return <SimulationView onBack={() => navigate('hub')} onNavigate={navigate} />;
    if (route === 'minigames') return <MinigamesLobby onBack={() => navigate('hub')} />;
    if (route === 'dobacksoft') return <DobackSoft onBack={() => navigate('hub')} onNavigate={navigate} />;
    if (route === 'missioncontrol') {
      return (
        <Suspense fallback={<div className="loading-text">Cargando Mission Control...</div>}>
          <MissionControl onBack={() => navigate('hub')} onNavigate={navigate} />
        </Suspense>
      );
    }
    if (route === 'mysticquest') return <MysticQuestView onBack={() => navigate('hub')} onNavigate={navigate} />;
    if (route === 'controltower') {
      return (
        <Suspense fallback={<div className="loading-text">Cargando Control Tower...</div>}>
          <ControlTower onBack={() => navigate('hub')} onNavigate={navigate} />
        </Suspense>
      );
    }
    if (route === 'admin') return <AdminPanel onBack={() => navigate('hub')} />;
    if (route === 'docs') return <Docs onBack={() => navigate('hub')} />;
    return <Hub onNavigate={navigate} />;
  })();

  return (
    <AppShell routeId={route} onNavigate={navigate}>
      {shellContent}
    </AppShell>
  );
}
