import { useTranslation } from "react-i18next";
import { BookX, Brain, Trophy } from "lucide-react";

const ProblemSection = () => {
  const { t } = useTranslation();

  const problems = [
    {
      icon: BookX,
      titleKey: "platform.problem.items.notebook.title",
      descriptionKey: "platform.problem.items.notebook.description",
      color: "text-tennis-red",
      bgColor: "bg-tennis-red/10",
    },
    {
      icon: Brain,
      titleKey: "platform.problem.items.mind.title",
      descriptionKey: "platform.problem.items.mind.description",
      color: "text-tennis-blue",
      bgColor: "bg-tennis-blue/10",
    },
    {
      icon: Trophy,
      titleKey: "platform.problem.items.rivals.title",
      descriptionKey: "platform.problem.items.rivals.description",
      color: "text-tennis-green",
      bgColor: "bg-tennis-green/10",
    },
  ];

  return (
    <section className="py-24 px-4 relative">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/30 to-transparent" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {t("platform.problem.title")}
          </h2>
        </div>

        {/* Problems grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {problems.map((problem, index) => (
            <div
              key={problem.titleKey}
              className="glass-card rounded-2xl p-8 hover:scale-105 transition-transform duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-16 h-16 rounded-2xl ${problem.bgColor} flex items-center justify-center mb-6`}>
                <problem.icon className={`w-8 h-8 ${problem.color}`} />
              </div>
              <h3 className="font-display text-xl font-bold text-foreground mb-3">
                {t(problem.titleKey)}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {t(problem.descriptionKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
