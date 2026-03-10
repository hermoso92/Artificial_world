import { MissionControlShell } from './features/MissionControlShell.jsx';
import './mc.css';

export function MissionControl({ onBack, onNavigate }) {
  return <MissionControlShell onBack={onBack} onNavigate={onNavigate} />;
}
