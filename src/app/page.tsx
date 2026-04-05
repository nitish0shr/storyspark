import { createClient } from "@/lib/supabase/server";
import { themes } from "@/data/themes";
import Navbar from "@/components/shared/Navbar";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import ThemeShowcase from "@/components/landing/ThemeShowcase";
import SampleBookViewer from "@/components/landing/SampleBookViewer";
import Testimonials from "@/components/landing/Testimonials";
import Pricing from "@/components/landing/Pricing";
import FAQ from "@/components/landing/FAQ";
import Footer from "@/components/landing/Footer";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const navUser = user
    ? {
        id: user.id,
        email: user.email ?? undefined,
        name:
          user.user_metadata?.full_name ??
          user.user_metadata?.name ??
          undefined,
        avatarUrl: user.user_metadata?.avatar_url ?? undefined,
      }
    : null;

  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      <Navbar user={navUser} />
      <Hero />
      <HowItWorks />
      <ThemeShowcase themes={themes} />
      <SampleBookViewer />
      <Testimonials />
      <Pricing />
      <FAQ />
      <Footer />
    </div>
  );
}
