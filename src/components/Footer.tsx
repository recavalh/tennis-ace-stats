import logo from "@/assets/logo.png";

const Footer = () => {
  return (
    <footer className="py-12 px-4 border-t border-border/30">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo and brand */}
          <div className="flex items-center gap-3">
            <img src={logo} alt="Ace-Stats" className="w-10 h-10 rounded-lg" />
            <div>
              <span className="font-display text-lg font-bold text-foreground">Ace-Stats</span>
              <p className="text-muted-foreground text-sm">Wearable Tennis Performance</p>
            </div>
          </div>

          {/* Links */}
          <nav className="flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              Recursos
            </a>
            <a href="#app" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              App
            </a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              Como Funciona
            </a>
          </nav>

          {/* Copyright */}
          <div className="text-muted-foreground text-sm">
            © 2024 Ace-Stats. Todos os direitos reservados.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
