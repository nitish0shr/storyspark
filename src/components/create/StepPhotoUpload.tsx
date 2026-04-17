"use client";

import { useCallback, useRef, useState } from "react";
import { useWizardStore } from "./WizardProvider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Camera,
  Upload,
  ArrowRight,
  X,
  ImageIcon,
  Lightbulb,
  Loader2,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/heic", "image/heif"];

export function StepPhotoUpload() {
  const { childName, photoPreviewUrl, setPhoto, setPhotoUrl, nextStep } =
    useWizardStore();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [consent, setConsent] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadToServer = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);

      const res = await fetch("/api/upload-photo", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setPhotoUrl(data.url);
      }
      // Non-blocking: if upload fails, we still have the local preview
      // The photo URL is optional for book creation
    } catch {
      // Silent failure — photo upload is best-effort
    } finally {
      setUploading(false);
    }
  }, [setPhotoUrl]);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);

      if (!ACCEPTED_TYPES.includes(file.type) && !file.name.toLowerCase().endsWith(".heic")) {
        setError("Please upload a JPG, PNG, or HEIC image.");
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError("Image must be under 10MB.");
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      setPhoto(file, previewUrl);

      // Upload to server in background (non-blocking)
      uploadToServer(file);
    },
    [setPhoto, uploadToServer]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const clearPhoto = () => {
    useWizardStore.setState({
      photoFile: null,
      photoPreviewUrl: null,
    });
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="text-center">
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-gray-900">
          Upload a photo of {childName}
        </h2>
        <p className="mt-2 text-gray-500">
          We&apos;ll use this to create illustrations that look like {childName}.
        </p>
      </div>

      {/* Photo tips */}
      <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-100 p-4">
        <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
        <div className="text-sm text-amber-800">
          <p className="font-medium">For best results:</p>
          <ul className="mt-1 list-disc pl-4 space-y-0.5 text-amber-700">
            <li>Clear view of face</li>
            <li>Good lighting</li>
            <li>No sunglasses or masks</li>
          </ul>
        </div>
      </div>

      {/* Dropzone or Preview */}
      {photoPreviewUrl ? (
        <div className="relative overflow-hidden rounded-2xl border-2 border-violet-200 bg-violet-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoPreviewUrl}
            alt={`Photo of ${childName}`}
            className="mx-auto max-h-72 w-full object-contain p-4"
          />
          <button
            onClick={clearPhoto}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="border-t border-violet-200 bg-violet-50 px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => inputRef.current?.click()}
              className="text-sm font-medium text-violet-600 hover:text-violet-700 transition-colors"
            >
              <Camera className="mr-1.5 inline h-4 w-4 -mt-0.5" />
              Change Photo
            </button>
            {uploading && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Uploading...
              </span>
            )}
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "group flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-10 transition-all duration-200",
            isDragging
              ? "border-violet-500 bg-violet-50 scale-[1.02]"
              : "border-gray-300 bg-white hover:border-violet-300 hover:bg-violet-50/30"
          )}
        >
          <div
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-2xl transition-colors",
              isDragging
                ? "bg-violet-600 text-white"
                : "bg-violet-100 text-violet-600 group-hover:bg-violet-200"
            )}
          >
            <ImageIcon className="h-8 w-8" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-gray-700">
              <Upload className="mr-1.5 inline h-4 w-4 -mt-0.5" />
              Drop photo here or click to browse
            </p>
            <p className="mt-1 text-sm text-gray-400">
              JPG, PNG, or HEIC -- up to 10MB
            </p>
          </div>
        </div>
      )}

      {/* Privacy reassurance */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
        <Shield className="h-3.5 w-3.5" />
        <span>Your photo is encrypted and never shared with third parties.</span>
      </div>

      {/* Parent/guardian consent (COPPA) */}
      <label
        htmlFor="parent-consent"
        className="flex items-start gap-3 rounded-xl border border-violet-100 bg-violet-50/50 p-4 cursor-pointer hover:bg-violet-50 transition-colors"
      >
        <input
          id="parent-consent"
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-violet-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
        />
        <span className="text-sm text-gray-700 leading-relaxed">
          I&apos;m {childName}&apos;s parent or legal guardian and I consent to
          Starmee using this photo to generate a personalized book. I&apos;ve
          read the{" "}
          <a
            href="/privacy"
            target="_blank"
            rel="noopener"
            className="text-violet-600 underline hover:text-violet-700"
          >
            privacy policy
          </a>
          .
        </span>
      </label>

      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.heic,.heif"
        onChange={handleChange}
        className="hidden"
      />

      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <div
          onClick={() => {
            if (!photoPreviewUrl) {
              toast.info(`Please upload a photo of ${childName} to continue, or skip below.`);
            } else if (!consent) {
              toast.info("Please confirm you're the parent or guardian.");
            }
          }}
        >
          <Button
            onClick={() => nextStep()}
            disabled={!photoPreviewUrl || !consent}
            className={cn(
              "h-12 w-full rounded-xl text-base font-semibold transition-all",
              photoPreviewUrl && consent
                ? "bg-gradient-to-r from-violet-600 to-pink-500 text-white hover:shadow-lg hover:shadow-violet-200 hover:brightness-105"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            )}
          >
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        <button
          onClick={() => nextStep()}
          className="text-sm font-medium text-gray-400 hover:text-violet-600 transition-colors"
        >
          Skip — illustrations won&apos;t match {childName}&apos;s appearance
        </button>
      </div>
    </div>
  );
}
