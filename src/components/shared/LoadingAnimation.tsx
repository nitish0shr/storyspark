"use client";

import { useEffect, useState } from "react";
import { Sparkles, Star, Wand2 } from "lucide-react";

interface LoadingAnimationProps {
  childName: string;
  currentStep?: string;
}

const messages = [
  "Our artists are drawing {name} right now...",
  "Writing {name}'s story...",
  "Adding magical details...",
  "Choosing the perfect colors...",
  "Bringing the adventure to life...",
  "Almost done...",
];

export function LoadingAnimation({
  childName,
  currentStep,
}: LoadingAnimationProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 3500);

    return () => clearInterval(messageInterval);
  }, []);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) return 92;
        return prev + Math.random() * 3 + 0.5;
      });
    }, 400);

    return () => clearInterval(progressInterval);
  }, []);

  const currentMessage = messages[messageIndex].replace("{name}", childName);

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {/* Animated sparkle area */}
      <div className="relative mb-8 h-40 w-40">
        {/* Central wand icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-gradient-to-br from-violet-500 to-pink-500 p-5 shadow-lg shadow-violet-200 animate-pulse">
            <Wand2 className="h-10 w-10 text-white" />
          </div>
        </div>

        {/* Orbiting sparkles */}
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: "6s" }}>
          <Sparkles className="absolute top-0 left-1/2 -translate-x-1/2 h-5 w-5 text-amber-400" />
        </div>
        <div
          className="absolute inset-0 animate-spin"
          style={{ animationDuration: "8s", animationDirection: "reverse" }}
        >
          <Star className="absolute top-1/2 right-0 -translate-y-1/2 h-4 w-4 text-pink-400 fill-pink-400" />
        </div>
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: "10s" }}>
          <Sparkles className="absolute bottom-0 left-1/2 -translate-x-1/2 h-5 w-5 text-violet-400" />
        </div>
        <div
          className="absolute inset-0 animate-spin"
          style={{ animationDuration: "7s", animationDirection: "reverse" }}
        >
          <Star className="absolute top-1/2 left-0 -translate-y-1/2 h-4 w-4 text-amber-300 fill-amber-300" />
        </div>

        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute h-1.5 w-1.5 rounded-full animate-bounce"
            style={{
              backgroundColor: i % 2 === 0 ? "#7C3AED" : "#EC4899",
              top: `${20 + Math.sin(i * 1.2) * 35}%`,
              left: `${20 + Math.cos(i * 1.2) * 35}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${1.5 + i * 0.2}s`,
            }}
          />
        ))}
      </div>

      {/* Message */}
      <h3 className="font-heading text-xl md:text-2xl font-semibold text-gray-800 mb-2 transition-opacity duration-500">
        Creating {childName}&apos;s Story
      </h3>
      <p className="text-gray-500 mb-8 h-6 transition-all duration-500">
        {currentStep || currentMessage}
      </p>

      {/* Progress bar */}
      <div className="w-full max-w-xs">
        <div className="h-2 w-full overflow-hidden rounded-full bg-violet-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-600 to-pink-500 transition-all duration-700 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-gray-400">
          {Math.round(Math.min(progress, 100))}% complete
        </p>
      </div>

      {/* Tip */}
      <div className="mt-8 max-w-sm rounded-xl bg-violet-50 border border-violet-100 p-4">
        <p className="text-sm text-violet-700">
          <Sparkles className="inline h-4 w-4 mr-1 -mt-0.5" />
          Each story is uniquely crafted with custom illustrations made just for{" "}
          {childName}.
        </p>
      </div>
    </div>
  );
}
