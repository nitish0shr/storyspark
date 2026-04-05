"use client";

import { useTheme } from "@/context/ThemeContext";

import Navbar from "@/components/shared/Navbar";
import NavbarClassic from "@/components/shared/NavbarClassic";

import Hero from "@/components/landing/Hero";
import Stats from "@/components/landing/Stats";
import HowItWorks from "@/components/landing/HowItWorks";
import Testimonials from "@/components/landing/Testimonials";
import Footer from "@/components/landing/Footer";

import HeroClassic from "@/components/landing/classic/Hero";
import StatsClassic from "@/components/landing/classic/Stats";
import HowItWorksClassic from "@/components/landing/classic/HowItWorks";
import TestimonialsClassic from "@/components/landing/classic/Testimonials";
import FooterClassic from "@/components/landing/classic/Footer";

interface NavbarUser {
  id: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
}

interface Props {
  user?: NavbarUser | null;
  middleContent: React.ReactNode;
}

export default function ClientLandingContent({ user, middleContent }: Props) {
  const { theme } = useTheme();

  if (theme === "classic") {
    return (
      <div className="min-h-screen bg-[#FFFBF5]">
        <NavbarClassic user={user} />
        <HeroClassic />
        <StatsClassic />
        <HowItWorksClassic />
        {middleContent}
        <TestimonialsClassic />
        <FooterClassic />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFBF0]">
      <Navbar user={user} />
      <Hero />
      <Stats />
      <HowItWorks />
      {middleContent}
      <Testimonials />
      <Footer />
    </div>
  );
}
