import { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy — StorySpark",
  description: "How StorySpark handles your data and protects your family's privacy.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: June 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-600 text-[15px] leading-relaxed">
          <section>
            <h2 className="font-heading text-xl font-semibold text-gray-900 mb-3">
              1. Information We Collect
            </h2>
            <p>
              When you use StorySpark, we collect the information you provide directly:
              your email address, your child&apos;s first name, age, and gender, and
              optionally a photo of your child. We also collect standard usage data
              (browser type, pages visited) to improve the service.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-gray-900 mb-3">
              2. Children&apos;s Photos
            </h2>
            <p className="mb-4">
              We take extra care with photos of children. Here is exactly what happens
              when you choose to upload one:
            </p>
            <ul className="list-disc pl-6 space-y-3">
              <li>
                <strong>Uploading a photo is completely optional.</strong> You can
                create a full, beautiful storybook without ever providing a photo. This
                step can be skipped at any time.
              </li>
              <li>
                <strong>The photo is used only to create that child&apos;s storybook.</strong>{" "}
                It is sent to our AI system, which reads it to write a brief description
                of your child&apos;s appearance (for example, hair colour, skin tone, and
                eye colour). That description is then used to make the storybook
                illustrations look like your child.
              </li>
              <li>
                <strong>The photo is deleted immediately after analysis.</strong> It is
                not saved to our servers, not stored in any database, and not retained
                in any backup. Only the short text description (e.g. &quot;curly auburn
                hair, fair skin, green eyes&quot;) is kept — and only for as long as
                your book exists.
              </li>
              <li>
                <strong>Photos are never used to train AI models.</strong> Your
                child&apos;s image is not shared with any AI training dataset, used to
                improve machine-learning systems, or retained for any purpose beyond
                generating your specific book.
              </li>
              <li>
                <strong>Only a parent or legal guardian may upload a photo.</strong> By
                uploading a photo, you confirm that you are the parent or legal guardian
                of the child pictured and that you have the right to use the photo for
                this purpose.
              </li>
              <li>
                <strong>To request deletion of your data</strong> — including the
                appearance description stored with your book — email us at{" "}
                <a
                  href="mailto:hello@starmeestories.com"
                  className="text-[#7C3AED] hover:underline"
                >
                  hello@starmeestories.com
                </a>{" "}
                and we will remove it promptly.
              </li>
            </ul>
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
              StorySpark is designed for parents and guardians to create books for
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
              providers necessary to operate StorySpark: Supabase (database), Stripe
              (payments), Resend (email), OpenAI (story and appearance analysis), and
              Replicate (illustration generation). Each provider has their own privacy
              policy.
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
                href="mailto:hello@starmeestories.com"
                className="text-[#7C3AED] hover:underline"
              >
                hello@starmeestories.com
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
