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
} from "lucide-react";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/heic", "image/heif"];

export function StepPhotoUpload() {
  const { childName, photoPreviewUrl, setPhoto, nextStep } = useWizardStore();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    },
    [setPhoto]
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
          <div className="border-t border-violet-200 bg-violet-50 px-4 py-3">
            <button
              onClick={() => inputRef.current?.click()}
              className="text-sm font-medium text-violet-600 hover:text-violet-700 transition-colors"
            >
              <Camera className="mr-1.5 inline h-4 w-4 -mt-0.5" />
              Change Photo
            </button>
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
        <Button
          onClick={nextStep}
          disabled={!photoPreviewUrl}
          className={cn(
            "h-12 w-full rounded-xl text-base font-semibold transition-all",
            photoPreviewUrl
              ? "bg-gradient-to-r from-violet-600 to-pink-500 text-white hover:shadow-lg hover:shadow-violet-200 hover:brightness-105"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          )}
        >
          Next
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <button
          onClick={nextStep}
          className="text-sm font-medium text-gray-400 hover:text-violet-600 transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
