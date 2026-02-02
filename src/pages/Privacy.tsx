import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Privacy = () => {
  const { t } = useTranslation();
  const paragraphs = [
    t("privacy.paragraph1"),
    t("privacy.paragraph2"),
    t("privacy.paragraph3"),
    t("privacy.paragraph4"),
    t("privacy.paragraph5"),
  ];

  return (
    <>
      <Helmet>
        <title>{t("privacy.title")} | Ace-Stats</title>
        <meta name="description" content={t("privacy.metaDescription")} />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="px-4 pb-16 pt-24">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-10">
            <header className="space-y-3">
              <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
                Ace-Stats
              </p>
              <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">
                {t("privacy.title")}
              </h1>
            </header>

            <section className="space-y-5 text-base leading-relaxed text-muted-foreground">
              {paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">{t("privacy.contactTitle")}</h2>
              <p className="text-muted-foreground">{t("privacy.contactText")}</p>
              <a
                className="text-primary underline underline-offset-4 transition-colors hover:text-primary/90"
                href="mailto:acestatstennis@gmail.com"
              >
                acestatstennis@gmail.com
              </a>
            </section>

            <p className="text-sm text-muted-foreground">{t("privacy.updates")}</p>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Privacy;
