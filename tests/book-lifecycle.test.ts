import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  LIFECYCLE_STAGES,
  isLegalTransition,
  legalNextStages,
  checkVersionCompleteness,
  hasMaterialDifference,
  selectPreviewPages,
  checkDeliveryPrerequisites,
  resolveCanonicalStage,
  isDeliveredStage,
  type LifecycleStage,
} from "@/lib/book-lifecycle";
import type { BookVersionPage } from "@/types/book";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makePage(
  pageNumber: number,
  overrides: Partial<Pick<BookVersionPage, "textContent" | "illustrationUrl" | "isPreview">> = {},
): Pick<BookVersionPage, "pageNumber" | "textContent" | "illustrationUrl" | "isPreview"> {
  return {
    pageNumber,
    textContent:     overrides.textContent     ?? `Text for page ${pageNumber}`,
    illustrationUrl: overrides.illustrationUrl ?? `https://cdn.example.com/p${pageNumber}.png`,
    isPreview:       overrides.isPreview       ?? false,
  };
}

/** Fully-ready delivery input; individual fields can be overridden per-test. */
function fullyReadyDelivery(
  overrides: Partial<Parameters<typeof checkDeliveryPrerequisites>[0]> = {},
): Parameters<typeof checkDeliveryPrerequisites>[0] {
  return {
    lifecycleStage:              "Purchased",
    hasPaidOrder:                true,
    hasSuccessfulDeliveryAttempt: true,
    hasDurableVerifiedArtefact:  true,
    hasVerifiedAccessGrant:      true,
    currentVersionId:            "v-uuid-1",
    approvedVersionId:           "v-uuid-1",
    ...overrides,
  };
}

// ─── Stage list ───────────────────────────────────────────────────────────────

describe("LIFECYCLE_STAGES", () => {
  test("contains exactly the 8 canonical stages in order", () => {
    assert.equal(LIFECYCLE_STAGES.length, 8);
    assert.deepEqual([...LIFECYCLE_STAGES], [
      "Generated",
      "Under Review",
      "Changes Requested",
      "Revised",
      "Approved",
      "Ready for Purchase",
      "Purchased",
      "Delivered",
    ]);
  });

  test("every element is a string", () => {
    for (const s of LIFECYCLE_STAGES) assert.equal(typeof s, "string");
  });

  test("no duplicates", () => {
    assert.equal(new Set(LIFECYCLE_STAGES).size, LIFECYCLE_STAGES.length);
  });
});

// ─── Legal transition validator ───────────────────────────────────────────────

describe("isLegalTransition – valid moves", () => {
  test("null -> Generated (initial entry)", () => {
    assert.equal(isLegalTransition(null, "Generated").allowed, true);
  });

  test("Generated -> Under Review", () => {
    assert.equal(isLegalTransition("Generated", "Under Review").allowed, true);
  });

  test("Under Review -> Approved", () => {
    assert.equal(isLegalTransition("Under Review", "Approved").allowed, true);
  });

  test("Under Review -> Changes Requested", () => {
    assert.equal(isLegalTransition("Under Review", "Changes Requested").allowed, true);
  });

  test("Changes Requested -> Revised", () => {
    assert.equal(isLegalTransition("Changes Requested", "Revised").allowed, true);
  });

  test("Revised -> Under Review", () => {
    assert.equal(isLegalTransition("Revised", "Under Review").allowed, true);
  });

  test("Approved -> Ready for Purchase", () => {
    assert.equal(isLegalTransition("Approved", "Ready for Purchase").allowed, true);
  });

  test("Ready for Purchase -> Purchased", () => {
    assert.equal(isLegalTransition("Ready for Purchase", "Purchased").allowed, true);
  });

  test("Purchased -> Delivered", () => {
    assert.equal(isLegalTransition("Purchased", "Delivered").allowed, true);
  });

  test("Changes Requested -> Generated (admin re-generation override)", () => {
    assert.equal(isLegalTransition("Changes Requested", "Generated").allowed, true);
  });
});

