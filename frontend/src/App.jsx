import { useState, useEffect } from 'react';
import { Hub } from './components/Hub';
import { SimulationView } from './components/SimulationView';
import { MinigamesLobby } from './components/MinigamesLobby';
import { DobackSoft } from './components/DobackSoft';
import { MissionControl } from './components/MissionControl';

// Valid routes: 'hub' | 'simulation' | 'minigames' | 'dobacksoft' | 'missioncontrol'
const VALID_ROUTES = ['hub', 'simulation', 'minigames', 'dobacksoft', 'missioncontrol'];

function getInitialRoute() {
  const hash = window.location.hash.replace('#', '');
  return VALID_ROUTES.includes(hash) ? hash : 'hub';
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

  if (route === 'simulation') return <SimulationView onBack={() => navigate('hub')} />;
  if (route === 'minigames')  return <MinigamesLobby onBack={() => navigate('hub')} />;
  if (route === 'dobacksoft') return <DobackSoft onBack={() => navigate('hub')} />;
  if (route === 'missioncontrol') return <MissionControl onBack={() => navigate('hub')} />;

  return <Hub onNavigate={navigate} />;
}
