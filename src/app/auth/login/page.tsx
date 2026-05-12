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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(
    errorParam === "auth"
      ? "Authentication failed. Please try again."
      : errorParam === "confirm"
        ? "Email confirmation failed. Please request a new link."
        : null
  );

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(redirectTo)}`,
      },
    });

    setLoading(false);
    if (signInError) setError(signInError.message);
    else setSent(true);
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });

    if (signInError) { setGoogleLoading(false); setError(signInError.message); }
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

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#262625]/10" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-4 font-body text-[#262625]/30">or</span>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                  variant="outline"
                  className="w-full h-11 rounded-xl border-2 border-[#262625]/15 bg-white hover:bg-[#FDF5E7] text-[#262625] font-body font-bold text-base transition-all duration-200"
                >
                  {googleLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                  )}
                  Continue with Google
                </Button>
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
