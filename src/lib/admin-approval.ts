import crypto from "crypto";

export function getAdminEmail(): string {
  return process.env.ADMIN_EMAIL ?? "";
}

export function isAdminEmailConfigured(): boolean {
  return !!(process.env.ADMIN_EMAIL && process.env.ADMIN_APPROVAL_SECRET);
}

/**
 * Generates a per-book HMAC-SHA256 approval token.
 * The same token is used for both approve and reject links so only one secret
 * is needed. The action (approve vs reject) is encoded in the URL path.
 */
export function generateApprovalToken(bookId: string): string {
  const secret =
    process.env.ADMIN_APPROVAL_SECRET ?? "no-approval-secret-configured";
  return crypto.createHmac("sha256", secret).update(bookId).digest("hex");
}

/**
 * Timing-safe token verification.
 */
export function verifyApprovalToken(bookId: string, token: string): boolean {
  try {
    const expected = generateApprovalToken(bookId);
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(token, "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Build the admin approval email HTML. */
export function buildAdminApprovalEmail(data: {
  bookId: string;
  childName: string;
  themeName: string;
  buyerEmail: string;
  buyerName: string;
  previewUrl: string;
  approveUrl: string;
  rejectUrl: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Book Review Required – ${data.childName}</title>
</head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:40px 20px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

        <!-- Header -->
        <tr><td style="background:#1F2937;padding:28px 36px;text-align:center">
          <p style="margin:0;color:#F9FAFB;font-size:13px;letter-spacing:2px;text-transform:uppercase;font-weight:600">Starmee Stories · Admin</p>
          <h1 style="margin:10px 0 0;color:#FFFFFF;font-size:22px;font-weight:700">📚 New Book Ready for Review</h1>
        </td></tr>

        <!-- Book details -->
        <tr><td style="padding:28px 36px 0">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border-radius:10px;overflow:hidden;border:1px solid #E5E7EB">
            <tr>
              <td style="padding:14px 20px;border-bottom:1px solid #E5E7EB">
                <span style="font-size:12px;color:#6B7280;text-transform:uppercase;letter-spacing:1px">Child</span><br>
                <strong style="font-size:16px;color:#111827">${data.childName}</strong>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 20px;border-bottom:1px solid #E5E7EB">
                <span style="font-size:12px;color:#6B7280;text-transform:uppercase;letter-spacing:1px">Theme</span><br>
                <strong style="font-size:16px;color:#111827">${data.themeName}</strong>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 20px;border-bottom:1px solid #E5E7EB">
                <span style="font-size:12px;color:#6B7280;text-transform:uppercase;letter-spacing:1px">Customer</span><br>
                <strong style="font-size:16px;color:#111827">${data.buyerName}</strong>
                <span style="font-size:14px;color:#6B7280"> &lt;${data.buyerEmail}&gt;</span>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 20px">
                <span style="font-size:12px;color:#6B7280;text-transform:uppercase;letter-spacing:1px">Book ID</span><br>
                <span style="font-size:13px;color:#6B7280;font-family:monospace">${data.bookId}</span>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Preview link -->
        <tr><td style="padding:24px 36px 0;text-align:center">
          <a href="${data.previewUrl}" style="display:inline-block;color:#7C3AED;font-size:15px;font-weight:600;text-decoration:underline">
            🔍 Preview the book before deciding →
          </a>
        </td></tr>

        <!-- Action buttons -->
        <tr><td style="padding:24px 36px 32px">
          <p style="margin:0 0 16px;font-size:15px;color:#374151;text-align:center">
            Review the book above, then approve or reject:
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="48%" style="padding-right:8px">
                <a href="${data.approveUrl}" style="display:block;background:#059669;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:16px 24px;border-radius:10px;text-align:center">
                  ✅ Approve &amp; Release
                </a>
              </td>
              <td width="48%" style="padding-left:8px">
                <a href="${data.rejectUrl}" style="display:block;background:#DC2626;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:16px 24px;border-radius:10px;text-align:center">
                  ❌ Reject
                </a>
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0;font-size:12px;color:#9CA3AF;text-align:center">
            Approving will immediately start full book generation and email the customer when ready.<br>
            Rejecting records the decision — contact the customer separately if needed.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:16px 36px 24px;text-align:center;border-top:1px solid #F3F4F6">
          <p style="margin:0;font-size:12px;color:#9CA3AF">
            Starmee Stories Admin · This email was triggered by a new purchase
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
