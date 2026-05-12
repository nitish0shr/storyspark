"use client";

import { useCallback, useRef, useState } from "react";
import { useWizardStore } from "./WizardProvider";
import { cn } from "@/lib/utils";
import {
  Camera, Upload, ArrowRight, X, ImageIcon, Lightbulb, Loader2, Shield,
} from "lucide-react";
import { toast } from "sonner";
import { usePostHog } from "posthog-js/react";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/heic", "image/heif"];

function PhotoUploader({
  label, previewUrl, onFile, onClear, uploading,
}: {
  label: string;
  previewUrl: string | null;
  onFile: (file: File) => void;
  onClear: () => void;
  uploading: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    setError(null);
    if (!ACCEPTED_TYPES.includes(file.type) && !file.name.toLowerCase().endsWith(".heic")) {
      setError("Please upload a JPG, PNG, or HEIC image.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("Image must be under 10MB.");
      return;
    }
    onFile(file);
  }, [onFile]);

  return (
    <div className="space-y-3">
      {previewUrl ? (
        <div className="relative overflow-hidden rounded-2xl border-2 border-[#CB6CE6] bg-[#CB6CE6]/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt={label} className="mx-auto max-h-52 w-full object-contain p-4" />
          <button
            onClick={() => { onClear(); if (inputRef.current) inputRef.current.value = ""; }}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#262625]/50 text-white backdrop-blur-sm transition-colors hover:bg-[#262625]/70"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="border-t-2 border-[#CB6CE6]/20 bg-[#CB6CE6]/5 px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => inputRef.current?.click()}
              className="font-body text-sm font-bold text-[#5E17EB] hover:text-[#CB6CE6] transition-colors"
            >
              <Camera className="mr-1.5 inline h-4 w-4 -mt-0.5" />
              Change Photo
            </button>
            {uploading && (
              <span className="font-body text-xs text-[#262625]/40 flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Uploading...
              </span>
            )}
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 transition-all duration-200",
            isDragging
              ? "border-[#5E17EB] bg-[#5E17EB]/5 scale-[1.02]"
              : "border-[#262625]/20 bg-white hover:border-[#CB6CE6] hover:bg-[#CB6CE6]/5"
          )}
        >
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-2xl transition-colors",
            isDragging ? "bg-[#5E17EB] text-white" : "bg-[#CB6CE6]/20 text-[#5E17EB] group-hover:bg-[#CB6CE6]/30"
          )}>
            <ImageIcon className="h-6 w-6" />
          </div>
          <div className="text-center">
            <p className="font-body font-bold text-[#262625]/70 text-sm">
              <Upload className="mr-1 inline h-3.5 w-3.5 -mt-0.5" />
              Drop photo or click to browse
            </p>
            <p className="mt-0.5 font-body text-xs text-[#262625]/40">JPG, PNG, or HEIC — up to 10MB</p>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.heic,.heif"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        className="hidden"
      />
      {error && <p className="font-body text-sm text-red-500 text-center">{error}</p>}
    </div>
  );
}

export function StepPhotoUpload() {
  const {
    childName, photoPreviewUrl, setPhoto, setPhotoUrl,
    hasSecondChild, secondChildName, secondChildPhotoPreviewUrl,
    setSecondChildPhoto, setSecondChildPhotoUrl, nextStep,
  } = useWizardStore();
  const posthog = usePostHog();
  const [uploading, setUploading] = useState(false);
  const [uploading2, setUploading2] = useState(false);

  const uploadToServer = useCallback(async (file: File, setUrl: (url: string) => void, setLoading: (b: boolean) => void) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const res = await fetch("/api/upload-photo", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setUrl(data.url);
      }
    } catch { } finally {
      setLoading(false);
    }
  }, []);

  const handleFirstFile = useCallback((file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setPhoto(file, previewUrl);
    uploadToServer(file, setPhotoUrl, setUploading);
  }, [setPhoto, setPhotoUrl, uploadToServer]);

  const handleSecondFile = useCallback((file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setSecondChildPhoto(file, previewUrl);
    uploadToServer(file, setSecondChildPhotoUrl, setUploading2);
  }, [setSecondChildPhoto, setSecondChildPhotoUrl, uploadToServer]);

  const clearFirst = () => {
    useWizardStore.setState({ photoFile: null, photoPreviewUrl: null, photoUrl: null });
  };
  const clearSecond = () => {
    useWizardStore.setState({ secondChildPhotoFile: null, secondChildPhotoPreviewUrl: null, secondChildPhotoUrl: null });
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="text-center">
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-[#262625]">
          Upload photo{hasSecondChild ? "s" : ""} {hasSecondChild ? "" : `of ${childName}`}
        </h2>
        <p className="mt-2 font-body text-[#262625]/60">
          We&apos;ll use {hasSecondChild ? "these" : "this"} to create illustrations that look like{" "}
          {hasSecondChild ? `${childName} and ${secondChildName}` : childName}.
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-xl bg-[#FFDE59]/20 border-2 border-[#FFDE59] p-4">
        <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-[#262625]" />
        <div className="font-body text-sm text-[#262625]">
          <p className="font-bold">For best results:</p>
          <ul className="mt-1 list-disc pl-4 space-y-0.5 text-[#262625]/70">
            <li>Clear view of face</li>
            <li>Good lighting</li>
            <li>No sunglasses or masks</li>
          </ul>
        </div>
      </div>

      {hasSecondChild && (
        <p className="font-body text-sm font-bold text-[#262625]">{childName}&apos;s photo</p>
      )}
      <PhotoUploader
        label={`Photo of ${childName}`}
        previewUrl={photoPreviewUrl}
        onFile={handleFirstFile}
        onClear={clearFirst}
        uploading={uploading}
      />

      {hasSecondChild && (
        <>
          <p className="font-body text-sm font-bold text-[#262625]">{secondChildName || "Second child"}&apos;s photo</p>
          <PhotoUploader
            label={`Photo of ${secondChildName}`}
            previewUrl={secondChildPhotoPreviewUrl}
            onFile={handleSecondFile}
            onClear={clearSecond}
            uploading={uploading2}
          />
        </>
      )}

      <div className="flex items-center justify-center gap-2 font-body text-xs text-[#262625]/40">
        <Shield className="h-3.5 w-3.5" />
        <span>Your photos are encrypted and never shared with third parties.</span>
      </div>

      <div className="flex flex-col gap-3">
        <div onClick={() => {
          if (!photoPreviewUrl) toast.info(`Please upload a photo of ${childName} to continue, or skip below.`);
        }}>
          <button
            onClick={() => {
              posthog.capture("wizard_step_completed", { step: "photo_upload", has_second_child: hasSecondChild });
              nextStep();
            }}
            disabled={!photoPreviewUrl}
            className={cn(
              "btn-chunky h-12 w-full flex items-center justify-center gap-2 font-heading font-bold text-base transition-all",
              photoPreviewUrl
                ? "bg-[#FFDE59] text-[#262625] cursor-pointer"
                : "bg-gray-200 text-gray-400 cursor-not-allowed border-gray-300 shadow-none"
            )}
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <button
          onClick={() => {
            posthog.capture("wizard_step_completed", { step: "photo_skipped" });
            nextStep();
          }}
          className="font-body text-sm font-bold text-[#262625]/40 hover:text-[#5E17EB] transition-colors"
        >
          Skip — illustrations won&apos;t match {hasSecondChild ? "their appearances" : `${childName}'s appearance`}
        </button>
      </div>
    </div>
  );
}
