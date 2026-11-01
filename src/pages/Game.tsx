import { ArrowRight, BookOpen, Check, Crosshair, Gamepad2, ShieldCheck, Target, TrendingUp, Users, Zap } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { gameUrl } from "@/lib/game";

function CourtPreview() {
  const { t } = useTranslation();
  return (
    <div className="relative rounded-3xl border border-tennis-green/30 bg-[#132c22] p-5 shadow-2xl md:p-8">
      <div className="mb-5 flex items-center justify-between gap-4 text-xs font-medium uppercase tracking-widest text-white/65">
        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-lime-300" />Tennis Tático</span>
        <span>{t("game.preview.turn")}</span>
      </div>
      <svg viewBox="0 0 440 460" className="mx-auto w-full max-w-[440px]" role="img" aria-label={t("game.preview.alt")}>
        <rect width="440" height="460" rx="18" fill="#183b2b" />
        <rect x="70" y="35" width="300" height="390" fill="#698b4b" />
        <g fill="none" stroke="#f1f1d5" strokeWidth="2" opacity=".85">
          <rect x="70" y="35" width="300" height="390" />
          <path d="M105 35v390M335 35v390M70 230h300M105 135h230M105 325h230M220 135v190" />
        </g>
        <path d="M65 230h310" stroke="#152c24" strokeWidth="7" />
        <path d="M65 230h310" stroke="#f1f1d5" strokeWidth="2" strokeDasharray="3 3" />
        <ellipse cx="130" cy="370" rx="26" ry="9" fill="#000" opacity=".18" />
        <ellipse cx="300" cy="83" rx="22" ry="8" fill="#000" opacity=".18" />
        <circle cx="130" cy="354" r="15" fill="#ddeb78" stroke="#f9ffdc" strokeWidth="3" />
        <circle cx="300" cy="72" r="14" fill="#eda779" stroke="#ffe2bd" strokeWidth="3" />
        <path d="M144 340Q250 260 296 142" fill="none" stroke="#e6ed88" strokeWidth="3" strokeDasharray="8 7" />
        <circle cx="296" cy="142" r="6" fill="#ebf08a" />
        <path d="M149 357Q180 374 220 372" fill="none" stroke="#f1f1d5" strokeWidth="2" strokeDasharray="5 6" />
        <circle cx="230" cy="372" r="15" fill="none" stroke="#f1f1d5" strokeWidth="2" strokeDasharray="4 4" />
        <text x="220" y="447" textAnchor="middle" fill="#d8e4c9" fontSize="12" letterSpacing="2">{t("game.preview.position")}</text>
      </svg>
      <div className="mt-5 flex items-start gap-3 rounded-xl border border-white/10 bg-black/15 p-4 text-sm text-white/80">
        <Crosshair className="mt-0.5 h-5 w-5 shrink-0 text-lime-200" />
        <p>{t("game.preview.caption")}</p>
      </div>
      <p className="mt-3 text-center text-xs text-white/45">{t("game.preview.note")}</p>
    </div>
  );
}

