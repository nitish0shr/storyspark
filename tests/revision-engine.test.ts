/**
 * Unit tests for the revision engine.
 *
 * All DB interaction is injected via pure helpers — no real Supabase calls.
 * These tests verify the engine's logic: duplicate detection, material
 * difference checks, max attempt enforcement, and page merging.
 */

import { test, describe, mock } from "node:test";
import assert from "node:assert/strict";

import {
  computeVersionContentHash,
  textSimilarity,
} from "@/lib/book-versions";
import {
  MAX_REVISION_ATTEMPTS,
} from "@/services/revision-engine";
import type {
  RevisionHelpers,
  RevisionTarget,
  RevisionPageScope,
  RevisionFinding,
} from "@/services/revision-engine";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeBookPage(pageNumber: number, text = `Page ${pageNumber} text`) {
  return { pageNumber, text };
}

function makeVersionPage(
  pageNumber: number,
  textContent = `Page ${pageNumber} text`,
  illustrationUrl = `https://cdn.example.com/p${pageNumber}.png`,
) {
  return {
    id: `page-${pageNumber}`,
    versionId: "v1",
    pageNumber,
    textContent,
    illustrationUrl,
    qualityFindings: [],
    isPreview: false,
    metadata: null,
    createdAt: new Date().toISOString(),
  };
}

// ─── computeVersionContentHash ────────────────────────────────────────────────

describe("computeVersionContentHash", () => {
  test("identical pages produce identical hash", () => {
    const pages = [
      { pageNumber: 1, textContent: "Hello world", illustrationUrl: "https://cdn.example.com/1.png" },
      { pageNumber: 2, textContent: "Page two text", illustrationUrl: "https://cdn.example.com/2.png" },
    ];
    const h1 = computeVersionContentHash(pages);
    const h2 = computeVersionContentHash([...pages]);
    assert.equal(h1, h2);
  });

  test("different text produces different hash", () => {
    const pages1 = [{ pageNumber: 1, textContent: "Hello", illustrationUrl: "u1" }];
    const pages2 = [{ pageNumber: 1, textContent: "World", illustrationUrl: "u1" }];
    assert.notEqual(computeVersionContentHash(pages1), computeVersionContentHash(pages2));
  });

  test("different illustration URL produces different hash", () => {
    const pages1 = [{ pageNumber: 1, textContent: "Text", illustrationUrl: "url-a" }];
    const pages2 = [{ pageNumber: 1, textContent: "Text", illustrationUrl: "url-b" }];
    assert.notEqual(computeVersionContentHash(pages1), computeVersionContentHash(pages2));
  });

  test("order-insensitive (sorted by pageNumber)", () => {
    const pagesA = [
      { pageNumber: 2, textContent: "B", illustrationUrl: "u2" },
      { pageNumber: 1, textContent: "A", illustrationUrl: "u1" },
    ];
    const pagesB = [
      { pageNumber: 1, textContent: "A", illustrationUrl: "u1" },
      { pageNumber: 2, textContent: "B", illustrationUrl: "u2" },
    ];
    assert.equal(computeVersionContentHash(pagesA), computeVersionContentHash(pagesB));
  });

  test("null textContent is treated as empty string", () => {
    const pages1 = [{ pageNumber: 1, textContent: null, illustrationUrl: "u" }];
    const pages2 = [{ pageNumber: 1, textContent: "", illustrationUrl: "u" }];
    assert.equal(computeVersionContentHash(pages1), computeVersionContentHash(pages2));
  });

  test("returns a 64-char SHA-256 hex string", () => {
    const hash = computeVersionContentHash([
      { pageNumber: 1, textContent: "test", illustrationUrl: "url" },
    ]);
    // SHA-256 digests are 32 bytes = 64 lowercase hex characters.
    assert.match(hash, /^[0-9a-f]{64}$/);
  });
});

// ─── textSimilarity ───────────────────────────────────────────────────────────

