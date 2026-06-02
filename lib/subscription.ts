export const ACTIVE_SUBSCRIPTION_STATUSES = ["active", "trialing"] as const;

export function isActiveSubscription(status: string) {
  return ACTIVE_SUBSCRIPTION_STATUSES.includes(
    status as (typeof ACTIVE_SUBSCRIPTION_STATUSES)[number]
  );
}

export function getBillingStatusLabel({
  isPro,
  isCanceling,
}: {
  isPro: boolean;
  isCanceling: boolean;
}) {
  if (!isPro) {
    return "Not subscribed";
  }

  return isCanceling ? "Cancels at period end" : "Active";
}

export function getSubscriptionHeadline({
  isPro,
  isCanceling,
}: {
  isPro: boolean;
  isCanceling: boolean;
}) {
  if (!isPro) {
    return "Free workspace";
  }

  return isCanceling ? "Pro workspace canceling" : "Pro workspace active";
}

export function canCreateFreeNote({
  isPro,
  currentNoteCount,
  freeNoteLimit,
}: {
  isPro: boolean;
  currentNoteCount: number;
  freeNoteLimit: number;
}) {
  if (isPro) {
    return true;
  }

  return currentNoteCount < freeNoteLimit;
}
