import type { Metadata } from "next";
import { Nunito, DynaPuff } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { PostHogProvider } from "@/components/providers/PostHogProvider";
import GoogleTags from "@/components/shared/GoogleTags";
import MetaPixel from "@/components/shared/MetaPixel";
import SensitiveRouteGate from "@/components/shared/SensitiveRouteGate";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["400", "600", "700", "800", "900"],
});

const dynapuff = DynaPuff({
  subsets: ["latin"],
  variable: "--font-dynapuff",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Starmee — Personalised AI Storybooks for Kids",
  description:
    "Your child is the star of their own story! Upload a photo, pick an adventure, and AI creates a beautiful personalised storybook. Free preview — no credit card needed!",
  keywords: [
    "personalised children's book",
    "AI storybook",
    "custom kids book",
    "children's gift",
    "personalised gift for kids",
  ],
  openGraph: {
    title: "Starmee — Your Child Is the Star of Their Own Story!",
    description:
      "Upload a photo, pick a magical adventure theme, and get a beautifully illustrated storybook with your child as the hero. Free preview in about 2 minutes!",
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
        nunito.variable,
        dynapuff.variable
      )}
    >
      <body className="antialiased">
        <SensitiveRouteGate>
          <GoogleTags />
          <MetaPixel />
        </SensitiveRouteGate>
        <PostHogProvider>
          {children}
          <Toaster />
        </PostHogProvider>
      </body>
    </html>
  );
}
