import type { Metadata } from "next";
import { Nunito, Baloo_2 } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { PostHogProvider } from "@/components/providers/PostHogProvider";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["400", "600", "700", "800", "900"],
});

const baloo = Baloo_2({
  subsets: ["latin"],
  variable: "--font-baloo",
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "StorySpark — Personalized AI Storybooks for Kids",
  description:
    "Upload a photo, pick an adventure, and AI creates a beautiful personalized storybook with your child as the hero. Digital delivery in under 2 minutes.",
  keywords: [
    "personalized children's book",
    "AI storybook",
    "custom kids book",
    "children's gift",
    "personalized gift",
  ],
  openGraph: {
    title: "StorySpark — Your Child Is the Star of Their Own Storybook",
    description:
      "Upload a photo, pick an adventure theme, and get a beautifully illustrated storybook featuring your child in under 2 minutes.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(nunito.variable, baloo.variable)}>
      <body className="font-sans antialiased bg-[#FFFBF0] text-[#1a1a2e]">
        <PostHogProvider>
          {children}
          <Toaster />
        </PostHogProvider>
      </body>
    </html>
  );
}
