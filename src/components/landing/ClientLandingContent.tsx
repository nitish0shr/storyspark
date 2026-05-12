"use client";

import Navbar from "@/components/shared/Navbar";
import Hero from "@/components/landing/Hero";
import Stats from "@/components/landing/Stats";
import HowItWorks from "@/components/landing/HowItWorks";
import Testimonials from "@/components/landing/Testimonials";
import Footer from "@/components/landing/Footer";

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
  return (
    <div className="min-h-screen bg-[#FDF5E7]">
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
