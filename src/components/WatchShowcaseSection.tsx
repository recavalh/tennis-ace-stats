import videoMenu from "@/assets/video-menu.webm";
import videoMatch from "@/assets/video-match.webm";
import watchStats from "@/assets/watch-stats.png";

const watches = [
  {
    video: videoMenu,
    title: "Configuração Rápida",
    description: "Configure sets, games e tie-break em segundos",
  },
  {
    video: videoMatch,
    title: "Controle da Partida",
    description: "Registre cada ponto com facilidade",
  },
  {
    image: watchStats,
    title: "Estatísticas Completas",
    description: "Acompanhe seu desempenho em tempo real",
  },
];

const WatchShowcaseSection = () => {
  return (
    <section id="app" className="py-24 px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-tennis-green/5 rounded-full blur-[200px]" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            <span className="text-foreground">Feito para o </span>
            <span className="text-gradient-green">seu Pulso</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Interface otimizada para smartwatches Android com WearOS
          </p>
        </div>

        {/* Watch showcase */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {watches.map((watch, index) => (
            <div
              key={watch.title}
              className="flex flex-col items-center group"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {/* Watch media */}
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-tennis-green/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                {'video' in watch && watch.video ? (
                  <video
                    src={watch.video}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-64 h-64 object-contain relative z-10 group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <img
                    src={'image' in watch ? watch.image : ''}
                    alt={watch.title}
                    className="w-64 h-64 object-contain relative z-10 group-hover:scale-105 transition-transform duration-500"
                  />
                )}
              </div>

              {/* Content */}
              <h3 className="font-display text-xl font-semibold text-foreground mb-2 text-center">
                {watch.title}
              </h3>
              <p className="text-muted-foreground text-center max-w-xs">
                {watch.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WatchShowcaseSection;
