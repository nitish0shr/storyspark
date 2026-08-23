import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import {
  canUseSubscriberTheme,
  creatorIdentityFromUser,
  establishCreatorSession,
  isCreatorOwner,
  type CreatorAuthClient,
  type CreatorSessionUser,
} from "../src/lib/creator-session";
import {
  LONG_RUNNING_NOTICE_AFTER_MS,
  getPreviewProgressState,
} from "../src/lib/preview-progress";

const regularUser: CreatorSessionUser = {
  id: "regular-user",
  is_anonymous: false,
};
const guestUser: CreatorSessionUser = {
  id: "guest-user",
  is_anonymous: true,
};

function result(
  user: CreatorSessionUser | null,
  error: { message?: string } | null = null,
) {
  return { data: { user }, error };
}

describe("creator session establishment", () => {
  test("uses an existing verified regular session without creating a guest", async () => {
    let anonymousSignIns = 0;
    const auth: CreatorAuthClient = {
      async getUser() {
        return result(regularUser);
      },
      async signInAnonymously() {
        anonymousSignIns += 1;
        return result(guestUser);
      },
    };

    assert.deepEqual(await establishCreatorSession(auth), {
      userId: regularUser.id,
      isAnonymous: false,
    });
    assert.equal(anonymousSignIns, 0);
  });

  test("creates and re-verifies one anonymous user for a fresh visitor", async () => {
    let getUserCalls = 0;
    let anonymousSignIns = 0;
    const auth: CreatorAuthClient = {
      async getUser() {
        getUserCalls += 1;
        return result(getUserCalls === 1 ? null : guestUser);
      },
      async signInAnonymously() {
        anonymousSignIns += 1;
        return result(guestUser);
      },
    };

    assert.deepEqual(await establishCreatorSession(auth), {
      userId: guestUser.id,
      isAnonymous: true,
    });
    assert.equal(anonymousSignIns, 1);
    assert.equal(getUserCalls, 2);
  });

  test("does not silently continue when Supabase returns an auth error", async () => {
    const auth: CreatorAuthClient = {
      async getUser() {
        return result(null);
      },
      async signInAnonymously() {
        return result(null, { message: "Anonymous sign-ins are disabled" });
      },
    };

    await assert.rejects(
      establishCreatorSession(auth),
      /Anonymous sign-ins are disabled/,
    );
  });

  test("rejects a provisional guest that is not present in the verified session", async () => {
    let getUserCalls = 0;
    const auth: CreatorAuthClient = {
      async getUser() {
        getUserCalls += 1;
        return result(null);
      },
      async signInAnonymously() {
        return result(guestUser);
      },
    };

    await assert.rejects(
      establishCreatorSession(auth),
      /guest session could not be verified/i,
    );
    assert.equal(getUserCalls, 2);
  });
});

describe("creator ownership and subscriber boundaries", () => {
  test("a missing auth user never becomes a creator identity", () => {
    assert.equal(creatorIdentityFromUser(null), null);
    assert.equal(creatorIdentityFromUser({ id: "" }), null);
  });

  test("the same guest identity owns every customer hop and no other identity does", () => {
    const guest = creatorIdentityFromUser(guestUser);
    assert.ok(guest);

    for (const hop of [
      "create-book",
      "generate-preview",
      "book-status",
      "preview-page",
    ]) {
      assert.equal(
        isCreatorOwner(guest.userId, guestUser.id),
        true,
        `${hop} should recognise the creating guest`,
      );
      assert.equal(
        isCreatorOwner("different-user", guestUser.id),
        false,
        `${hop} must reject a different user`,
      );
      assert.equal(
        isCreatorOwner(guest.userId, null),
        false,
        `${hop} must never authorise a null owner`,
      );
    }
  });

  test("anonymous guests cannot use subscriber-only themes", () => {
    const guest = creatorIdentityFromUser(guestUser);
    const regular = creatorIdentityFromUser(regularUser);
    assert.ok(guest);
    assert.ok(regular);

    assert.equal(canUseSubscriberTheme(guest, true), false);
    assert.equal(canUseSubscriberTheme(guest, false), false);
    assert.equal(canUseSubscriberTheme(regular, false), false);
    assert.equal(canUseSubscriberTheme(regular, true), true);
  });
});

describe("long-running preview progress", () => {
  test("elapsed time never turns active generation into a failure", () => {
    assert.deepEqual(
      getPreviewProgressState(
        "preview_generating",
        LONG_RUNNING_NOTICE_AFTER_MS - 1,
      ),
      {
        phase: "working",
        keepPolling: true,
        showLongRunningNotice: false,
      },
    );
    assert.deepEqual(
      getPreviewProgressState(
        "preview_generating",
        LONG_RUNNING_NOTICE_AFTER_MS,
      ),
      {
        phase: "working",
        keepPolling: true,
        showLongRunningNotice: true,
      },
    );
    assert.deepEqual(
      getPreviewProgressState("preview_generating", 10 * 60_000),
      {
        phase: "working",
        keepPolling: true,
        showLongRunningNotice: true,
      },
    );
  });

  test("only real ready or failed statuses stop polling", () => {
    for (const status of [
      "preview_ready",
      "complete",
      "completed",
      "purchased",
    ]) {
      assert.equal(getPreviewProgressState(status, 0).phase, "ready");
      assert.equal(getPreviewProgressState(status, 0).keepPolling, false);
    }
    assert.deepEqual(getPreviewProgressState("failed", 0), {
      phase: "failed",
      keepPolling: false,
      showLongRunningNotice: false,
    });
  });
});

