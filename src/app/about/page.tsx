import { Metadata } from "next";
import { Sparkles, Heart, Shield, Palette } from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "About — Starmee",
  description: "Learn about Starmee and our mission to make every child the hero of their own story.",
};

export default function AboutPage() {
  const values = [
    {
      icon: Heart,
      title: "Family First",
      description:
        "Every decision we make starts with the question: does this create a better experience for families?",
    },
    {
      icon: Shield,
      title: "Privacy by Design",
      description:
        "Your child's data is parent-controlled. We never share photos for AI training, and you can delete everything at any time.",
    },
    {
      icon: Palette,
      title: "Quality Over Speed",
      description:
        "We use stylized, watercolor-inspired illustrations — never photorealistic images of children. Every book is crafted to feel like a real children's book.",
    },
    {
      icon: Sparkles,
      title: "Personalization That Matters",
      description:
        "We don't just swap names into a template. Our AI weaves your child's details into a unique story that feels written just for them.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          About Starmee
        </h1>
        <p className="text-lg text-gray-500 mb-12 leading-relaxed">
          Starmee is an AI-powered platform that turns your child into the hero of
          their own beautifully illustrated storybook. Upload a photo, choose an
          adventure, and in minutes you&apos;ll have a personalized book your family
          will treasure.
        </p>

        <h2 className="font-heading text-2xl font-bold text-gray-900 mb-6">
          What We Believe
        </h2>
        <div className="grid gap-6 mb-12">
          {values.map((value) => (
            <div
              key={value.title}
              className="flex gap-4 p-5 rounded-xl bg-white border border-violet-50 shadow-sm"
            >
              <div className="h-10 w-10 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                <value.icon className="h-5 w-5 text-[#7C3AED]" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{value.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {value.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <h2 className="font-heading text-2xl font-bold text-gray-900 mb-4">
          Our Story
        </h2>
        <p className="text-gray-600 leading-relaxed">
          Starmee was born from a simple idea: every child deserves to see
          themselves as the hero. We combine the latest in AI technology with the
          warmth and care of traditional children&apos;s book illustration to create
          something truly special — personalized stories that families read together
          again and again.
        </p>
      </main>
      <Footer />
    </div>
  );
}
