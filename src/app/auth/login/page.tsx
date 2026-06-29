"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Star } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDF5E7]" />}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const NOT_CONFIGURED_MSG =
    "Sign-in is temporarily unavailable. Please try again later — our team has been notified.";

  const mapError = (message: string): string => {
    const m = message.toLowerCase();
    if (m.includes("invalid login credentials")) {
      return "Invalid email or password. Please try again.";
    }
    if (m.includes("already registered") || m.includes("already been registered")) {
      return "An account with this email already exists. Please log in instead.";
    }
    if (m.includes("password") && m.includes("6")) {
      return "Password must be at least 6 characters.";
    }
    if (m.includes("at least 6")) {
      return "Password must be at least 6 characters.";
    }
    return message;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
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
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(mapError(signInError.message));
      } else {
        router.push(redirectTo);
      }
    } catch (err) {
      console.error("Login failed:", err);
      setError("We couldn't log you in. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email.trim() || !password) {
      setError("Please enter an email and password to create an account.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
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
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (signUpError) {
        setError(mapError(signUpError.message));
      } else if (data.session) {
        router.push(redirectTo);
      } else {
        setError(
          "Your account was created. Please log in with your email and password."
        );
      }
    } catch (err) {
      console.error("Sign-up failed:", err);
      setError("We couldn't create your account. Please try again in a moment.");
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

            <form onSubmit={handleLogin} className="space-y-4">
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
              <div>
                <label htmlFor="password" className="block font-body text-sm font-bold text-[#262625] mb-1.5">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="h-11 rounded-xl border-2 border-[#262625]/15 bg-[#FDF5E7] px-4 font-body text-base placeholder:text-[#262625]/30 focus-visible:border-[#5E17EB] focus-visible:ring-[#CB6CE6]/20"
                />
              </div>
              <Button
                type="submit"
                disabled={loading || !email.trim() || !password}
                className="btn-chunky w-full h-11 bg-[#FFDE59] text-[#262625] font-heading font-bold text-base border-0 hover:brightness-105 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Logging in...
                  </>
                ) : (
                  "Log in"
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="h-px flex-1 bg-[#262625]/10" />
              <span className="font-body text-xs text-[#262625]/40">or</span>
              <div className="h-px flex-1 bg-[#262625]/10" />
            </div>

            <Button
              type="button"
              onClick={handleSignUp}
              disabled={loading || !email.trim() || !password}
              className="btn-chunky w-full h-11 bg-white text-[#262625] font-heading font-bold text-base border-2 border-[#262625] hover:bg-[#FDF5E7] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Create account
            </Button>
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
