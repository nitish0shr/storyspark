import { Metadata } from "next";
import { Mail, MessageCircle } from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Contact — StorySpark",
  description: "Get in touch with the StorySpark team.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-16 sm:py-20">
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          Contact Us
        </h1>
        <p className="text-lg text-gray-500 mb-10">
          We&apos;d love to hear from you. Whether you have a question, feedback, or
          need help with your order, we&apos;re here for you.
        </p>

        <div className="space-y-6">
          <div className="flex gap-4 p-6 rounded-xl bg-white border border-violet-50 shadow-sm">
            <div className="h-10 w-10 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
              <Mail className="h-5 w-5 text-[#7C3AED]" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 mb-1">Email</h2>
              <p className="text-sm text-gray-500 mb-2">
                For general inquiries, support, or order help:
              </p>
              <a
                href="mailto:hello@storyspark.co"
                className="text-[#7C3AED] font-medium hover:underline"
              >
                hello@storyspark.co
              </a>
            </div>
          </div>

          <div className="flex gap-4 p-6 rounded-xl bg-white border border-violet-50 shadow-sm">
            <div className="h-10 w-10 rounded-lg bg-pink-100 flex items-center justify-center shrink-0">
              <MessageCircle className="h-5 w-5 text-[#EC4899]" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 mb-1">Feedback</h2>
              <p className="text-sm text-gray-500">
                Love your book? Have a suggestion? We read every message and use your
                feedback to make StorySpark better for all families.
              </p>
            </div>
          </div>
        </div>

        <p className="mt-10 text-sm text-gray-400">
          We typically respond within 24 hours on business days.
        </p>
      </main>
      <Footer />
    </div>
  );
}
