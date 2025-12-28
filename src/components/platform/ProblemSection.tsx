import { BookX, Brain, Trophy } from "lucide-react";

const problems = [
  {
    icon: BookX,
    title: "Adeus caderninho.",
    description: "Chega de anotações manuais que não geram dados reais. Seus registros se transformam automaticamente em métricas valiosas.",
    color: "text-tennis-red",
    bgColor: "bg-tennis-red/10",
  },
  {
    icon: Brain,
    title: "Entenda sua mente.",
    description: "Descubra seu 'Fator Clutch' e como você reage sob pressão. Saiba exatamente onde você perde pontos decisivos.",
    color: "text-tennis-blue",
    bgColor: "bg-tennis-blue/10",
  },
  {
    icon: Trophy,
    title: "Vença seus rivais.",
    description: "Histórico detalhado contra cada adversário para saber exatamente como ganhar do 'Wilson Oba'.",
    color: "text-tennis-green",
    bgColor: "bg-tennis-green/10",
  },
];

const ProblemSection = () => {
  return (
    <section className="py-24 px-4 relative">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/30 to-transparent" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Você joga bem, mas não sabe <span className="text-gradient-green">por que perdeu?</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A maioria dos tenistas confia apenas na memória. Isso custa vitórias.
          </p>
        </div>

        {/* Problems grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {problems.map((problem, index) => (
            <div
              key={problem.title}
              className="glass-card rounded-2xl p-8 hover:scale-105 transition-transform duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-16 h-16 rounded-2xl ${problem.bgColor} flex items-center justify-center mb-6`}>
                <problem.icon className={`w-8 h-8 ${problem.color}`} />
              </div>
              <h3 className="font-display text-xl font-bold text-foreground mb-3">
                {problem.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {problem.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
