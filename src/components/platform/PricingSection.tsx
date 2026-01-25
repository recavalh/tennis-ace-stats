import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, Sparkles } from "lucide-react";
import BetaAccessModal from "@/components/BetaAccessModal";

const plans = [
  {
    name: "Free",
    subtitle: "O Hábito",
    price: "R$ 0",
    period: "/ mês",
    description: "Para quem quer registrar tudo.",
    features: [
      { text: "Partidas Ilimitadas", included: true },
      { text: "Adversários Ilimitados", included: true },
      { text: "Stats Básicas do Jogo", included: true },
      { text: "Análise de Evolução", included: false },
      { text: "Filtros de Rivais", included: false },
      { text: "Insights de IA", included: false },
    ],
    cta: "Começar Grátis",
    highlighted: false,
  },
  {
    name: "Ace Pro",
    subtitle: "A Evolução",
    price: "R$ 19,90",
    period: "/ mês",
    priceNote: "Preço de um grip",
    description: "Para quem quer vencer mais.",
    features: [
      { text: "Tudo do Free", included: true },
      { text: "Rivalry Mode (Filtro de Adversários)", included: true },
      { text: "Métricas de Ouro (Clutch, Hold%)", included: true },
      { text: "Gráficos de Tendência", included: true },
      { text: "Insights Automáticos de IA", included: true },
      { text: "Suporte Prioritário", included: true },
    ],
    cta: "Assinar Ace Pro",
    highlighted: true,
  },
];

const PricingSection = () => {
  const [betaModalOpen, setBetaModalOpen] = useState(false);

  return (
    <section className="py-24 px-4 relative">
      <div className="max-w-5xl mx-auto relative z-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Escolha seu <span className="text-gradient-green">plano</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comece grátis e evolua quando estiver pronto. Sem compromisso.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-8 relative ${
                plan.highlighted
                  ? "glass-card border-tennis-green/30 glow-green"
                  : "glass-card"
              }`}
            >
              {/* Popular badge */}
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-tennis-green text-primary-foreground text-sm font-medium">
                    <Sparkles className="w-4 h-4" />
                    Mais Popular
                  </div>
                </div>
              )}

              {/* Plan header */}
              <div className="text-center mb-8">
                <h3 className={`font-display text-2xl font-bold mb-1 ${
                  plan.highlighted ? "text-tennis-green" : "text-foreground"
                }`}>
                  {plan.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">{plan.subtitle}</p>
                
                <div className="flex items-baseline justify-center gap-1">
                  <span className="font-display text-4xl font-bold text-foreground">
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                
                {plan.priceNote && (
                  <p className="text-sm text-tennis-green mt-1">{plan.priceNote}</p>
                )}
                
                <p className="text-muted-foreground mt-3">{plan.description}</p>
              </div>

              {/* Features list */}
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature.text} className="flex items-center gap-3">
                    {feature.included ? (
                      <div className="w-5 h-5 rounded-full bg-tennis-green/20 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-tennis-green" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <X className="w-3 h-3 text-muted-foreground" />
                      </div>
                    )}
                    <span className={feature.included ? "text-foreground" : "text-muted-foreground"}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA button */}
              <Button
                variant={plan.highlighted ? "hero" : "heroOutline"}
                size="lg"
                className="w-full"
                onClick={() => setBetaModalOpen(true)}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Beta Access Modal */}
      <BetaAccessModal open={betaModalOpen} onOpenChange={setBetaModalOpen} />
    </section>
  );
};

export default PricingSection;
