
import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import HeroSection from '@/components/landing/HeroSection.jsx';
import WhatIsSection from '@/components/landing/WhatIsSection.jsx';
import WhyDifferentSection from '@/components/landing/WhyDifferentSection.jsx';
import HowItWorksSection from '@/components/landing/HowItWorksSection.jsx';
import ProofOfRealitySection from '@/components/landing/ProofOfRealitySection.jsx';
import RefugeSection from '@/components/landing/RefugeSection.jsx';
import PaperSection from '@/components/landing/PaperSection.jsx';
import VisionSection from '@/components/landing/VisionSection.jsx';
import FinalCTASection from '@/components/landing/FinalCTASection.jsx';

const LandingPage = () => {
  useEffect(() => {
    document.documentElement.classList.add('dark', 'scroll-smooth');
    return () => {
      document.documentElement.classList.remove('scroll-smooth');
    };
  }, []);

  return (
    <div className="w-full bg-background text-foreground flex flex-col">
      <Helmet>
        <title>Artificial World - Crea tu propio mundo digital con IA</title>
        <meta name="description" content="Tú aportas la idea. Nuestros agentes de IA colaboran contigo para pensar, estructurar y construir tu visión sin necesidad de programar." />
      </Helmet>

      <div className="flex-grow flex flex-col w-full">
        <HeroSection />
        <WhatIsSection />
        <WhyDifferentSection />
        <HowItWorksSection />
        <ProofOfRealitySection />
        <RefugeSection />
        <PaperSection />
        <VisionSection />
        <FinalCTASection />
      </div>
    </div>
  );
};

export default LandingPage;
