import { createClient } from "@/lib/supabase/server";
import PersonalizationShowcase from "@/components/landing/PersonalizationShowcase";
import SampleBookViewer from "@/components/landing/SampleBookViewer";
import Pricing from "@/components/landing/Pricing";
import FAQ from "@/components/landing/FAQ";
import ClientLandingContent from "@/components/landing/ClientLandingContent";

export default async function HomePage() {
  let navUser = null;

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      navUser = user
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
    } catch {
      // Supabase not configured — continue without auth
    }
  }

  const middleContent = (
    <>
      <PersonalizationShowcase />
      <SampleBookViewer />
      <Pricing />
      <FAQ />
    </>
  );

  return (
    <ClientLandingContent user={navUser} middleContent={middleContent} />
  );
}
