import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";
import BetaAccessModal from "@/components/BetaAccessModal";

const FinalCTA = () => {
  const { t } = useTranslation();
  const [betaModalOpen, setBetaModalOpen] = useState(false);

  return (
    <section className="py-24 px-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-tennis-green/10 rounded-full blur-[200px]" />
      
      <div className="max-w-4xl mx-auto relative z-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-tennis-green/20 mb-8">
          <Zap className="w-8 h-8 text-tennis-green" />
        </div>

        <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
          {t("platform.finalCta.title")} <span className="text-gradient-green">{t("platform.finalCta.titleHighlight")}</span>.
        </h2>

        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
          {t("platform.finalCta.description")}
        </p>

        <Button variant="hero" size="xl" className="group" onClick={() => setBetaModalOpen(true)}>
          {t("platform.finalCta.cta")}
          <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>

        <p className="mt-6 text-sm text-muted-foreground">
          {t("platform.finalCta.trustText")}
        </p>
      </div>

      <BetaAccessModal open={betaModalOpen} onOpenChange={setBetaModalOpen} />
    </section>
  );
};

export default FinalCTA;
