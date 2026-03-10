
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Github, Menu, X, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';

const StickyNavbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Inicio', path: '/' },
    { name: 'Hub', path: '/hub' },
    { name: 'Constructor', path: '/simulation' },
    { name: 'Arena', path: '/games' },
    { name: 'DobackSoft 3D', path: '/dobacksoft' },
    { name: 'Paper', path: '/paper' }
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-slate-950/90 backdrop-blur-lg border-b border-slate-800 shadow-lg py-3' : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-2 cursor-pointer focus:outline-none group"
            aria-label="Ir a la página de inicio"
          >
            <div className="w-8 h-8 rounded-lg bg-accent-amber/10 flex items-center justify-center border border-accent-amber/20 group-hover:bg-accent-amber/20 transition-colors">
              <Globe className="w-5 h-5 text-accent-amber" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white">Artificial World</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Navegación principal">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  aria-current={isActive ? 'page' : undefined}
                  className={`text-sm font-bold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-amber rounded-md px-2 py-1 ${
                    isActive ? 'text-accent-amber' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* CTA & Mobile Toggle */}
          <div className="flex items-center gap-4">
            <Button 
              asChild
              variant="outline" 
              className="hidden md:flex border-slate-700 text-white hover:bg-slate-800 transition-all font-bold"
            >
              <a href="https://github.com/hermoso92/Artificial_world" target="_blank" rel="noopener noreferrer" aria-label="Ver repositorio en GitHub">
                Código <Github className="ml-2 w-4 h-4" aria-hidden="true" />
              </a>
            </Button>
            <button 
              className="md:hidden text-white p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-amber rounded-md"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
            >
              {mobileMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden absolute top-full left-0 right-0 bg-slate-950 border-b border-slate-800 overflow-hidden shadow-xl"
          >
            <nav className="p-4 flex flex-col gap-4" aria-label="Navegación móvil">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`text-base font-bold p-3 rounded-md transition-colors ${
                      isActive ? 'text-accent-amber bg-accent-amber/10' : 'text-white hover:text-accent-amber hover:bg-slate-900'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
              <Button 
                asChild
                className="w-full bg-accent-amber text-slate-950 hover:bg-accent-amber/90 mt-2 font-bold"
              >
                <a href="https://github.com/hermoso92/Artificial_world" target="_blank" rel="noopener noreferrer" aria-label="Ver repositorio en GitHub">
                  Código <Github className="ml-2 w-4 h-4" aria-hidden="true" />
                </a>
              </Button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default StickyNavbar;