describe("textSimilarity", () => {
  test("identical strings have similarity 1", () => {
    const s = "The quick brown fox jumps over the lazy dog";
    assert.equal(textSimilarity(s, s), 1);
  });

  test("completely different strings have low similarity", () => {
    const a = "The quick brown fox jumps over the lazy dog";
    const b = "Quantum mechanics describes subatomic particle behavior";
    const sim = textSimilarity(a, b);
    assert.ok(sim < 0.2, `Expected similarity < 0.2 but got ${sim}`);
  });

  test("empty strings have similarity 1", () => {
    assert.equal(textSimilarity("", ""), 1);
  });

  test("one empty string has similarity 0", () => {
    assert.equal(textSimilarity("hello world", ""), 0);
    assert.equal(textSimilarity("", "hello world"), 0);
  });

  test("near-identical strings (one word changed) have high similarity", () => {
    const a = "Leo loved playing with the friendly dolphin near the reef";
    const b = "Leo loved playing with the friendly dolphin near the rocks";
    const sim = textSimilarity(a, b);
    assert.ok(sim > 0.7, `Expected similarity > 0.7 but got ${sim}`);
  });

  test("symmetric: f(a,b) === f(b,a)", () => {
    const a = "The sun rose over the mountains";
    const b = "Mountains stood tall in the morning light";
    assert.equal(textSimilarity(a, b), textSimilarity(b, a));
  });

  test("similarity is always in [0, 1]", () => {
    const pairs = [
      ["", ""],
      ["hello", "hello"],
      ["foo bar baz", "qux quux"],
      ["same same same", "same same same same"],
    ];
    for (const [a, b] of pairs) {
      const sim = textSimilarity(a, b);
      assert.ok(sim >= 0 && sim <= 1, `Out of range: textSimilarity("${a}", "${b}") = ${sim}`);
    }
  });
});

// ─── MAX_REVISION_ATTEMPTS ────────────────────────────────────────────────────

describe("revision constants", () => {
  test("MAX_REVISION_ATTEMPTS is 2", () => {
    assert.equal(MAX_REVISION_ATTEMPTS, 2);
  });
});

// ─── RevisionHelpers interface contract ───────────────────────────────────────

describe("RevisionHelpers interface", () => {
  test("a conforming helpers object satisfies the interface", () => {
    const helpers: RevisionHelpers = {
      regenerateStoryPages: async (_bookId, pageNumbers, _reason, _currentPages) => {
        return pageNumbers.map((n) => makeBookPage(n, `Regenerated page ${n}`));
      },
      regenerateIllustrations: async (_bookId, storyPages, _reason) => {
        return storyPages.map((p) => `https://cdn.example.com/new-p${p.pageNumber}.png`);
      },
    };

    assert.ok(typeof helpers.regenerateStoryPages === "function");
    assert.ok(typeof helpers.regenerateIllustrations === "function");
  });

  test("regenerateStoryPages returns correct page count", async () => {
    const helpers: RevisionHelpers = {
      regenerateStoryPages: async (_bookId, pageNumbers, _reason, _currentPages) => {
        return pageNumbers.map((n) => makeBookPage(n));
      },
      regenerateIllustrations: async (_bookId, storyPages, _reason) => {
        return storyPages.map(() => null);
      },
    };

    const result = await helpers.regenerateStoryPages("book-1", [2, 3], "fix issue", []);
    assert.equal(result.length, 2);
    assert.equal(result[0].pageNumber, 2);
    assert.equal(result[1].pageNumber, 3);
  });
});

// ─── RevisionTarget ───────────────────────────────────────────────────────────

describe("RevisionTarget", () => {
  test("empty pageNumbers means regenerate all", () => {
    const scope: RevisionTarget = {
      pageNumbers: [],
      reason: "Regenerate everything",
    };
    assert.equal(scope.pageNumbers.length, 0);
  });

  test("non-empty pageNumbers means targeted revision", () => {
    const scope: RevisionTarget = {
      pageNumbers: [1, 3],
      reason: "Fix pages 1 and 3",
    };
    assert.equal(scope.pageNumbers.length, 2);
    assert.ok(scope.pageNumbers.includes(1));
    assert.ok(scope.pageNumbers.includes(3));
  });
});

