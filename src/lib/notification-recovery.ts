export interface PostPaymentRecoveryResult {
  notificationSucceeded: boolean;
}

/**
 * A non-essential purchase notification must never prevent the paid-book
 * finaliser from running. Finalisation errors are deliberately not caught so
 * the Stripe webhook can remain retryable.
 */
export async function runPostPaymentRecovery(params: {
  attemptNotification: () => Promise<void>;
  recordNotificationFailure: (error: unknown) => Promise<void>;
  finalise: () => Promise<void>;
}): Promise<PostPaymentRecoveryResult> {
  let notificationSucceeded = true;
  try {
    await params.attemptNotification();
  } catch (error) {
    notificationSucceeded = false;
    try {
      await params.recordNotificationFailure(error);
    } catch (recordError) {
      console.error(
        "[payment-recovery] Could not record notification failure:",
        recordError,
      );
    }
  }

  await params.finalise();
  return { notificationSucceeded };
}