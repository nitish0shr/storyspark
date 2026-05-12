import { notFound } from "next/navigation";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase/admin";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getPreviewRequest(id: string) {
  if (!isAdminConfigured()) return null;
  const { data } = await supabaseAdmin
    .from("preview_requests")
    .select("id, child_name, theme_id, status, preview_image_url")
    .eq("id", id)
    .single();
  return data;
}

const THEME_LABELS: Record<string, string> = {
  "royal-quest": "Royal Quest 👑",
  "dinosaur-discovery": "Dinosaur Discovery 🦕",
  "space-adventure": "Explore the Galaxy 🚀",
  "under-the-sea": "Under the Sea 🐠",
  "superhero-origin": "Superhero Origin ⚡",
  "kindness-courage": "Kindness & Courage 🌻",
};

export default async function PreviewResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const req = await getPreviewRequest(id);

  if (!req || req.status !== "ready" || !req.preview_image_url) {
    notFound();
  }

  const childName = req.child_name || "Your child";
  const themeLabel = THEME_LABELS[req.theme_id] || "Adventure";

  return (
    <div className="min-h-screen bg-[#FFFBF0] flex flex-col items-center px-4 py-10">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="text-3xl mb-1">⭐</div>
        <h1 className="text-2xl font-bold text-[#1a1a2e]">Starmee Stories</h1>
      </div>

      <div className="w-full max-w-sm">
        {/* Preview card */}
        <div className="bg-white rounded-3xl shadow-md border border-pink-100 overflow-hidden">
          {/* Image */}
          <div className="relative w-full aspect-[3/4] bg-pink-50">
            <Image
              src={req.preview_image_url}
              alt={`${childName}'s storybook preview`}
              fill
              className="object-cover"
              priority
            />
            {/* Watermark overlay */}
            <div className="absolute inset-0 flex items-end justify-center pb-4 pointer-events-none">
              <div className="bg-black/30 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full">
                Free Preview — Full book unlocks after payment
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="px-6 pt-5 pb-4">
            <h2 className="text-lg font-bold text-[#1a1a2e]">
              {childName}'s {themeLabel} preview ✨
            </h2>
            <p className="text-sm text-[#6b6b8a] mt-1">
              This is just a taste — the full book has 12 beautifully illustrated pages
              where {childName} is the hero of every scene.
            </p>
          </div>

          {/* CTA */}
          <div className="px-6 pb-6">
            <Link
              href={`/checkout/from-preview/${req.id}`}
              className="block w-full bg-[#E8417A] hover:bg-[#d43570] text-white font-bold text-center py-4 rounded-2xl transition-colors text-base"
            >
              ✨ Create {childName}'s Full Storybook — $9.99
            </Link>

            <p className="text-xs text-center text-[#9a9aaa] mt-2">
              One-time payment · Instant digital download · Printable PDF
            </p>
          </div>
        </div>

        {/* Trust badges */}
        <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs text-[#6b6b8a]">
          <div className="bg-white rounded-xl p-2.5 shadow-sm">
            <div className="text-base">📖</div>12 full pages
          </div>
          <div className="bg-white rounded-xl p-2.5 shadow-sm">
            <div className="text-base">🎨</div>AI illustrations
          </div>
          <div className="bg-white rounded-xl p-2.5 shadow-sm">
            <div className="text-base">📥</div>PDF download
          </div>
        </div>

        {/* Share nudge */}
        <div className="mt-5 bg-white rounded-2xl border border-pink-100 p-4 text-center">
          <p className="text-sm font-semibold text-[#1a1a2e] mb-1">
            Know someone who'd love this?
          </p>
          <p className="text-xs text-[#6b6b8a]">
            Share Starmee with a friend →{" "}
            <a
              href="https://starmeestories.com"
              className="text-[#E8417A] font-semibold underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              starmeestories.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
