import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import Stripe from "stripe";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  stripe,
  isStripeConfigured,
  PRICE_BASE,
  PRICE_MID,
  PRICE_PREMIUM,
  PRICING,
} from "@/lib/stripe";
import { PricingTier } from "@/types/order";
import { getAppUrl } from "@/lib/utils";
import {
  CHECKOUT_RESERVATION_LEASE_MS,
  shouldReuseUnboundCheckoutReservation,
} from "@/lib/checkout-recovery";

// ---------------------------------------------------------------------------
// Canonical lifecycle stage values (title-cased, as stored in the DB)
// ---------------------------------------------------------------------------
const LIFECYCLE = {
  READY_FOR_PURCHASE: "Ready for Purchase",
  PURCHASED: "Purchased",
  DELIVERED: "Delivered",
} as const;

const TIER_CONFIG: Record<PricingTier, { price: number; name: string }> = {
  base: { price: PRICE_BASE, name: "Base" },
  mid: { price: PRICE_MID, name: "Mid" },
  premium: { price: PRICE_PREMIUM, name: "Premium" },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

/**
 * Stable idempotency key covering book + exact version + buyer identity + tier.
 * Stored in orders.checkout_idempotency_key to find reusable pending sessions.
 */
function buildIdempotencyKey(
  bookId: string,
  versionId: string,
  buyerIdentity: string,
  tier: string,
): string {
  return crypto
    .createHash("sha256")
    .update(`checkout:${bookId}:${versionId}:${buyerIdentity}:${tier}`)
    .digest("hex");
}

/**
 * Validate a preview access grant token for anonymous purchasers.
 * Token must:
 *   - exist in access_grants for this bookId
 *   - not be revoked (revoked_at IS NULL)
 *   - not be expired
 *   - reference exactly the supplied versionId (not an older version)
 */
async function resolvePreviewGrant(
  rawToken: string,
  bookId: string,
  versionId: string,
): Promise<boolean> {
  if (!rawToken || typeof rawToken !== "string") return false;

  const { data, error } = await supabaseAdmin
    .from("access_grants")
    .select("version_id, access_kind, expires_at, revoked_at")
    .eq("token_hash", hashToken(rawToken))
    .eq("book_id", bookId)
    .maybeSingle();

  if (error || !data) return false;
  if (data.revoked_at) return false;
  if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) return false;
  // Must match the exact version being purchased — stale tokens are rejected
  if (data.version_id !== versionId) return false;

  return true;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Database not configured. Please add Supabase environment variables." },
        { status: 503 },
      );
    }
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Payments not configured. Please add STRIPE_SECRET_KEY." },
        { status: 503 },
      );
    }

    // ------------------------------------------------------------------
    // Parse body first (needed before auth to read accessToken)
    // ------------------------------------------------------------------
    const body = await request.json();
    const {
      bookId,
      versionId: bodyVersionId,
      tier,
      accessToken: rawAccessToken,
      purchaserEmail: bodyPurchaserEmail,
      isGift = false,
      giftRecipientName,
      giftRecipientEmail,
      giftMessage,
      dedication,
    } = body as {
      bookId: string;
      versionId?: string;
      tier: PricingTier;
      accessToken?: string;
      purchaserEmail?: string;
      isGift?: boolean;
      giftRecipientName?: string;
      giftRecipientEmail?: string;
      giftMessage?: string;
      dedication?: string;
    };

    if (!bookId || typeof bookId !== "string") {
      return NextResponse.json({ error: "bookId is required" }, { status: 400 });
    }
    if (!tier || !TIER_CONFIG[tier]) {
      return NextResponse.json(
        { error: "Invalid tier. Must be base, mid, or premium." },
        { status: 400 },
      );
    }
    if (isGift && (!giftRecipientEmail || !giftRecipientName)) {
      return NextResponse.json(
        { error: "Gift recipient name and email are required for gifts." },
        { status: 400 },
      );
    }

    // ------------------------------------------------------------------
    // Authentication
    //
    // Accepted callers:
    //   1. Authenticated owner (session user whose id matches book.user_id)
    //   2. Anonymous visitor holding a valid preview access_grants token
    //      for the exact version — must supply purchaserEmail
    //
    // Tokens are preview-only on the read side; allowing checkout via token
    // is safe because we verify the token against the exact version before
    // creating any Stripe session.
    // ------------------------------------------------------------------
    const supabase = await createClient();
    const {
      data: { user: sessionUser },
    } = await supabase.auth.getUser();

    // ------------------------------------------------------------------
    // Fetch book
    // ------------------------------------------------------------------
    const { data: book, error: bookError } = await supabaseAdmin
      .from("books")
      .select(
        "id, user_id, child_name, status, lifecycle_stage, approved_version_id, is_purchased, dedication",
      )
      .eq("id", bookId)
      .single();

    if (bookError || !book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // ------------------------------------------------------------------
    // Lifecycle gating
    //
    // Canonical lifecycle: only "Ready for Purchase" is allowed.
    // "Purchased" and "Delivered" are already-done states — block.
    // Legacy rows must be reconciled into an immutable approved version first.
    // ------------------------------------------------------------------
    const lifecycleStage: string | null | undefined = book.lifecycle_stage;
    const approvedVersionId: string | null | undefined = book.approved_version_id;
    const isCanonical = lifecycleStage != null;

    if (isCanonical) {
      if (lifecycleStage !== LIFECYCLE.READY_FOR_PURCHASE) {
        // "Purchased", "Delivered", or any other canonical stage — block
        const alreadyDone =
          lifecycleStage === LIFECYCLE.PURCHASED || lifecycleStage === LIFECYCLE.DELIVERED;
        return NextResponse.json(
          {
            error: alreadyDone
              ? "This book has already been purchased."
              : "This book version is not available for purchase.",
          },
          { status: 409 },
        );
      }
      // "Ready for Purchase" requires an approved version
      if (!approvedVersionId) {
        return NextResponse.json(
          { error: "This book has not yet been approved for purchase." },
          { status: 409 },
        );
      }
    } else {
      return NextResponse.json(
        {
          error:
            "This legacy book must be reconciled to an approved version before purchase.",
        },
        { status: 409 },
      );
    }

    // ------------------------------------------------------------------
    // Resolve the exact version to purchase.
    //
    // For canonical books: must be approvedVersionId.
    // Client may supply versionId in body — reject if it doesn't match.
    // ------------------------------------------------------------------
    const resolvedVersionId = approvedVersionId ?? null;

    if (isCanonical && bodyVersionId && bodyVersionId !== resolvedVersionId) {
      return NextResponse.json(
        { error: "Version mismatch — the book has been updated. Please refresh and try again." },
        { status: 409 },
      );
    }

    // ------------------------------------------------------------------
    // Authorisation
    //
    // Owner: session user whose id matches book.user_id
    // Anonymous with token: valid access_grants token for exact version
    // ------------------------------------------------------------------
    const isOwner = !!sessionUser && sessionUser.id === book.user_id;

    let tokenGranted = false;
    if (!isOwner && rawAccessToken && resolvedVersionId) {
      tokenGranted = await resolvePreviewGrant(rawAccessToken, bookId, resolvedVersionId);
    }

    if (!isOwner && !tokenGranted) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Buyer identity for idempotency and Stripe.
    // Owner: use authenticated email.
    // Token-holder: must provide purchaserEmail in body (not trusted from token).
    const buyerEmail: string | undefined = isOwner
      ? (sessionUser!.email ?? undefined)
      : (bodyPurchaserEmail?.trim() || undefined);

    if (!isOwner && !buyerEmail) {
      return NextResponse.json(
        { error: "purchaserEmail is required when checking out with an access token." },
        { status: 400 },
      );
    }

    // Stable buyer identity string for idempotency key
    const buyerIdentity = isOwner
      ? `user:${sessionUser!.id}`
      : `anon:${crypto
          .createHash("sha256")
          .update((buyerEmail ?? "").trim().toLowerCase())
          .digest("hex")}`;

    // ------------------------------------------------------------------
    // Dedication: immutable once the book has entered any lifecycle stage
    // (generation is complete). Only update in legacy flow.
    // ------------------------------------------------------------------
    if (dedication !== undefined) {
      if (isCanonical) {
        console.warn(
          `[checkout] Ignoring dedication update for book ${bookId} — lifecycle stage '${lifecycleStage}' is set; dedication is immutable after generation.`,
        );
      } else {
        const { error: dedError } = await supabaseAdmin
          .from("books")
          .update({ dedication: dedication.trim() || null })
          .eq("id", bookId);

        if (dedError) {
          console.error("Failed to save dedication:", dedError);
          return NextResponse.json(
            { error: "Failed to save dedication. Please try again." },
            { status: 500 },
          );
        }
      }
    }

    // ------------------------------------------------------------------
    // Idempotency — reuse an existing open session for the same purchase
    //
    // Key covers: bookId + exact versionId + buyer identity + tier
    // ------------------------------------------------------------------
    const idempotencyKey = buildIdempotencyKey(
      bookId,
      resolvedVersionId ?? "legacy",
      buyerIdentity,
      tier,
    );

    let reusableReservation: {
      id: string;
      amount_cents: number;
    } | null = null;
    const { data: existingOrder } = await supabaseAdmin
      .from("orders")
      .select(
        "id, status, stripe_checkout_session_id, version_id, amount_cents, currency, created_at, checkout_reservation_expires_at",
      )
      .eq("book_id", bookId)
      .eq("checkout_idempotency_key", idempotencyKey)
      .eq("status", "pending")
      .maybeSingle();

    if (existingOrder && !existingOrder.stripe_checkout_session_id) {
      if (
        shouldReuseUnboundCheckoutReservation({
          status: existingOrder.status,
          stripeSessionId: existingOrder.stripe_checkout_session_id,
          reservationExpiresAt:
            existingOrder.checkout_reservation_expires_at,
          createdAt: existingOrder.created_at,
          nowMs: Date.now(),
        })
      ) {
        // Reuse an unbound durable reservation. The order-scoped Stripe
        // idempotency key below recovers both a pre-Stripe crash and a crash
        // after Stripe accepted the request but before the DB bind.
        reusableReservation = {
          id: existingOrder.id,
          amount_cents: Number(existingOrder.amount_cents),
        };
      } else {
        throw new Error("Invalid checkout reservation state.");
      }
    } else if (existingOrder?.stripe_checkout_session_id) {
      // Ensure the existing pending order is for the same version
      if (
        resolvedVersionId &&
        existingOrder.version_id &&
        existingOrder.version_id !== resolvedVersionId
      ) {
        // Version has changed since the pending order was created — fall through
        // to create a fresh session for the new version.
      } else {
        try {
          const existingSession = await stripe.checkout.sessions.retrieve(
            existingOrder.stripe_checkout_session_id,
          );
          if (existingSession.status === "open" && existingSession.url) {
            return NextResponse.json({ checkoutUrl: existingSession.url });
          }
          await supabaseAdmin
            .from("orders")
            .update({
              status: "failed",
              checkout_idempotency_key: null,
              checkout_reservation_expires_at: null,
            })
            .eq("id", existingOrder.id)
            .eq("status", "pending");
        } catch {
          return NextResponse.json(
            {
              error:
                "An existing checkout is still being reconciled. Please try again shortly.",
            },
            { status: 409 },
          );
        }
      }
    }

    // ------------------------------------------------------------------
    // Pricing
    // ------------------------------------------------------------------
    const tierConfig = TIER_CONFIG[tier];
    const appUrl = getAppUrl();

    let finalPrice = tierConfig.price;
    let isSubscriber = false;

    if (isOwner) {
      const { data: activeSub } = await supabaseAdmin
        .from("subscriptions")
        .select("id, status")
        .eq("user_id", sessionUser!.id)
        .eq("status", "active")
        .maybeSingle();

      if (activeSub) {
        isSubscriber = true;
        finalPrice = Math.round(tierConfig.price * (1 - PRICING.subscriberDiscount));
      }
    }
    if (reusableReservation) {
      finalPrice = reusableReservation.amount_cents;
    }

    // Reserve the exact book/version in the database BEFORE creating an
    // external Stripe session. The partial unique index permits only one active
    // pending order for this immutable version across all servers and buyers.
    const orderInsert: Record<string, unknown> = {
      book_id: bookId,
      stripe_checkout_session_id: null,
      status: "pending",
      amount_cents: finalPrice,
      currency: "usd",
      tier,
      is_gift: isGift,
      gift_recipient_name: giftRecipientName ?? null,
      gift_recipient_email: giftRecipientEmail ?? null,
      gift_message: giftMessage ?? null,
      checkout_idempotency_key: idempotencyKey,
      checkout_reservation_expires_at: new Date(
        Date.now() + CHECKOUT_RESERVATION_LEASE_MS,
      ).toISOString(),
      version_id: resolvedVersionId,
      user_id: isOwner ? sessionUser!.id : null,
      purchaser_email: isOwner ? buyerEmail ?? null : buyerEmail,
    };
    let reservedOrder: { id: string } | null = reusableReservation;
    if (!reservedOrder) {
      const { data: insertedOrder, error: reservationError } =
        await supabaseAdmin
          .from("orders")
          .insert(orderInsert)
          .select("id")
          .single();
      if (reservationError || !insertedOrder) {
        if (reservationError?.code === "23505") {
          // A concurrent identical request may have won the reservation race.
          // Recover only that exact operation identity; never attach this buyer
          // to another pending checkout for the same version.
          const { data: concurrentReservation } = await supabaseAdmin
            .from("orders")
            .select(
              "id, amount_cents, stripe_checkout_session_id, checkout_reservation_expires_at, created_at, status",
            )
            .eq("book_id", bookId)
            .eq("version_id", resolvedVersionId)
            .eq("checkout_idempotency_key", idempotencyKey)
            .eq("status", "pending")
            .maybeSingle();

          if (
            concurrentReservation &&
            !concurrentReservation.stripe_checkout_session_id &&
            shouldReuseUnboundCheckoutReservation({
              status: concurrentReservation.status,
              stripeSessionId:
                concurrentReservation.stripe_checkout_session_id,
              reservationExpiresAt:
                concurrentReservation.checkout_reservation_expires_at,
              createdAt: concurrentReservation.created_at,
              nowMs: Date.now(),
            })
          ) {
            reservedOrder = { id: concurrentReservation.id };
            finalPrice = Number(concurrentReservation.amount_cents);
          } else if (
            concurrentReservation?.stripe_checkout_session_id
          ) {
            try {
              const concurrentSession =
                await stripe.checkout.sessions.retrieve(
                  concurrentReservation.stripe_checkout_session_id,
                );
              if (concurrentSession.status === "open" && concurrentSession.url) {
                return NextResponse.json({
                  checkoutUrl: concurrentSession.url,
                });
              }
            } catch {
              // Fail closed below; a retry will reconcile the durable winner.
            }
          }
          if (!reservedOrder) {
            return NextResponse.json(
              {
                error:
                  "A checkout is already active for this approved book version. Please use the original checkout or try again shortly.",
              },
              { status: 409 },
            );
          }
        } else {
          console.error("Failed to reserve checkout order:", reservationError);
          return NextResponse.json(
            { error: "Could not reserve checkout. Please try again." },
            { status: 500 },
          );
        }
      } else {
        reservedOrder = insertedOrder;
      }
    }

    // ------------------------------------------------------------------
    // Create Stripe checkout session
    // Idempotency key is passed to Stripe so concurrent retries deduplicate.
    // ------------------------------------------------------------------
    const stripeMetadata: Record<string, string> = {
      book_id: bookId,
      tier,
      is_gift: isGift ? "true" : "false",
      gift_recipient_email: giftRecipientEmail ?? "",
      gift_recipient_name: giftRecipientName ?? "",
      // Stripe metadata key is "version_id" (not approved_version_id)
      version_id: resolvedVersionId ?? "",
      buyer_identity: buyerIdentity,
      order_id: reservedOrder.id,
    };
    if (isOwner) stripeMetadata.user_id = sessionUser!.id;

    let session;
    try {
      session = await stripe.checkout.sessions.create(
        {
        mode: "payment",
        customer_email: buyerEmail,
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `Starmee Book - ${tierConfig.name}${isSubscriber ? " (Subscriber Discount)" : ""}`,
                description: `${book.child_name}'s personalised storybook${isSubscriber ? " — 15% subscriber discount applied" : ""}`,
              },
              unit_amount: finalPrice,
            },
            quantity: 1,
          },
        ],
        metadata: stripeMetadata,
        success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url:
          `${appUrl}/preview/${bookId}` +
          (rawAccessToken
            ? `?token=${encodeURIComponent(rawAccessToken)}`
            : ""),
        },
        { idempotencyKey: `checkout-reservation:${reservedOrder.id}` },
      );
    } catch (stripeError) {
      // The provider result can be ambiguous. Retain the unbound reservation
      // so a retry uses the same order-scoped Stripe idempotency key.
      const definitelyRejected =
        stripeError instanceof Stripe.errors.StripeInvalidRequestError ||
        stripeError instanceof Stripe.errors.StripeAuthenticationError ||
        stripeError instanceof Stripe.errors.StripePermissionError;
      if (definitelyRejected) {
        await supabaseAdmin
          .from("orders")
          .update({
            status: "failed",
            checkout_idempotency_key: null,
            checkout_reservation_expires_at: null,
          })
          .eq("id", reservedOrder.id)
          .eq("status", "pending")
          .is("stripe_checkout_session_id", null);
      }
      throw stripeError;
    }

    // ------------------------------------------------------------------
    // Bind the external session to the already-durable reservation. Ambiguous
    // failures keep the reservation so the same session can be recovered.
    // ------------------------------------------------------------------
    const { error: orderError, count: boundOrderCount } = await supabaseAdmin
      .from("orders")
      .update(
        {
          stripe_checkout_session_id: session.id,
          checkout_reservation_expires_at: null,
        },
        { count: "exact" },
      )
      .eq("id", reservedOrder.id)
      .eq("status", "pending")
      .is("stripe_checkout_session_id", null);

    if (orderError || (boundOrderCount ?? 0) !== 1) {
      const { data: concurrentlyBound } = await supabaseAdmin
        .from("orders")
        .select("status, stripe_checkout_session_id")
        .eq("id", reservedOrder.id)
        .maybeSingle();
      if (
        concurrentlyBound?.status === "pending" &&
        concurrentlyBound.stripe_checkout_session_id === session.id &&
        session.url
      ) {
        return NextResponse.json({ checkoutUrl: session.url });
      }
      console.error("Failed to bind checkout session:", orderError);
      return NextResponse.json(
        {
          error:
            "Checkout is being safely reconciled. Please try again shortly.",
        },
        { status: 503 },
      );
    }

    const { error: attemptError } = await supabaseAdmin
      .from("checkout_attempts")
      .upsert(
        {
          book_id: bookId,
          order_id: reservedOrder.id,
          version_id: resolvedVersionId,
          stripe_checkout_session_id: session.id,
          idempotency_key: idempotencyKey,
          status: "initiated",
          metadata: { tier, buyer_identity: buyerIdentity },
        },
        { onConflict: "idempotency_key" },
      );
    if (attemptError) {
      console.error("Failed to record checkout attempt:", attemptError);
    }

    return NextResponse.json({ checkoutUrl: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
