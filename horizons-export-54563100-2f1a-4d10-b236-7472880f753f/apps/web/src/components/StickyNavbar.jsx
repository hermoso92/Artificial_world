
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Github, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const StickyNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('#hero');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Intersection Observer for active section highlighting
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(`#${entry.target.id}`);
        }
      });
    }, { threshold: 0.3, rootMargin: "-100px 0px -100px 0px" });

    const sectionIds = ['hero', 'concepto', 'ecosistema', 'simulator', 'docs', 'repositorio'];
    sectionIds.forEach(id => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  const navLinks = [
    { name: 'Inicio', href: '#hero', isHash: true },
    { name: 'Hub', href: '/hub', isHash: false },
    { name: 'Arena', href: '/games', isHash: false },
    { name: 'Concepto', href: '#concepto', isHash: true },
    { name: 'Ecosistema', href: '#ecosistema', isHash: true },
    { name: 'Simulador', href: '#simulator', isHash: true },
    { name: 'Documentación', href: '#docs', isHash: true },
    { name: 'Repositorio', href: '#repositorio', isHash: true }
  ];

  const handleNavClick = (e, link) => {
    setMobileMenuOpen(false);
    if (link.isHash) {
      e.preventDefault();
      if (location.pathname !== '/') {
        navigate(`/${link.href}`);
        window.setTimeout(() => {
          const element = document.querySelector(link.href);
          if (element) element.scrollIntoView({ behavior: 'smooth' });
        }, 120);
        return;
      }
      const element = document.querySelector(link.href);
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleHomeClick = (e) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (location.pathname !== '/') {
      navigate('/');
      return;
    }

    const element = document.querySelector('#hero');
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass py-3' : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a 
            href="/" 
            onClick={handleHomeClick}
            className="flex items-center gap-3 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
            aria-label="Go to Home"
          >
            <div className="relative flex h-3 w-3" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary glow-cyan"></span>
            </div>
            <span className="font-extrabold text-xl tracking-tighter text-foreground">Artificial World</span>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-6" aria-label="Main Navigation">
            {navLinks.map((link) => {
              const isActive = link.isHash ? activeSection === link.href : location.pathname === link.href;
              return link.isHash ? (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link)}
                  aria-label={`Navigate to ${link.name}`}
                  aria-current={isActive ? 'page' : undefined}
                  className={`text-sm font-bold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md px-2 py-1 ${
                    isActive ? 'text-primary glow-cyan-text' : 'text-secondary hover:text-primary'
                  }`}
                >
                  {link.name}
                </a>
              ) : (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label={`Navigate to ${link.name}`}
                  aria-current={isActive ? 'page' : undefined}
                  className={`text-sm font-bold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md px-2 py-1 ${
                    isActive ? 'text-primary glow-cyan-text' : 'text-secondary hover:text-primary'
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
              variant="outline" 
              className="hidden md:flex border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground transition-all glow-cyan focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background font-bold"
              onClick={() => window.open('https://github.com/hermoso92/Artificial_world', '_blank')}
              aria-label="View GitHub Repository"
            >
              GitHub <Github className="ml-2 w-4 h-4" aria-hidden="true" />
            </Button>
            <button 
              className="md:hidden text-foreground p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
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
            className="md:hidden absolute top-full left-0 right-0 glass border-t border-border overflow-hidden"
          >
            <nav className="p-4 flex flex-col gap-4" aria-label="Mobile Navigation">
              {navLinks.map((link) => {
                const isActive = link.isHash ? activeSection === link.href : location.pathname === link.href;
                return link.isHash ? (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link)}
                    aria-label={`Navigate to ${link.name}`}
                    aria-current={isActive ? 'page' : undefined}
                    className={`text-base font-bold p-3 rounded-md transition-colors ${
                      isActive ? 'text-primary bg-primary/10' : 'text-foreground hover:text-primary hover:bg-white/5'
                    }`}
                  >
                    {link.name}
                  </a>
                ) : (
                  <Link
                    key={link.name}
                    to={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label={`Navigate to ${link.name}`}
                    aria-current={isActive ? 'page' : undefined}
                    className={`text-base font-bold p-3 rounded-md transition-colors ${
                      isActive ? 'text-primary bg-primary/10' : 'text-foreground hover:text-primary hover:bg-white/5'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
              <Button 
                className="w-full bg-primary text-primary-foreground mt-2 font-bold"
                onClick={() => window.open('https://github.com/hermoso92/Artificial_world', '_blank')}
                aria-label="View GitHub Repository"
              >
                GitHub <Github className="ml-2 w-4 h-4" aria-hidden="true" />
              </Button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default StickyNavbar;
