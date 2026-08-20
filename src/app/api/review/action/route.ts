/**
 * The ONLY place a book version can be approved, flagged for changes, or
 * rejected. POST only — there is deliberately no GET handler: an email
 * security scanner or link-preview fetcher that GETs the review URL must never
 * be able to approve anything. The reviewer must submit the form on the review
 * page.
 *
 * Three canonical actions:
 *   approve         — approve the EXACT reviewed version (the token's version
 *                     must equal review_version_id). The workflow mints the
 *                     preview access grant, sends the invitation, and advances
 *                     the lifecycle.
 *   request_changes — flag specific pages for revision. Requires feedback, at
 *                     least one affected page, and a scope. Creates exactly one
 *                     structured revision request, transitions once, and runs
 *                     the bounded targeted revision.
 *   reject          — hard rejection. Same mandatory fields and same single
 *                     structured request + transition.
 *
 * This route is a thin validator: it validates input, delegates the decision to
 * the workflow, and consumes the token only AFTER a successful decision.
 */

import { NextRequest, NextResponse } from "next/server";
import { resolveReviewToken, consumeReviewToken } from "@/lib/review-tokens";
import { approveBook, requestBookChanges } from "@/lib/review-workflow";
import { getAppUrl } from "@/lib/utils";
import { runRequestedRevision } from "@/services/book-pipeline";

export const dynamic = "force-dynamic";

/**
 * Behind Replit's proxy req.url resolves to http://0.0.0.0:PORT, so a redirect
 * built from it sends the reviewer to a dead address. Always redirect from the
 * configured public origin.
 */
function back(token: string, message: string) {
  const url = new URL("/review/" + encodeURIComponent(token), getAppUrl());
  url.searchParams.set("m", message);
  return NextResponse.redirect(url, { status: 303 });
}

type Scope = "text" | "illustration" | "both";

function normaliseScope(raw: string): Scope | null {
  if (raw === "text" || raw === "illustration" || raw === "both") return raw;
  return null;
}

/** Pull all checked page numbers from a multi-value "affected_pages" field. */
function collectAffectedPages(form: FormData): number[] {
  const raw = form.getAll("affected_pages");
  const nums: number[] = [];
  for (const v of raw) {
    const n = parseInt(String(v), 10);
    if (!isNaN(n) && n > 0) nums.push(n);
  }
  return Array.from(new Set(nums)).sort((a, b) => a - b);
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const token = String(form.get("token") || "");
  const action = String(form.get("action") || "");
  const reviewer = String(form.get("reviewer") || "").trim();
  const feedback = String(form.get("feedback") || form.get("notes") || "").trim();

  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const resolved = await resolveReviewToken(token);
  if (resolved.state !== "valid" || !resolved.bookId || !resolved.tokenId) {
    return back(token, "This review link is " + resolved.state + ".");
  }

  if (!reviewer) {
    return back(token, "Please enter your name so we can record who reviewed this.");
  }

  const { bookId, tokenId, versionId } = resolved;
  let message: string;
  let decisionRecorded = false;

  // ── APPROVE ────────────────────────────────────────────────────────────────
  if (action === "approve") {
    // The workflow enforces the exact-version binding (token version ==
    // review_version_id), mints the preview access grant, sends the invitation,
    // and advances the lifecycle. This route does not touch version pointers.
    const r = await approveBook({
      bookId,
      versionId: versionId ?? null,
      reviewer,
      notes: feedback || undefined,
    });
    message = r.message;
    decisionRecorded = r.ok;

  // ── REQUEST CHANGES / REJECT ────────────────────────────────────────────────
  } else if (action === "request_changes" || action === "reject") {
    if (!feedback) {
      return back(token, "Please describe what needs to change.");
    }
    const affectedPages = collectAffectedPages(form);
    if (affectedPages.length === 0) {
      return back(token, "Please select at least one affected page.");
    }
    const scope = normaliseScope(String(form.get("scope") || "").trim());
    if (!scope) {
      return back(
        token,
        "Please choose whether the issue is with text, illustration, or both.",
      );
    }

    const r = await requestBookChanges({
      bookId,
      versionId: versionId ?? null,
      reviewer,
      feedback,
      affectedPages,
      scope,
      decision: action === "reject" ? "reject" : "request_changes",
    });
    message = r.message;
    decisionRecorded = r.ok;
    if (r.ok && r.requestId) {
      try {
        const revision = await runRequestedRevision(bookId, r.requestId);
        message += revision.ok
          ? " The targeted revision is complete and ready for re-review."
          : " The revision request is saved, but generation needs an operator retry: " +
            (revision.error ?? "unknown error");
      } catch (error) {
        message +=
          " The revision request is saved, but generation needs an operator retry: " +
          (error instanceof Error ? error.message : String(error));
      }
    }

  } else {
    return back(token, "Unknown action.");
  }

  // Consume the token only after a successful decision has been recorded. If the
  // decision failed (e.g. wrong version, already processed), leave the token so
  // the reviewer can retry with a corrected submission.
  if (decisionRecorded) {
    await consumeReviewToken(tokenId);
  }

  return back(token, message);
}