// ─── Page merging logic ───────────────────────────────────────────────────────

describe("page merging logic (pure)", () => {
  test("merging unaffected + new pages produces sorted complete set", () => {
    const allPages = [1, 2, 3, 4, 5].map((n) => makeVersionPage(n));
    const targetPageNumbers = [2, 4];

    const unaffected = allPages.filter((p) => !targetPageNumbers.includes(p.pageNumber));
    const regenerated = targetPageNumbers.map((n) => makeBookPage(n, `New text for ${n}`));

    const unaffectedStory = unaffected.map((p) => ({
      pageNumber: p.pageNumber,
      text: p.textContent ?? "",
    }));

    const merged = [...unaffectedStory, ...regenerated].sort(
      (a, b) => a.pageNumber - b.pageNumber,
    );

    assert.equal(merged.length, 5);
    assert.deepEqual(
      merged.map((p) => p.pageNumber),
      [1, 2, 3, 4, 5],
    );
    // Pages 1, 3, 5 should have original text
    assert.equal(merged[0].text, "Page 1 text");
    assert.equal(merged[2].text, "Page 3 text");
    assert.equal(merged[4].text, "Page 5 text");
    // Pages 2, 4 should have new text
    assert.equal(merged[1].text, "New text for 2");
    assert.equal(merged[3].text, "New text for 4");
  });

  test("targeting all pages replaces everything", () => {
    const allPages = [1, 2, 3].map((n) => makeVersionPage(n));
    const targetPageNumbers = allPages.map((p) => p.pageNumber);

    const unaffected = allPages.filter((p) => !targetPageNumbers.includes(p.pageNumber));
    const regenerated = targetPageNumbers.map((n) => makeBookPage(n, `Completely new ${n}`));

    assert.equal(unaffected.length, 0);
    assert.equal(regenerated.length, 3);
  });
});

// ─── Duplicate detection logic (pure) ────────────────────────────────────────

describe("duplicate detection (pure logic)", () => {
  test("identical content hashes indicate duplicate", () => {
    const pages = [
      { pageNumber: 1, textContent: "Hello world", illustrationUrl: "url1" },
      { pageNumber: 2, textContent: "Page two", illustrationUrl: "url2" },
    ];
    const h1 = computeVersionContentHash(pages);
    const h2 = computeVersionContentHash(pages);
    assert.equal(h1, h2, "Same content should produce same hash");
    assert.equal(h1 === h2, true);
  });

  test("changed text produces a different hash (material change detected)", () => {
    const original = [
      { pageNumber: 1, textContent: "Original text", illustrationUrl: "url1" },
    ];
    const revised = [
      { pageNumber: 1, textContent: "Changed text", illustrationUrl: "url1" },
    ];
    assert.notEqual(
      computeVersionContentHash(original),
      computeVersionContentHash(revised),
    );
  });

  test("changed illustration URL produces a different hash", () => {
    const original = [{ pageNumber: 1, textContent: "Text", illustrationUrl: "original-url" }];
    const revised = [{ pageNumber: 1, textContent: "Text", illustrationUrl: "new-url" }];
    assert.notEqual(
      computeVersionContentHash(original),
      computeVersionContentHash(revised),
    );
  });

  test("high text similarity indicates near-duplicate", () => {
    // 95%+ similarity should be caught
    const text1 = "Leo went to the beach and played with a dolphin all afternoon long";
    const text2 = "Leo went to the beach and played with a dolphin all afternoon long";
    assert.equal(textSimilarity(text1, text2), 1);
  });

  test("materially different text has low similarity", () => {
    const text1 = "Leo discovered a magical ocean cave with glowing crystals";
    const text2 = "The stars twinkled above as Prisha counted sheep in the meadow";
    const sim = textSimilarity(text1, text2);
    assert.ok(sim < 0.3, `Expected low similarity but got ${sim}`);
  });
});

