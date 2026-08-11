"use client";

import { usePathname } from "next/navigation";

/**
 * Routes where third-party tracking must never load. The password reset link
 * carries a single-use token in the URL; analytics scripts (which capture the
 * full URL) and third-party requests (which can receive it as a Referer) must
 * be excluded on these pages.
 */
export const SENSITIVE_ROUTES = ["/auth/reset-password", "/auth/forgot-password"];

export function isSensitivePath(pathname: string | null): boolean {
  if (!pathname) return false;
  return SENSITIVE_ROUTES.some((r) => pathname.startsWith(r));
}

/** Renders children (e.g. analytics scripts) only on non-sensitive routes. */
export default function SensitiveRouteGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  if (isSensitivePath(pathname)) return null;
  return <>{children}</>;
}
