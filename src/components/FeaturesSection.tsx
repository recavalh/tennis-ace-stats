import { useTranslation } from "react-i18next";
import { Watch, BarChart3, Zap, Target, TrendingUp, Smartphone } from "lucide-react";

const FeaturesSection = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: Watch,
      titleKey: "features.items.wristControl.title",
      descriptionKey: "features.items.wristControl.description",
      color: "tennis-green",
    },
    {
      icon: Target,
      titleKey: "features.items.pointDetails.title",
      descriptionKey: "features.items.pointDetails.description",
      color: "tennis-blue",
    },
    {
      icon: BarChart3,
      titleKey: "features.items.detailedStats.title",
      descriptionKey: "features.items.detailedStats.description",
      color: "tennis-green",
    },
    {
      icon: TrendingUp,
      titleKey: "features.items.evolutionAnalysis.title",
      descriptionKey: "features.items.evolutionAnalysis.description",
      color: "tennis-red",
    },
    {
      icon: Zap,
      titleKey: "features.items.intuitiveInterface.title",
      descriptionKey: "features.items.intuitiveInterface.description",
      color: "tennis-blue",
    },
    {
      icon: Smartphone,
      titleKey: "features.items.webSync.title",
      descriptionKey: "features.items.webSync.description",
      color: "tennis-green",
    },
  ];

  return (
    <section id="features" className="py-24 px-4 relative">
      {/* Background effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card/30 to-transparent" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            <span className="text-gradient-green">{t("features.title")}</span>{" "}
            <span className="text-foreground">{t("features.titleHighlight")}</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t("features.subtitle")}
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.titleKey}
              className="group glass-card rounded-2xl p-6 hover:border-primary/50 transition-all duration-500 hover:shadow-[0_0_40px_hsl(145_63%_42%/0.15)]"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Icon */}
              <div className={`w-14 h-14 rounded-xl bg-${feature.color}/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className={`w-7 h-7 text-${feature.color}`} />
              </div>

              {/* Content */}
              <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                {t(feature.titleKey)}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {t(feature.descriptionKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
