export type SubscriptionState = {
  subscriptionId: string | null;
  status: string | null;
  isPro: boolean;
  cancelAtPeriodEnd: boolean;
  priceId: string | null;
  currentPeriodEnd: Date | null;
};

export function shouldApplyStripeEvent({
  incomingCreated,
  lastAppliedCreated,
}: {
  incomingCreated: number;
  lastAppliedCreated: number | null;
}) {
  return lastAppliedCreated === null || incomingCreated >= lastAppliedCreated;
}

export function shouldClearSubscription({
  currentSubscriptionId,
  deletedSubscriptionId,
}: {
  currentSubscriptionId: string | null;
  deletedSubscriptionId: string;
}) {
  return (
    currentSubscriptionId === null ||
    currentSubscriptionId === deletedSubscriptionId
  );
}

export function shouldReplaceSubscription({
  currentSubscriptionId,
  currentSubscriptionCreated,
  incomingSubscriptionId,
  incomingSubscriptionCreated,
}: {
  currentSubscriptionId: string | null;
  currentSubscriptionCreated: number | null;
  incomingSubscriptionId: string;
  incomingSubscriptionCreated: number;
}) {
  if (!currentSubscriptionId || currentSubscriptionId === incomingSubscriptionId) {
    return true;
  }

  if (currentSubscriptionCreated === null) {
    return true;
  }

  return incomingSubscriptionCreated >= currentSubscriptionCreated;
}

export function isEntitledSubscriptionStatus(status: string | null) {
  return status === "active" || status === "trialing";
}

export function diffSubscriptionState(
  stored: SubscriptionState,
  authoritative: SubscriptionState
) {
  const differences: Record<string, { stored: unknown; authoritative: unknown }> = {};

  for (const key of Object.keys(stored) as (keyof SubscriptionState)[]) {
    const left = stored[key];
    const right = authoritative[key];

    const normalizedLeft =
      left instanceof Date ? left.toISOString() : left;
    const normalizedRight =
      right instanceof Date ? right.toISOString() : right;

    if (normalizedLeft !== normalizedRight) {
      differences[key] = {
        stored: normalizedLeft,
        authoritative: normalizedRight,
      };
    }
  }

  return differences;
}
