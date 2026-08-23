"use client";

import { useEffect, useState } from "react";
import { Star, Wand2 } from "lucide-react";

interface LoadingAnimationProps {
  childName: string;
  currentStep?: string;
  serverStatus?: string;
  illustrationsReady?: number;
}

const messages = [
  "Our artists are drawing {name} right now...",
  "Writing {name}'s story...",
  "Adding magical details...",
  "Choosing the perfect colors...",
  "Bringing the adventure to life...",
  "Almost done...",
];

function getServerMessage(
  status: string | undefined,
  illustrationsReady: number | undefined,
  childName: string
): string | null {
  if (!status) return null;
  if (status === "preview_ready" || status === "completed")
    return `${childName}'s book is ready!`;
  if (status === "preview_generating" || status === "generating") {
    if (illustrationsReady && illustrationsReady > 0)
      return `Illustrating page ${illustrationsReady + 1}...`;
    return `Writing ${childName}'s story...`;
  }
  return null;
}

export function LoadingAnimation({
  childName,
  currentStep,
  serverStatus,
  illustrationsReady,
}: LoadingAnimationProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 3500);
    return () => clearInterval(messageInterval);
  }, []);

  const serverMessage = getServerMessage(serverStatus, illustrationsReady, childName);
  const currentMessage = messages[messageIndex].replace("{name}", childName);

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {/* Animated icon area */}
      <div className="relative mb-8 h-40 w-40">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-[#FFDE59] border-[2.5px] border-[#262625] shadow-[4px_4px_0px_#262625] p-5 animate-bounce-gentle">
            <Wand2 className="h-10 w-10 text-[#262625]" />
          </div>
        </div>

        {/* Orbiting stars */}
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: "6s" }}>
          <Star className="absolute top-0 left-1/2 -translate-x-1/2 h-5 w-5 text-[#FFDE59] fill-[#FFDE59]" />
        </div>
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: "8s", animationDirection: "reverse" }}>
          <Star className="absolute top-1/2 right-0 -translate-y-1/2 h-4 w-4 text-[#CB6CE6] fill-[#CB6CE6]" />
        </div>
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: "10s" }}>
          <Star className="absolute bottom-0 left-1/2 -translate-x-1/2 h-5 w-5 text-[#5E17EB] fill-[#5E17EB]" />
        </div>
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: "7s", animationDirection: "reverse" }}>
          <Star className="absolute top-1/2 left-0 -translate-y-1/2 h-4 w-4 text-[#FFDE59] fill-[#FFDE59]" />
        </div>

        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute h-1.5 w-1.5 rounded-full animate-bounce"
            style={{
              backgroundColor: i % 3 === 0 ? "#5E17EB" : i % 3 === 1 ? "#CB6CE6" : "#FFDE59",
              top: `${20 + Math.sin(i * 1.2) * 35}%`,
              left: `${20 + Math.cos(i * 1.2) * 35}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${1.5 + i * 0.2}s`,
            }}
          />
        ))}
      </div>

      <h3 className="font-heading text-xl md:text-2xl font-bold text-[#262625] mb-2">
        Creating {childName}&apos;s Story
      </h3>
      <p className="font-body text-[#262625]/60 mb-8 h-6 transition-all duration-500">
        {serverMessage || currentStep || currentMessage}
      </p>

      {/* Indeterminate progress: the pipeline does not expose a trustworthy
          percentage, so do not present a fabricated one. */}
      <div className="w-full max-w-xs">
        <div className="h-3 w-full overflow-hidden rounded-full bg-[#262625]/10 border border-[#262625]/20">
          <div
            className="h-full w-2/3 animate-pulse rounded-full border-r border-[#262625]/20 bg-[#FFDE59]"
          />
        </div>
        <p className="mt-2 font-body text-xs text-[#262625]/40">
          Usually ready in 6–8 minutes
        </p>
      </div>

      {/* Tip */}
      <div className="mt-8 max-w-sm rounded-2xl bg-[#CB6CE6]/15 border-2 border-[#CB6CE6]/30 p-4">
        <p className="font-body text-sm text-[#5E17EB]">
          <Star className="inline h-4 w-4 mr-1 -mt-0.5 fill-[#5E17EB]" />
          Each story is uniquely crafted with custom illustrations made just for{" "}
          {childName}.
        </p>
      </div>
    </div>
  );
}
