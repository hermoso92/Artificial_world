
import React from 'react';

const VisionSection = () => {
  return (
    <section className="py-24 bg-secondary/20 border-t border-border w-full">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground mb-10">
          La Visión
        </h2>
        
        <div className="space-y-8 text-lg md:text-xl text-muted-foreground leading-relaxed text-left">
          <p>
            Imaginamos un futuro donde la inteligencia artificial no sea un oráculo inescrutable, sino un <strong className="text-foreground">universo de inteligencias observables</strong>. Mundos simulados donde comunidades enteras puedan auditar, comprender y colaborar en la evolución de sistemas complejos.
          </p>
          <p>
            Artificial World es el primer paso hacia sistemas verificables aplicables en la ciencia, la gobernanza, la economía y la educación. Al hacer que el comportamiento emergente sea determinista y reproducible, transformamos la IA de una herramienta de consumo a un instrumento de descubrimiento científico.
          </p>
          <p className="text-center text-primary font-medium italic mt-12">
            "Construimos mundos para entender el nuestro."
          </p>
        </div>
      </div>
    </section>
  );
};

export default VisionSection;
