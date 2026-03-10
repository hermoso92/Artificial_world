
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import StatusBadge from './StatusBadge.jsx';

const SurfaceCard = ({ title, description, status, icon: Icon, cta, link, disabled }) => {
  const CardContent = () => (
    <div className={`bg-slate-900 rounded-xl p-6 border border-slate-700 shadow-lg h-full flex flex-col transition-all duration-300 ${disabled ? 'opacity-75 grayscale' : 'hover:border-accent-amber/50 hover:shadow-accent-amber/10 hover:-translate-y-1'}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700">
          <Icon className="w-6 h-6 text-accent-amber" />
        </div>
        <StatusBadge status={status} />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-300 text-sm flex-grow mb-6 leading-relaxed">{description}</p>
      <div className={`flex items-center font-bold text-sm ${disabled ? 'text-slate-500' : 'text-accent-amber'}`}>
        {cta} {!disabled && <ArrowRight className="w-4 h-4 ml-2" />}
      </div>
    </div>
  );

  if (disabled || !link) {
    return <div className={disabled ? 'cursor-not-allowed' : 'cursor-pointer'}><CardContent /></div>;
  }
  
  return (
    <Link to={link} className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-amber rounded-xl">
      <CardContent />
    </Link>
  );
};

export default SurfaceCard;
