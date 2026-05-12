"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface PreviewData {
  email: string;
  child_name: string | null;
  theme_id: string | null;
  preview_image_url: string | null;
  status: string;
}

const THEME_LABELS: Record<string, string> = {
  "royal-quest": "Royal Quest 👑",
  "dinosaur-discovery": "Dinosaur Discovery 🦕",
  "space-adventure": "Explore the Galaxy 🚀",
  "under-the-sea": "Under the Sea 🐠",
  "superhero-origin": "Superhero Origin ⚡",
  "kindness-courage": "Kindness & Courage 🌻",
};

export default function CheckoutFromPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/preview-status/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.status !== "ready") {
          router.replace(`/preview/result/${id}`);
          return;
        }
        setPreview({
          email: "",
          child_name: data.childName,
          theme_id: data.themeId,
          preview_image_url: data.previewImageUrl,
          status: data.status,
        });
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load preview. Please go back and try again.");
        setLoading(false);
      });
  }, [id, router]);

  async function handlePay() {
    setPaying(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout/from-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ previewRequestId: id }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Payment setup failed. Please try again.");
        setPaying(false);
        return;
      }
      window.location.href = json.checkoutUrl;
    } catch {
      setError("Something went wrong. Please try again.");
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFBF0] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-pink-100 border-t-[#E8417A] animate-spin" />
      </div>
    );
  }

  if (!preview) {
    return (
      <div className="min-h-screen bg-[#FFFBF0] flex flex-col items-center justify-center px-4 text-center">
        <p className="text-[#6b6b8a] mb-4">{error || "Preview not found."}</p>
        <a href="/preview/start" className="text-[#E8417A] font-semibold underline">
          Start a new preview
        </a>
      </div>
    );
  }

  const childName = preview.child_name || "Your child";
  const themeLabel = THEME_LABELS[preview.theme_id || ""] || "Adventure";

  return (
    <div className="min-h-screen bg-[#FFFBF0] flex flex-col items-center px-4 py-10">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="text-3xl mb-1">⭐</div>
        <h1 className="text-2xl font-bold text-[#1a1a2e]">Starmee Stories</h1>
      </div>

      <div className="w-full max-w-sm">
        {/* Order summary card */}
        <div className="bg-white rounded-3xl shadow-sm border border-pink-100 overflow-hidden">
          {/* Preview image */}
          {preview.preview_image_url && (
            <div className="relative w-full aspect-[3/4] bg-pink-50">
              <Image
                src={preview.preview_image_url}
                alt={`${childName}'s preview`}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          <div className="p-6">
            <h2 className="text-lg font-bold text-[#1a1a2e] mb-1">
              {childName}'s Full Storybook
            </h2>
            <p className="text-sm text-[#6b6b8a] mb-4">
              {themeLabel} — 12 illustrated pages
            </p>

            {/* What's included */}
            <ul className="space-y-2 mb-6">
              {[
                "📖 Full 12-page illustrated story",
                "🎨 AI illustrations featuring " + childName,
                "🖨️ Print-ready PDF download",
                "📧 Delivered to your email",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-[#4a4a5a]">
                  <span className="mt-0.5 text-[#E8417A] font-bold">✓</span>
                  {item}
                </li>
              ))}
            </ul>

            {/* Price row */}
            <div className="flex items-center justify-between bg-pink-50 rounded-2xl px-4 py-3 mb-5">
              <span className="text-sm font-semibold text-[#1a1a2e]">Total</span>
              <div className="text-right">
                <span className="text-2xl font-bold text-[#E8417A]">$9.99</span>
                <span className="text-xs text-[#6b6b8a] ml-1">one-time</span>
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center mb-4">{error}</p>
            )}

            <button
              onClick={handlePay}
              disabled={paying}
              className="w-full bg-[#E8417A] hover:bg-[#d43570] text-white font-bold py-4 rounded-2xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2 text-base"
            >
              {paying ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Redirecting to payment...
                </>
              ) : (
                "💳 Pay $9.99 — Create Full Book"
              )}
            </button>

            <p className="text-xs text-center text-[#9a9aaa] mt-3">
              Secure payment via Stripe · No subscription · Cancel anytime
            </p>
          </div>
        </div>

        {/* Trust badges */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-[#6b6b8a]">
          <div className="bg-white rounded-xl p-2.5 shadow-sm">
            <div className="text-base">🔒</div>Secure checkout
          </div>
          <div className="bg-white rounded-xl p-2.5 shadow-sm">
            <div className="text-base">📥</div>Instant PDF
          </div>
          <div className="bg-white rounded-xl p-2.5 shadow-sm">
            <div className="text-base">💝</div>Perfect gift
          </div>
        </div>

        <div className="mt-4 text-center">
          <a
            href={`/preview/result/${id}`}
            className="text-sm text-[#6b6b8a] underline"
          >
            ← Back to preview
          </a>
        </div>
      </div>
    </div>
  );
}
