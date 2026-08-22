import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, test } from "node:test";

const migration = fs.readFileSync(
  path.resolve(
    process.cwd(),
    "supabase/migrations/010_canonical_book_fulfilment.sql",
  ),
  "utf8",
);
const checkoutRoute = fs.readFileSync(
  path.resolve(process.cwd(), "src/app/api/checkout/route.ts"),
  "utf8",
);
const pipeline = fs.readFileSync(
  path.resolve(process.cwd(), "src/services/book-pipeline.ts"),
  "utf8",
);
const versionService = fs.readFileSync(
  path.resolve(process.cwd(), "src/lib/book-versions.ts"),
  "utf8",
);

const privilegedFunctions = [
  "reject_version_mutation",
  "create_book_version_snapshot",
  "transition_book_lifecycle",
  "record_verified_payment_and_purchase",
  "create_revision_request_and_transition",
];

function functionDefinition(name: string): string {
  const start = migration.indexOf(`create or replace function public.${name}(`);
  assert.notEqual(start, -1, `${name} must exist`);
  const end = migration.indexOf("\n$$;", start);
  assert.notEqual(end, -1, `${name} must have a complete definition`);
  return migration.slice(start, end + 4);
}

describe("privileged SQL hardening", () => {
  for (const name of privilegedFunctions) {
    test(`${name} has a trusted search path, owner and service-only ACL`, () => {
      const definition = functionDefinition(name);
      assert.match(definition, /security definer/i);
      assert.match(definition, /set search_path = ''/i);
      assert.ok(
        migration.includes(`alter function public.${name}(`) &&
          migration.includes("owner to postgres"),
      );
      assert.ok(
        migration.includes(`revoke execute on function public.${name}(`),
      );
      assert.ok(
        migration.includes(`grant execute on function public.${name}(`),
      );
    });
  }

  test("no named privileged function trusts public object resolution", () => {
    assert.doesNotMatch(migration, /set search_path\s*=\s*public/i);
  });

  test("payment and revision RPCs qualify every application relation", () => {
    for (const name of [
      "record_verified_payment_and_purchase",
      "create_revision_request_and_transition",
    ]) {
      const definition = functionDefinition(name);
      assert.match(definition, /set search_path = ''/i);
      assert.doesNotMatch(
        definition,
        /^\s*(?:from|join|update|insert into|delete from)\s+(?!public\.|pg_catalog\.|extensions\.)[a-z_][a-z0-9_]*/im,
      );
    }
  });

  test("immutable delete guards permit only nested parent cascades", () => {
    const definition = functionDefinition("reject_version_mutation");
    assert.match(definition, /TG_OP = 'DELETE'/i);
    assert.match(definition, /pg_catalog\.pg_trigger_depth\(\) > 1/i);
    assert.match(definition, /return OLD/i);
  });
});

describe("private final-book storage contract", () => {
  test("migration idempotently enforces a private final-books bucket", () => {
    assert.match(migration, /insert into storage\.buckets/i);
    assert.match(migration, /'final-books'[\s\S]*false/i);
    assert.match(migration, /on conflict \(id\) do update/i);
    assert.match(migration, /public = false/i);
    assert.match(
      migration,
      /to service_role[\s\S]*bucket_id = 'final-books'/i,
    );
  });

  test("delivery accepts only exact-version private artefacts", () => {
    const transition = functionDefinition("transition_book_lifecycle");
    assert.match(transition, /metadata->>'storage_bucket' = 'final-books'/i);
    assert.match(
      transition,
      /'books\/' \|\| p_book_id::text \|\| '\/versions\/' \|\| v_effective_vid::text/i,
    );
    assert.match(transition, /access_verified_at is not null/i);
    assert.doesNotMatch(
      transition,
      /btrim\(access_url\)[\s\S]*is not null/i,
    );
    assert.doesNotMatch(pipeline, /access_url:\s*bookAccessUrl/i);
    assert.match(
      migration,
      /update public\.product_artefacts[\s\S]*access_url = null[\s\S]*url =[\s\S]*'private:\/\/'[\s\S]*url not like 'private:\/\/%'/i,
    );
    assert.match(
      migration,
      /update public\.books[\s\S]*set pdf_url = null,[\s\S]*pdf_print_url = null/i,
    );
    assert.match(
      migration,
      /update public\.book_versions[\s\S]*set pdf_url = null,[\s\S]*pdf_print_url = null/i,
    );
    assert.match(
      migration,
      /update public\.book_pages[\s\S]*set audio_url = null/i,
    );
    assert.match(
      migration,
      /update public\.book_version_pages[\s\S]*set audio_url = null/i,
    );
    assert.doesNotMatch(pipeline, /generateNarration\(/);
  });

  test("owner RLS never exposes full versions or artefacts without exact paid grants", () => {
    assert.match(migration, /drop policy if exists "Owners read own book_versions"/i);
    assert.match(migration, /create policy "Owners read purchased book_versions"/i);
    assert.match(
      migration,
      /join public\.access_grants ag[\s\S]*join public\.orders o[\s\S]*o\.version_id = book_versions\.id/i,
    );
    assert.match(
      migration,
      /create policy "Owners read purchased product_artefacts"[\s\S]*b\.approved_version_id = product_artefacts\.version_id/i,
    );
    assert.match(
      migration,
      /create policy "Owners read authorised book_version_pages"[\s\S]*book_version_pages\.is_preview[\s\S]*preview_grant\.access_kind = 'preview'/i,
    );
  });
});

describe("conservative legacy evidence", () => {
  test("compatibility snapshots require ordered pages and immutable identity", () => {
    assert.match(migration, /pageNumber/);
    assert.match(migration, /is distinct from p\.ordinal::integer/i);
    assert.match(migration, /content_hash/i);
    assert.match(migration, /complete_ordered_immutable_page_set/i);
  });

  test("legacy financial promotion requires one pre-verified payment", () => {
    assert.match(
      migration,
      /payment_confirmed_at timestamp is not upgraded into payment_verified_at/i,
    );
    assert.match(
      migration,
      /select count\(\*\)[\s\S]*status in \('paid', 'fulfilled'\)[\s\S]*\) = 1/i,
    );
    assert.match(
      migration,
      /select count\(\*\)[\s\S]*from public\.book_versions candidate_version[\s\S]*candidate_version\.book_id = b\.id[\s\S]*\) = 1/i,
    );
  });

  test("legacy delivery is never inferred and ambiguity is surfaced", () => {
    assert.doesNotMatch(
      migration,
      /set stage_delivered_at = coalesce\(stage_delivered_at, delivered_at\)/i,
    );
    assert.match(migration, /legacy_reconciliation_required/i);
    assert.match(migration, /incomplete, ambiguous, or conflicting/i);
  });
});

