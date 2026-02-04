import { useTranslation } from "react-i18next";
import logo from "@/assets/logo.png";
import { Link } from "react-router-dom";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="py-12 px-4 border-t border-border/30">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo and brand */}
          <div className="flex items-center gap-3">
            <img src={logo} alt="Ace-Stats" className="w-10 h-10 rounded-lg" />
            <div>
              <span className="font-display text-lg font-bold text-foreground">Ace-Stats</span>
              <p className="text-muted-foreground text-sm">{t("hero.subtitle")}</p>
            </div>
          </div>

          {/* Links */}
          <nav className="flex items-center gap-8">
            <Link to="/#features" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              {t("nav.features")}
            </Link>
            <Link to="/#app" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              {t("nav.app")}
            </Link>
            <Link to="/#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              {t("nav.howItWorks")}
            </Link>
            <Link to="/watch" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              {t("nav.watch")}
            </Link>
            <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              {t("nav.privacy")}
            </Link>
          </nav>

          {/* Copyright */}
          <div className="text-muted-foreground text-sm">
            {t("footer.copyright")}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
