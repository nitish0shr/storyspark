"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="mx-auto max-w-md space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>

        <div>
          <h2 className="font-heading text-2xl font-bold text-gray-900">
            Something went wrong
          </h2>
          <p className="mt-2 text-gray-500">
            We hit an unexpected problem. Please try again, or contact us if it
            keeps happening.
          </p>
        </div>

        <div className="flex flex-col items-center gap-3">
          <Button
            onClick={reset}
            className="h-12 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white font-semibold"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>

          <Link
            href="/contact"
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-violet-600 transition-colors"
          >
            <Mail className="h-3.5 w-3.5" />
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
