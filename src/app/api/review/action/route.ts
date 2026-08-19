/**
 * The ONLY place an order can be approved or rejected.
 *
 * POST only. There is deliberately no GET handler: an email security scanner
 * or link preview that fetches the review URL must never be able to approve
 * anything. The reviewer has to submit this form on the review page.
 */

import { NextRequest, NextResponse } from "next/server";
import { resolveReviewToken, consumeReviewToken } from "@/lib/review-tokens";
import { approveBook, rejectBook } from "@/lib/review-workflow";
import { getAppUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Behind Replit's proxy req.url resolves to http://0.0.0.0:PORT, so a redirect
 * built from it sends the reviewer to a dead address and the browser shows
 * "site cannot be reached". Always redirect from the configured public origin.
 */
function back(token: string, message: string) {
  const url = new URL("/review/" + encodeURIComponent(token), getAppUrl());
  url.searchParams.set("m", message);
  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const token = String(form.get("token") || "");
  const action = String(form.get("action") || "");
  const reviewer = String(form.get("reviewer") || "").trim();
  const notes = String(form.get("notes") || "").trim();

  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const resolved = await resolveReviewToken(token);
  if (resolved.state !== "valid" || !resolved.bookId || !resolved.tokenId) {
    return back(token, "This review link is " + resolved.state + ".");
  }

  if (!reviewer) {
    return back(token, "Please enter your name so we can record who reviewed this.");
  }

  let message: string;
  if (action === "approve") {
    const r = await approveBook({ bookId: resolved.bookId, reviewer, notes });
    message = r.message;
  } else if (action === "reject") {
    if (!notes) {
      return back(token, "Please say what is wrong so the retry can fix it.");
    }
    const r = await rejectBook({ bookId: resolved.bookId, reviewer, reason: notes });
    message = r.message;

    // A human rejection should immediately trigger a fresh attempt that uses
    // their written feedback. Fire and forget so the reviewer is not left
    // waiting on image generation; if it fails the book simply stays in
    // needs_regeneration for a manual retry.
    if (r.ok) {
      const bookId = resolved.bookId;
      void import("@/services/book-pipeline")
        .then((m) => m.generatePreview(bookId))
        .catch((err) => {
          console.error("[review] auto-regeneration failed for " + bookId, err);
        });
    }
  } else {
    return back(token, "Unknown action.");
  }

  // Burn the link once a decision has been recorded.
  await consumeReviewToken(resolved.tokenId);
  return back(token, message);
}
