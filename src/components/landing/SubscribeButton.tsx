"use client";

import { useState } from "react";
import { Crown, Loader2 } from "lucide-react";

interface SubscribeButtonProps {
  className?: string;
}

export default function SubscribeButton({ className }: SubscribeButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showChildSelect, setShowChildSelect] = useState(false);
  const [children, setChildren] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const profilesRes = await fetch("/api/child-profiles");
      if (!profilesRes.ok) {
        if (profilesRes.status === 401) {
          window.location.href = "/auth/login?redirectTo=/#pricing";
          return;
        }
        throw new Error("Failed to load profiles");
      }
      const profilesData = await profilesRes.json();
      const profiles = profilesData.profiles || [];

      if (profiles.length === 0) {
        window.location.href = "/create?subscribe=true";
        return;
      }

      if (profiles.length === 1) {
        await startSubscription(profiles[0].id);
        return;
      }

      setChildren(profiles.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })));
      setShowChildSelect(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function startSubscription(childProfileId: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childProfileId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to start subscription");
        return;
      }
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (showChildSelect) {
    return (
      <div className="space-y-3">
        <p className="font-body font-bold text-sm text-[#1a1a2e] text-center">
          Which child is this subscription for?
        </p>
        {children.map((child) => (
          <button
            key={child.id}
            onClick={() => startSubscription(child.id)}
            disabled={loading}
            className="btn-chunky w-full flex items-center justify-center gap-2 bg-[#7B2D8B] text-white font-heading font-bold text-base px-6 py-3 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
            {child.name}
          </button>
        ))}
        <button
          onClick={() => setShowChildSelect(false)}
          className="w-full text-sm text-[#1a1a2e]/60 hover:text-[#1a1a2e] font-body font-bold transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className={`btn-chunky w-full flex items-center justify-center gap-2 bg-[#7B2D8B] text-white font-heading font-bold text-lg px-8 py-4 disabled:opacity-50 ${className || ""}`}
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Crown className="h-5 w-5" />}
        Join Book Club!
      </button>
      {error && (
        <p className="mt-2 text-xs text-red-600 font-body font-bold text-center">{error}</p>
      )}
    </div>
  );
}