describe("guest creation route contracts", () => {
  const createPage = readFileSync("src/app/create/page.tsx", "utf8");
  const createRoute = readFileSync(
    "src/app/api/create-book/route.ts",
    "utf8",
  );
  const generateRoute = readFileSync(
    "src/app/api/generate-preview/route.ts",
    "utf8",
  );
  const statusRoute = readFileSync(
    "src/app/api/book-status/route.ts",
    "utf8",
  );
  const previewPage = readFileSync(
    "src/app/preview/[bookId]/page.tsx",
    "utf8",
  );
  const previewStep = readFileSync(
    "src/components/create/StepPreview.tsx",
    "utf8",
  );
  const themeStep = readFileSync(
    "src/components/create/StepThemeSelect.tsx",
    "utf8",
  );
  const loadingAnimation = readFileSync(
    "src/components/shared/LoadingAnimation.tsx",
    "utf8",
  );
  const pipeline = readFileSync(
    "src/services/book-pipeline.ts",
    "utf8",
  );

  test("the wizard blocks on verified auth and exposes a retry", () => {
    assert.match(createPage, /await establishCreatorSession\(supabase\.auth\)/);
    assert.match(createPage, /authState === "error"/);
    assert.match(createPage, /Retry secure session/);
    assert.doesNotMatch(createPage, /continuing anyway/i);
  });

  test("create-book rejects no identity before parsing or inserting data", () => {
    const authGuard = createRoute.indexOf("if (!identity)");
    const parseBody = createRoute.indexOf("await request.json()");
    const firstInsert = createRoute.indexOf('.from("child_profiles")');
    assert.ok(authGuard >= 0);
    assert.ok(authGuard < parseBody);
    assert.ok(parseBody < firstInsert);
    assert.match(
      createRoute.slice(authGuard, parseBody),
      /status:\s*401/,
    );
    assert.equal(
      createRoute.match(/user_id:\s*userId/g)?.length,
      3,
      "both child profiles and the book must use the exact auth user",
    );
  });

  test("generation, polling, and preview all require an exact non-null owner", () => {
    assert.match(generateRoute, /isCreatorOwner\(identity\.userId, book\.user_id\)/);
    assert.doesNotMatch(generateRoute, /allow anyone who knows the bookId/i);
    assert.match(statusRoute, /isCreatorOwner\(user\?\.id, book\.user_id\)/);
    assert.match(previewPage, /isCreatorOwner\(user\?\.id, book\.user_id\)/);
    assert.match(previewStep, /href=\{bookId \? `\/preview\/\$\{bookId\}`/);
  });

  test("checkout status access requires exact verified payment, not merely a session id", () => {
    assert.match(
      statusRoute,
      /authorised = hasExactVerifiedPayment/,
    );
    assert.doesNotMatch(statusRoute, /authorised = Boolean\(order\)/);
  });

  test("only one concurrent request can claim a new preview generation", () => {
    assert.match(
      generateRoute,
      /\.update\(\{ status: "preview_generating" \}\)[\s\S]*\.eq\("user_id", identity\.userId\)[\s\S]*\.eq\("status", "draft"\)[\s\S]*\.is\("lifecycle_stage", null\)/,
    );
    assert.match(generateRoute, /if \(!claimedBook\)[\s\S]*status: 409/);
    assert.match(
      generateRoute,
      /claimedPublicGeneration: true/,
    );
    assert.match(
      pipeline,
      /book\.status !== "preview_generating"/,
    );
  });

  test("guest subscriber themes are disabled in the UI and denied by the server", () => {
    assert.match(themeStep, /disabled=\{isLockedForGuest\}/);
    assert.match(themeStep, /isGuest && theme\.subscriberOnly === true/);
    assert.match(createRoute, /if \(identity\.isAnonymous\)/);
    assert.match(createRoute, /canUseSubscriberTheme/);
  });

  test("the preview keeps polling after two minutes and shows no invented percentage", () => {
    assert.match(previewStep, /getPreviewProgressState/);
    assert.doesNotMatch(previewStep, /POLL_TIMEOUT|timedOut/);
    assert.doesNotMatch(previewStep, /Taking longer than expected/);
    assert.match(previewStep, /There is no need to start again/);
    assert.match(loadingAnimation, /Usually ready in 6–8 minutes/);
    assert.doesNotMatch(loadingAnimation, /Math\.random|% complete/);
  });
});