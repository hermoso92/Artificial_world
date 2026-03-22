
import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, LayoutGrid } from 'lucide-react';

const EcosystemNav = () => (
  <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2 font-extrabold text-foreground hover:text-primary transition-colors">
        <span className="w-2 h-2 rounded-full bg-primary" />
        Artificial World
      </Link>
      <nav className="flex items-center gap-4">
        <Link to="/hub" className="text-sm font-bold text-secondary hover:text-primary transition-colors flex items-center gap-1">
          <LayoutGrid className="w-4 h-4" /> Hub
        </Link>
        <Link to="/games" className="text-sm font-bold text-secondary hover:text-primary transition-colors">
          Arena
        </Link>
        <Link to="/paper" className="text-sm font-bold text-secondary hover:text-primary transition-colors flex items-center gap-1">
          <FileText className="w-4 h-4" /> Paper
        </Link>
        <Link to="/" className="text-sm font-bold text-secondary hover:text-primary transition-colors">
          Inicio
        </Link>
      </nav>
    </div>
  </header>
);

export default EcosystemNav;
