import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type GalleryItem = {
  src: string;
  alt: string;
  caption: string;
};

type LabeledItem = {
  label: string;
  text: string;
};

type CardContent = {
  title: string;
  items: LabeledItem[];
};

const WatchImageCard = ({ src, alt, caption }: GalleryItem) => (
  <figure className="glass-card rounded-3xl p-4 border border-border/40">
    <div className="bg-black/40 rounded-2xl p-3 flex items-center justify-center">
      <img src={src} alt={alt} className="w-full max-w-[240px] rounded-2xl" loading="lazy" />
    </div>
    <figcaption className="mt-3 text-sm text-muted-foreground">{caption}</figcaption>
  </figure>
);

const Watch = () => {
  const { t } = useTranslation();

  const buildImage = (key: string, src: string): GalleryItem => ({
    src,
    alt: t(`watchPage.images.${key}.alt`),
    caption: t(`watchPage.images.${key}.caption`),
  });

  const matchSetupImages: GalleryItem[] = [
    buildImage("menu1", "/images/watch/Menu%201.png"),
    buildImage("menu2", "/images/watch/Menu%202.png"),
  ];

  const advancedSettingsImages: GalleryItem[] = [
    buildImage("settings2", "/images/watch/Settings%20(2).png"),
    buildImage("settings3", "/images/watch/Settings%20(3).png"),
    buildImage("settings4", "/images/watch/Settings%20(4).png"),
  ];

  const historyImages: GalleryItem[] = [
    buildImage("history", "/images/watch/History.png"),
    buildImage("matchHistory", "/images/watch/match%20history.png"),
  ];

  const simpleModeImages: GalleryItem[] = [
    buildImage("ui2", "/images/watch/Ui%202%20button.png"),
  ];

  const pauseMenuImages: GalleryItem[] = [
    buildImage("pause1", "/images/watch/Pause%20(1).png"),
    buildImage("pause2", "/images/watch/Pause%20(2).png"),
  ];

  const advancedModeImages: GalleryItem[] = [
    buildImage("ui6_1", "/images/watch/Ui%206%20buttons%20(1).png"),
    buildImage("ui6_2", "/images/watch/Ui%206%20buttons%20(2).png"),
    buildImage("ui6_3", "/images/watch/Ui%206%20buttons%20(3).png"),
  ];

  const errorImages: GalleryItem[] = [
    buildImage("errors1", "/images/watch/Erros%20(1).png"),
    buildImage("errors2", "/images/watch/Erros%20(2).png"),
  ];

  const winnerImages: GalleryItem[] = [
    buildImage("winners1", "/images/watch/Winnes%20(1).png"),
    buildImage("winners2", "/images/watch/Winnes%20(2).png"),
  ];

  const matchStatsImage: GalleryItem = buildImage(
    "matchStats",
    "/images/watch/Match%20stats.png"
  );

  const matchSetupCards: CardContent[] = [
    {
      title: t("watchPage.matchSetup.cards.structure.title"),
      items: [
        {
          label: t("watchPage.matchSetup.cards.structure.items.bestOfSets.label"),
          text: t("watchPage.matchSetup.cards.structure.items.bestOfSets.text"),
        },
        {
          label: t("watchPage.matchSetup.cards.structure.items.gamesPerSet.label"),
          text: t("watchPage.matchSetup.cards.structure.items.gamesPerSet.text"),
        },
        {
          label: t("watchPage.matchSetup.cards.structure.items.superTieBreak.label"),
          text: t("watchPage.matchSetup.cards.structure.items.superTieBreak.text"),
        },
      ],
    },
    {
      title: t("watchPage.matchSetup.cards.rules.title"),
      items: [
        {
          label: t("watchPage.matchSetup.cards.rules.items.enableTieBreak.label"),
          text: t("watchPage.matchSetup.cards.rules.items.enableTieBreak.text"),
        },
        {
          label: t("watchPage.matchSetup.cards.rules.items.iServeFirst.label"),
          text: t("watchPage.matchSetup.cards.rules.items.iServeFirst.text"),
        },
      ],
    },
    {
      title: t("watchPage.matchSetup.cards.quickNav.title"),
      items: [
        {
          label: t("watchPage.matchSetup.cards.quickNav.items.settings.label"),
          text: t("watchPage.matchSetup.cards.quickNav.items.settings.text"),
        },
        {
          label: t("watchPage.matchSetup.cards.quickNav.items.start.label"),
          text: t("watchPage.matchSetup.cards.quickNav.items.start.text"),
        },
        {
          label: t("watchPage.matchSetup.cards.quickNav.items.history.label"),
          text: t("watchPage.matchSetup.cards.quickNav.items.history.text"),
        },
      ],
    },
  ];

  const advancedSettingsCards: CardContent[] = [
    {
      title: t("watchPage.advancedSettings.cards.uiMode.title"),
      items: [
        {
          label: t("watchPage.advancedSettings.cards.uiMode.items.simple.label"),
          text: t("watchPage.advancedSettings.cards.uiMode.items.simple.text"),
        },
        {
          label: t("watchPage.advancedSettings.cards.uiMode.items.advanced.label"),
          text: t("watchPage.advancedSettings.cards.uiMode.items.advanced.text"),
        },
      ],
    },
    {
      title: t("watchPage.advancedSettings.cards.scoring.title"),
      items: [
        {
          label: t("watchPage.advancedSettings.cards.scoring.items.deuce.label"),
          text: t("watchPage.advancedSettings.cards.scoring.items.deuce.text"),
        },
        {
          label: t("watchPage.advancedSettings.cards.scoring.items.noAd.label"),
          text: t("watchPage.advancedSettings.cards.scoring.items.noAd.text"),
        },
      ],
    },
    {
      title: t("watchPage.advancedSettings.cards.tieBreaks.title"),
      items: [
        {
          label: t("watchPage.advancedSettings.cards.tieBreaks.items.setTieBreak.label"),
          text: t("watchPage.advancedSettings.cards.tieBreaks.items.setTieBreak.text"),
        },
        {
          label: t("watchPage.advancedSettings.cards.tieBreaks.items.finalSet.label"),
          text: t("watchPage.advancedSettings.cards.tieBreaks.items.finalSet.text"),
        },
        {
          label: t("watchPage.advancedSettings.cards.tieBreaks.items.matchTieBreak.label"),
          text: t("watchPage.advancedSettings.cards.tieBreaks.items.matchTieBreak.text"),
        },
      ],
    },
    {
      title: t("watchPage.advancedSettings.cards.precision.title"),
      items: [
        {
          label: t("watchPage.advancedSettings.cards.precision.items.trackFirstServe.label"),
          text: t("watchPage.advancedSettings.cards.precision.items.trackFirstServe.text"),
        },
        {
          label: t("watchPage.advancedSettings.cards.precision.items.setFormat.label"),
          text: t("watchPage.advancedSettings.cards.precision.items.setFormat.text"),
        },
      ],
    },
  ];

  const historyItems: LabeledItem[] = [
    {
      label: t("watchPage.history.items.detail.label"),
      text: t("watchPage.history.items.detail.text"),
    },
    {
      label: t("watchPage.history.items.share.label"),
      text: t("watchPage.history.items.share.text"),
    },
    {
      label: t("watchPage.history.items.clean.label"),
      text: t("watchPage.history.items.clean.text"),
    },
  ];

  const interfaceCards: CardContent[] = [
    {
      title: t("watchPage.interface.cards.simple.title"),
      items: [
        {
          label: t("watchPage.interface.cards.simple.items.opponentPoint.label"),
          text: t("watchPage.interface.cards.simple.items.opponentPoint.text"),
        },
        {
          label: t("watchPage.interface.cards.simple.items.yourPoint.label"),
          text: t("watchPage.interface.cards.simple.items.yourPoint.text"),
        },
        {
          label: t("watchPage.interface.cards.simple.items.serveGuide.label"),
          text: t("watchPage.interface.cards.simple.items.serveGuide.text"),
        },
      ],
    },
    {
      title: t("watchPage.interface.cards.errors.title"),
      items: [
        {
          label: t("watchPage.interface.cards.errors.items.undo.label"),
          text: t("watchPage.interface.cards.errors.items.undo.text"),
        },
        {
          label: t("watchPage.interface.cards.errors.items.pauseMenu.label"),
          text: t("watchPage.interface.cards.errors.items.pauseMenu.text"),
        },
      ],
    },
  ];

  const pauseCommands: LabeledItem[] = [
    {
      label: t("watchPage.interface.pauseCommands.items.resume.label"),
      text: t("watchPage.interface.pauseCommands.items.resume.text"),
    },
    {
      label: t("watchPage.interface.pauseCommands.items.stats.label"),
      text: t("watchPage.interface.pauseCommands.items.stats.text"),
    },
    {
      label: t("watchPage.interface.pauseCommands.items.history.label"),
      text: t("watchPage.interface.pauseCommands.items.history.text"),
    },
    {
      label: t("watchPage.interface.pauseCommands.items.finish.label"),
      text: t("watchPage.interface.pauseCommands.items.finish.text"),
    },
    {
      label: t("watchPage.interface.pauseCommands.items.restart.label"),
      text: t("watchPage.interface.pauseCommands.items.restart.text"),
    },
  ];

  const advancedServeItems: LabeledItem[] = [
    {
      label: t("watchPage.advancedMode.cards.serve.items.aces.label"),
      text: t("watchPage.advancedMode.cards.serve.items.aces.text"),
    },
    {
      label: t("watchPage.advancedMode.cards.serve.items.serveControl.label"),
      text: t("watchPage.advancedMode.cards.serve.items.serveControl.text"),
    },
    {
      label: t("watchPage.advancedMode.cards.serve.items.orientation.label"),
      text: t("watchPage.advancedMode.cards.serve.items.orientation.text"),
    },
  ];

  const advancedErrorItems: LabeledItem[] = [
    {
      label: t("watchPage.advancedMode.cards.errors.items.unforced.label"),
      text: t("watchPage.advancedMode.cards.errors.items.unforced.text"),
    },
    {
      label: t("watchPage.advancedMode.cards.errors.items.forced.label"),
      text: t("watchPage.advancedMode.cards.errors.items.forced.text"),
    },
    {
      label: t("watchPage.advancedMode.cards.errors.items.return.label"),
      text: t("watchPage.advancedMode.cards.errors.items.return.text"),
    },
  ];

  const winnersItems: LabeledItem[] = [
    {
      label: t("watchPage.advancedMode.winners.items.baseline.label"),
      text: t("watchPage.advancedMode.winners.items.baseline.text"),
    },
    {
      label: t("watchPage.advancedMode.winners.items.volley.label"),
      text: t("watchPage.advancedMode.winners.items.volley.text"),
    },
    {
      label: t("watchPage.advancedMode.winners.items.smash.label"),
      text: t("watchPage.advancedMode.winners.items.smash.text"),
    },
    {
      label: t("watchPage.advancedMode.winners.items.returnWinner.label"),
      text: t("watchPage.advancedMode.winners.items.returnWinner.text"),
    },
  ];

  const renderList = (items: LabeledItem[]) => (
    <ul className="space-y-2 text-muted-foreground">
      {items.map((item) => (
        <li key={item.label}>
          <span className="text-foreground font-medium">{item.label}</span> {item.text}
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <Helmet>
        <title>{t("watchPage.meta.title")}</title>
        <meta name="description" content={t("watchPage.meta.description")} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />

        <main className="pt-28 md:pt-32 pb-20">
          <section className="px-4">
            <div className="max-w-6xl mx-auto">
              <div className="glass-card rounded-3xl p-8 md:p-12 border border-border/40">
                <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground mb-4">
                  {t("watchPage.hero.badge")}
                </p>
                <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
                  {t("watchPage.hero.title")}
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl">
                  {t("watchPage.hero.subtitle")}
                </p>
              </div>
            </div>
          </section>

          <section className="px-4 mt-12">
            <div className="max-w-6xl mx-auto space-y-12">
              <div className="glass-card rounded-3xl p-6 md:p-10">
                <h2 className="text-2xl md:text-3xl font-display font-semibold mb-4">
                  {t("watchPage.matchSetup.title")}
                </h2>
                <p className="text-muted-foreground mb-8">{t("watchPage.matchSetup.intro")}</p>

                <div className="grid md:grid-cols-3 gap-6">
                  {matchSetupCards.map((card) => (
                    <div
                      key={card.title}
                      className="bg-surface-elevated rounded-2xl p-5 border border-border/40"
                    >
                      <h3 className="text-lg font-semibold mb-3">{card.title}</h3>
                      {renderList(card.items)}
                    </div>
                  ))}
                </div>

                <div className="mt-8 grid sm:grid-cols-2 gap-6">
                  {matchSetupImages.map((item) => (
                    <WatchImageCard key={item.src} {...item} />
                  ))}
                </div>
              </div>

              <div className="glass-card rounded-3xl p-6 md:p-10">
                <h2 className="text-2xl md:text-3xl font-display font-semibold mb-4">
                  {t("watchPage.advancedSettings.title")}
                </h2>
                <p className="text-muted-foreground mb-8">
                  {t("watchPage.advancedSettings.intro")}
                </p>

                <div className="grid md:grid-cols-2 gap-6">
                  {advancedSettingsCards.map((card) => (
                    <div
                      key={card.title}
                      className="bg-surface-elevated rounded-2xl p-5 border border-border/40"
                    >
                      <h3 className="text-lg font-semibold mb-3">{card.title}</h3>
                      {renderList(card.items)}
                    </div>
                  ))}
                </div>

                <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {advancedSettingsImages.map((item) => (
                    <WatchImageCard key={item.src} {...item} />
                  ))}
                </div>
              </div>

              <div className="glass-card rounded-3xl p-6 md:p-10">
                <h2 className="text-2xl md:text-3xl font-display font-semibold mb-4">
                  {t("watchPage.history.title")}
                </h2>
                <p className="text-muted-foreground mb-6">{t("watchPage.history.intro")}</p>
                {renderList(historyItems)}

                <div className="mt-8 grid sm:grid-cols-2 gap-6">
                  {historyImages.map((item) => (
                    <WatchImageCard key={item.src} {...item} />
                  ))}
                </div>
              </div>

              <div className="glass-card rounded-3xl p-6 md:p-10">
                <h2 className="text-2xl md:text-3xl font-display font-semibold mb-4">
                  {t("watchPage.interface.title")}
                </h2>
                <p className="text-muted-foreground mb-8">{t("watchPage.interface.intro")}</p>

                <div className="grid md:grid-cols-2 gap-6">
                  {interfaceCards.map((card) => (
                    <div
                      key={card.title}
                      className="bg-surface-elevated rounded-2xl p-5 border border-border/40"
                    >
                      <h3 className="text-lg font-semibold mb-3">{card.title}</h3>
                      {renderList(card.items)}
                    </div>
                  ))}
                </div>

                <div className="mt-8 grid lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
                      {t("watchPage.interface.imageLabels.simpleMode")}
                    </p>
                    <div className="flex justify-center gap-6">
                      {simpleModeImages.map((item) => (
                        <WatchImageCard key={item.src} {...item} />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
                      {t("watchPage.interface.imageLabels.pauseMenu")}
                    </p>
                    <div className="grid sm:grid-cols-2 gap-6">
                      {pauseMenuImages.map((item) => (
                        <WatchImageCard key={item.src} {...item} />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 bg-surface-elevated rounded-2xl p-5 border border-border/40">
                  <h3 className="text-lg font-semibold mb-3">
                    {t("watchPage.interface.pauseCommands.title")}
                  </h3>
                  {renderList(pauseCommands)}
                </div>

                <div className="mt-6 bg-surface-elevated rounded-2xl p-5 border border-border/40">
                  <h3 className="text-lg font-semibold mb-3">
                    {t("watchPage.interface.matchStats.title")}
                  </h3>
                  <p className="text-muted-foreground">
                    {t("watchPage.interface.matchStats.text")}
                  </p>
                  <div className="mt-4 grid sm:grid-cols-2 gap-6">
                    <WatchImageCard {...matchStatsImage} />
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-3xl p-6 md:p-10">
                <h2 className="text-2xl md:text-3xl font-display font-semibold mb-4">
                  {t("watchPage.advancedMode.title")}
                </h2>
                <p className="text-muted-foreground mb-8">{t("watchPage.advancedMode.intro")}</p>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-surface-elevated rounded-2xl p-5 border border-border/40">
                    <h3 className="text-lg font-semibold mb-3">
                      {t("watchPage.advancedMode.cards.serve.title")}
                    </h3>
                    {renderList(advancedServeItems)}

                    <div className="mt-4 grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {advancedModeImages.map((item) => (
                        <WatchImageCard key={item.src} {...item} />
                      ))}
                    </div>
                  </div>

                  <div className="bg-surface-elevated rounded-2xl p-5 border border-border/40">
                    <h3 className="text-lg font-semibold mb-3">
                      {t("watchPage.advancedMode.cards.errors.title")}
                    </h3>
                    {renderList(advancedErrorItems)}

                    <div className="mt-4 grid sm:grid-cols-2 gap-4">
                      {errorImages.map((item) => (
                        <WatchImageCard key={item.src} {...item} />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 bg-surface-elevated rounded-2xl p-5 border border-border/40">
                  <h3 className="text-lg font-semibold mb-3">
                    {t("watchPage.advancedMode.winners.title")}
                  </h3>
                  {renderList(winnersItems)}

                  <div className="mt-4 grid sm:grid-cols-2 gap-4">
                    {winnerImages.map((item) => (
                      <WatchImageCard key={item.src} {...item} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Watch;
