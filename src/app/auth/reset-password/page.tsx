"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Lock } from "lucide-react";
import { getMarketingUrl } from "@/lib/utils";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDF5E7]" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Capture the token once, then scrub it from the address bar so it cannot
  // leak via the Referer header, browser history or analytics tooling.
  const [token] = useState(() => searchParams.get("token") || "");
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("token=")) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invalidLink, setInvalidLink] = useState(!token);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match. Please try again.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/auth/login"), 3000);
      } else if (
        typeof data.error === "string" &&
        data.error.toLowerCase().includes("invalid or has expired")
      ) {
        setInvalidLink(true);
      } else {
        setError(data.error || "We couldn't reset your password. Please try again.");
      }
    } catch {
      setError("We couldn't reset your password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "h-11 rounded-xl border-2 border-[#262625]/15 bg-[#FDF5E7] px-4 font-body text-base placeholder:text-[#262625]/30 focus-visible:border-[#5E17EB] focus-visible:ring-[#CB6CE6]/20";

  return (
    <div className="min-h-screen bg-[#FDF5E7] bg-stars flex flex-col">
      {/* Header */}
      <div className="p-6">
        <a href={getMarketingUrl()} className="inline-flex items-center">
          <img
            src="https://starmeestories.com/wp-content/uploads/2026/04/Starmee-Logo-Primary.png"
            alt="Starmee Stories"
            className="h-9 w-auto"
          />
        </a>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md">
          <div className="card-chunky bg-white p-8">
            <div className="flex justify-center mb-6">
              <div className="h-14 w-14 rounded-2xl bg-[#FFDE59] border-2 border-[#262625] shadow-[3px_3px_0px_#262625] flex items-center justify-center">
                <Lock className="h-7 w-7 text-[#262625]" />
              </div>
            </div>

            {invalidLink ? (
              <>
                <h1 className="font-heading text-2xl sm:text-3xl font-bold text-center text-[#262625] mb-4">
                  Link invalid or expired
                </h1>
                <p className="font-body text-center text-[#262625]/60 mb-8 text-sm">
                  This password reset link is invalid or has expired. Please
                  request a new password reset link.
                </p>
                <Link href="/auth/forgot-password">
                  <Button className="btn-chunky w-full h-11 bg-[#FFDE59] text-[#262625] font-heading font-bold text-base border-0 hover:brightness-105">
                    Request a New Reset Link
                  </Button>
                </Link>
              </>
            ) : success ? (
              <>
                <h1 className="font-heading text-2xl sm:text-3xl font-bold text-center text-[#262625] mb-4">
                  Password reset!
                </h1>
                <div className="rounded-xl bg-green-50 border-2 border-green-100 px-4 py-4 font-body text-sm text-green-700 mb-6">
                  Your password has been reset successfully. You can now log in
                  with your new password.
                </div>
                <Link href="/auth/login">
                  <Button className="btn-chunky w-full h-11 bg-[#FFDE59] text-[#262625] font-heading font-bold text-base border-0 hover:brightness-105">
                    Go to Login
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <h1 className="font-heading text-2xl sm:text-3xl font-bold text-center text-[#262625] mb-2">
                  Reset Your Password
                </h1>
                <p className="font-body text-center text-[#262625]/50 mb-8 text-sm">
                  Enter your new password below.
                </p>

                {error && (
                  <div className="mb-6 rounded-xl bg-red-50 border-2 border-red-100 px-4 py-3 font-body text-sm text-red-600">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="password"
                      className="block font-body text-sm font-bold text-[#262625] mb-1.5"
                    >
                      New Password
                    </label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      className={inputClass}
                    />
                    <p className="font-body text-xs text-[#262625]/40 mt-1.5">
                      At least 6 characters.
                    </p>
                  </div>
                  <div>
                    <label
                      htmlFor="confirm"
                      className="block font-body text-sm font-bold text-[#262625] mb-1.5"
                    >
                      Confirm New Password
                    </label>
                    <Input
                      id="confirm"
                      type="password"
                      placeholder="••••••••"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      className={inputClass}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading || !password || !confirm}
                    className="btn-chunky w-full h-11 bg-[#FFDE59] text-[#262625] font-heading font-bold text-base border-0 hover:brightness-105 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Resetting...
                      </>
                    ) : (
                      "Reset Password"
                    )}
                  </Button>
                </form>

                <p className="text-center mt-6">
                  <Link
                    href="/auth/login"
                    className="font-body text-sm text-[#5E17EB] hover:underline font-bold"
                  >
                    Back to Login
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