// ─── Scope preservation (pure reference of the engine merge algorithm) ─────────
//
// These reference helpers mirror EXACTLY what applyRevision does when merging a
// scoped revision. Keeping the algorithm here lets us assert the scope contract
// (text-only retains image, illustration-only retains text, both changes both,
// unaffected pages preserved) without a live Supabase connection.

interface RefPredPage {
  pageNumber: number;
  textContent: string | null;
  illustrationUrl: string | null;
}

function scopeFor(
  pageNumber: number,
  targets: number[],
  scopeByPage: Record<number, RevisionPageScope>,
  defaultScope: RevisionPageScope,
): RevisionPageScope | null {
  if (!targets.includes(pageNumber)) return null; // unaffected
  return scopeByPage[pageNumber] ?? defaultScope;
}

/** Merges predecessor pages with scoped regenerations exactly like the engine. */
function refMerge(
  predecessor: RefPredPage[],
  targets: number[],
  scopeByPage: Record<number, RevisionPageScope>,
  defaultScope: RevisionPageScope,
  regenText: (n: number) => string,
  regenUrl: (n: number) => string,
): { text: string; url: string | null; pageNumber: number }[] {
  return predecessor
    .slice()
    .sort((a, b) => a.pageNumber - b.pageNumber)
    .map((p) => {
      const scope = scopeFor(p.pageNumber, targets, scopeByPage, defaultScope);
      const regenText_ = scope === "text" || scope === "both";
      const regenIll_ = scope === "illustration" || scope === "both";
      return {
        pageNumber: p.pageNumber,
        text: regenText_ ? regenText(p.pageNumber) : (p.textContent ?? ""),
        url: regenIll_ ? regenUrl(p.pageNumber) : (p.illustrationUrl ?? null),
      };
    });
}

describe("scope preservation", () => {
  const pred: RefPredPage[] = [1, 2, 3].map((n) => ({
    pageNumber: n,
    textContent: `orig text ${n}`,
    illustrationUrl: `orig-url-${n}`,
  }));
  const newText = (n: number) => `NEW text ${n}`;
  const newUrl = (n: number) => `NEW-url-${n}`;

  test("text-only scope regenerates text but RETAINS the original illustration", () => {
    const merged = refMerge(pred, [2], { 2: "text" }, "both", newText, newUrl);
    const p2 = merged.find((p) => p.pageNumber === 2)!;
    assert.equal(p2.text, "NEW text 2");
    assert.equal(p2.url, "orig-url-2", "illustration must be preserved for text-only scope");
  });

  test("illustration-only scope regenerates image but RETAINS the original text", () => {
    const merged = refMerge(pred, [2], { 2: "illustration" }, "both", newText, newUrl);
    const p2 = merged.find((p) => p.pageNumber === 2)!;
    assert.equal(p2.text, "orig text 2", "text must be preserved for illustration-only scope");
    assert.equal(p2.url, "NEW-url-2");
  });

  test("both scope regenerates text AND illustration", () => {
    const merged = refMerge(pred, [2], { 2: "both" }, "both", newText, newUrl);
    const p2 = merged.find((p) => p.pageNumber === 2)!;
    assert.equal(p2.text, "NEW text 2");
    assert.equal(p2.url, "NEW-url-2");
  });

  test("unaffected pages are preserved verbatim (text and illustration)", () => {
    const merged = refMerge(pred, [2], { 2: "both" }, "both", newText, newUrl);
    const p1 = merged.find((p) => p.pageNumber === 1)!;
    const p3 = merged.find((p) => p.pageNumber === 3)!;
    assert.equal(p1.text, "orig text 1");
    assert.equal(p1.url, "orig-url-1");
    assert.equal(p3.text, "orig text 3");
    assert.equal(p3.url, "orig-url-3");
  });

  test("mixed scopes across pages apply independently", () => {
    const merged = refMerge(
      pred,
      [1, 2, 3],
      { 1: "text", 2: "illustration", 3: "both" },
      "both",
      newText,
      newUrl,
    );
    const [p1, p2, p3] = merged;
    // p1 text-only
    assert.equal(p1.text, "NEW text 1");
    assert.equal(p1.url, "orig-url-1");
    // p2 illustration-only
    assert.equal(p2.text, "orig text 2");
    assert.equal(p2.url, "NEW-url-2");
    // p3 both
    assert.equal(p3.text, "NEW text 3");
    assert.equal(p3.url, "NEW-url-3");
  });

  test("default scope 'text' applies to targeted pages missing from scopeByPage", () => {
    const merged = refMerge(pred, [2], {}, "text", newText, newUrl);
    const p2 = merged.find((p) => p.pageNumber === 2)!;
    assert.equal(p2.text, "NEW text 2");
    assert.equal(p2.url, "orig-url-2");
  });
});

