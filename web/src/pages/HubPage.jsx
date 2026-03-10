
import React from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Globe, Gamepad2, Flame, Box } from 'lucide-react';
import SurfaceCard from '@/components/SurfaceCard.jsx';
import ComingSoonSurface from '@/components/ComingSoonSurface.jsx';

const HubPage = () => {
  const activeSurfaces = [
    {
      title: 'Constructor de Mundos',
      description: 'Simulación determinista 2D de agentes autónomos. Configura semillas y observa el comportamiento emergente.',
      status: 'DEMO',
      icon: Globe,
      cta: 'Abrir Simulador',
      link: '/simulation',
      disabled: false
    },
    {
      title: 'DobackSoft 3D',
      description: 'Explore in 3D - Choose your vehicle and explore a beautiful 3D world with physics and dynamic cameras.',
      status: 'REAL',
      icon: Box,
      cta: 'Entrar al 3D',
      link: '/dobacksoft',
      disabled: false
    },
    {
      title: 'Arena de Minijuegos',
      description: 'Entornos de prueba lógicos aislados. Observa cómo los agentes resuelven juegos clásicos.',
      status: 'DEMO',
      icon: Gamepad2,
      cta: 'Entrar a la Arena',
      link: '/games',
      disabled: false
    },
    {
      title: 'FireSimulator',
      description: 'Simulación de propagación de elementos en un entorno 2D con reglas físicas estrictas.',
      status: 'DEMO',
      icon: Flame,
      cta: 'Ver Simulación',
      link: '/fire',
      disabled: false
    }
  ];

  const comingSoonSurfaces = [
    {
      title: 'Mission Control',
      description: 'Centro de control para gestionar múltiples simulaciones y analizar telemetría en tiempo real.',
      status: 'PARCIAL',
      repoLink: 'https://github.com/hermoso92/Artificial_world'
    },
    {
      title: 'Mystic Quest',
      description: 'Aventura narrativa en mundos artificiales. Capa RPG construida sobre el motor determinista.',
      status: 'PARCIAL',
      repoLink: 'https://github.com/hermoso92/Artificial_world'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="w-full py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-slate-950 min-h-screen">
      <Helmet>
        <title>Hub del Ecosistema | Artificial World</title>
        <meta name="description" content="Explora las diferentes superficies y simulaciones del ecosistema Artificial World." />
      </Helmet>

      <div className="text-center mb-16">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4"
        >
          Artificial World — <span className="text-accent-amber">Ecosistema</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-slate-300"
        >
          Elige una superficie para explorar
        </motion.p>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {/* Active Surfaces */}
        {activeSurfaces.map((surface, idx) => (
          <motion.div key={`active-${idx}`} variants={itemVariants}>
            <SurfaceCard {...surface} />
          </motion.div>
        ))}

        {/* Coming Soon Surfaces */}
        {comingSoonSurfaces.map((surface, idx) => (
          <motion.div key={`soon-${idx}`} variants={itemVariants}>
            <ComingSoonSurface {...surface} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default HubPage;
