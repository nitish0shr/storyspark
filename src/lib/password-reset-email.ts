/**
 * Branded password-reset email, sent through the existing provider-agnostic
 * sendEmail (SendGrid). Never includes the user's password or any account
 * details beyond the reset link itself.
 */

import { sendEmail, type SendResult } from "@/lib/email-provider";
import { getAppUrl } from "@/lib/utils";

export async function sendPasswordResetEmail(
  to: string,
  token: string,
  ttlMinutes: number,
): Promise<SendResult> {
  const resetUrl = `${getAppUrl()}/auth/reset-password?token=${encodeURIComponent(token)}`;
  const ttlText = ttlMinutes === 60 ? "1 hour" : `${ttlMinutes} minutes`;

  const html = `
  <div style="background:#FDF5E7;padding:32px 16px;font-family:Georgia,'Times New Roman',serif;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border:2px solid #262625;border-radius:16px;padding:32px;">
      <div style="text-align:center;margin-bottom:24px;">
        <img src="https://starmeestories.com/wp-content/uploads/2026/04/Starmee-Logo-Primary.png"
             alt="Starmee Stories" style="height:40px;width:auto;" />
      </div>
      <h1 style="font-size:22px;color:#262625;margin:0 0 16px;text-align:center;">
        Reset your password
      </h1>
      <p style="font-size:15px;color:#262625;line-height:1.6;margin:0 0 20px;">
        We received a request to reset the password for your Starmee Stories
        account. Click the button below to choose a new password.
      </p>
      <div style="text-align:center;margin:28px 0;">
        <a href="${resetUrl}"
           style="display:inline-block;background:#FFDE59;color:#262625;font-weight:bold;font-size:16px;padding:14px 32px;border-radius:12px;border:2px solid #262625;text-decoration:none;">
          Reset Password
        </a>
      </div>
      <p style="font-size:13px;color:#666;line-height:1.6;margin:0 0 8px;">
        This link expires in ${ttlText} and can only be used once.
      </p>
      <p style="font-size:13px;color:#666;line-height:1.6;margin:0;">
        If you didn't request a password reset, you can safely ignore this
        email — your password will not be changed.
      </p>
    </div>
    <p style="text-align:center;font-size:12px;color:#999;margin-top:16px;">
      Starmee Stories · Personalised storybooks for little dreamers
    </p>
  </div>`;

  return sendEmail({
    to,
    subject: "Reset your Starmee Stories password",
    html,
  });
}