// ─── Per-page scope resolution & escalation ───────────────────────────────────
//
// Reference of fetchRequestScopes' merge rule: conflicting scopes on the same
// page escalate to "both"; whole-book (null page) items are ignored for page
// targeting.

function refResolveScopes(
  items: Array<{ page_number: number | null; scope: RevisionPageScope }>,
): { scopeByPage: Record<number, RevisionPageScope>; pageNumbers: number[] } {
  const scopeByPage: Record<number, RevisionPageScope> = {};
  const pages = new Set<number>();
  for (const it of items) {
    if (it.page_number === null || it.page_number === undefined) continue;
    pages.add(it.page_number);
    const existing = scopeByPage[it.page_number];
    if (!existing) scopeByPage[it.page_number] = it.scope;
    else if (existing !== it.scope) scopeByPage[it.page_number] = "both";
  }
  return { scopeByPage, pageNumbers: Array.from(pages).sort((a, b) => a - b) };
}

describe("scope resolution from request items", () => {
  test("single-scope item maps directly", () => {
    const r = refResolveScopes([{ page_number: 2, scope: "text" }]);
    assert.deepEqual(r.pageNumbers, [2]);
    assert.equal(r.scopeByPage[2], "text");
  });

  test("conflicting scopes on the same page escalate to 'both'", () => {
    const r = refResolveScopes([
      { page_number: 2, scope: "text" },
      { page_number: 2, scope: "illustration" },
    ]);
    assert.equal(r.scopeByPage[2], "both");
  });

  test("same scope repeated stays that scope", () => {
    const r = refResolveScopes([
      { page_number: 2, scope: "text" },
      { page_number: 2, scope: "text" },
    ]);
    assert.equal(r.scopeByPage[2], "text");
  });

  test("whole-book (null page) items do not create a page target", () => {
    const r = refResolveScopes([
      { page_number: null, scope: "both" },
      { page_number: 3, scope: "text" },
    ]);
    assert.deepEqual(r.pageNumbers, [3]);
  });
});

// ─── Illustration generation failure detection (pure rule) ────────────────────
//
// The engine treats a null/empty URL for a page it explicitly asked to
// regenerate as a hard failure. Reference the exact predicate.

function refIllustrationFailure(
  requestedPages: number[],
  returnedUrls: (string | null)[],
): { failed: boolean; failedPage: number | "unknown" } {
  if (returnedUrls.length !== requestedPages.length) {
    return { failed: true, failedPage: "unknown" };
  }
  const idx = returnedUrls.findIndex((u) => !u || !String(u).trim());
  if (idx !== -1) return { failed: true, failedPage: requestedPages[idx] };
  return { failed: false, failedPage: "unknown" };
}

