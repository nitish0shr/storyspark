import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendPurchaseConfirmationEmail } from "@/lib/email-notifications";
import { shouldSendPurchaseConfirmation } from "@/lib/webhook-idempotency";

export interface PurchaseConfirmationInput {
  orderId: string;
  email: string;
  buyerName: string;
  childName: string;
  bookId: string;
  dashboardUrl: string;
}

/**
 * Claims and sends one purchase confirmation. Failed provider attempts become
 * retryable; provider-accepted but unrecorded attempts stay pending for manual
 * reconciliation so the message is never blindly duplicated.
 */
export async function attemptPurchaseConfirmation(
  input: PurchaseConfirmationInput,
): Promise<{ sent: boolean; alreadySent: boolean }> {
  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("purchase_confirmation_sent_at, purchase_confirmation_status")
    .eq("id", input.orderId)
    .maybeSingle();
  if (orderError || !order) {
    throw new Error(
      "Could not read purchase confirmation state: " +
        (orderError?.message ?? "order not found"),
    );
  }
  if (!shouldSendPurchaseConfirmation(order)) {
    return { sent: true, alreadySent: true };
  }

  const { count: claimCount, error: claimError } = await supabaseAdmin
    .from("orders")
    .update(
      {
        purchase_confirmation_status: "pending",
        purchase_confirmation_error: null,
      },
      { count: "exact" },
    )
    .eq("id", input.orderId)
    .is("purchase_confirmation_sent_at", null)
    .or(
      "purchase_confirmation_status.is.null,purchase_confirmation_status.eq.failed",
    );
  if (claimError) {
    throw new Error(
      "Could not claim purchase confirmation: " + claimError.message,
    );
  }
  if ((claimCount ?? 0) !== 1) {
    throw new Error(
      "Purchase confirmation is awaiting provider reconciliation",
    );
  }

  let providerAccepted = false;
  try {
    const sendResult = await sendPurchaseConfirmationEmail({
      email: input.email,
      buyerName: input.buyerName,
      childName: input.childName,
      bookId: input.bookId,
      dashboardUrl: input.dashboardUrl,
    });
    providerAccepted = sendResult.sent;
    if (!sendResult.sent) {
      throw new Error(
        "Purchase confirmation not sent: " +
          (sendResult.reason ?? "provider returned not_sent"),
      );
    }

    const { error: recordError, count: recordCount } = await supabaseAdmin
      .from("orders")
      .update(
        {
          email_delivered: true,
          purchase_confirmation_sent_at: new Date().toISOString(),
          purchase_confirmation_status: "sent",
          purchase_confirmation_error: null,
          purchase_confirmation_provider_message_id:
            sendResult.providerMessageId ?? sendResult.provider ?? null,
        },
        { count: "exact" },
      )
      .eq("id", input.orderId)
      .eq("purchase_confirmation_status", "pending");
    if (recordError || (recordCount ?? 0) !== 1) {
      throw new Error(
        "Could not durably record purchase confirmation: " +
          (recordError?.message ?? "claim was no longer pending"),
      );
    }
    return { sent: true, alreadySent: false };
  } catch (error) {
    if (!providerAccepted) {
      await supabaseAdmin
        .from("orders")
        .update({
          purchase_confirmation_status: "failed",
          purchase_confirmation_error:
            error instanceof Error ? error.message : String(error),
        })
        .eq("id", input.orderId)
        .eq("purchase_confirmation_status", "pending");
    }
    throw error;
  }
}