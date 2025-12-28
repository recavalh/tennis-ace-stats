import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Funciona em qual relógio?",
    answer: "O Ace-Stats funciona em qualquer smartwatch com Wear OS (Google), incluindo Samsung Galaxy Watch, Fossil, TicWatch, e outros. Requer Wear OS 3.0 ou superior.",
  },
  {
    question: "Posso cancelar quando quiser?",
    answer: "Sim! Você pode cancelar sua assinatura do Ace Pro a qualquer momento. Seus dados continuam salvos e você volta para o plano Free sem perder nenhuma partida registrada.",
  },
  {
    question: "Preciso do celular na quadra?",
    answer: "Não necessariamente. O relógio funciona de forma independente para registrar os pontos. Os dados sincronizam automaticamente quando você tiver conexão.",
  },
  {
    question: "Como funciona o Rivalry Mode?",
    answer: "O Rivalry Mode permite filtrar todas as suas estatísticas por adversário específico. Veja seu histórico completo contra cada oponente, identifique padrões e descubra como melhorar contra cada um.",
  },
  {
    question: "O que é o Fator Clutch?",
    answer: "É uma métrica exclusiva que mede sua performance em momentos decisivos: break points, tie-breaks, e game points importantes. Quanto maior o número, melhor você performa sob pressão.",
  },
  {
    question: "Meus dados são seguros?",
    answer: "Sim. Utilizamos criptografia de ponta a ponta e seus dados nunca são compartilhados com terceiros. Você é o único dono das suas estatísticas.",
  },
];

const FAQSection = () => {
  return (
    <section className="py-24 px-4 relative">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/20 to-transparent" />
      
      <div className="max-w-3xl mx-auto relative z-10">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Perguntas <span className="text-gradient-green">Frequentes</span>
          </h2>
          <p className="text-muted-foreground">
            Tudo que você precisa saber sobre o Ace-Stats.
          </p>
        </div>

        {/* FAQ accordion */}
        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="glass-card rounded-xl px-6 border-none"
            >
              <AccordionTrigger className="text-left font-semibold text-foreground hover:text-tennis-green hover:no-underline py-5">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQSection;
