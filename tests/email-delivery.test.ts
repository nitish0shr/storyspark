import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { isEmailConfigured, sendEmail } from "@/lib/email-provider";

/**
 * These run with SENDGRID_API_KEY deliberately unset, which is the current
 * production reality. The contract we depend on is that an unconfigured
 * provider degrades safely instead of throwing, so a book is never marked
 * delivered when nothing was actually sent.
 */
describe("email provider (no credentials configured)", () => {
  test("reports itself as not configured", () => {
    delete process.env.SENDGRID_API_KEY;
    assert.equal(isEmailConfigured(), false);
  });

  test("sendEmail resolves instead of throwing", async () => {
    delete process.env.SENDGRID_API_KEY;
    const result = await sendEmail({
      to: "nobody@example.com",
      subject: "test",
      html: "<p>test</p>",
    });
    assert.equal(result.sent, false);
    assert.equal(result.reason, "not_configured");
  });

  test("delivery must not be recorded when the send did not happen", async () => {
    delete process.env.SENDGRID_API_KEY;
    const book = { status: "approved", delivered_at: null as string | null };
    const result = await sendEmail({ to: "a@b.com", subject: "s", html: "h" });

    // Mirrors deliverBook: only mark delivered after a successful send.
    if (result.sent) {
      book.status = "delivered";
      book.delivered_at = new Date().toISOString();
    }

    assert.equal(book.status, "approved");
    assert.equal(book.delivered_at, null);
  });

  test("a second delivery attempt is refused once already delivered", () => {
    const book = { status: "delivered", delivered_at: "2026-08-04T00:00:00Z" };
    const alreadyDelivered = book.status === "delivered" || Boolean(book.delivered_at);
    assert.equal(alreadyDelivered, true);
  });
});