export default function Game() {
  const { t } = useTranslation();
  const modes = [
    { id: "academy", icon: BookOpen, number: "01" },
    { id: "computer", icon: Zap, number: "02" },
    { id: "duel", icon: Users, number: "03" },
  ] as const;
  return (
    <>
      <Helmet>
        <title>{t("game.meta.title")}</title>
        <meta name="description" content={t("game.meta.description")} />
        <link rel="canonical" href="https://ace-stats.com/jogo" />
      </Helmet>
      <Navbar />
      <main className="min-h-screen overflow-hidden pt-32">
        <section className="relative px-5 pb-20 pt-8 md:pb-28 md:pt-14">
          <div className="pointer-events-none absolute -left-40 top-8 h-[520px] w-[520px] rounded-full bg-tennis-green/10 blur-[140px]" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-20">
            <div>
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-tennis-green/30 bg-tennis-green/10 px-4 py-2 text-sm text-tennis-green"><Gamepad2 className="h-4 w-4" />{t("game.badge")}</div>
              <h1 className="font-display text-4xl font-bold leading-tight tracking-tight md:text-6xl">{t("game.hero.title")}<span className="mt-2 block text-gradient-green">{t("game.hero.highlight")}</span></h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">{t("game.hero.description")}</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button asChild variant="hero" size="xl"><a href={gameUrl()}>{t("game.play")}<ArrowRight className="ml-2 h-5 w-5" /></a></Button>
                <Button asChild variant="heroOutline" size="xl"><a href="#modos">{t("game.explore")}</a></Button>
              </div>
              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">{["browser", "guest", "free"].map(key => <span key={key} className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-tennis-green" />{t("game.hero." + key)}</span>)}</div>
            </div>
            <CourtPreview />
          </div>
        </section>
        <section id="modos" className="scroll-mt-28 border-y border-border/30 bg-card/40 px-5 py-20">
          <div className="mx-auto max-w-7xl">
            <p className="mb-3 text-sm uppercase tracking-[.2em] text-tennis-green">{t("game.modes.eyebrow")}</p>
            <h2 className="font-display text-3xl font-bold md:text-4xl">{t("game.modes.title")}</h2>
            <div className="mt-10 grid gap-5 md:grid-cols-3">{modes.map(mode => <article key={mode.id} className="flex flex-col rounded-2xl border border-border/50 bg-background p-7">
              <div className="mb-7 flex items-center justify-between"><mode.icon className="h-8 w-8 text-tennis-green" /><span className="font-display text-sm text-muted-foreground">/{mode.number}</span></div>
              <h3 className="font-display text-2xl font-semibold">{t("game.modes." + mode.id + ".title")}</h3>
              <p className="mb-7 mt-4 flex-1 leading-relaxed text-muted-foreground">{t("game.modes." + mode.id + ".description")}</p>
              <a className="inline-flex items-center gap-2 font-medium text-tennis-green hover:underline" href={gameUrl(mode.id)}>{t("game.modes." + mode.id + ".action")}<ArrowRight className="h-4 w-4" /></a>
            </article>)}</div>
          </div>
        </section>
        <section className="mx-auto grid max-w-7xl gap-12 px-5 py-20 md:grid-cols-2 md:gap-20">
          <div><Target className="mb-5 h-9 w-9 text-tennis-green" /><h2 className="font-display text-3xl font-bold">{t("game.learn.title")}</h2><p className="mt-5 leading-relaxed text-muted-foreground">{t("game.learn.description")}</p><p className="mt-4 text-sm leading-relaxed text-muted-foreground">{t("game.learn.note")}</p></div>
          <div className="rounded-2xl border border-border/50 bg-card/50 p-7"><TrendingUp className="mb-5 h-8 w-8 text-tennis-green" /><h2 className="font-display text-2xl font-semibold">{t("game.account.title")}</h2><p className="mt-4 leading-relaxed text-muted-foreground">{t("game.account.description")}</p><div className="mt-5 flex items-start gap-3 border-t border-border/40 pt-5 text-sm text-muted-foreground"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-tennis-green" /><p>{t("game.account.privacy")}</p></div></div>
        </section>
        <section className="px-5 pb-20"><div className="mx-auto max-w-7xl rounded-3xl border border-tennis-green/30 bg-tennis-green/10 p-8 text-center md:p-14"><p className="mb-4 text-sm uppercase tracking-[.2em] text-tennis-green">Ace Stats · Tennis Tático</p><h2 className="font-display text-3xl font-bold md:text-4xl">{t("game.cta.title")}</h2><p className="mx-auto mb-8 mt-4 max-w-xl leading-relaxed text-muted-foreground">{t("game.cta.description")}</p><Button asChild variant="hero" size="xl"><a href={gameUrl()}>{t("game.play")}<ArrowRight className="ml-2 h-5 w-5" /></a></Button></div></section>
      </main>
      <Footer />
    </>
  );
}
