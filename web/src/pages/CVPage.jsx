
import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import StickyNavbar from '@/components/StickyNavbar.jsx';
import CVSection from '@/components/CVSection.jsx';
import { Button } from '@/components/ui/button';
import { Download, Briefcase, GraduationCap, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const CVPage = () => {
  useEffect(() => {
    document.documentElement.classList.add('dark');
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground pt-24 pb-24">
      <Helmet>
        <title>Curriculum Vitae - Cosigein SL</title>
      </Helmet>
      <StickyNavbar />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" className="text-secondary hover:text-primary hover:bg-primary/10 -ml-4">
              <ArrowLeft className="w-4 h-4 mr-2" /> Volver al inicio
            </Button>
          </Link>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 bg-elevated p-8 rounded-2xl border border-border shadow-xl">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter mb-2">Perfil Profesional</h1>
            <p className="text-xl text-primary font-mono">Arquitecto de Sistemas & IA</p>
          </div>
          <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-cyan font-bold">
            <Download className="w-5 h-5 mr-2" /> Descargar PDF
          </Button>
        </div>

        <CVSection />

        <div className="grid md:grid-cols-2 gap-8 mt-12">
          <div className="glass p-8 rounded-2xl shadow-xl">
            <h3 className="text-2xl font-bold text-foreground mb-8 flex items-center gap-3 border-b border-border pb-4">
              <Briefcase className="text-primary w-6 h-6" /> Experiencia Destacada
            </h3>
            <div className="space-y-10">
              <div className="relative pl-8 border-l-2 border-primary/30">
                <div className="absolute w-4 h-4 bg-primary rounded-full -left-[9px] top-1 glow-cyan"></div>
                <h4 className="font-bold text-xl text-foreground">Fundador & Lead Architect</h4>
                <p className="text-primary text-sm font-mono mb-3 mt-1">Cosigein SL | 2024 - Presente</p>
                <p className="text-secondary leading-relaxed">Desarrollo de Artificial World y DobackSoft StabilSafe V3. Arquitectura de sistemas deterministas y motores de simulación. Implementación de telemetría a 100Hz.</p>
              </div>
              <div className="relative pl-8 border-l-2 border-border">
                <div className="absolute w-4 h-4 bg-elevated border-2 border-secondary rounded-full -left-[9px] top-1"></div>
                <h4 className="font-bold text-xl text-foreground">Senior Backend Engineer</h4>
                <p className="text-secondary text-sm font-mono mb-3 mt-1">Tech Corp | 2020 - 2024</p>
                <p className="text-secondary leading-relaxed">Liderazgo técnico en plataformas B2B de alta concurrencia. Optimización de bases de datos y despliegues CI/CD. Reducción de latencia en un 40%.</p>
              </div>
            </div>
          </div>

          <div className="glass p-8 rounded-2xl shadow-xl">
            <h3 className="text-2xl font-bold text-foreground mb-8 flex items-center gap-3 border-b border-border pb-4">
              <GraduationCap className="text-primary w-6 h-6" /> Formación
            </h3>
            <div className="space-y-10">
              <div className="relative pl-8 border-l-2 border-primary/30">
                <div className="absolute w-4 h-4 bg-primary rounded-full -left-[9px] top-1 glow-cyan"></div>
                <h4 className="font-bold text-xl text-foreground">Ingeniería Informática</h4>
                <p className="text-primary text-sm font-mono mb-3 mt-1">Universidad Politécnica | 2016 - 2020</p>
                <p className="text-secondary leading-relaxed">Especialización en Sistemas Inteligentes y Computación de Alto Rendimiento. Matrícula de honor en Algoritmia.</p>
              </div>
              <div className="relative pl-8 border-l-2 border-border">
                <div className="absolute w-4 h-4 bg-elevated border-2 border-secondary rounded-full -left-[9px] top-1"></div>
                <h4 className="font-bold text-xl text-foreground">Máster en IA Aplicada</h4>
                <p className="text-secondary text-sm font-mono mb-3 mt-1">Instituto Tecnológico | 2020 - 2021</p>
                <p className="text-secondary leading-relaxed">Tesis sobre sistemas multi-agente y funciones de utilidad en entornos de recursos limitados.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CVPage;
