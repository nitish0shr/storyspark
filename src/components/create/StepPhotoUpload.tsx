"use client";

import { useRef, useState, useEffect } from "react";
import { useWizardStore } from "@/components/create/WizardProvider";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, X, CheckCircle2, ArrowRight, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;

const CONSENT_TEXT =
  "I am the parent or legal guardian of the child in this photo and consent to it being used only to create this storybook. It is deleted right after the book is made and is never used to train AI.";

const PRIVACY_NOTE =
  "Your photo is used only to match your child's look in the illustrations. It's deleted from our servers right after — never stored, never used to train AI.";

export function StepPhotoUpload() {
  const childName = useWizardStore((s) => s.childName);
  const nextStep = useWizardStore((s) => s.nextStep);
  const setAppearanceDescription = useWizardStore((s) => s.setAppearanceDescription);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function validateAndSetFile(f: File) {
    setError(null);

    if (!ALLOWED_TYPES.includes(f.type)) {
      setError("Please choose a JPG, PNG, or WEBP photo.");
      return;
    }

    if (f.size > MAX_BYTES) {
      setError(`That photo is too large (${(f.size / 1024 / 1024).toFixed(1)} MB). Please choose one under 10 MB.`);
      return;
    }

    if (f.size === 0) {
      setError("That file looks empty. Please try a different photo.");
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setConsentChecked(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (picked) validateAndSetFile(picked);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) validateAndSetFile(dropped);
  }

  function clearFile() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setConsentChecked(false);
    setError(null);
  }

  function handleSkip() {
    setAppearanceDescription(null);
    nextStep();
  }

  async function handleUsePhoto() {
    if (!file || !consentChecked) return;
    setLoading(true);
    setError(null);

    try {
      const form = new FormData();
      form.append("photo", file);

      const res = await fetch("/api/analyze-photo", {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Could not analyze the photo. Please try again or skip.");
        setLoading(false);
        return;
      }

      setAppearanceDescription(data.description ?? null);
      nextStep();
    } catch {
      setError("Something went wrong. Please try again or skip this step.");
      setLoading(false);
    }
  }

  const name = childName || "your child";
  const canSubmit = !!file && consentChecked && !loading;

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-8 text-center">
        <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#262625] mb-2">
          Add a photo{" "}
          <span className="text-[#262625]/40 text-xl font-medium">(optional)</span>
        </h2>
        <p className="font-body text-[#262625]/60 text-sm">
          We&apos;ll match {name}&apos;s look in every illustration — hair color, skin tone, and more.
        </p>
      </div>

      <div className="card-chunky bg-white p-6 space-y-5">
        {/* Drop zone / preview */}
        {!previewUrl ? (
          <div
            className="border-2 border-dashed border-[#262625]/20 rounded-2xl p-8 text-center cursor-pointer hover:border-[#5E17EB]/40 hover:bg-[#FDF5E7]/60 transition-all duration-200"
            onClick={() => inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-[#FFDE59]/30 border-2 border-[#262625]/10 flex items-center justify-center">
              <Camera className="h-7 w-7 text-[#262625]/50" />
            </div>
            <p className="font-body font-bold text-[#262625] mb-1">
              Tap to choose a photo
            </p>
            <p className="font-body text-xs text-[#262625]/40">
              JPG, PNG, or WEBP · max 10 MB
            </p>
          </div>
        ) : (
          <div className="relative rounded-2xl overflow-hidden border-2 border-[#262625]/10 bg-[#FDF5E7]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Selected photo preview"
              className="w-full max-h-64 object-contain"
            />
            <button
              onClick={clearFile}
              className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white border-2 border-[#262625]/20 flex items-center justify-center hover:bg-red-50 hover:border-red-300 transition-colors"
              aria-label="Remove photo"
            >
              <X className="h-4 w-4 text-[#262625]" />
            </button>
            <div className="px-4 py-2 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
              <span className="font-body text-xs text-[#262625]/60 truncate">{file?.name}</span>
            </div>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Privacy microcopy */}
        <div className="flex gap-2.5 bg-[#FDF5E7] rounded-xl px-4 py-3 border border-[#262625]/10">
          <ShieldCheck className="h-4 w-4 text-[#5E17EB] shrink-0 mt-0.5" />
          <p className="font-body text-xs text-[#262625]/60 leading-relaxed">
            {PRIVACY_NOTE}
          </p>
        </div>

        {/* Consent checkbox — only shown when a file is selected */}
        {file && (
          <label
            className={cn(
              "flex gap-3 cursor-pointer p-3 rounded-xl border-2 transition-colors",
              consentChecked
                ? "border-[#5E17EB]/30 bg-[#5E17EB]/5"
                : "border-[#262625]/12 bg-white hover:border-[#5E17EB]/20"
            )}
          >
            <div className="relative mt-0.5 shrink-0">
              <input
                type="checkbox"
                className="sr-only"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
              />
              <div
                className={cn(
                  "h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors",
                  consentChecked
                    ? "bg-[#5E17EB] border-[#5E17EB]"
                    : "bg-white border-[#262625]/30"
                )}
              >
                {consentChecked && (
                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 12 12">
                    <path
                      d="M2 6l3 3 5-5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            </div>
            <p className="font-body text-xs text-[#262625]/70 leading-relaxed">
              {CONSENT_TEXT}
            </p>
          </label>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl bg-red-50 border-2 border-red-100 px-4 py-3 font-body text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={handleSkip}
            disabled={loading}
            className="sm:flex-1 h-11 rounded-xl border-2 border-[#262625]/15 font-body font-bold text-[#262625]/60 hover:text-[#262625] hover:border-[#262625]/30"
          >
            Skip this step
          </Button>
          <Button
            type="button"
            onClick={handleUsePhoto}
            disabled={!canSubmit}
            className="sm:flex-[2] btn-chunky h-11 bg-[#FFDE59] text-[#262625] font-heading font-bold border-0 hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Analyzing photo…
              </>
            ) : (
              <>
                Use this photo
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>

        {!file && (
          <p className="text-center font-body text-xs text-[#262625]/40">
            No photo? No problem —{" "}
            <button
              type="button"
              onClick={handleSkip}
              className="text-[#5E17EB] font-bold hover:underline"
            >
              skip this step
            </button>{" "}
            and we&apos;ll still make a beautiful book.
          </p>
        )}
      </div>
    </div>
  );
}
