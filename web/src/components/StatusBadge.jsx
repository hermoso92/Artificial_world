
import React from 'react';

const StatusBadge = ({ status }) => {
  const getStatusConfig = (s) => {
    switch(s) {
      case 'REAL': 
        return { bg: 'bg-accent-green/20', text: 'text-accent-green', border: 'border-accent-green/50' };
      case 'DEMO': 
        return { bg: 'bg-accent-blue/20', text: 'text-accent-blue', border: 'border-accent-blue/50' };
      case 'PARCIAL': 
        return { bg: 'bg-accent-amber/20', text: 'text-accent-amber', border: 'border-accent-amber/50' };
      case 'ROADMAP': 
        return { bg: 'bg-slate-700', text: 'text-slate-300', border: 'border-slate-500' };
      default: 
        return { bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-600' };
    }
  };
  
  const config = getStatusConfig(status);
  
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${config.bg} ${config.text} ${config.border}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
