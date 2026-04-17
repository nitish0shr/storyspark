import { Resend } from "resend";

let _resend: Resend | null = null;

export function isResendConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

export function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      throw new Error(
        "Resend is not configured. Set RESEND_API_KEY to enable email delivery."
      );
    }
    _resend = new Resend(key);
  }
  return _resend;
}

export const resend = new Proxy({} as Resend, {
  get(_target, prop) {
    return (getResend() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const RESEND_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "Starmee <hello@starmee.com>";