describe("isLegalTransition – invalid moves", () => {
  test("null -> Under Review is blocked (must start with Generated)", () => {
    const r = isLegalTransition(null, "Under Review");
    assert.equal(r.allowed, false);
    assert.ok(r.reason, "should carry a reason message");
  });

  test("Generated -> Approved is blocked (skips review)", () => {
    const r = isLegalTransition("Generated", "Approved");
    assert.equal(r.allowed, false);
    assert.ok(r.reason);
  });

  test("Approved -> Purchased is blocked (must go through Ready for Purchase)", () => {
    assert.equal(isLegalTransition("Approved", "Purchased").allowed, false);
  });

  test("Delivered is a terminal stage – every outgoing transition blocked", () => {
    for (const stage of LIFECYCLE_STAGES) {
      assert.equal(
        isLegalTransition("Delivered", stage).allowed,
        false,
        `Delivered -> ${stage} should be blocked`,
      );
    }
  });

  test("backward skip: Purchased -> Approved", () => {
    assert.equal(isLegalTransition("Purchased", "Approved").allowed, false);
  });

  test("backward skip: Delivered -> Purchased", () => {
    assert.equal(isLegalTransition("Delivered", "Purchased").allowed, false);
  });

  test("backward skip: Ready for Purchase -> Approved", () => {
    assert.equal(isLegalTransition("Ready for Purchase", "Approved").allowed, false);
  });

  test("large skip: Under Review -> Purchased", () => {
    assert.equal(isLegalTransition("Under Review", "Purchased").allowed, false);
  });

  test("large skip: Generated -> Delivered", () => {
    assert.equal(isLegalTransition("Generated", "Delivered").allowed, false);
  });

  test("same-stage self-transition is blocked", () => {
    for (const stage of LIFECYCLE_STAGES) {
      assert.equal(
        isLegalTransition(stage, stage).allowed,
        false,
        `${stage} -> ${stage} should not be self-allowed`,
      );
    }
  });
});

describe("isLegalTransition – reason messages", () => {
  test("blocked transition carries a non-empty reason string", () => {
    const r = isLegalTransition("Generated", "Delivered");
    assert.equal(r.allowed, false);
    assert.ok(typeof r.reason === "string" && r.reason.length > 0);
  });

  test("allowed transition has no reason field set", () => {
    const r = isLegalTransition("Generated", "Under Review");
    assert.equal(r.allowed, true);
    assert.equal(r.reason, undefined);
  });
});

// ─── legalNextStages ─────────────────────────────────────────────────────────

describe("legalNextStages", () => {
  test("null -> [Generated]", () => {
    assert.deepEqual(legalNextStages(null), ["Generated"]);
  });

  test("Under Review has exactly two next stages: Approved and Changes Requested", () => {
    const next = legalNextStages("Under Review");
    assert.equal(next.length, 2);
    assert.ok(next.includes("Approved"));
    assert.ok(next.includes("Changes Requested"));
  });

  test("Changes Requested -> [Revised, Generated]", () => {
    const next = legalNextStages("Changes Requested");
    assert.equal(next.length, 2);
    assert.ok(next.includes("Revised"));
    assert.ok(next.includes("Generated"));
  });

  test("Delivered returns empty array (terminal)", () => {
    assert.deepEqual(legalNextStages("Delivered"), []);
  });

  test("all returned stages are known stage values", () => {
    const stageSet = new Set<string>(LIFECYCLE_STAGES);
    for (const from of [null as LifecycleStage | null, ...LIFECYCLE_STAGES]) {
      for (const next of legalNextStages(from)) {
        assert.ok(stageSet.has(next), `unknown stage returned: ${next}`);
      }
    }
  });
});

// ─── Version completeness ─────────────────────────────────────────────────────

