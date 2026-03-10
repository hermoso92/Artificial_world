
import React from 'react';
import { Navigate, Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop.jsx';
import HomePage from '@/pages/HomePage.jsx';
import PaperPage from '@/pages/PaperPage.jsx';
import HubPage from '@/pages/HubPage.jsx';
import GamesPage from '@/pages/GamesPage.jsx';
import FireSimulator from '@/components/FireSimulator.jsx';

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/landing" element={<Navigate to="/" replace />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/paper" element={<PaperPage />} />
        <Route path="/hub" element={<HubPage />} />
        <Route path="/games" element={<GamesPage />} />
        <Route path="/games/:gameId" element={<GamesPage />} />
        <Route path="/demos" element={<Navigate to="/hub" replace />} />
        <Route path="/fire" element={<FireSimulator />} />
      </Routes>
    </Router>
  );
}

export default App;
