"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { isSensitivePath } from "@/components/shared/SensitiveRouteGate";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;
    // Never initialise analytics on password-recovery pages: the reset URL
    // contains a single-use token that must not reach third parties.
    if (isSensitivePath(pathname)) return;
    if (posthog.__loaded) return;

    posthog.init(key, {
      api_host: "https://us.i.posthog.com",
      capture_pageview: true,
      capture_pageleave: true,
    });
  }, [pathname]);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