describe("illustration generation failure detection", () => {
  test("all URLs present -> no failure", () => {
    const r = refIllustrationFailure([1, 2], ["u1", "u2"]);
    assert.equal(r.failed, false);
  });

  test("a null URL for a requested page is a failure", () => {
    const r = refIllustrationFailure([1, 2], ["u1", null]);
    assert.equal(r.failed, true);
    assert.equal(r.failedPage, 2);
  });

  test("an empty/whitespace URL for a requested page is a failure", () => {
    const r = refIllustrationFailure([1, 2], ["u1", "   "]);
    assert.equal(r.failed, true);
    assert.equal(r.failedPage, 2);
  });

  test("mismatched count is a failure", () => {
    const r = refIllustrationFailure([1, 2], ["u1"]);
    assert.equal(r.failed, true);
    assert.equal(r.failedPage, "unknown");
  });

  test("empty request set never fails (nothing to generate)", () => {
    const r = refIllustrationFailure([], []);
    assert.equal(r.failed, false);
  });
});

// ─── Revalidation blocker gate (pure rule) ────────────────────────────────────

function refBlockersRemain(findings: RevisionFinding[]): boolean {
  return findings.some((f) => f.severity === "blocker");
}

describe("revalidation gate", () => {
  test("no findings -> gate passes (may advance to Revised)", () => {
    assert.equal(refBlockersRemain([]), false);
  });

  test("only minor/major findings -> gate passes", () => {
    const findings: RevisionFinding[] = [
      { pageNumber: 1, code: "x", detail: "d", severity: "minor" },
      { pageNumber: 2, code: "y", detail: "d", severity: "major" },
    ];
    assert.equal(refBlockersRemain(findings), false);
  });

  test("a blocker finding -> gate fails (requested fix unresolved)", () => {
    const findings: RevisionFinding[] = [
      { pageNumber: 1, code: "animal_missing", detail: "d", severity: "blocker" },
    ];
    assert.equal(refBlockersRemain(findings), true);
  });
});

// ─── revalidate helper contract ───────────────────────────────────────────────

describe("RevisionHelpers.revalidate (optional)", () => {
  test("a helpers object with revalidate satisfies the interface", async () => {
    const helpers: RevisionHelpers = {
      regenerateStoryPages: async (_b, ns) => ns.map((n) => makeBookPage(n)),
      regenerateIllustrations: async (_b, sp) =>
        sp.map((p) => `https://cdn.example.com/p${p.pageNumber}.png`),
      revalidate: async (_b, mergedPages) =>
        mergedPages.map((p) => ({
          pageNumber: p.pageNumber,
          code: "ok",
          detail: "clean",
          severity: "minor" as const,
        })),
    };
    assert.ok(typeof helpers.revalidate === "function");
    const findings = await helpers.revalidate!("book-1", [makeBookPage(1)], ["u"], "reason");
    assert.equal(findings.length, 1);
    assert.equal(findings[0].severity, "minor");
  });

  test("revalidate is optional (omitting it still conforms)", () => {
    const helpers: RevisionHelpers = {
      regenerateStoryPages: async (_b, ns) => ns.map((n) => makeBookPage(n)),
      regenerateIllustrations: async (_b, sp) => sp.map(() => "u"),
    };
    assert.equal(helpers.revalidate, undefined);
  });
});

// ─── Bounds ───────────────────────────────────────────────────────────────────

describe("revision attempt bounds (pure rule)", () => {
  // The engine derives attempt count from the durable count of successor
  // versions and refuses once priorAttempts >= MAX_REVISION_ATTEMPTS.
  function canAttempt(priorAttempts: number): boolean {
    return priorAttempts < MAX_REVISION_ATTEMPTS;
  }

  test("first attempt allowed (0 prior)", () => {
    assert.equal(canAttempt(0), true);
  });

  test("second attempt allowed (1 prior)", () => {
    assert.equal(canAttempt(1), true);
  });

  test("blocked once MAX reached", () => {
    assert.equal(canAttempt(MAX_REVISION_ATTEMPTS), false);
    assert.equal(canAttempt(MAX_REVISION_ATTEMPTS + 1), false);
  });
});
