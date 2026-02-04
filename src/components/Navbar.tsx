import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Watch, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import BetaAccessModal from "@/components/BetaAccessModal";

const Navbar = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [betaModalOpen, setBetaModalOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="mx-4 mt-4">
        <nav className="glass-card rounded-2xl px-4 md:px-6 py-3 max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <img src={logo} alt="Ace-Stats" className="w-10 h-10 rounded-lg" />
              <span className="font-display text-xl font-bold text-foreground hidden sm:inline">
                Ace-Stats
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <Link to="/#features" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
                {t("nav.features")}
              </Link>
              <Link to="/#app" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
                {t("nav.app")}
              </Link>
              <Link to="/#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
                {t("nav.howItWorks")}
              </Link>
              <Link to="/watch" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
                {t("nav.watch")}
              </Link>
            </div>

            {/* Right side */}
            <div className="hidden md:flex items-center gap-3">
              <LanguageSwitcher />
              <Button variant="hero" size="default" onClick={() => setBetaModalOpen(true)}>
                <Watch className="w-4 h-4 mr-2" />
                {t("nav.download")}
              </Button>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center gap-2 md:hidden">
              <LanguageSwitcher />
              <button
                className="p-2 text-foreground"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle menu"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isOpen && (
            <div className="md:hidden pt-4 pb-2 border-t border-border/30 mt-3">
              <div className="flex flex-col gap-4">
                <Link 
                  to="/#features" 
                  className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium py-2"
                  onClick={() => setIsOpen(false)}
                >
                  {t("nav.features")}
                </Link>
                <Link 
                  to="/#app" 
                  className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium py-2"
                  onClick={() => setIsOpen(false)}
                >
                  {t("nav.app")}
                </Link>
                <Link 
                  to="/#how-it-works" 
                  className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium py-2"
                  onClick={() => setIsOpen(false)}
                >
                  {t("nav.howItWorks")}
                </Link>
                <Link 
                  to="/watch" 
                  className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium py-2"
                  onClick={() => setIsOpen(false)}
                >
                  {t("nav.watch")}
                </Link>
                <Button variant="hero" size="default" className="w-full mt-2" onClick={() => setBetaModalOpen(true)}>
                  <Watch className="w-4 h-4 mr-2" />
                  {t("nav.download")}
                </Button>
              </div>
            </div>
          )}
        </nav>
      </div>

      <BetaAccessModal open={betaModalOpen} onOpenChange={setBetaModalOpen} />
    </header>
  );
};

export default Navbar;
