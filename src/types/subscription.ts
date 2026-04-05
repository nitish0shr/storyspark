export type SubscriptionStatus = "active" | "paused" | "canceled" | "past_due" | "incomplete";

export interface Subscription {
  id: string;
  userId: string;
  childProfileId: string;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  status: SubscriptionStatus;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  usedThemeIds: string[];
  booksGenerated: number;
  createdAt: string;
  updatedAt: string;
}
