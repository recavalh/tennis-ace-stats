import { Watch, BarChart3, Zap, Target, TrendingUp, Smartphone } from "lucide-react";

const features = [
  {
    icon: Watch,
    title: "Controle no Pulso",
    description: "Registre winners, erros forçados e não forçados diretamente do seu smartwatch durante a partida.",
    color: "tennis-green",
  },
  {
    icon: Target,
    title: "Detalhes de Cada Ponto",
    description: "Categorize seus pontos: baseline, volley, smash ou return winner. Saiba exatamente onde você brilha.",
    color: "tennis-blue",
  },
  {
    icon: BarChart3,
    title: "Estatísticas Detalhadas",
    description: "Games no serviço, pontos na recepção, break points, deuces e muito mais em tempo real.",
    color: "tennis-green",
  },
  {
    icon: TrendingUp,
    title: "Análise de Evolução",
    description: "Acompanhe seu progresso ao longo do tempo e identifique padrões no seu jogo.",
    color: "tennis-red",
  },
  {
    icon: Zap,
    title: "Interface Intuitiva",
    description: "Modo simples (2 botões) ou avançado (6 botões). Escolha o que melhor se adapta ao seu estilo.",
    color: "tennis-blue",
  },
  {
    icon: Smartphone,
    title: "Sincronização Web",
    description: "Exporte seus dados para análise completa na plataforma web. Visualize gráficos e relatórios.",
    color: "tennis-green",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 px-4 relative">
      {/* Background effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card/30 to-transparent" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            <span className="text-gradient-green">Recursos</span>{" "}
            <span className="text-foreground">Poderosos</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Tudo que você precisa para elevar seu jogo de tênis ao próximo nível
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group glass-card rounded-2xl p-6 hover:border-primary/50 transition-all duration-500 hover:shadow-[0_0_40px_hsl(145_63%_42%/0.15)]"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Icon */}
              <div className={`w-14 h-14 rounded-xl bg-${feature.color}/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className={`w-7 h-7 text-${feature.color}`} />
              </div>

              {/* Content */}
              <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
