import { Lock, Unlock, Sparkles } from "lucide-react";

const AceProHighlight = () => {
  return (
    <section className="py-24 px-4 relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-tennis-green/5 to-transparent" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-tennis-green/10 border border-tennis-green/20 mb-6">
            <Sparkles className="w-4 h-4 text-tennis-green" />
            <span className="text-sm text-tennis-green font-medium">Ace Pro</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Seu <span className="text-gradient-green">Técnico Digital</span>.
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Dados sem análise são apenas números. O Ace Pro transforma números em estratégia.
          </p>
        </div>

        {/* Comparison cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free card - blurred */}
          <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <Lock className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-display font-bold text-foreground">Free</h3>
                <p className="text-sm text-muted-foreground">Dados básicos</p>
              </div>
            </div>

            {/* Blurred chart mockup */}
            <div className="relative">
              <div className="blur-sm opacity-50">
                <div className="h-40 flex items-end gap-2 mb-4">
                  {[30, 45, 35, 50, 40, 55].map((height, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-muted rounded-t"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
              
              {/* Lock overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-secondary/80 backdrop-blur flex items-center justify-center">
                  <Lock className="w-8 h-8 text-muted-foreground" />
                </div>
              </div>
            </div>

            <p className="text-center text-muted-foreground text-sm mt-4">
              Você joga, mas não entende os padrões.
            </p>
          </div>

          {/* Pro card - clear */}
          <div className="glass-card rounded-2xl p-6 border-tennis-green/30 relative overflow-hidden glow-green">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-tennis-green/20 flex items-center justify-center">
                <Unlock className="w-5 h-5 text-tennis-green" />
              </div>
              <div>
                <h3 className="font-display font-bold text-tennis-green">Ace Pro</h3>
                <p className="text-sm text-muted-foreground">Insights completos</p>
              </div>
            </div>

            {/* Clear chart mockup */}
            <div>
              <div className="h-40 flex items-end gap-2 mb-4">
                {[30, 45, 35, 60, 50, 75, 65, 85].map((height, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-tennis-green/30 to-tennis-green rounded-t"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Clutch Factor</span>
                  <span className="text-tennis-green font-bold">85</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Hold % Tendência</span>
                  <span className="text-tennis-green font-bold">+12%</span>
                </div>
              </div>
            </div>

            <p className="text-center text-foreground text-sm mt-4 font-medium">
              Você joga e sabe exatamente o que melhorar.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AceProHighlight;
