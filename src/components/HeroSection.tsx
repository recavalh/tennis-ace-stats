import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ChevronDown, Watch, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";
import BetaAccessModal from "@/components/BetaAccessModal";

const HeroSection = () => {
  const { t } = useTranslation();
  const [betaModalOpen, setBetaModalOpen] = useState(false);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-tennis-green/10 rounded-full blur-[150px] animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-tennis-red/10 rounded-full blur-[150px] animate-pulse-slow" style={{ animationDelay: "2s" }} />
      
      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto">
        {/* Logo */}
        <div className="mb-8 animate-slide-up">
          <img 
            src={logo} 
            alt="Ace-Stats Logo" 
            className="w-32 h-32 md:w-40 md:h-40 mx-auto animate-float rounded-3xl"
          />
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6 animate-slide-up animate-delay-100">
          <Watch className="w-4 h-4 text-tennis-green" />
          <span className="text-sm text-muted-foreground">{t("hero.badge")}</span>
        </div>

        {/* Title */}
        <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold mb-4 animate-slide-up animate-delay-200">
          <span className="text-gradient-green">Ace</span>
          <span className="text-foreground">-Stats</span>
        </h1>

        {/* Subtitle */}
        <p className="font-display text-lg md:text-xl text-muted-foreground tracking-widest uppercase mb-6 animate-slide-up animate-delay-300">
          {t("hero.subtitle")}
        </p>

        {/* Description */}
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up animate-delay-400 leading-relaxed">
          {t("hero.description")}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up animate-delay-500">
          <Button variant="hero" size="xl" className="w-full sm:w-auto" onClick={() => setBetaModalOpen(true)}>
            <Watch className="w-5 h-5 mr-2" />
            {t("hero.downloadBtn")}
          </Button>
          <Link to="/platform">
            <Button variant="heroOutline" size="xl" className="w-full sm:w-auto">
              <BarChart3 className="w-5 h-5 mr-2" />
              {t("hero.statsBtn")}
            </Button>
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="w-8 h-8 text-muted-foreground" />
      </div>

      {/* Beta Access Modal */}
      <BetaAccessModal open={betaModalOpen} onOpenChange={setBetaModalOpen} />
    </section>
  );
};

export default HeroSection;
