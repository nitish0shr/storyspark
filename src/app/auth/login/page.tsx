"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Mail, Loader2 } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FFFBF5]" />}>
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

    if (signInError) {
      setError(signInError.message);
    } else {
      setSent(true);
    }
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

    if (signInError) {
      setGoogleLoading(false);
      setError(signInError.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBF5] flex flex-col">
      {/* Header */}
      <div className="p-6">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <Sparkles className="h-6 w-6 text-[#7C3AED] transition-transform group-hover:rotate-12" />
          <span className="font-heading text-xl font-bold text-[#7C3AED]">
            StorySpark
          </span>
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-lg shadow-violet-100/50 border border-violet-50 p-8">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#EC4899] flex items-center justify-center shadow-md">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
            </div>

            {/* Heading */}
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-2">
              Welcome to StorySpark
            </h1>
            <p className="text-center text-gray-500 mb-8 text-sm">
              Sign in to create magical memory books for your little ones
            </p>

            {/* Error Message */}
            {error && (
              <div className="mb-6 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Success State */}
            {sent ? (
              <div className="text-center py-4">
                <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-50 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-green-600" />
                </div>
                <h2 className="font-heading text-lg font-semibold text-gray-900 mb-2">
                  Check your email
                </h2>
                <p className="text-gray-500 text-sm mb-6">
                  We sent a magic link to{" "}
                  <span className="font-medium text-gray-700">{email}</span>.
                  <br />
                  Click the link in the email to sign in.
                </p>
                <button
                  onClick={() => {
                    setSent(false);
                    setEmail("");
                  }}
                  className="text-sm text-[#7C3AED] hover:text-[#6D28D9] font-medium transition-colors"
                >
                  Use a different email
                </button>
              </div>
            ) : (
              <>
                {/* Magic Link Form */}
                <form onSubmit={handleMagicLink} className="space-y-4">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-1.5"
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
                      className="h-11 rounded-xl border-gray-200 bg-gray-50/50 px-4 text-base placeholder:text-gray-400 focus-visible:border-[#7C3AED] focus-visible:ring-[#7C3AED]/20"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className="w-full h-11 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#6D28D9] hover:to-[#5B21B6] text-white font-medium text-base shadow-md shadow-violet-200/50 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed border-0"
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

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-4 text-gray-400">or</span>
                  </div>
                </div>

                {/* Google Sign In */}
                <Button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                  variant="outline"
                  className="w-full h-11 rounded-xl border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium text-base transition-all duration-200"
                >
                  {googleLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                  )}
                  Continue with Google
                </Button>
              </>
            )}
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-6">
            By signing in, you agree to our{" "}
            <Link
              href="/terms"
              className="text-[#7C3AED] hover:underline"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="text-[#7C3AED] hover:underline"
            >
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
