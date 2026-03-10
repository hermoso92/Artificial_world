
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import StickyNavbar from './StickyNavbar.jsx';
import BreadcrumbNav from './BreadcrumbNav.jsx';
import { Globe, Github, Twitter, Mail } from 'lucide-react';

const AppLayout = ({ children }) => {
  const location = useLocation();
  
  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path === '/') return [];
    
    const crumbs = [{ label: 'Hub', path: '/hub' }];
    
    if (path === '/games') crumbs.push({ label: 'Arena de Minijuegos', path: '/games' });
    if (path === '/fire') crumbs.push({ label: 'FireSimulator', path: '/fire' });
    if (path === '/simulation') crumbs.push({ label: 'Constructor de Mundos', path: '/simulation' });
    if (path === '/paper') crumbs.push({ label: 'Paper', path: '/paper' });
    if (path === '/dobacksoft') crumbs.push({ label: 'DobackSoft 3D', path: '/dobacksoft' });
    
    return crumbs;
  };

  const isHome = location.pathname === '/';
  const is3DExperience = location.pathname === '/dobacksoft';

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-300">
      <StickyNavbar />
      
      <div className={`flex-grow flex flex-col ${is3DExperience ? 'pt-0' : 'pt-20'}`}>
        {!isHome && !is3DExperience && <BreadcrumbNav items={getBreadcrumbs()} />}
        <main id="main-content" className="flex-grow flex flex-col w-full" tabIndex={-1}>
          {children}
        </main>
      </div>

      {!is3DExperience && (
        <footer className="bg-slate-900 border-t border-slate-800 py-12 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-accent-amber/10 flex items-center justify-center border border-accent-amber/20">
                    <Globe className="w-5 h-5 text-accent-amber" />
                  </div>
                  <span className="font-extrabold text-xl tracking-tighter text-white">Artificial World</span>
                </div>
                <p className="text-slate-300 text-sm max-w-sm leading-relaxed mb-6">
                  Ecosistema de simulación determinista y agentes autónomos. Construyendo inteligencia observable y auditable.
                </p>
                <div className="flex gap-4">
                  <a href="https://github.com/hermoso92/Artificial_world" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-accent-amber transition-colors" aria-label="GitHub">
                    <Github className="w-5 h-5" />
                  </a>
                  <a href="https://twitter.com/artificialworld" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-accent-amber transition-colors" aria-label="Twitter">
                    <Twitter className="w-5 h-5" />
                  </a>
                  <a href="mailto:hello@artificialworld.es" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-accent-amber transition-colors" aria-label="Email">
                    <Mail className="w-5 h-5" />
                  </a>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-white mb-4">Navegación</h4>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li><Link to="/hub" className="hover:text-accent-amber transition-colors focus-visible:ring-2 focus-visible:ring-accent-amber rounded-sm outline-none">Hub Central</Link></li>
                  <li><Link to="/simulation" className="hover:text-accent-amber transition-colors focus-visible:ring-2 focus-visible:ring-accent-amber rounded-sm outline-none">Constructor de Mundos</Link></li>
                  <li><Link to="/games" className="hover:text-accent-amber transition-colors focus-visible:ring-2 focus-visible:ring-accent-amber rounded-sm outline-none">Arena de Minijuegos</Link></li>
                  <li><Link to="/dobacksoft" className="hover:text-accent-amber transition-colors focus-visible:ring-2 focus-visible:ring-accent-amber rounded-sm outline-none">DobackSoft 3D</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-white mb-4">Recursos</h4>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li><Link to="/paper" className="hover:text-accent-amber transition-colors focus-visible:ring-2 focus-visible:ring-accent-amber rounded-sm outline-none">Scientific Paper</Link></li>
                  <li><a href="https://github.com/hermoso92/Artificial_world" target="_blank" rel="noopener noreferrer" className="hover:text-accent-amber transition-colors focus-visible:ring-2 focus-visible:ring-accent-amber rounded-sm outline-none flex items-center gap-1">GitHub Repo <Github className="w-3 h-3" /></a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
              <p>© {new Date().getFullYear()} Artificial World by Hermoso92. Open Source.</p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default AppLayout;
