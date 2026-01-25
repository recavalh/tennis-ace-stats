import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import BetaAccessModal from "@/components/BetaAccessModal";

const PlatformHero = () => {
  const [betaModalOpen, setBetaModalOpen] = useState(false);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-tennis-green/15 rounded-full blur-[180px] animate-pulse-slow" />
      <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-tennis-blue/10 rounded-full blur-[150px] animate-pulse-slow" style={{ animationDelay: "2s" }} />
      
      {/* Content */}
      <div className="relative z-10 text-center max-w-5xl mx-auto">
        {/* Headline */}
        <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-slide-up">
          <span className="text-foreground">Pare de </span>
          <span className="text-gradient-green">Achar</span>
          <span className="text-foreground">.</span>
          <br />
          <span className="text-foreground">Comece a </span>
          <span className="text-gradient-green">Saber</span>
          <span className="text-foreground">.</span>
        </h1>

        {/* Sub-headline */}
        <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 animate-slide-up animate-delay-200 leading-relaxed">
          O tracking definitivo para tenistas que querem evoluir. 
          <span className="text-foreground font-medium"> Registre partidas ilimitadas de graça.</span>
          {" "}Desbloqueie a inteligência de um coach com o <span className="text-tennis-green font-semibold">Ace Pro</span>.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up animate-delay-300">
          <Button variant="hero" size="xl" className="w-full sm:w-auto group" onClick={() => setBetaModalOpen(true)}>
            Começar Grátis Agora
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button variant="heroOutline" size="xl" className="w-full sm:w-auto" onClick={() => setBetaModalOpen(true)}>
            <Play className="w-5 h-5 mr-2" />
            Ver Demo do Pro
          </Button>
        </div>

        {/* Trust badge */}
        <p className="mt-8 text-sm text-muted-foreground animate-slide-up animate-delay-400">
          ✓ Sem cartão de crédito &nbsp;•&nbsp; ✓ Setup em 2 minutos &nbsp;•&nbsp; ✓ Cancele quando quiser
        </p>
      </div>

      {/* Dashboard mockup floating */}
      <div className="relative z-10 mt-16 w-full max-w-4xl mx-auto animate-slide-up animate-delay-500">
        <div className="glass-card rounded-2xl p-2 glow-green">
          <div className="bg-card rounded-xl p-6 md:p-8">
            {/* Mock dashboard header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-tennis-green/20 flex items-center justify-center">
                  <span className="text-tennis-green font-bold">JS</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">João Silva</p>
                  <p className="text-sm text-muted-foreground">Nível 4.0 • 23 partidas</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-tennis-green/20 text-tennis-green text-sm font-medium">
                  Ace Pro
                </span>
              </div>
            </div>
            
            {/* Mock stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Win Rate", value: "68%", color: "text-tennis-green" },
                { label: "Hold %", value: "72%", color: "text-tennis-blue" },
                { label: "Clutch Factor", value: "85", color: "text-yellow-400" },
                { label: "Break Conv.", value: "45%", color: "text-tennis-green" },
              ].map((stat) => (
                <div key={stat.label} className="bg-secondary/50 rounded-lg p-4 text-center">
                  <p className={`text-2xl md:text-3xl font-display font-bold ${stat.color}`}>
                    {stat.value}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Beta Access Modal */}
      <BetaAccessModal open={betaModalOpen} onOpenChange={setBetaModalOpen} />
    </section>
  );
};

export default PlatformHero;
