"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Loader2, Star } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDF5E7]" />}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(
    errorParam === "auth"
      ? "Authentication failed. Please try again."
      : errorParam === "confirm"
        ? "Email confirmation failed. Please request a new link."
        : null
  );

  const NOT_CONFIGURED_MSG =
    "Sign-in is temporarily unavailable. Please try again later — our team has been notified.";

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();
    if (!supabase) {
      console.error("Supabase client unavailable: auth env vars are missing.");
      setLoading(false);
      setError(NOT_CONFIGURED_MSG);
      return;
    }

    try {
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(redirectTo)}`,
        },
      });

      if (signInError) setError(signInError.message);
      else setSent(true);
    } catch (err) {
      console.error("Magic link sign-in failed:", err);
      setError("We couldn't send your magic link. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF5E7] bg-stars flex flex-col">
      {/* Header */}
      <div className="p-6">
        <Link href="/" className="inline-flex items-center">
          <img
            src="https://starmeestories.com/wp-content/uploads/2026/04/Starmee-Logo-Primary.png"
            alt="Starmee Stories"
            className="h-9 w-auto"
          />
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="card-chunky bg-white p-8">
            {/* Logo mark */}
            <div className="flex justify-center mb-6">
              <div className="h-14 w-14 rounded-2xl bg-[#FFDE59] border-2 border-[#262625] shadow-[3px_3px_0px_#262625] flex items-center justify-center">
                <Star className="h-7 w-7 text-[#262625] fill-[#262625]" />
              </div>
            </div>

            {/* Heading */}
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-center text-[#262625] mb-2">
              Welcome to Starmee Stories
            </h1>
            <p className="font-body text-center text-[#262625]/50 mb-8 text-sm">
              Sign in to create magical storybooks for your little ones
            </p>

            {/* Error */}
            {error && (
              <div className="mb-6 rounded-xl bg-red-50 border-2 border-red-100 px-4 py-3 font-body text-sm text-red-600">
                {error}
              </div>
            )}

            {sent ? (
              <div className="text-center py-4">
                <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-[#FFDE59]/30 border-2 border-[#FFDE59] flex items-center justify-center">
                  <Mail className="h-6 w-6 text-[#262625]" />
                </div>
                <h2 className="font-heading text-lg font-bold text-[#262625] mb-2">
                  Check your email
                </h2>
                <p className="font-body text-[#262625]/60 text-sm mb-6">
                  We sent a magic link to{" "}
                  <span className="font-bold text-[#262625]">{email}</span>.
                  <br />
                  Click the link in the email to sign in.
                </p>
                <button
                  onClick={() => { setSent(false); setEmail(""); }}
                  className="font-body text-sm font-bold text-[#5E17EB] hover:text-[#CB6CE6] transition-colors"
                >
                  Use a different email
                </button>
              </div>
            ) : (
              <>
                <form onSubmit={handleMagicLink} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block font-body text-sm font-bold text-[#262625] mb-1.5">
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
                        Sending link...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Send Magic Link
                      </>
                    )}
                  </Button>
                </form>

              </>
            )}
          </div>

          <p className="text-center font-body text-xs text-[#262625]/40 mt-6">
            By signing in, you agree to our{" "}
            <Link href="/terms" className="text-[#5E17EB] hover:underline font-bold">Terms of Service</Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-[#5E17EB] hover:underline font-bold">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
