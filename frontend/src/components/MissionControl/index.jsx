/**
 * Mission Control — TenacitOS-inspired dashboard for Artificial World.
 * Tab layout: Overview | Agents | Activity | System | Audit
 */
import { useState } from 'react';
import { useRealtimeSimulation } from '../../hooks/useRealtimeSimulation';
import { MCOverview } from './MCOverview.jsx';
import { MCAgentDashboard } from './MCAgentDashboard.jsx';
import { DetectionBanner } from '../DetectionBanner.jsx';
import { MCActivityFeed } from './MCActivityFeed.jsx';
import { MCSystemMonitor } from './MCSystemMonitor.jsx';
import { MCAuditLog } from './MCAuditLog.jsx';
import './mc.css';

const TABS = [
  { id: 'overview', label: 'Resumen' },
  { id: 'agents', label: 'Agentes' },
  { id: 'activity', label: 'Actividad' },
  { id: 'system', label: 'Sistema' },
  { id: 'audit', label: 'Auditoría' },
];

export function MissionControl({ onBack }) {
  const [activeTab, setActiveTab] = useState('overview');
  const { connected } = useRealtimeSimulation();

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <MCOverview />;
      case 'agents':
        return <MCAgentDashboard />;
      case 'activity':
        return <MCActivityFeed />;
      case 'system':
        return <MCSystemMonitor />;
      case 'audit':
        return <MCAuditLog />;
      default:
        return <MCOverview />;
    }
  };

  return (
    <div className="mc">
      <header className="mc-header">
        <div className="mc-header-left">
          {onBack && (
            <button type="button" className="back-btn" onClick={onBack} aria-label="Volver">
              ← Volver
            </button>
          )}
          <div>
            <h1 className="mc-title">Mission Control</h1>
            <div className="mc-subtitle">Artificial World · Dashboard</div>
          </div>
        </div>
        <nav className="mc-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`mc-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="mc-content">
        <DetectionBanner wsConnected={connected} />
        {renderContent()}
      </main>
    </div>
  );
}
