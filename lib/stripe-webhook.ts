import "server-only";

import { Prisma } from "@prisma/client";
import Stripe from "stripe";
import {
  isEntitledSubscriptionStatus,
  shouldApplyStripeEvent,
  shouldClearSubscription,
  shouldReplaceSubscription,
} from "./billing-policy";
import { db } from "./db";

type EventOutcome =
  | "applied"
  | "duplicate"
  | "ignored"
  | "stale"
  | "unmatched_user"
  | "superseded_subscription";

type ProcessResult = {
  outcome: EventOutcome;
  userId?: string;
  subscriptionId?: string | null;
};

function getCustomerId(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null
) {
  if (!customer) {
    return null;
  }

  return typeof customer === "string" ? customer : customer.id;
}

function getSubscriptionId(subscription: string | Stripe.Subscription | null) {
  if (!subscription) {
    return null;
  }

  return typeof subscription === "string" ? subscription : subscription.id;
}

function getCurrentPeriodEnd(subscription: Stripe.Subscription) {
  const item = subscription.items.data[0];
  return item?.current_period_end
    ? new Date(item.current_period_end * 1000)
    : null;
}

async function findUserForStripeEvent(
  tx: Prisma.TransactionClient,
  {
    userId,
    customerId,
  }: {
    userId?: string | null;
    customerId?: string | null;
  }
) {
  if (userId) {
    const byId = await tx.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        stripeLastEventCreated: true,
        stripeSubscriptionId: true,
        stripeSubscriptionCreated: true,
      },
    });

    if (byId) {
      return byId;
    }
  }

  if (!customerId) {
    return null;
  }

  return tx.user.findUnique({
    where: { stripeCustomerId: customerId },
    select: {
      id: true,
      stripeLastEventCreated: true,
      stripeSubscriptionId: true,
      stripeSubscriptionCreated: true,
    },
  });
}

async function applySubscriptionSnapshot(
  tx: Prisma.TransactionClient,
  {
    event,
    subscription,
    userId,
    customerId,
  }: {
    event: Stripe.Event;
    subscription: Stripe.Subscription;
    userId?: string | null;
    customerId?: string | null;
  }
): Promise<ProcessResult> {
  const resolvedCustomerId =
    customerId || getCustomerId(subscription.customer);
  const user = await findUserForStripeEvent(tx, {
    userId: userId || subscription.metadata?.userId || null,
    customerId: resolvedCustomerId,
  });

  if (!user) {
    return {
      outcome: "unmatched_user",
      subscriptionId: subscription.id,
    };
  }

  if (
    !shouldApplyStripeEvent({
      incomingCreated: event.created,
      lastAppliedCreated: user.stripeLastEventCreated,
    })
  ) {
    return {
      outcome: "stale",
      userId: user.id,
      subscriptionId: subscription.id,
    };
  }

  if (
    !shouldReplaceSubscription({
      currentSubscriptionId: user.stripeSubscriptionId,
      currentSubscriptionCreated: user.stripeSubscriptionCreated,
      incomingSubscriptionId: subscription.id,
      incomingSubscriptionCreated: subscription.created,
    })
  ) {
    return {
      outcome: "superseded_subscription",
      userId: user.id,
      subscriptionId: subscription.id,
    };
  }

  const item = subscription.items.data[0];

  await tx.user.update({
    where: { id: user.id },
    data: {
      isPro: isEntitledSubscriptionStatus(subscription.status),
      stripeCustomerId: resolvedCustomerId,
      stripeSubscriptionId: subscription.id,
      stripeSubscriptionCreated: subscription.created,
      stripePriceId: item?.price.id || null,
      stripeCurrentPeriodEnd: getCurrentPeriodEnd(subscription),
      stripeStatus: subscription.status,
      stripeCancelAtPeriodEnd: subscription.cancel_at_period_end,
      stripeLastEventCreated: event.created,
      stripeLastEventId: event.id,
    },
  });

  return {
    outcome: "applied",
    userId: user.id,
    subscriptionId: subscription.id,
  };
}

async function applySubscriptionDeletion(
  tx: Prisma.TransactionClient,
  event: Stripe.Event,
  subscription: Stripe.Subscription
): Promise<ProcessResult> {
  const customerId = getCustomerId(subscription.customer);
  const user = await findUserForStripeEvent(tx, {
    userId: subscription.metadata?.userId || null,
    customerId,
  });

  if (!user) {
    return {
      outcome: "unmatched_user",
      subscriptionId: subscription.id,
    };
  }

  if (
    !shouldApplyStripeEvent({
      incomingCreated: event.created,
      lastAppliedCreated: user.stripeLastEventCreated,
    })
  ) {
    return {
      outcome: "stale",
      userId: user.id,
      subscriptionId: subscription.id,
    };
  }

  if (
    !shouldClearSubscription({
      currentSubscriptionId: user.stripeSubscriptionId,
      deletedSubscriptionId: subscription.id,
    })
  ) {
    return {
      outcome: "superseded_subscription",
      userId: user.id,
      subscriptionId: subscription.id,
    };
  }

  await tx.user.update({
    where: { id: user.id },
    data: {
      isPro: false,
      stripeSubscriptionId: null,
      stripeSubscriptionCreated: null,
      stripePriceId: null,
      stripeCurrentPeriodEnd: null,
      stripeStatus: "canceled",
      stripeCancelAtPeriodEnd: false,
      stripeLastEventCreated: event.created,
      stripeLastEventId: event.id,
    },
  });

  return {
    outcome: "applied",
    userId: user.id,
    subscriptionId: subscription.id,
  };
}

export async function hasProcessedStripeEvent(eventId: string) {
  const existing = await db.stripeWebhookEvent.findUnique({
    where: { eventId },
    select: { id: true },
  });

  return Boolean(existing);
}

export async function processStripeEvent(
  event: Stripe.Event,
  {
    canonicalSubscription,
  }: {
    canonicalSubscription?: Stripe.Subscription | null;
  } = {}
): Promise<ProcessResult> {
  try {
    return await db.$transaction(async (tx) => {
      await tx.stripeWebhookEvent.create({
        data: {
          eventId: event.id,
          eventType: event.type,
          stripeCreated: event.created,
          subscriptionId:
            event.type === "checkout.session.completed"
              ? getSubscriptionId(
                  (event.data.object as Stripe.Checkout.Session).subscription
                )
              : event.type.startsWith("customer.subscription.")
                ? (event.data.object as Stripe.Subscription).id
                : null,
        },
      });

      let result: ProcessResult = { outcome: "ignored" };

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;

        if (canonicalSubscription) {
          result = await applySubscriptionSnapshot(tx, {
            event,
            subscription: canonicalSubscription,
            userId: session.metadata?.userId || session.client_reference_id,
            customerId: getCustomerId(session.customer),
          });
        }
      } else if (
        event.type === "customer.subscription.created" ||
        event.type === "customer.subscription.updated"
      ) {
        if (canonicalSubscription) {
          result = await applySubscriptionSnapshot(tx, {
            event,
            subscription: canonicalSubscription,
          });
        }
      } else if (event.type === "customer.subscription.deleted") {
        result = await applySubscriptionDeletion(
          tx,
          event,
          event.data.object as Stripe.Subscription
        );
      }

      await tx.stripeWebhookEvent.update({
        where: { eventId: event.id },
        data: {
          outcome: result.outcome,
          userId: result.userId || null,
          subscriptionId: result.subscriptionId || null,
        },
      });

      return result;
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { outcome: "duplicate" };
    }

    throw error;
  }
}
