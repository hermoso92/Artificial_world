
import React from 'react';
import { Github, Lock } from 'lucide-react';
import StatusBadge from './StatusBadge.jsx';

const ComingSoonSurface = ({ title, description, status, repoLink }) => {
  return (
    <div className="bg-slate-900 rounded-xl p-6 border border-slate-700 shadow-lg h-full flex flex-col relative overflow-hidden group">
      <div className="absolute inset-0 bg-slate-950/60 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[2px]">
        <div className="bg-slate-800 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 border border-slate-600 shadow-xl">
          <Lock className="w-4 h-4 text-accent-amber" /> En desarrollo
        </div>
      </div>
      <div className="flex justify-between items-start mb-4 relative z-0">
        <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700 opacity-50">
          <Lock className="w-6 h-6 text-slate-400" />
        </div>
        <StatusBadge status={status} />
      </div>
      <h3 className="text-xl font-bold text-white mb-2 relative z-0">{title}</h3>
      <p className="text-slate-300 text-sm flex-grow mb-6 leading-relaxed relative z-0">{description}</p>
      {repoLink && (
        <a href={repoLink} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm font-bold text-slate-400 hover:text-white transition-colors relative z-20 w-fit">
          <Github className="w-4 h-4 mr-2" /> Ver progreso en GitHub
        </a>
      )}
    </div>
  );
};

export default ComingSoonSurface;
