import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/context/ThemeContext";
import ThemeToggle from "@/components/shared/ThemeToggle";

export const metadata: Metadata = {
  title: "Starmee — Personalized AI Storybooks for Kids",
  description:
    "Upload a photo, pick an adventure, and create a beautiful personalized storybook with your child as the hero.",
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
      "Upload a photo, pick an adventure theme, and get a beautifully illustrated storybook featuring your child.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
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
