"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const THEMES = [
  {
    id: "royal-quest",
    name: "Royal Quest",
    emoji: "👑",
    desc: "Castles, magic, and brave adventures",
    bg: "from-yellow-50 to-amber-50",
    border: "border-amber-300",
    selected: "bg-amber-50 border-amber-500 ring-2 ring-amber-300",
  },
  {
    id: "dinosaur-discovery",
    name: "Dinosaur Discovery",
    emoji: "🦕",
    desc: "Explore the prehistoric jungle",
    bg: "from-green-50 to-emerald-50",
    border: "border-green-300",
    selected: "bg-green-50 border-green-500 ring-2 ring-green-300",
  },
  {
    id: "space-adventure",
    name: "Explore the Galaxy",
    emoji: "🚀",
    desc: "Rocket ships, stars, and planets",
    bg: "from-indigo-50 to-violet-50",
    border: "border-indigo-300",
    selected: "bg-indigo-50 border-indigo-500 ring-2 ring-indigo-300",
  },
];

export default function PreviewStartPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState<number | "">("");
  const [gender, setGender] = useState("child");
  const [themeId, setThemeId] = useState("royal-quest");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    setError(null);
    setLoading(true);

    try {
      // 1. Create preview request
      const res = await fetch("/api/preview-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          childName,
          childAge: childAge === "" ? 5 : Number(childAge),
          themeId,
          preferences: { gender },
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      const previewRequestId: string = json.id;

      // 2. Upload photo if provided
      if (photoFile) {
        const form = new FormData();
        form.append("file", photoFile);
        form.append("previewRequestId", previewRequestId);
        await fetch("/api/upload-preview-photo", { method: "POST", body: form });
        // Non-fatal if upload fails — generation uses default appearance
      }

      // 3. Trigger image generation (fire-and-forget)
      await fetch("/api/generate-preview-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ previewRequestId }),
      });

      // 4. Go to loading page
      router.push(`/preview/loading/${previewRequestId}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FFFBF0] flex flex-col items-center px-4 py-10">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="text-3xl mb-1">⭐</div>
        <h1 className="text-2xl font-bold text-[#1a1a2e]">Starmee Stories</h1>
        <p className="text-sm text-[#6b6b8a] mt-1">Your child is the star of their own story</p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-2.5 rounded-full transition-all ${
              s <= step ? "w-8 bg-[#E8417A]" : "w-2.5 bg-[#E8417A]/20"
            }`}
          />
        ))}
      </div>

      <div className="w-full max-w-md">
        {/* ── Step 1: Child details ── */}
        {step === 1 && (
          <div className="bg-white rounded-3xl shadow-sm border border-pink-100 p-7">
            <h2 className="text-xl font-bold text-[#1a1a2e] mb-1">Who's the star? ✨</h2>
            <p className="text-sm text-[#6b6b8a] mb-6">We'll create a free preview just for them.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#1a1a2e] mb-1.5">Your email</label>
                <input
                  type="email"
                  placeholder="parent@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-pink-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8417A]/30 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1a1a2e] mb-1.5">Child's first name</label>
                <input
                  type="text"
                  placeholder="e.g. Maya"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  className="w-full border border-pink-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8417A]/30 bg-white"
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-[#1a1a2e] mb-1.5">Age</label>
                  <input
                    type="number"
                    placeholder="5"
                    min={1}
                    max={12}
                    value={childAge}
                    onChange={(e) => setChildAge(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full border border-pink-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8417A]/30 bg-white"
                  />
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-semibold text-[#1a1a2e] mb-1.5">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full border border-pink-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8417A]/30 bg-white"
                  >
                    <option value="child">Any</option>
                    <option value="girl">Girl</option>
                    <option value="boy">Boy</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (!email || !childName) {
                  setError("Please enter your email and child's name.");
                  return;
                }
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                  setError("Please enter a valid email address.");
                  return;
                }
                setError(null);
                setStep(2);
              }}
              className="mt-6 w-full bg-[#E8417A] hover:bg-[#d43570] text-white font-bold py-3.5 rounded-2xl transition-colors"
            >
              Continue →
            </button>

            {error && <p className="text-red-500 text-sm text-center mt-3">{error}</p>}
          </div>
        )}

        {/* ── Step 2: Theme selection ── */}
        {step === 2 && (
          <div className="bg-white rounded-3xl shadow-sm border border-pink-100 p-7">
            <h2 className="text-xl font-bold text-[#1a1a2e] mb-1">Choose the adventure! 🗺️</h2>
            <p className="text-sm text-[#6b6b8a] mb-5">
              {childName} will be the hero of this story.
            </p>

            <div className="space-y-3">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setThemeId(t.id)}
                  className={`w-full text-left rounded-2xl border p-4 transition-all ${
                    themeId === t.id ? t.selected : `bg-gradient-to-r ${t.bg} ${t.border} hover:opacity-90`
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{t.emoji}</span>
                    <div>
                      <div className="font-bold text-[#1a1a2e] text-sm">{t.name}</div>
                      <div className="text-xs text-[#6b6b8a]">{t.desc}</div>
                    </div>
                    {themeId === t.id && (
                      <span className="ml-auto text-[#E8417A] font-bold text-lg">✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(1)}
                className="flex-1 border border-pink-200 text-[#6b6b8a] font-semibold py-3 rounded-2xl hover:bg-pink-50 transition-colors text-sm"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-[2] bg-[#E8417A] hover:bg-[#d43570] text-white font-bold py-3 rounded-2xl transition-colors"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Photo upload + submit ── */}
        {step === 3 && (
          <div className="bg-white rounded-3xl shadow-sm border border-pink-100 p-7">
            <h2 className="text-xl font-bold text-[#1a1a2e] mb-1">Add {childName}'s photo 📸</h2>
            <p className="text-sm text-[#6b6b8a] mb-5">
              Optional — but makes the illustration look just like them!
            </p>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-pink-200 rounded-2xl p-6 text-center hover:border-[#E8417A]/50 hover:bg-pink-50/50 transition-colors"
            >
              {photoPreview ? (
                <div className="flex flex-col items-center gap-2">
                  <Image
                    src={photoPreview}
                    alt="Child photo preview"
                    width={96}
                    height={96}
                    className="rounded-xl object-cover w-24 h-24 mx-auto"
                  />
                  <span className="text-sm text-[#E8417A] font-semibold">Photo added ✓ (tap to change)</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-[#6b6b8a]">
                  <div className="text-3xl">📷</div>
                  <span className="text-sm font-semibold">Tap to upload a photo</span>
                  <span className="text-xs">JPEG or PNG, under 10 MB</span>
                </div>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoChange}
            />

            {/* Privacy note */}
            <p className="text-xs text-[#9a9aaa] text-center mt-3">
              🔒 Photo is only used to generate your preview and is never shared.
            </p>

            {/* Trust badges */}
            <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs text-[#6b6b8a]">
              <div className="bg-pink-50 rounded-xl p-2">
                <div className="text-base">⚡</div>
                <div>Preview in ~2 min</div>
              </div>
              <div className="bg-pink-50 rounded-xl p-2">
                <div className="text-base">🔒</div>
                <div>Photo stays private</div>
              </div>
              <div className="bg-pink-50 rounded-xl p-2">
                <div className="text-base">💳</div>
                <div>No card needed</div>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setStep(2)}
                disabled={loading}
                className="flex-1 border border-pink-200 text-[#6b6b8a] font-semibold py-3 rounded-2xl hover:bg-pink-50 transition-colors text-sm disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-[2] bg-[#E8417A] hover:bg-[#d43570] text-white font-bold py-3 rounded-2xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="animate-spin text-lg">⏳</span>
                    Creating preview...
                  </>
                ) : (
                  "✨ Create Free Preview"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
