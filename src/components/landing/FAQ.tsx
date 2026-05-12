"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How does AI illustration work?",
    answer:
      "We use advanced AI to create warm, watercolor-style illustrations. Your child's photo is analyzed to capture their unique features \u2014 hair color, skin tone, eye color, and more. The AI then generates beautiful, age-appropriate illustrations with your child as the main character throughout the story. Each illustration is unique and created just for your book.",
  },
  {
    question: "Is my child's photo safe?",
    answer:
      "Your child's photo is stored in a private bucket and used only to create the storybook experience. We send the minimum needed image context to our AI providers for generation and do not sell child data. Unused child profiles can be deleted from your dashboard; profiles tied to purchased books are retained so the book stays accessible.",
  },
  {
    question: "How long does it take?",
    answer:
      "A preview is usually ready in a few minutes. After purchase, the full book is generated and then manually reviewed before delivery. Most launch orders should be ready the same day, and we'll email you as soon as the PDF is approved.",
  },
  {
    question: "What ages is this for?",
    answer:
      "We have themes designed for children ages 2\u201312, including adventure stories, fairy tales, superhero origins, and heartfelt stories about kindness and courage. We also support special pre-birth and newborn editions that make perfect baby shower or welcome gifts.",
  },
  {
    question: "Can I gift this?",
    answer:
      "Yes! During checkout, you can add a personalized gift message and enter the recipient's email. We'll deliver the storybook directly to them with your heartfelt note. It makes a wonderful birthday, holiday, or just-because gift that families treasure.",
  },
  {
    question: "Will the illustrations look like my child?",
    answer:
      "The illustrations are stylized watercolor art inspired by your child\u2019s photo features \u2014 hair color, skin tone, facial structure, and more. They won\u2019t be photorealistic, but parents consistently recognize their child in the art. The style is warm, whimsical, and designed to feel like a hand-illustrated children\u2019s book.",
  },
  {
    question: "How do I access my book after purchasing?",
    answer:
      "After purchase, your book is generated and reviewed. Once approved, it is saved to your Starmee account and we email you a private download link.",
  },
  {
    question: "Can I print it at home?",
    answer:
      "Yes! The PDF is formatted for standard printing. You can print it at home on any color printer, or take it to a local print shop like Walgreens, FedEx Office, or Staples for professional-quality results. We\u2019re also launching printed book delivery soon.",
  },
  {
    question: "What's the return policy?",
    answer:
      "If you\u2019re not completely happy with your storybook, email us at hello@starmee.com within 7 days for a full refund. We want every family to love the book they receive.",
  },
];

export default function FAQ() {
  return (
    <section id="faq" className="py-20 sm:py-28 relative bg-[#E0F4FD]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-14">
          <div className="inline-block bg-[#4FC3F7] border-2 border-[#1a1a2e] rounded-full px-5 py-1.5 shadow-[3px_3px_0px_#1a1a2e] mb-5">
            <span className="font-body font-bold text-sm text-[#1a1a2e]">Got questions? 🤔</span>
          </div>
          <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1a1a2e] mb-4">
            You Asked, We Answer!
          </h2>
        </div>

        {/* Accordion */}
        <div className="max-w-2xl mx-auto space-y-3">
          <Accordion className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                className="bg-white border-2 border-[#1a1a2e] rounded-2xl px-6 shadow-[4px_4px_0px_#1a1a2e] transition-shadow"
              >
                <AccordionTrigger className="text-left font-heading text-base font-bold text-[#1a1a2e] hover:text-[#7B2D8B] hover:no-underline py-4 data-[open]:text-[#7B2D8B]">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="font-body text-sm text-[#1a1a2e]/70 leading-relaxed pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
