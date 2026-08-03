import { isResendConfigured, getResend, RESEND_FROM_EMAIL } from "@/lib/resend";
import { getAppUrl } from "@/lib/utils";

interface PreviewEmailParams {
  email: string;
  childName: string;
  bookId: string;
}

interface BookReadyEmailParams {
  email: string;
  childName: string;
  bookId: string;
  pdfUrl?: string | null;
}

export async function sendPreviewReadyEmail({
  email,
  childName,
  bookId,
}: PreviewEmailParams): Promise<void> {
  if (!isResendConfigured()) {
    console.log(`[email] Resend not configured — skipping preview email to ${email}`);
    return;
  }

  const resend = getResend();
  const appUrl = getAppUrl();
  const previewUrl = `${appUrl}/preview/${bookId}`;

  await resend.emails.send({
    from: RESEND_FROM_EMAIL,
    to: email,
    subject: `✨ ${childName}'s storybook preview is ready!`,
    html: previewEmailHtml({ childName, previewUrl }),
  });

  console.log(`[email] Preview email sent to ${email} for book ${bookId}`);
}

export async function sendBookReadyEmail({
  email,
  childName,
  bookId,
  pdfUrl,
}: BookReadyEmailParams): Promise<void> {
  if (!isResendConfigured()) {
    console.log(`[email] Resend not configured — skipping book-ready email to ${email}`);
    return;
  }

  const resend = getResend();
  const appUrl = getAppUrl();
  const bookUrl = `${appUrl}/preview/${bookId}`;

  await resend.emails.send({
    from: RESEND_FROM_EMAIL,
    to: email,
    subject: `🎉 ${childName}'s complete storybook is ready to read!`,
    html: bookReadyEmailHtml({ childName, bookUrl, pdfUrl }),
  });

  console.log(`[email] Book-ready email sent to ${email} for book ${bookId}`);
}

function previewEmailHtml({
  childName,
  previewUrl,
}: {
  childName: string;
  previewUrl: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${childName}'s storybook preview</title>
</head>
<body style="margin:0;padding:0;background:#FFFBF5;font-family:Georgia,'Times New Roman',serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFBF5;padding:40px 20px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(124,58,237,0.10)">

        <tr><td style="background:linear-gradient(135deg,#7C3AED 0%,#EC4899 100%);padding:44px 40px 36px;text-align:center">
          <p style="margin:0 0 10px;color:rgba(255,255,255,0.80);font-size:13px;letter-spacing:2px;text-transform:uppercase;font-family:Arial,sans-serif">Starmee</p>
          <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:bold;line-height:1.25">${childName}'s story is ready! ✨</h1>
        </td></tr>

        <tr><td style="padding:36px 40px 32px">
          <p style="margin:0 0 18px;font-size:16px;color:#374151;line-height:1.65">Hi there!</p>
          <p style="margin:0 0 18px;font-size:16px;color:#374151;line-height:1.65">
            We've finished creating <strong>${childName}'s</strong> personalised storybook preview — a unique story written just for them, with custom illustrations where they're the star.
          </p>
          <p style="margin:0 0 28px;font-size:16px;color:#374151;line-height:1.65">
            Click below to read the first 3 illustrated pages for free:
          </p>

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="${previewUrl}" style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#EC4899);color:#ffffff;text-decoration:none;font-size:17px;font-weight:bold;padding:17px 44px;border-radius:12px;font-family:Arial,sans-serif;letter-spacing:0.3px">
                Read the Preview &rarr;
              </a>
            </td></tr>
          </table>

          <p style="margin:24px 0 0;font-size:13px;color:#9CA3AF;text-align:center;font-family:Arial,sans-serif">
            Or paste this link in your browser:<br>
            <a href="${previewUrl}" style="color:#7C3AED;word-break:break-all">${previewUrl}</a>
          </p>
        </td></tr>

        <tr><td style="padding:20px 40px 32px;text-align:center;border-top:1px solid #F3F4F6">
          <p style="margin:0;font-size:12px;color:#9CA3AF;font-family:Arial,sans-serif;line-height:1.6">
            Starmee &middot; Personalised storybooks for every child<br>
            You received this because you created a story at starmeestories.com
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function bookReadyEmailHtml({
  childName,
  bookUrl,
  pdfUrl,
}: {
  childName: string;
  bookUrl: string;
  pdfUrl?: string | null;
}): string {
  const pdfButton = pdfUrl
    ? `<p style="margin:16px 0 0;text-align:center">
        <a href="${pdfUrl}" style="font-size:15px;color:#7C3AED;font-family:Arial,sans-serif;font-weight:600;text-decoration:underline">
          Download PDF &rarr;
        </a>
      </p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${childName}'s complete storybook</title>
</head>
<body style="margin:0;padding:0;background:#FFFBF5;font-family:Georgia,'Times New Roman',serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFBF5;padding:40px 20px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(124,58,237,0.10)">

        <tr><td style="background:linear-gradient(135deg,#7C3AED 0%,#EC4899 100%);padding:44px 40px 36px;text-align:center">
          <p style="margin:0 0 10px;color:rgba(255,255,255,0.80);font-size:13px;letter-spacing:2px;text-transform:uppercase;font-family:Arial,sans-serif">Starmee</p>
          <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:bold;line-height:1.25">🎉 ${childName}'s book is complete!</h1>
        </td></tr>

        <tr><td style="padding:36px 40px 32px">
          <p style="margin:0 0 18px;font-size:16px;color:#374151;line-height:1.65">Hi there!</p>
          <p style="margin:0 0 18px;font-size:16px;color:#374151;line-height:1.65">
            Great news — <strong>${childName}'s</strong> personalised storybook is fully illustrated and ready to enjoy! All 12 pages have been brought to life with beautiful artwork.
          </p>
          <p style="margin:0 0 28px;font-size:16px;color:#374151;line-height:1.65">
            Read it online or download the PDF to print and keep forever:
          </p>

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="${bookUrl}" style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#EC4899);color:#ffffff;text-decoration:none;font-size:17px;font-weight:bold;padding:17px 44px;border-radius:12px;font-family:Arial,sans-serif;letter-spacing:0.3px">
                Read the Full Book &rarr;
              </a>
            </td></tr>
          </table>

          ${pdfButton}
        </td></tr>

        <tr><td style="padding:20px 40px 32px;text-align:center;border-top:1px solid #F3F4F6">
          <p style="margin:0;font-size:12px;color:#9CA3AF;font-family:Arial,sans-serif;line-height:1.6">
            Starmee &middot; Personalised storybooks for every child<br>
            You received this because you purchased a story at starmeestories.com
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
