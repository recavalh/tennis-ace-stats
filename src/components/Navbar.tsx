import { Button } from "@/components/ui/button";
import { Watch, Menu, X } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/logo.png";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="mx-4 mt-4">
        <nav className="glass-card rounded-2xl px-4 md:px-6 py-3 max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <a href="#" className="flex items-center gap-3">
              <img src={logo} alt="Ace-Stats" className="w-10 h-10 rounded-lg" />
              <span className="font-display text-xl font-bold text-foreground hidden sm:inline">
                Ace-Stats
              </span>
            </a>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
                Recursos
              </a>
              <a href="#app" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
                App
              </a>
              <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
                Como Funciona
              </a>
            </div>

            {/* CTA Button */}
            <div className="hidden md:block">
              <Button variant="hero" size="default">
                <Watch className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-foreground"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isOpen && (
            <div className="md:hidden pt-4 pb-2 border-t border-border/30 mt-3">
              <div className="flex flex-col gap-4">
                <a 
                  href="#features" 
                  className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium py-2"
                  onClick={() => setIsOpen(false)}
                >
                  Recursos
                </a>
                <a 
                  href="#app" 
                  className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium py-2"
                  onClick={() => setIsOpen(false)}
                >
                  App
                </a>
                <a 
                  href="#how-it-works" 
                  className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium py-2"
                  onClick={() => setIsOpen(false)}
                >
                  Como Funciona
                </a>
                <Button variant="hero" size="default" className="w-full mt-2">
                  <Watch className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
