import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type GalleryItem = {
  src: string;
  alt: string;
  caption: string;
};

type ImageGroup = {
  title: string;
  description: string;
  items: GalleryItem[];
};

const AndroidImageCard = ({ src, alt, caption }: GalleryItem) => (
  <figure className="glass-card rounded-3xl p-4 border border-border/40">
    <div className="bg-black/40 rounded-2xl p-3 flex items-center justify-center">
      <img src={src} alt={alt} className="w-full max-w-[260px] rounded-2xl" loading="lazy" />
    </div>
    <figcaption className="mt-3 text-sm text-muted-foreground">{caption}</figcaption>
  </figure>
);

const Android = () => {
  const { t } = useTranslation();

  const buildImage = (key: string, src: string): GalleryItem => ({
    src,
    alt: t(`androidPage.images.${key}.alt`),
    caption: t(`androidPage.images.${key}.caption`),
  });

  const setupImages: GalleryItem[] = [
    buildImage("menu1", "/images/watch/Menu%201.png"),
    buildImage("settings1", "/images/watch/Settings%20(1).png"),
    buildImage("settings2", "/images/watch/Settings%20(2).png"),
    buildImage("settings3", "/images/watch/Settings%20(3).png"),
    buildImage("settings4", "/images/watch/Settings%20(4).png"),
  ];

  const matchFlowImages: GalleryItem[] = [
    buildImage("menu2", "/images/watch/Menu%202.png"),
    buildImage("ui2", "/images/watch/Ui%202%20button.png"),
    buildImage("ui6_1", "/images/watch/Ui%206%20buttons%20(1).png"),
    buildImage("ui6_2", "/images/watch/Ui%206%20buttons%20(2).png"),
    buildImage("ui6_3", "/images/watch/Ui%206%20buttons%20(3).png"),
    buildImage("errors1", "/images/watch/Erros%20(1).png"),
    buildImage("errors2", "/images/watch/Erros%20(2).png"),
    buildImage("winners1", "/images/watch/Winnes%20(1).png"),
    buildImage("winners2", "/images/watch/Winnes%20(2).png"),
    buildImage("pause1", "/images/watch/Pause%20(1).png"),
    buildImage("pause2", "/images/watch/Pause%20(2).png"),
  ];

  const analyticsImages: GalleryItem[] = [
    buildImage("matchStats", "/images/watch/Match%20stats.png"),
    buildImage("matchHistory", "/images/watch/match%20history.png"),
    buildImage("history", "/images/watch/History.png"),
  ];

  const imageGroups: ImageGroup[] = [
    {
      title: t("androidPage.groups.setup.title"),
      description: t("androidPage.groups.setup.description"),
      items: setupImages,
    },
    {
      title: t("androidPage.groups.match.title"),
      description: t("androidPage.groups.match.description"),
      items: matchFlowImages,
    },
    {
      title: t("androidPage.groups.analytics.title"),
      description: t("androidPage.groups.analytics.description"),
      items: analyticsImages,
    },
  ];

  return (
    <>
      <Helmet>
        <title>{t("androidPage.meta.title")}</title>
        <meta name="description" content={t("androidPage.meta.description")} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />

        <main className="pt-28 md:pt-32 pb-20">
          <section className="px-4">
            <div className="max-w-6xl mx-auto">
              <div className="glass-card rounded-3xl p-8 md:p-12 border border-border/40">
                <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground mb-4">
                  {t("androidPage.hero.badge")}
                </p>
                <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
                  {t("androidPage.hero.title")}
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl">
                  {t("androidPage.hero.subtitle")}
                </p>
              </div>
            </div>
          </section>

          <section className="px-4 mt-12">
            <div className="max-w-6xl mx-auto space-y-12">
              {imageGroups.map((group) => (
                <div key={group.title} className="glass-card rounded-3xl p-6 md:p-10">
                  <h2 className="text-2xl md:text-3xl font-display font-semibold mb-4">
                    {group.title}
                  </h2>
                  <p className="text-muted-foreground mb-8">{group.description}</p>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {group.items.map((item) => (
                      <AndroidImageCard key={item.src} {...item} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Android;