describe("checkVersionCompleteness – default (requirePdf = false)", () => {
  const goodVersion = { pageCount: 3, pdfUrl: null }; // no PDF needed for review
  const goodPages   = [makePage(1), makePage(2), makePage(3)];

  test("all pages present, no PDF required -> complete", () => {
    const r = checkVersionCompleteness(goodVersion, goodPages);
    assert.equal(r.complete, true);
    assert.deepEqual(r.missingFields, []);
  });

  test("missing pdf_url does NOT fail when requirePdf defaults to false", () => {
    const r = checkVersionCompleteness({ pageCount: 2, pdfUrl: null }, [makePage(1), makePage(2)]);
    assert.equal(r.complete, true);
  });

  test("zero pageCount fails", () => {
    const r = checkVersionCompleteness({ pageCount: 0, pdfUrl: null }, []);
    assert.equal(r.complete, false);
    assert.ok(r.missingFields.some((f) => f.includes("pages")));
  });

  test("empty pages array fails even with positive pageCount", () => {
    const r = checkVersionCompleteness({ pageCount: 3, pdfUrl: "x" }, []);
    assert.equal(r.complete, false);
    assert.ok(r.missingFields.some((f) => f.includes("pages")));
  });

  test("page with blank text_content fails", () => {
    const pages = [makePage(1, { textContent: "" }), makePage(2)];
    const r = checkVersionCompleteness({ pageCount: 2, pdfUrl: null }, pages);
    assert.equal(r.complete, false);
    assert.ok(r.missingFields.some((f) => f.includes("page 1") && f.includes("text")));
  });

  test("page with whitespace-only text_content fails", () => {
    const pages = [makePage(1, { textContent: "   " }), makePage(2)];
    const r = checkVersionCompleteness({ pageCount: 2, pdfUrl: null }, pages);
    assert.equal(r.complete, false);
  });

  test("page with empty illustration_url fails", () => {
    const pages = [makePage(1, { illustrationUrl: "" }), makePage(2)];
    const r = checkVersionCompleteness({ pageCount: 2, pdfUrl: null }, pages);
    assert.equal(r.complete, false);
    assert.ok(r.missingFields.some((f) => f.includes("page 1") && f.includes("illustration")));
  });

  test("multiple missing fields on multiple pages all reported", () => {
    const pages = [
      makePage(1, { textContent: "", illustrationUrl: "" }),
      makePage(2, { textContent: "" }),
    ];
    const r = checkVersionCompleteness({ pageCount: 2, pdfUrl: null }, pages);
    assert.equal(r.complete, false);
    // At least: p1 text, p1 illust, p2 text
    assert.ok(r.missingFields.length >= 3);
  });
});

describe("checkVersionCompleteness – requirePdf = true (delivery stage)", () => {
  const goodPages = [makePage(1), makePage(2)];

  test("pdf_url present -> complete", () => {
    const r = checkVersionCompleteness(
      { pageCount: 2, pdfUrl: "https://cdn.example.com/book.pdf" },
      goodPages,
      { requirePdf: true },
    );
    assert.equal(r.complete, true);
  });

  test("missing pdf_url fails when requirePdf = true", () => {
    const r = checkVersionCompleteness(
      { pageCount: 2, pdfUrl: null },
      goodPages,
      { requirePdf: true },
    );
    assert.equal(r.complete, false);
    assert.ok(r.missingFields.includes("pdf_url"));
  });

  test("pdf_url required + page issue -> both reported", () => {
    const r = checkVersionCompleteness(
      { pageCount: 1, pdfUrl: null },
      [makePage(1, { textContent: "" })],
      { requirePdf: true },
    );
    assert.equal(r.complete, false);
    assert.ok(r.missingFields.includes("pdf_url"));
    assert.ok(r.missingFields.some((f) => f.includes("text")));
  });
});

// ─── Material difference helper ───────────────────────────────────────────────

describe("hasMaterialDifference", () => {
  const pagesA = [makePage(1), makePage(2), makePage(3)];

  test("identical pages have no material difference", () => {
    const r = hasMaterialDifference(pagesA, [...pagesA]);
    assert.equal(r.hasMaterialDifference, false);
    assert.deepEqual(r.changedPages, []);
    assert.deepEqual(r.reason, []);
  });

  test("changed text on one page is material", () => {
    const pagesB = [makePage(1), makePage(2, { textContent: "CHANGED" }), makePage(3)];
    const r = hasMaterialDifference(pagesA, pagesB);
    assert.equal(r.hasMaterialDifference, true);
    assert.ok(r.changedPages.includes(2));
    assert.ok(r.reason.some((s) => s.includes("text")));
  });

  test("changed illustration URL on one page is material", () => {
    const pagesB = [makePage(1), makePage(2, { illustrationUrl: "https://cdn.example.com/NEW.png" }), makePage(3)];
    const r = hasMaterialDifference(pagesA, pagesB);
    assert.equal(r.hasMaterialDifference, true);
    assert.ok(r.changedPages.includes(2));
    assert.ok(r.reason.some((s) => s.includes("illustration")));
  });

  test("different page count is material", () => {
    const r = hasMaterialDifference(pagesA, [makePage(1), makePage(2)]);
    assert.equal(r.hasMaterialDifference, true);
    assert.ok(r.reason.some((s) => s.includes("count")));
  });

  test("added page is material", () => {
    const r = hasMaterialDifference(pagesA, [...pagesA, makePage(4)]);
    assert.equal(r.hasMaterialDifference, true);
    assert.ok(r.changedPages.includes(4));
    assert.ok(r.reason.some((s) => s.includes("added")));
  });

  test("removed page is material", () => {
    const r = hasMaterialDifference(pagesA, [makePage(1), makePage(3)]);
    assert.equal(r.hasMaterialDifference, true);
    assert.ok(r.changedPages.includes(2));
    assert.ok(r.reason.some((s) => s.includes("removed")));
  });

  test("both text and illustration changed on same page – both reported", () => {
    const pagesB = [
      makePage(1, { textContent: "NEW TEXT", illustrationUrl: "https://cdn.example.com/NEWILLUST.png" }),
      makePage(2),
      makePage(3),
    ];
    const r = hasMaterialDifference(pagesA, pagesB);
    assert.equal(r.hasMaterialDifference, true);
    assert.ok(r.reason.some((s) => s.includes("text") && s.includes("illustration")));
  });

  test("empty sets have no material difference", () => {
    const r = hasMaterialDifference([], []);
    assert.equal(r.hasMaterialDifference, false);
  });

  test("changedPages contains no duplicates", () => {
    const pagesB = [makePage(1, { textContent: "X" }), makePage(2, { textContent: "Y" })];
    const r = hasMaterialDifference([makePage(1), makePage(2)], pagesB);
    const unique = new Set(r.changedPages);
    assert.equal(unique.size, r.changedPages.length);
  });
});

