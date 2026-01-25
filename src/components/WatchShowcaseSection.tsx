import { useTranslation } from "react-i18next";
import videoMenu from "@/assets/video-menu.webm";
import videoMatch from "@/assets/video-match.webm";
import watchStats from "@/assets/watch-stats.png";

const WatchShowcaseSection = () => {
  const { t } = useTranslation();

  const watches = [
    {
      video: videoMenu,
      titleKey: "watchShowcase.items.quickSetup.title",
      descriptionKey: "watchShowcase.items.quickSetup.description",
    },
    {
      video: videoMatch,
      titleKey: "watchShowcase.items.matchControl.title",
      descriptionKey: "watchShowcase.items.matchControl.description",
    },
    {
      image: watchStats,
      titleKey: "watchShowcase.items.completeStats.title",
      descriptionKey: "watchShowcase.items.completeStats.description",
    },
  ];

  return (
    <section id="app" className="py-24 px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-tennis-green/5 rounded-full blur-[200px]" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            <span className="text-foreground">{t("watchShowcase.title")} </span>
            <span className="text-gradient-green">{t("watchShowcase.titleHighlight")}</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t("watchShowcase.subtitle")}
          </p>
        </div>

        {/* Watch showcase */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {watches.map((watch, index) => (
            <div
              key={watch.titleKey}
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
                    alt={t(watch.titleKey)}
                    className="w-64 h-64 object-contain relative z-10 group-hover:scale-105 transition-transform duration-500"
                  />
                )}
              </div>

              {/* Content */}
              <h3 className="font-display text-xl font-semibold text-foreground mb-2 text-center">
                {t(watch.titleKey)}
              </h3>
              <p className="text-muted-foreground text-center max-w-xs">
                {t(watch.descriptionKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WatchShowcaseSection;
