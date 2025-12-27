import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import WatchShowcaseSection from "@/components/WatchShowcaseSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Ace-Stats | Wearable Tennis Performance - Estatísticas de Tênis no seu Smartwatch</title>
        <meta 
          name="description" 
          content="Registre suas partidas de tênis direto do seu smartwatch WearOS. Analise winners, erros, break points e evolua seu jogo com estatísticas detalhadas." 
        />
        <meta name="keywords" content="tênis, tennis, estatísticas, wearos, smartwatch, android, ace stats, tennis stats" />
        <link rel="canonical" href="https://ace-stats.com" />
      </Helmet>

      <main className="min-h-screen">
        <Navbar />
        <HeroSection />
        <FeaturesSection />
        <WatchShowcaseSection />
        <HowItWorksSection />
        <CTASection />
        <Footer />
      </main>
    </>
  );
};

export default Index;
