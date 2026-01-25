import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, TestTube, Users, Sparkles } from "lucide-react";

interface BetaAccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLScmIgziJHIsmrT_acXjXuDtJcZ0yprOzqm_4Bx-qFd6dNWMQw/viewform";

const BetaAccessModal = ({ open, onOpenChange }: BetaAccessModalProps) => {
  const handleAccessForm = () => {
    window.open(GOOGLE_FORM_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-tennis-green/20 bg-card">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-tennis-green/20 flex items-center justify-center">
            <TestTube className="w-8 h-8 text-tennis-green" />
          </div>
          <DialogTitle className="font-display text-2xl text-center">
            Beta Fechado
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            O Ace-Stats está em fase de testes internos. Solicite acesso para ser um dos primeiros a experimentar!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Benefits */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-tennis-green/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-tennis-green" />
              </div>
              <span className="text-muted-foreground">
                Acesso antecipado a todas as funcionalidades
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-tennis-green/10 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-tennis-green" />
              </div>
              <span className="text-muted-foreground">
                Faça parte da comunidade de testadores
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-tennis-green/10 flex items-center justify-center flex-shrink-0">
                <TestTube className="w-4 h-4 text-tennis-green" />
              </div>
              <span className="text-muted-foreground">
                Ajude a moldar o futuro do app
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button 
            variant="hero" 
            size="lg" 
            className="w-full"
            onClick={handleAccessForm}
          >
            Solicitar Acesso
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full text-muted-foreground"
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BetaAccessModal;
