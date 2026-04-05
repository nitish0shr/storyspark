import { Metadata } from "next";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Terms of Service — StorySpark",
  description: "Terms and conditions for using StorySpark.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          Terms of Service
        </h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: April 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-600 text-[15px] leading-relaxed">
          <section>
            <h2 className="font-heading text-xl font-semibold text-gray-900 mb-3">
              1. Service Description
            </h2>
            <p>
              StorySpark is an AI-powered platform that creates personalized,
              illustrated children&apos;s storybooks. By using our service, you agree
              to these terms.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-gray-900 mb-3">
              2. Account and Eligibility
            </h2>
            <p>
              You must be at least 18 years old to create an account. You are
              responsible for maintaining the security of your account credentials.
              Parent or guardian accounts are used to manage content for children.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-gray-900 mb-3">
              3. Content and Ownership
            </h2>
            <p>
              You retain ownership of any photos you upload. StorySpark grants you a
              personal, non-commercial license to use the generated storybooks
              (illustrations and text) for personal and gift purposes. You may print,
              share, and display your purchased books.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-gray-900 mb-3">
              4. Purchases and Refunds
            </h2>
            <p>
              All purchases are processed securely through Stripe. Digital products are
              delivered instantly upon payment. If you are unsatisfied with the quality
              of your generated book, contact us within 14 days for a full refund.
              We stand behind a 100% satisfaction guarantee.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-gray-900 mb-3">
              5. AI-Generated Content
            </h2>
            <p>
              Storybooks are generated using artificial intelligence. While we strive
              for high quality, AI-generated content may occasionally contain
              imperfections. We review content for safety and appropriateness but
              cannot guarantee perfection in every output.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-gray-900 mb-3">
              6. Acceptable Use
            </h2>
            <p>
              You agree not to misuse the service, upload inappropriate content, or
              attempt to circumvent security measures. We reserve the right to
              terminate accounts that violate these terms.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-gray-900 mb-3">
              7. Limitation of Liability
            </h2>
            <p>
              StorySpark is provided &quot;as is.&quot; We are not liable for indirect,
              incidental, or consequential damages arising from your use of the
              service. Our total liability is limited to the amount you paid for the
              specific product in question.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-gray-900 mb-3">
              8. Changes to Terms
            </h2>
            <p>
              We may update these terms from time to time. Continued use of the
              service after changes constitutes acceptance of the updated terms.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
