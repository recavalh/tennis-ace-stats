import { useTranslation } from "react-i18next";
import { Watch, Play, BarChart3, TrendingUp } from "lucide-react";

const HowItWorksSection = () => {
  const { t } = useTranslation();

  const steps = [
    {
      number: "01",
      icon: Watch,
      titleKey: "howItWorks.steps.install.title",
      descriptionKey: "howItWorks.steps.install.description",
    },
    {
      number: "02",
      icon: Play,
      titleKey: "howItWorks.steps.start.title",
      descriptionKey: "howItWorks.steps.start.description",
    },
    {
      number: "03",
      icon: BarChart3,
      titleKey: "howItWorks.steps.sync.title",
      descriptionKey: "howItWorks.steps.sync.description",
    },
    {
      number: "04",
      icon: TrendingUp,
      titleKey: "howItWorks.steps.analyze.title",
      descriptionKey: "howItWorks.steps.analyze.description",
    },
  ];

  return (
    <section id="how-it-works" className="py-24 px-4 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-card/30 via-transparent to-card/30" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            <span className="text-foreground">{t("howItWorks.title")} </span>
            <span className="text-gradient-green">{t("howItWorks.titleHighlight")}</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t("howItWorks.subtitle")}
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.number} className="relative group">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[calc(50%+3rem)] w-[calc(100%-3rem)] h-[2px] bg-gradient-to-r from-tennis-green/50 to-tennis-green/10" />
              )}

              <div className="flex flex-col items-center text-center">
                {/* Number badge */}
                <div className="relative mb-4">
                  <div className="w-24 h-24 rounded-2xl bg-card border border-border flex items-center justify-center group-hover:border-primary/50 transition-all duration-300 group-hover:shadow-[0_0_30px_hsl(145_63%_42%/0.2)]">
                    <step.icon className="w-10 h-10 text-tennis-green" />
                  </div>
                  <span className="absolute -top-3 -right-3 font-display text-sm font-bold text-tennis-green bg-background px-2 py-1 rounded-lg border border-tennis-green/30">
                    {step.number}
                  </span>
                </div>

                {/* Content */}
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  {t(step.titleKey)}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-[200px]">
                  {t(step.descriptionKey)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
