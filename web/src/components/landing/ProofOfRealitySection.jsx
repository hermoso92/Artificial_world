
import React from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CheckCircle2, PlayCircle, Clock } from 'lucide-react';

const ProofOfRealitySection = () => {
  const items = {
    real: [
      { name: "Simulación reproducible", desc: "Si usas los mismos datos iniciales, siempre obtendrás el mismo resultado. Nada de azar oculto." },
      { name: "Agentes colaborativos", desc: "Entidades que toman decisiones basadas en objetivos claros y reglas que tú defines." },
      { name: "Semillas de civilización", desc: "Arquetipos y plantillas listas para usar y modificar rápidamente." }
    ],
    demo: [
      { name: "Constructor de mundos", desc: "Interfaz visual para crear y configurar tus simulaciones sin escribir código." },
      { name: "FireSimulator", desc: "Una demostración interactiva de cómo se propagan elementos en un entorno." },
      { name: "Arena de minijuegos", desc: "Entornos de prueba lógicos para ver a los agentes en acción." }
    ],
    roadmap: [
      { name: "Interfaz 3D", desc: "Visualización inmersiva de los mundos que has creado." },
      { name: "Multijugador", desc: "Colabora con otros usuarios en tiempo real para construir simulaciones." },
      { name: "Guardado en la nube", desc: "Tus mundos persistentes y accesibles desde cualquier lugar." }
    ]
  };

  const Card = ({ item, icon: Icon, colorClass }) => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-card p-6 rounded-xl border border-border flex flex-col gap-3 hover:border-primary/30 transition-colors shadow-sm"
    >
      <div className="flex items-center gap-3 mb-2">
        <Icon className={`w-5 h-5 ${colorClass}`} />
        <h4 className="font-bold text-lg text-foreground leading-tight">{item.name}</h4>
      </div>
      <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
    </motion.div>
  );

  return (
    <section id="proof" className="py-24 bg-secondary/20 border-y border-border w-full">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground mb-6">
            Estado del proyecto
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transparencia total sobre lo que ya puedes usar y lo que estamos construyendo.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Tabs defaultValue="real" className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="bg-background border border-border p-1 h-auto flex-wrap justify-center gap-1">
                <TabsTrigger value="real" className="text-sm md:text-base py-2 px-4 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                  Lo que ya existe
                </TabsTrigger>
                <TabsTrigger value="demo" className="text-sm md:text-base py-2 px-4 data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-400">
                  Lo que puedes probar
                </TabsTrigger>
                <TabsTrigger value="roadmap" className="text-sm md:text-base py-2 px-4 data-[state=active]:bg-muted data-[state=active]:text-foreground">
                  Lo que viene
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="real" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              <div className="grid md:grid-cols-3 gap-6">
                {items.real.map((item, idx) => (
                  <Card key={idx} item={item} icon={CheckCircle2} colorClass="text-success" />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="demo" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              <div className="grid md:grid-cols-3 gap-6">
                {items.demo.map((item, idx) => (
                  <Card key={idx} item={item} icon={PlayCircle} colorClass="text-blue-400" />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="roadmap" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              <div className="grid md:grid-cols-3 gap-6">
                {items.roadmap.map((item, idx) => (
                  <Card key={idx} item={item} icon={Clock} colorClass="text-muted-foreground" />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </section>
  );
};

export default ProofOfRealitySection;
