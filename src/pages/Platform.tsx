import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PlatformHero from "@/components/platform/PlatformHero";
import ProblemSection from "@/components/platform/ProblemSection";
import FeatureShowcase from "@/components/platform/FeatureShowcase";
import AceProHighlight from "@/components/platform/AceProHighlight";
import PricingSection from "@/components/platform/PricingSection";
import FAQSection from "@/components/platform/FAQSection";
import FinalCTA from "@/components/platform/FinalCTA";

const Platform = () => {
  return (
    <>
      <Helmet>
        <title>Ace-Stats Platform | Analytics para Tenistas</title>
        <meta
          name="description"
          content="Plataforma de analytics para tenistas amadores e de clube. Registre partidas ilimitadas grátis e desbloqueie insights com Ace Pro."
        />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Navbar />
        <PlatformHero />
        <ProblemSection />
        <FeatureShowcase />
        <AceProHighlight />
        <PricingSection />
        <FAQSection />
        <FinalCTA />
        <Footer />
      </div>
    </>
  );
};

export default Platform;
