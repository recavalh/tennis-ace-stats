import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";
import BetaAccessModal from "@/components/BetaAccessModal";

const FinalCTA = () => {
  const [betaModalOpen, setBetaModalOpen] = useState(false);

  return (
    <section className="py-24 px-4 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-tennis-green/10 rounded-full blur-[200px]" />
      
      <div className="max-w-4xl mx-auto relative z-10 text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-tennis-green/20 mb-8">
          <Zap className="w-8 h-8 text-tennis-green" />
        </div>

        {/* Headline */}
        <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
          Sua próxima vitória começa nos <span className="text-gradient-green">dados</span>.
        </h2>

        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
          Junte-se a centenas de tenistas que já transformaram sua forma de jogar e evoluir.
        </p>

        {/* CTA Button */}
        <Button variant="hero" size="xl" className="group" onClick={() => setBetaModalOpen(true)}>
          Criar Conta Grátis
          <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>

        {/* Trust text */}
        <p className="mt-6 text-sm text-muted-foreground">
          Grátis para sempre • Sem cartão de crédito • Setup em 2 minutos
        </p>
      </div>

      {/* Beta Access Modal */}
      <BetaAccessModal open={betaModalOpen} onOpenChange={setBetaModalOpen} />
    </section>
  );
};

export default FinalCTA;
