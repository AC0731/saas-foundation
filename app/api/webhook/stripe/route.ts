import { db } from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getStripe() {
  return new Stripe(getRequiredEnv("STRIPE_SECRET_KEY"));
}

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
  const subscriptionItem = subscription.items.data[0];
  const currentPeriodEnd = subscriptionItem?.current_period_end;

  return currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null;
}

function isActiveSubscription(subscription: Stripe.Subscription) {
  return subscription.status === "active" || subscription.status === "trialing";
}

async function updateUserSubscription({
  userId,
  customerId,
  subscription,
}: {
  userId?: string | null;
  customerId?: string | null;
  subscription: Stripe.Subscription;
}) {
  const priceId = subscription.items.data[0]?.price.id || null;
  const currentPeriodEnd = getCurrentPeriodEnd(subscription);

  const data = {
    isPro: isActiveSubscription(subscription),
    stripeCustomerId: customerId || getCustomerId(subscription.customer),
    stripeSubscriptionId: subscription.id,
    stripePriceId: priceId,
    stripeCurrentPeriodEnd: currentPeriodEnd,
    stripeStatus: subscription.status,
    stripeCancelAtPeriodEnd: subscription.cancel_at_period_end,
  };

  if (userId) {
    const updatedUser = await db.user.updateMany({
      where: {
        id: userId,
      },
      data,
    });

    console.log("Stripe subscription updated by userId:", {
      userId,
      updated: updatedUser.count,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });

    return;
  }

  const resolvedCustomerId = data.stripeCustomerId;

  if (!resolvedCustomerId) {
    console.log("Stripe subscription skipped: missing customerId and userId.");
    return;
  }

  const updatedUser = await db.user.updateMany({
    where: {
      stripeCustomerId: resolvedCustomerId,
    },
    data,
  });

  console.log("Stripe subscription updated by customerId:", {
    customerId: resolvedCustomerId,
    updated: updatedUser.count,
    status: subscription.status,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId || session.client_reference_id;
  const customerId = getCustomerId(session.customer);
  const subscriptionId = getSubscriptionId(session.subscription);

  console.log("Stripe checkout completed:", {
    userId,
    customerId,
    subscriptionId,
  });

  if (!subscriptionId) {
    console.log("Stripe checkout skipped: missing subscriptionId.");
    return;
  }

  const subscription = await getStripe().subscriptions.retrieve(subscriptionId);

  await updateUserSubscription({
    userId,
    customerId,
    subscription,
  });
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = getCustomerId(subscription.customer);
  const userId = subscription.metadata?.userId || null;

  console.log("Stripe subscription changed:", {
    userId,
    customerId,
    subscriptionId: subscription.id,
    status: subscription.status,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  });

  await updateUserSubscription({
    userId,
    customerId,
    subscription,
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = getCustomerId(subscription.customer);
  const userId = subscription.metadata?.userId || null;

  const where = userId
    ? { id: userId }
    : customerId
      ? { stripeCustomerId: customerId }
      : null;

  if (!where) {
    console.log("Stripe subscription deletion skipped: missing userId and customerId.");
    return;
  }

  const updatedUser = await db.user.updateMany({
    where,
    data: {
      isPro: false,
      stripeSubscriptionId: null,
      stripePriceId: null,
      stripeCurrentPeriodEnd: null,
      stripeStatus: "canceled",
      stripeCancelAtPeriodEnd: false,
    },
  });

  console.log("Stripe subscription deleted:", {
    userId,
    customerId,
    updated: updatedUser.count,
  });
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return new NextResponse("Missing stripe-signature header.", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      getRequiredEnv("STRIPE_WEBHOOK_SECRET")
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown webhook signature error.";

    console.error("Stripe webhook signature failed:", message);

    return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
  }

  console.log("Stripe webhook event received:", event.type);

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;

    case "customer.subscription.created":
    case "customer.subscription.updated":
      await handleSubscriptionChange(event.data.object as Stripe.Subscription);
      break;

    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;

    default:
      break;
  }

  return new NextResponse(null, { status: 200 });
}
