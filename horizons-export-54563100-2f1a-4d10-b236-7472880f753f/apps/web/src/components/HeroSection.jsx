
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowDown, Play, Github, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';

const HeroSection = () => {
  const scrollToSimulator = () => {
    const el = document.getElementById('simulator');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToConcepto = () => {
    const el = document.getElementById('concepto');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative w-full h-full flex items-center justify-center overflow-hidden bg-background">
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,212,255,0.08)_0%,transparent_60%)]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/95 to-background"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-mono mb-8 shadow-[0_0_15px_rgba(0,212,255,0.15)]"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            Entrada pública del ecosistema
          </motion.div>

          <motion.h1 
            className="text-5xl sm:text-7xl lg:text-8xl font-extrabold tracking-tighter text-foreground leading-[1.1] mb-4 drop-shadow-2xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          >
            Artificial World
          </motion.h1>
          
          <motion.h2
            className="text-2xl sm:text-3xl text-primary font-bold tracking-tight mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Hub, paper, repositorio y superficies verificables en esta build
          </motion.h2>

          <motion.p
            className="text-lg sm:text-xl text-secondary mb-12 leading-relaxed max-w-2xl mx-auto font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            Esta web muestra una puerta de entrada honesta a Artificial World. Aquí puedes recorrer el Hub, abrir la Arena, consultar el paper y ver demos ilustrativas, pero no sustituye a la aplicación completa ni al motor principal del proyecto.
          </motion.p>

          <motion.div 
            className="flex flex-wrap items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <Link to="/hub">
              <Button 
                size="lg" 
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-8 text-lg font-bold shadow-[0_0_20px_rgba(0,212,255,0.3)] hover:shadow-[0_0_30px_rgba(0,212,255,0.5)] transition-all duration-300"
                aria-label="Entrar al Hub"
              >
                <LayoutGrid className="w-5 h-5 mr-2" aria-hidden="true" /> Abrir Hub
              </Button>
            </Link>
            <Button 
              size="lg" 
              className="h-14 px-8 text-lg font-bold transition-all duration-300"
              variant="outline"
              onClick={scrollToSimulator}
              aria-label="Explore the Simulation"
            >
              <Play className="w-5 h-5 mr-2" aria-hidden="true" /> Ver simulación visible
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-border text-foreground hover:bg-white/5 h-14 px-8 text-lg font-bold transition-all duration-300"
              onClick={() => window.open('https://github.com/hermoso92/Artificial_world', '_blank')}
              aria-label="View on GitHub"
            >
              <Github className="w-5 h-5 mr-2" aria-hidden="true" /> GitHub
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.button 
        onClick={scrollToConcepto}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-secondary flex flex-col items-center gap-2 hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md p-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1 }}
        aria-label="Scroll to Concept section"
      >
        <span className="text-xs tracking-widest uppercase font-bold">Discover</span>
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          <ArrowDown className="w-5 h-5 text-primary" aria-hidden="true" />
        </motion.div>
      </motion.button>
    </section>
  );
};

export default HeroSection;