describe("exact fulfilment evidence", () => {
  const transition = functionDefinition("transition_book_lifecycle");

  test("Ready for Purchase requires the sent invitation's usable preview grant", () => {
    assert.match(
      transition,
      /join public\.access_grants ag on ag\.id = aia\.access_grant_id/i,
    );
    assert.match(transition, /ag\.access_kind = 'preview'/i);
    assert.match(transition, /btrim\(ag\.token_hash\)/i);
    assert.match(transition, /ag\.revoked_at is null/i);
  });

  test("delivery converges on one paid order and fulfils only that order", () => {
    assert.match(
      transition,
      /select pg_catalog\.count\(\*\)[\s\S]*exact_paid_order_required/i,
    );
    assert.match(transition, /and ag\.order_id = v_order\.id/i);
    assert.match(transition, /where da\.order_id = v_order\.id/i);
    assert.match(
      transition,
      /update public\.orders[\s\S]*where id = v_order\.id/i,
    );
    assert.match(
      pipeline,
      /expected exactly one verified paid order; explicit operator reconciliation is required/i,
    );
  });

  test("a sent attempt proves the same grant that was delivered", () => {
    assert.match(
      migration,
      /add column if not exists access_grant_id uuid[\s\S]*references public\.access_grants\(id\)/i,
    );
    assert.match(
      migration,
      /create unique index if not exists uq_delivery_attempts_pending_claim[\s\S]*where status = 'pending'/i,
    );
    assert.match(
      transition,
      /join public\.access_grants ag on ag\.id = da\.access_grant_id/i,
    );
    assert.match(transition, /ag\.revoked_at is null/i);
    assert.match(transition, /ag\.verified_at is not null/i);
    assert.match(transition, /btrim\(ag\.token_hash\)/i);
    assert.match(pipeline, /isUsableLinkedDeliveryGrant/);
    assert.match(pipeline, /sent_delivery_grant_unusable/);
  });

  test("the delivery claim is acquired before any grant is revoked or minted", () => {
    const claim = pipeline.indexOf(
      "claimedDeliveryAttempt = await beginDeliveryAttempt",
    );
    const revoke = pipeline.indexOf(
      '.eq("access_kind", "full_book")',
      claim,
    );
    const send = pipeline.indexOf("providerCallStarted = true", claim);
    assert.ok(claim >= 0, "delivery claim must be acquired");
    assert.ok(revoke > claim, "grant revocation must happen after the claim");
    assert.ok(send > revoke, "provider send must happen after grant binding");
    assert.match(pipeline, /access_grant_id: createdGrant\.id/i);
    assert.match(
      pipeline,
      /\.eq\("id", claimedDeliveryAttempt\.id\)[\s\S]*\.is\("access_grant_id", null\)/i,
    );
  });
});

describe("idempotency and immutable identity", () => {
  test("lifecycle and revision replays reject a different operation identity", () => {
    const lifecycle = functionDefinition("transition_book_lifecycle");
    const revision = functionDefinition("create_revision_request_and_transition");
    const payment = functionDefinition("record_verified_payment_and_purchase");
    assert.match(lifecycle, /idempotency_key_conflict/i);
    assert.match(lifecycle, /v_existing_event\.book_id is distinct from p_book_id/i);
    assert.match(lifecycle, /v_existing_event\.version_id is distinct from v_effective_vid/i);
    assert.match(revision, /v_existing_items is distinct from v_requested_items/i);
    assert.match(payment, /stripe_payment_intent_id is distinct from p_payment_intent_id/i);
  });

  test("version snapshots require contiguous pages and a same-book predecessor", () => {
    const snapshot = functionDefinition("create_book_version_snapshot");
    assert.match(snapshot, /non_contiguous_page_numbers/i);
    assert.match(snapshot, /predecessor\.book_id = p_book_id/i);
    assert.match(snapshot, /predecessor_book_mismatch/i);
    assert.match(versionService, /pageNumber !== index \+ 1/i);
  });
});

describe("checkout reservation races", () => {
  test("a duplicate insert recovers only the exact pending operation before Stripe", () => {
    assert.match(checkoutRoute, /reservationError\?\.code === "23505"/);
    assert.match(
      checkoutRoute,
      /\.eq\("checkout_idempotency_key", idempotencyKey\)/,
    );
    assert.match(
      checkoutRoute,
      /reservedOrder = \{ id: concurrentReservation\.id \}/,
    );
    assert.match(
      checkoutRoute,
      /idempotencyKey: `checkout-reservation:\$\{reservedOrder\.id\}`/,
    );
  });
});