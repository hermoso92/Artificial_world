
import React, { useEffect, useState } from 'react';
import { ArrowLeft, Keyboard, Map as MapIcon } from 'lucide-react';

export const ReturnButton = ({ onReturn }) => {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onReturn();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onReturn]);

  return (
    <button
      onClick={onReturn}
      className="absolute top-6 left-6 z-50 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md border border-slate-700 text-white px-4 py-2 rounded-lg font-bold hover:bg-accent-amber hover:text-slate-950 hover:border-accent-amber transition-all shadow-lg group"
    >
      <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
      <span>Back to Menu (ESC)</span>
    </button>
  );
};

export const ControlsHelp = () => {
  return (
    <div className="absolute bottom-6 left-6 z-50 bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-xl p-4 shadow-2xl text-sm text-slate-300 font-mono">
      <div className="flex items-center gap-2 text-accent-amber font-bold mb-3 border-b border-slate-700 pb-2">
        <Keyboard className="w-5 h-5" /> Controls
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
        <div><span className="text-white font-bold">W/A/S/D</span> Move</div>
        <div><span className="text-white font-bold">Mouse</span> Look</div>
        <div><span className="text-white font-bold">Shift</span> Sprint</div>
        <div><span className="text-white font-bold">Space</span> Jump</div>
      </div>
    </div>
  );
};

export const Minimap = () => {
  return (
    <div className="absolute top-6 right-6 z-50 bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-full w-48 h-48 shadow-2xl overflow-hidden flex items-center justify-center relative">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-accent-green to-transparent"></div>
      
      {/* Radar sweep effect */}
      <div className="absolute inset-0 border-4 border-accent-green/30 rounded-full"></div>
      <div className="absolute w-full h-[2px] bg-accent-green/20 top-1/2 -translate-y-1/2"></div>
      <div className="absolute h-full w-[2px] bg-accent-green/20 left-1/2 -translate-x-1/2"></div>
      
      {/* Player Dot (Updated via DOM in useFrame for performance) */}
      <div id="minimap-dot" className="absolute w-3 h-3 bg-accent-amber rounded-full shadow-[0_0_10px_rgba(251,191,36,1)] z-10 transition-transform duration-75">
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-b-[6px] border-l-transparent border-r-transparent border-b-accent-amber"></div>
      </div>

      <div className="absolute bottom-4 text-[10px] font-mono text-accent-green font-bold bg-slate-950/50 px-2 py-0.5 rounded">
        RADAR ONLINE
      </div>
    </div>
  );
};

export const Speedometer = () => {
  return (
    <div className="absolute bottom-6 right-6 z-50 bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-xl p-4 shadow-2xl min-w-[160px] text-center">
      <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Speed</div>
      <div className="text-4xl font-extrabold text-white font-mono flex items-baseline justify-center gap-1">
        <span id="speed-value">0</span>
        <span className="text-sm text-accent-amber">km/h</span>
      </div>
    </div>
  );
};

export const HealthBar = () => {
  return (
    <div className="absolute bottom-6 right-6 z-50 bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-xl p-4 shadow-2xl w-64">
      <div className="flex justify-between items-end mb-2">
        <div className="text-white font-bold">Tryndamere</div>
        <div className="text-accent-red font-mono text-sm font-bold">100 / 100</div>
      </div>
      <div className="w-full h-4 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
        <div className="h-full bg-accent-red w-full shadow-[0_0_10px_rgba(248,113,113,0.5)]"></div>
      </div>
      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800 mt-1">
        <div className="h-full bg-accent-amber w-full"></div>
      </div>
    </div>
  );
};