// ─── Preview page selection ───────────────────────────────────────────────────

describe("selectPreviewPages", () => {
  test("returns at most 2 pages regardless of input size", () => {
    const pages = [1, 2, 3, 4, 5, 6].map((n) => makePage(n));
    assert.ok(selectPreviewPages(pages).length <= 2);
  });

  test("prefers pages already marked is_preview", () => {
    const pages = [
      makePage(1),
      makePage(2, { isPreview: true }),
      makePage(3, { isPreview: true }),
      makePage(4),
    ];
    const result = selectPreviewPages(pages);
    assert.equal(result.length, 2);
    assert.ok(result.every((p) => p.isPreview));
    assert.ok(result.some((p) => p.pageNumber === 2));
    assert.ok(result.some((p) => p.pageNumber === 3));
  });

  test("when more than 2 are marked, returns first 2 by page number", () => {
    const pages = [
      makePage(3, { isPreview: true }),
      makePage(1, { isPreview: true }),
      makePage(2, { isPreview: true }),
      makePage(4),
    ];
    const result = selectPreviewPages(pages);
    assert.equal(result.length, 2);
    assert.ok(result.some((p) => p.pageNumber === 1));
    assert.ok(result.some((p) => p.pageNumber === 2));
  });

  test("supplements when fewer than 2 are marked – marked page always included", () => {
    const pages = [
      makePage(1, { isPreview: true }),
      makePage(2),
      makePage(3),
      makePage(4),
      makePage(5),
    ];
    const result = selectPreviewPages(pages);
    assert.equal(result.length, 2);
    assert.ok(result.some((p) => p.pageNumber === 1));
  });

  test("returns empty array for empty input", () => {
    assert.deepEqual(selectPreviewPages([]), []);
  });

  test("single page input returns that page", () => {
    const result = selectPreviewPages([makePage(7)]);
    assert.equal(result.length, 1);
    assert.equal(result[0].pageNumber, 7);
  });

  test("two-page book returns both pages", () => {
    const result = selectPreviewPages([makePage(1), makePage(2)]);
    assert.equal(result.length, 2);
  });

  test("result is always sorted ascending by page number", () => {
    const pages = [
      makePage(5, { isPreview: true }),
      makePage(2, { isPreview: true }),
      makePage(8),
    ];
    const result = selectPreviewPages(pages);
    for (let i = 1; i < result.length; i++) {
      assert.ok(
        result[i].pageNumber > result[i - 1].pageNumber,
        "pages must be ascending",
      );
    }
  });

  test("no marked pages – heuristic selects from available pages", () => {
    const pages = [1, 2, 3, 4, 5].map((n) => makePage(n));
    const result = selectPreviewPages(pages);
    assert.equal(result.length, 2);
    // First page should always be page 1
    assert.ok(result.some((p) => p.pageNumber === 1));
  });
});

// ─── Delivery prerequisites (v2 – verified artefact / access / notification) ──

