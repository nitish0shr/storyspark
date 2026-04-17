import type { Metadata } from "next";
import { Inter, Playfair_Display, Nunito, Baloo_2 } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/context/ThemeContext";
import ThemeToggle from "@/components/shared/ThemeToggle";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "600", "700", "800"],
});

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
  title: "Starmee — Personalized AI Storybooks for Kids",
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
    title: "Starmee — Your Child Is the Star of Their Own Storybook",
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
    <html
      lang="en"
      className={cn(
        inter.variable,
        playfair.variable,
        nunito.variable,
        baloo.variable
      )}
    >
      <body className="antialiased">
        <ThemeProvider>
          {children}
          <ThemeToggle />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
