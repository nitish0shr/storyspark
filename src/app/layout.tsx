import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { PostHogProvider } from "@/components/providers/PostHogProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
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
    <html lang="en" className={cn(inter.variable, playfair.variable)}>
      <body className="font-sans antialiased bg-background text-foreground">
        <PostHogProvider>
          {children}
          <Toaster />
        </PostHogProvider>
      </body>
    </html>
  );
}