describe("checkDeliveryPrerequisites", () => {
  test("all prerequisites met -> ready with no blockers", () => {
    const r = checkDeliveryPrerequisites(fullyReadyDelivery());
    assert.equal(r.ready, true);
    assert.deepEqual(r.blockers, []);
  });

  // Stage check
  test("wrong lifecycle stage blocks delivery", () => {
    const r = checkDeliveryPrerequisites(fullyReadyDelivery({ lifecycleStage: "Approved" }));
    assert.equal(r.ready, false);
    assert.ok(r.blockers.some((b) => b.includes("Purchased") && b.includes("Approved")));
  });

  test("null lifecycle stage blocks delivery", () => {
    const r = checkDeliveryPrerequisites(fullyReadyDelivery({ lifecycleStage: null }));
    assert.equal(r.ready, false);
    assert.ok(r.blockers.some((b) => b.includes("Purchased")));
  });

  test("Generated stage blocks delivery", () => {
    const r = checkDeliveryPrerequisites(fullyReadyDelivery({ lifecycleStage: "Generated" }));
    assert.equal(r.ready, false);
  });

  // Payment check
  test("no paid order blocks delivery", () => {
    const r = checkDeliveryPrerequisites(fullyReadyDelivery({ hasPaidOrder: false }));
    assert.equal(r.ready, false);
    assert.ok(r.blockers.some((b) => b.includes("paid")));
  });

  // Delivery attempt check
  test("no successful delivery attempt blocks delivery", () => {
    const r = checkDeliveryPrerequisites(fullyReadyDelivery({ hasSuccessfulDeliveryAttempt: false }));
    assert.equal(r.ready, false);
    assert.ok(r.blockers.some((b) => b.includes("delivery attempt")));
  });

  // Artefact check (new v2 field: hasDurableVerifiedArtefact)
  test("no durable-verified artefact blocks delivery", () => {
    const r = checkDeliveryPrerequisites(fullyReadyDelivery({ hasDurableVerifiedArtefact: false }));
    assert.equal(r.ready, false);
    assert.ok(r.blockers.some((b) => b.includes("artefact")));
  });

  // Access grant check (new v2 field)
  test("no verified access grant blocks delivery", () => {
    const r = checkDeliveryPrerequisites(fullyReadyDelivery({ hasVerifiedAccessGrant: false }));
    assert.equal(r.ready, false);
    assert.ok(r.blockers.some((b) => b.includes("access grant")));
  });

  // Version checks
  test("null currentVersionId blocks delivery", () => {
    const r = checkDeliveryPrerequisites(
      fullyReadyDelivery({ currentVersionId: null, approvedVersionId: null }),
    );
    assert.equal(r.ready, false);
    assert.ok(r.blockers.some((b) => b.includes("version")));
  });

  test("currentVersionId mismatching approvedVersionId blocks delivery", () => {
    const r = checkDeliveryPrerequisites(
      fullyReadyDelivery({ currentVersionId: "v-uuid-2", approvedVersionId: "v-uuid-1" }),
    );
    assert.equal(r.ready, false);
    assert.ok(r.blockers.some((b) => b.includes("approved version")));
  });

  test("approvedVersionId = null (not yet set) does not block on version match", () => {
    // If no approved version pointer is set, no version-mismatch error – only
    // the presence of currentVersionId is checked.
    const r = checkDeliveryPrerequisites(
      fullyReadyDelivery({ currentVersionId: "v-uuid-1", approvedVersionId: null }),
    );
    assert.equal(r.ready, true);
  });

  test("all fields false -> all 6 blockers reported", () => {
    const r = checkDeliveryPrerequisites({
      lifecycleStage:               null,
      hasPaidOrder:                 false,
      hasSuccessfulDeliveryAttempt: false,
      hasDurableVerifiedArtefact:   false,
      hasVerifiedAccessGrant:       false,
      currentVersionId:             null,
      approvedVersionId:            null,
    });
    assert.equal(r.ready, false);
    assert.ok(r.blockers.length >= 5, `Expected >=5 blockers, got ${r.blockers.length}`);
  });
});

// ─── Full lifecycle happy path (integration) ──────────────────────────────────

