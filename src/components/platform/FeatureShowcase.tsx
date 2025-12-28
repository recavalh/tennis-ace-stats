import { Check, Watch, Brain, TrendingUp, Infinity } from "lucide-react";

const features = [
  {
    icon: Infinity,
    title: "Registro Ilimitado",
    description: "Nunca paramos seu jogo. Registre quantas partidas quiser, para sempre.",
  },
  {
    icon: Watch,
    title: "Integração Wear OS",
    description: "Marque pontos direto do pulso sem tocar no celular. Foco total no jogo.",
  },
  {
    icon: Brain,
    title: "Métricas de Ouro",
    description: "Hold %, Break Points Convertidos, Consistência e muito mais com o Pro.",
    isPro: true,
  },
  {
    icon: TrendingUp,
    title: "Evolução Visual",
    description: "Gráficos que mostram se seu saque está melhorando ou piorando ao longo do tempo.",
    isPro: true,
  },
];

const FeatureShowcase = () => {
  return (
    <section className="py-24 px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-tennis-green/5 rounded-full blur-[200px] -translate-y-1/2" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Muito mais que um <span className="text-gradient-green">placar</span>.
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Uma plataforma completa de performance para elevar seu jogo a outro nível.
          </p>
        </div>

        {/* Feature showcase layout */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Dashboard preview */}
          <div className="glass-card rounded-2xl p-2 order-2 lg:order-1">
            <div className="bg-card rounded-xl p-6">
              {/* Mini chart mockup */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-foreground">Evolução - Últimos 3 meses</h4>
                  <span className="text-tennis-green text-sm font-medium">+12%</span>
                </div>
                <div className="h-32 flex items-end gap-2">
                  {[40, 55, 45, 60, 52, 70, 65, 75, 68, 80, 72, 85].map((height, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-tennis-green/20 to-tennis-green rounded-t"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>Jan</span>
                  <span>Fev</span>
                  <span>Mar</span>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-secondary/50 rounded-lg">
                  <p className="text-xl font-display font-bold text-tennis-green">23</p>
                  <p className="text-xs text-muted-foreground">Partidas</p>
                </div>
                <div className="text-center p-3 bg-secondary/50 rounded-lg">
                  <p className="text-xl font-display font-bold text-tennis-blue">15</p>
                  <p className="text-xs text-muted-foreground">Vitórias</p>
                </div>
                <div className="text-center p-3 bg-secondary/50 rounded-lg">
                  <p className="text-xl font-display font-bold text-yellow-400">4.2</p>
                  <p className="text-xs text-muted-foreground">Nível</p>
                </div>
              </div>
            </div>
          </div>

          {/* Features list */}
          <div className="space-y-6 order-1 lg:order-2">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="flex gap-4 p-4 rounded-xl hover:bg-secondary/30 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-tennis-green/10 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-tennis-green" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-display font-bold text-foreground">
                      {feature.title}
                    </h3>
                    {feature.isPro && (
                      <span className="px-2 py-0.5 rounded-full bg-tennis-green/20 text-tennis-green text-xs font-medium">
                        Pro
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureShowcase;
