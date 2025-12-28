import { Button } from "@/components/ui/button";
import { Watch, ExternalLink } from "lucide-react";
import logo from "@/assets/logo.png";

const CTASection = () => {
  return (
    <section className="py-24 px-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-t from-tennis-green/5 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-tennis-green/10 rounded-full blur-[200px]" />
      
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="glass-card rounded-3xl p-8 md:p-12 lg:p-16 text-center border-tennis-green/20">
          {/* Logo */}
          <div className="mb-8">
            <img 
              src={logo} 
              alt="Ace-Stats" 
              className="w-24 h-24 mx-auto animate-glow rounded-2xl"
            />
          </div>

          {/* Content */}
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            <span className="text-foreground">Pronto para </span>
            <span className="text-gradient-green">Elevar seu Jogo</span>
            <span className="text-foreground">?</span>
          </h2>
          
          <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
            Junte-se aos tenistas que já estão usando dados para melhorar sua performance. 
            Comece gratuitamente hoje.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-10 max-w-lg mx-auto">
            <div>
              <div className="font-display text-2xl md:text-3xl font-bold text-tennis-green">500+</div>
              <div className="text-muted-foreground text-sm">Partidas Registradas</div>
            </div>
            <div>
              <div className="font-display text-2xl md:text-3xl font-bold text-tennis-green">50K+</div>
              <div className="text-muted-foreground text-sm">Pontos Analisados</div>
            </div>
            <div>
              <div className="font-display text-2xl md:text-3xl font-bold text-tennis-green">100+</div>
              <div className="text-muted-foreground text-sm">Jogadores Ativos</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button variant="hero" size="xl" className="w-full sm:w-auto">
              <Watch className="w-5 h-5 mr-2" />
              Baixar na Play Store
            </Button>
            <Button variant="glass" size="xl" className="w-full sm:w-auto">
              <ExternalLink className="w-5 h-5 mr-2" />
              Acessar Plataforma Web
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