describe("full lifecycle happy path", () => {
  const happyPath: LifecycleStage[] = [
    "Generated",
    "Under Review",
    "Approved",
    "Ready for Purchase",
    "Purchased",
    "Delivered",
  ];

  test("each consecutive stage in the happy path is a legal transition", () => {
    let current: LifecycleStage | null = null;
    for (const next of happyPath) {
      const r = isLegalTransition(current, next);
      assert.equal(
        r.allowed,
        true,
        `Expected ${String(current)} -> ${next} to be allowed; got: ${r.reason}`,
      );
      current = next;
    }
  });

  test("revision cycle: Under Review -> Changes Requested -> Revised -> Under Review", () => {
    assert.equal(isLegalTransition("Under Review", "Changes Requested").allowed, true);
    assert.equal(isLegalTransition("Changes Requested", "Revised").allowed, true);
    assert.equal(isLegalTransition("Revised", "Under Review").allowed, true);
  });

  test("re-generation path: Changes Requested -> Generated -> Under Review", () => {
    assert.equal(isLegalTransition("Changes Requested", "Generated").allowed, true);
    assert.equal(isLegalTransition("Generated", "Under Review").allowed, true);
  });

  test("nothing can follow Delivered", () => {
    for (const s of LIFECYCLE_STAGES) {
      assert.equal(isLegalTransition("Delivered", s).allowed, false);
    }
  });
});

// ─── Edge cases ───────────────────────────────────────────────────────────────

describe("edge cases", () => {
  test("checkVersionCompleteness: single page book passes", () => {
    const r = checkVersionCompleteness({ pageCount: 1, pdfUrl: null }, [makePage(1)]);
    assert.equal(r.complete, true);
  });

  test("checkVersionCompleteness: whitespace illustration URL fails", () => {
    const r = checkVersionCompleteness(
      { pageCount: 1, pdfUrl: null },
      [makePage(1, { illustrationUrl: "   " })],
    );
    assert.equal(r.complete, false);
  });

  test("hasMaterialDifference: page order in input does not matter", () => {
    const a = [makePage(1), makePage(2), makePage(3)];
    const b = [makePage(3), makePage(1), makePage(2)];
    const r = hasMaterialDifference(a, b);
    assert.equal(r.hasMaterialDifference, false);
  });

  test("selectPreviewPages: three pages none marked -> selects 2", () => {
    const result = selectPreviewPages([makePage(1), makePage(2), makePage(3)]);
    assert.equal(result.length, 2);
  });

  test("checkDeliveryPrerequisites: same version id for current and approved is fine", () => {
    const r = checkDeliveryPrerequisites(
      fullyReadyDelivery({ currentVersionId: "same-id", approvedVersionId: "same-id" }),
    );
    assert.equal(r.ready, true);
  });
});

// ─── Canonical stage resolution (display) ─────────────────────────────────────

describe("resolveCanonicalStage", () => {
  test("prefers the canonical stage when present", () => {
    assert.equal(resolveCanonicalStage("Delivered", "paid"), "Delivered");
    assert.equal(resolveCanonicalStage("Under Review", "complete"), "Under Review");
  });

  test("ignores legacy status when a canonical stage is present", () => {
    // Legacy status would map to Delivered, but the canonical stage wins.
    assert.equal(resolveCanonicalStage("Purchased", "delivered"), "Purchased");
  });

  test("falls back to legacy status ONLY when canonical stage is null", () => {
    assert.equal(resolveCanonicalStage(null, "pending_review"), "Under Review");
    assert.equal(resolveCanonicalStage(null, "needs_regeneration"), "Changes Requested");
    assert.equal(resolveCanonicalStage(null, "complete"), "Generated");
    assert.equal(resolveCanonicalStage(null, "delivered"), null);
    assert.equal(resolveCanonicalStage(undefined, "fulfilled"), null);
  });

  test("returns null when neither yields a canonical stage", () => {
    assert.equal(resolveCanonicalStage(null, null), null);
    assert.equal(resolveCanonicalStage(null, "some_unknown_status"), null);
    assert.equal(resolveCanonicalStage("Not A Stage", null), null);
  });
});

describe("isDeliveredStage", () => {
  test("true only for the canonical Delivered stage", () => {
    assert.equal(isDeliveredStage("Delivered"), true);
    assert.equal(isDeliveredStage("Purchased"), false);
    assert.equal(isDeliveredStage(null, "delivered"), false);
    assert.equal(isDeliveredStage(null, "fulfilled"), false);
    assert.equal(isDeliveredStage(null, "paid"), false);
    // Canonical present but not Delivered wins over legacy delivered.
    assert.equal(isDeliveredStage("Purchased", "delivered"), false);
  });
});
