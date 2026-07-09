"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Is my child's photo safe?",
    answer:
      "We use the photo only to create the illustrations for your book. Your child's photo stays private and is never shared with third parties. You can delete your child's profile and photo at any time from your dashboard, and it will be permanently removed from our servers.",
  },
  {
    question: "How long does it take?",
    answer:
      "You'll see a preview in about 2 minutes. Final timing may vary slightly depending on image upload and generation speed. Once you purchase, the full high-resolution book with all illustrations is generated shortly after.",
  },
  {
    question: "What ages is this for?",
    answer:
      "We have themes designed for children ages 2\u201312, including adventure stories, fairy tales, superhero origins, and heartfelt stories about kindness and courage.",
  },
  {
    question: "Can I gift this?",
    answer:
      "Yes! During checkout, you can mark your order as a gift, add a personalised message, and enter the recipient's email. We'll deliver the storybook directly to them with your heartfelt note.",
  },
  {
    question: "Will the illustrations look like my child?",
    answer:
      "The illustrations are stylised watercolour art inspired by your child\u2019s photo features \u2014 hair colour, skin tone, facial structure, and more. They won\u2019t be photorealistic, but parents consistently recognise their child in the art. The style is warm, whimsical, and designed to feel like a hand-illustrated children\u2019s book.",
  },
  {
    question: "How do I access my book after purchasing?",
    answer:
      "After purchase, your book is available as an instant PDF download. It\u2019s also permanently saved to your account, so you can re-download it anytime from your dashboard. We\u2019ll also email you a direct download link.",
  },
  {
    question: "Can I print it at home?",
    answer:
      "Yes! The PDF is formatted for standard printing. You can print it at home on any color printer, or take it to a local print shop for professional-quality results.",
  },
];

export default function FAQ() {
  return (
    <section id="faq" className="py-20 sm:py-28 relative bg-[#EDE4FF]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <div className="inline-block bg-[#CB6CE6] border-2 border-[#262625] rounded-full px-5 py-1.5 shadow-[3px_3px_0px_#262625] mb-5">
            <span className="font-body font-bold text-sm text-white">Got questions? 🤔</span>
          </div>
          <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-[#262625] mb-4">
            You Asked, We Answered!
          </h2>
        </div>

        <div className="max-w-2xl mx-auto space-y-3">
          <Accordion className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                className="bg-white border-2 border-[#262625] rounded-2xl px-6 shadow-[4px_4px_0px_#262625] transition-shadow"
              >
                <AccordionTrigger className="text-left font-heading text-base font-bold text-[#262625] hover:text-[#5E17EB] hover:no-underline py-4 data-[open]:text-[#5E17EB]">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="font-body text-sm text-[#262625]/70 leading-relaxed pb-4">
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
