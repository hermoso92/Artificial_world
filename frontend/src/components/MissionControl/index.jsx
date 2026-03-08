/**
 * Observatorio — Mira tu mundo desde arriba.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRealtimeSimulation } from '../../hooks/useRealtimeSimulation';
import { MCOverview } from './MCOverview.jsx';
import { MCAgentDashboard } from './MCAgentDashboard.jsx';
import { DetectionBanner } from '../DetectionBanner.jsx';
import { MCActivityFeed } from './MCActivityFeed.jsx';
import { MCSystemMonitor } from './MCSystemMonitor.jsx';
import { MCAuditLog } from './MCAuditLog.jsx';
import { MCLiveLog } from './MCLiveLog.jsx';
import './mc.css';

export function MissionControl({ onBack, onNavigate }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const { connected } = useRealtimeSimulation();

  const TABS = [
    { id: 'overview', label: t('missioncontrol.tab_overview') },
    { id: 'agents', label: t('missioncontrol.tab_agents') },
    { id: 'activity', label: t('missioncontrol.tab_activity') },
    { id: 'system', label: t('missioncontrol.tab_system') },
    { id: 'audit', label: t('missioncontrol.tab_audit') },
    { id: 'logs', label: t('missioncontrol.tab_logs') },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <MCOverview onEnterSimulation={() => onNavigate?.('simulation')} />;
      case 'agents':
        return <MCAgentDashboard />;
      case 'activity':
        return <MCActivityFeed />;
      case 'system':
        return <MCSystemMonitor />;
      case 'audit':
        return <MCAuditLog />;
      case 'logs':
        return <MCLiveLog />;
      default:
        return <MCOverview />;
    }
  };

  return (
    <div className="mc">
      <header className="mc-header">
        <div className="mc-header-left">
          {onBack && (
            <button type="button" className="back-btn" onClick={onBack} aria-label={t('missioncontrol.back')}>
              {t('missioncontrol.back')}
            </button>
          )}
          <div>
            <h1 className="mc-title">{t('missioncontrol.title')}</h1>
            <div className="mc-subtitle">{t('missioncontrol.subtitle')}</div>
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
