
import React from 'react';
import { motion } from 'framer-motion';

const RefugeSection = () => {
  return (
    <section className="relative py-32 w-full overflow-hidden flex items-center justify-center min-h-[80vh]">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1683825094320-636dd592c0a0")' }}
        aria-hidden="true"
      ></div>
      
      {/* Gradient Overlays */}
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-background via-background/80 to-background/40"></div>
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-background via-transparent to-background"></div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        >
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-primary mb-8 glow-amber-text">
            El Refugio
          </h2>
          
          <div className="space-y-6 text-lg md:text-2xl text-foreground/90 font-medium leading-relaxed">
            <p>
              Más que un espacio en la memoria, es el santuario persistente donde la civilización comienza.
            </p>
            <p className="text-muted-foreground">
              Aquí, los agentes encuentran su identidad. Es el núcleo emocional y sistémico de Artificial World, el punto de anclaje donde los datos se convierten en historia, y las decisiones en legado.
            </p>
            <p>
              Un lugar seguro en un universo determinista.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default RefugeSection;
