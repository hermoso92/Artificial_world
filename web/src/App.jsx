
import React, { useEffect } from 'react';
import { Route, Routes, BrowserRouter as Router, Navigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop.jsx';
import AppLayout from '@/components/AppLayout.jsx';
import HomePage from '@/pages/HomePage.jsx';
import HubPage from '@/pages/HubPage.jsx';
import GamesPage from '@/pages/GamesPage.jsx';
import FireSimulatorPage from '@/pages/FireSimulatorPage.jsx';
import SimulationPage from '@/pages/SimulationPage.jsx';
import PaperPage from '@/pages/PaperPage.jsx';
import DobacksoftPage from '@/pages/DobacksoftPage.jsx';

const RedirectToGitHub = () => {
  useEffect(() => {
    window.location.href = 'https://github.com/hermoso92/Artificial_world';
  }, []);
  return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-accent-amber font-bold">Redirigiendo a GitHub...</div>;
};

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* HomePage has its own Navbar and Footer, so it should NOT be wrapped in AppLayout */}
        <Route path="/" element={<HomePage />} />
        
        {/* Ecosystem pages are wrapped in AppLayout for consistent internal navigation */}
        <Route path="/hub" element={<AppLayout><HubPage /></AppLayout>} />
        <Route path="/games" element={<AppLayout><GamesPage /></AppLayout>} />
        <Route path="/fire" element={<AppLayout><FireSimulatorPage /></AppLayout>} />
        <Route path="/simulation" element={<AppLayout><SimulationPage /></AppLayout>} />
        <Route path="/paper" element={<AppLayout><PaperPage /></AppLayout>} />
        
        {/* DobackSoft 3D Experience has its own full-screen layout */}
        <Route path="/dobacksoft" element={<AppLayout><DobacksoftPage /></AppLayout>} />
        
        <Route path="/landing" element={<Navigate to="/" replace />} />
        <Route path="/repo" element={<RedirectToGitHub />} />
      </Routes>
    </Router>
  );
}

export default App;
