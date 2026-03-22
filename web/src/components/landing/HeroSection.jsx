
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, FileText, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const HeroSection = () => {
  return (
    <section id="hero" className="relative w-full min-h-[100svh] flex items-center justify-center overflow-hidden pt-20">
      {/* Background Image & Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1695859865368-ccd10c435ba6")' }}
        aria-hidden="true"
      ></div>
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-background/80 via-background/90 to-background"></div>
      
      {/* Subtle animated grid/particles effect could go here, using a simple radial gradient for now */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(212,165,116,0.08)_0%,transparent_60%)]"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8"
          >
            <Sparkles className="w-4 h-4" />
            <span>Construcción colaborativa con IA</span>
          </motion.div>

          <motion.h1 
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tighter text-foreground leading-[1.1] mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          >
            Crea tu propio mundo digital <br className="hidden sm:block" />
            <span className="text-primary glow-amber-text">con ayuda de IA</span>
          </motion.h1>
          
          <motion.p
            className="text-lg sm:text-xl text-muted-foreground mb-10 leading-relaxed max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            Tú aportas la idea. Nuestros agentes de IA colaboran contigo para pensar, estructurar y construir tu visión paso a paso, sin necesidad de saber programar.
          </motion.p>

          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <Button 
              asChild
              size="lg" 
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-8 text-lg font-bold w-full sm:w-auto shadow-[0_0_20px_rgba(212,165,116,0.2)] hover:shadow-[0_0_30px_rgba(212,165,116,0.4)] transition-all duration-300"
            >
              <Link to="/">
                Crear mi primer mundo <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button 
              asChild
              size="lg" 
              variant="outline"
              className="border-border text-foreground hover:bg-secondary h-14 px-8 text-lg font-bold w-full sm:w-auto transition-all duration-300"
            >
              <Link to="/paper">
                <FileText className="w-5 h-5 mr-2" /> Leer el Paper
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
