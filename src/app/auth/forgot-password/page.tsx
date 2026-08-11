"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, KeyRound } from "lucide-react";
import { getMarketingUrl } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setSent(true);
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
                <KeyRound className="h-7 w-7 text-[#262625]" />
              </div>
            </div>

            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-center text-[#262625] mb-2">
              Forgot your password?
            </h1>
            <p className="font-body text-center text-[#262625]/50 mb-8 text-sm">
              Enter your email address and we&apos;ll send you a secure link to
              reset your password.
            </p>

            {sent ? (
              <div className="rounded-xl bg-green-50 border-2 border-green-100 px-4 py-4 font-body text-sm text-green-700">
                If an account exists for that email address, we&apos;ve sent you a
                password reset link. Please check your inbox.
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-6 rounded-xl bg-red-50 border-2 border-red-100 px-4 py-3 font-body text-sm text-red-600">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="email"
                      className="block font-body text-sm font-bold text-[#262625] mb-1.5"
                    >
                      Email address
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="h-11 rounded-xl border-2 border-[#262625]/15 bg-[#FDF5E7] px-4 font-body text-base placeholder:text-[#262625]/30 focus-visible:border-[#5E17EB] focus-visible:ring-[#CB6CE6]/20"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className="btn-chunky w-full h-11 bg-[#FFDE59] text-[#262625] font-heading font-bold text-base border-0 hover:brightness-105 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      "Send Reset Link"
                    )}
                  </Button>
                </form>
              </>
            )}

            <p className="text-center mt-6">
              <Link
                href="/auth/login"
                className="font-body text-sm text-[#5E17EB] hover:underline font-bold"
              >
                Back to Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
