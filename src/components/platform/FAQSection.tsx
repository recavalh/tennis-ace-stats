import { useTranslation } from "react-i18next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQSection = () => {
  const { t } = useTranslation();

  const faqs = [
    {
      questionKey: "platform.faq.items.watches.question",
      answerKey: "platform.faq.items.watches.answer",
    },
    {
      questionKey: "platform.faq.items.cancel.question",
      answerKey: "platform.faq.items.cancel.answer",
    },
    {
      questionKey: "platform.faq.items.freeForever.question",
      answerKey: "platform.faq.items.freeForever.answer",
    },
    {
      questionKey: "platform.faq.items.dataSync.question",
      answerKey: "platform.faq.items.dataSync.answer",
    },
  ];

  return (
    <section className="py-24 px-4 relative">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/20 to-transparent" />
      
      <div className="max-w-3xl mx-auto relative z-10">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("platform.faq.title")} <span className="text-gradient-green">{t("platform.faq.titleHighlight")}</span>
          </h2>
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
                {t(faq.questionKey)}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                {t(faq.answerKey)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQSection;
