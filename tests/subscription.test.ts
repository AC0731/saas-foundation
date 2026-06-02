import { describe, expect, it } from "vitest";
import {
  canCreateFreeNote,
  getBillingStatusLabel,
  getSubscriptionHeadline,
  isActiveSubscription,
} from "../lib/subscription";

describe("subscription helpers", () => {
  it("treats active and trialing subscriptions as active", () => {
    expect(isActiveSubscription("active")).toBe(true);
    expect(isActiveSubscription("trialing")).toBe(true);
  });

  it("does not treat inactive subscription statuses as active", () => {
    expect(isActiveSubscription("canceled")).toBe(false);
    expect(isActiveSubscription("incomplete")).toBe(false);
    expect(isActiveSubscription("past_due")).toBe(false);
  });

  it("returns the correct billing status label", () => {
    expect(
      getBillingStatusLabel({
        isPro: false,
        isCanceling: false,
      })
    ).toBe("Not subscribed");

    expect(
      getBillingStatusLabel({
        isPro: true,
        isCanceling: false,
      })
    ).toBe("Active");

    expect(
      getBillingStatusLabel({
        isPro: true,
        isCanceling: true,
      })
    ).toBe("Cancels at period end");
  });

  it("returns the correct dashboard subscription headline", () => {
    expect(
      getSubscriptionHeadline({
        isPro: false,
        isCanceling: false,
      })
    ).toBe("Free workspace");

    expect(
      getSubscriptionHeadline({
        isPro: true,
        isCanceling: false,
      })
    ).toBe("Pro workspace active");

    expect(
      getSubscriptionHeadline({
        isPro: true,
        isCanceling: true,
      })
    ).toBe("Pro workspace canceling");
  });

  it("allows Pro users to create notes beyond the free limit", () => {
    expect(
      canCreateFreeNote({
        isPro: true,
        currentNoteCount: 99,
        freeNoteLimit: 3,
      })
    ).toBe(true);
  });

  it("limits Free users to notes below the free limit", () => {
    expect(
      canCreateFreeNote({
        isPro: false,
        currentNoteCount: 2,
        freeNoteLimit: 3,
      })
    ).toBe(true);

    expect(
      canCreateFreeNote({
        isPro: false,
        currentNoteCount: 3,
        freeNoteLimit: 3,
      })
    ).toBe(false);
  });
});
