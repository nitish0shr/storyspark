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
      "Absolutely. Your child's photo is stored securely using industry-standard encryption and is never shared with third parties. We use the photo only to create the illustrations for your book. You can delete your child's profile and photo at any time from your dashboard, and it will be permanently removed from our servers.",
  },
  {
    question: "How long does it take?",
    answer:
      "A preview of your storybook is ready in under 2 minutes! Once you purchase, the full high-resolution book with all illustrations is generated within 5 minutes. You'll receive a notification when your PDF is ready to download.",
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
      "After purchase, your book is available as an instant PDF download. It\u2019s also permanently saved to your Starmee account, so you can re-download it anytime from your dashboard. We\u2019ll also email you a direct download link.",
  },
  {
    question: "Can I print it at home?",
    answer:
      "Yes! The PDF is formatted for standard printing. You can print it at home on any color printer, or take it to a local print shop like Walgreens, FedEx Office, or Staples for professional-quality results. We\u2019re also launching printed book delivery soon.",
  },
  {
    question: "What's the return policy?",
    answer:
      "If you\u2019re not completely happy with your storybook, email us at hello@starmee.com within 30 days for a full refund \u2014 no questions asked. We want every family to love their book, and we stand behind the quality of every story we create.",
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
