import { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy — Starmee",
  description: "How Starmee handles your data and protects your family's privacy.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: April 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-600 text-[15px] leading-relaxed">
          <section>
            <h2 className="font-heading text-xl font-semibold text-gray-900 mb-3">
              1. Information We Collect
            </h2>
            <p>
              When you use Starmee, we collect the information you provide directly:
              your email address, your child&apos;s first name, age, and gender, and
              optionally a photo of your child. We also collect standard usage data
              (browser type, pages visited) to improve the service.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-gray-900 mb-3">
              2. How We Use Your Child&apos;s Photo
            </h2>
            <p>
              Your child&apos;s photo is used solely to generate a stylized,
              illustrated character for their personalized storybook. We never create
              photorealistic images of children. Photos are processed by our AI
              illustration service and are not used to train AI models. You can request
              deletion of any uploaded photos at any time.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-gray-900 mb-3">
              3. Data Storage and Security
            </h2>
            <p>
              Your data is stored securely using Supabase (hosted on AWS) with
              row-level security policies. Payment information is handled entirely by
              Stripe — we never store credit card details. All data transmission uses
              HTTPS encryption.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-gray-900 mb-3">
              4. Children&apos;s Privacy (COPPA)
            </h2>
            <p>
              Starmee is designed for parents and guardians to create books for
              their children. Only parents create accounts. Child information is stored
              within parent accounts and is parent-controlled. We do not knowingly
              collect information directly from children under 13.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-gray-900 mb-3">
              5. Data Sharing
            </h2>
            <p>
              We do not sell your personal information. We share data only with service
              providers necessary to operate Starmee: Supabase (database), Stripe
              (payments), Resend (email), OpenAI (story generation), and Replicate
              (illustration generation). Each provider has their own privacy policy.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-gray-900 mb-3">
              6. Your Rights
            </h2>
            <p>
              You can access, update, or delete your account and all associated data
              at any time from your dashboard. To request complete data deletion,
              contact us at{" "}
              <Link href="/contact" className="text-[#7C3AED] hover:underline">
                our contact page
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-gray-900 mb-3">
              7. Contact
            </h2>
            <p>
              For privacy-related questions, email us at{" "}
              <a
                href="mailto:privacy@starmee.com"
                className="text-[#7C3AED] hover:underline"
              >
                privacy@starmee.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
