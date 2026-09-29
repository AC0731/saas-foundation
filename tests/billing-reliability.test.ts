import { describe, expect, it } from "vitest";
import {
  diffSubscriptionState,
  isEntitledSubscriptionStatus,
  shouldApplyStripeEvent,
  shouldClearSubscription,
} from "../lib/billing-policy";

describe("billing reliability policy", () => {
  it("rejects an older webhook after a newer event was applied", () => {
    expect(
      shouldApplyStripeEvent({
        incomingCreated: 1_000,
        lastAppliedCreated: 1_001,
      })
    ).toBe(false);
  });

  it("allows the same-second event so current Stripe state can be re-read", () => {
    expect(
      shouldApplyStripeEvent({
        incomingCreated: 1_000,
        lastAppliedCreated: 1_000,
      })
    ).toBe(true);
  });

  it("does not let an old subscription deletion clear a newer subscription", () => {
    expect(
      shouldClearSubscription({
        currentSubscriptionId: "sub_new",
        deletedSubscriptionId: "sub_old",
      })
    ).toBe(false);

    expect(
      shouldClearSubscription({
        currentSubscriptionId: "sub_old",
        deletedSubscriptionId: "sub_old",
      })
    ).toBe(true);
  });

  it("treats only active and trialing states as entitled", () => {
    expect(isEntitledSubscriptionStatus("active")).toBe(true);
    expect(isEntitledSubscriptionStatus("trialing")).toBe(true);
    expect(isEntitledSubscriptionStatus("past_due")).toBe(false);
    expect(isEntitledSubscriptionStatus("canceled")).toBe(false);
  });

  it("reports precise drift for reconciliation", () => {
    const drift = diffSubscriptionState(
      {
        subscriptionId: "sub_123",
        status: "active",
        isPro: true,
        cancelAtPeriodEnd: false,
        priceId: "price_old",
        currentPeriodEnd: new Date("2026-10-01T00:00:00.000Z"),
      },
      {
        subscriptionId: "sub_123",
        status: "active",
        isPro: true,
        cancelAtPeriodEnd: true,
        priceId: "price_new",
        currentPeriodEnd: new Date("2026-11-01T00:00:00.000Z"),
      }
    );

    expect(drift).toEqual({
      cancelAtPeriodEnd: {
        stored: false,
        authoritative: true,
      },
      priceId: {
        stored: "price_old",
        authoritative: "price_new",
      },
      currentPeriodEnd: {
        stored: "2026-10-01T00:00:00.000Z",
        authoritative: "2026-11-01T00:00:00.000Z",
      },
    });
  });
});
