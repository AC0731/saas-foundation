import {
  hasProcessedStripeEvent,
  processStripeEvent,
} from "@/lib/stripe-webhook";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
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

function getSubscriptionId(subscription: string | Stripe.Subscription | null) {
  if (!subscription) {
    return null;
  }

  return typeof subscription === "string" ? subscription : subscription.id;
}

async function getCanonicalSubscription(event: Stripe.Event) {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const subscriptionId = getSubscriptionId(session.subscription);

    return subscriptionId
      ? getStripe().subscriptions.retrieve(subscriptionId)
      : null;
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated"
  ) {
    const subscription = event.data.object as Stripe.Subscription;

    // Re-read current Stripe state instead of trusting delivery order alone.
    return getStripe().subscriptions.retrieve(subscription.id);
  }

  return null;
}

export async function POST(req: Request) {
  const requestId = randomUUID();
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    console.warn("Stripe webhook rejected: missing signature", { requestId });
    return new NextResponse("Invalid webhook request.", {
      status: 400,
      headers: { "X-Request-ID": requestId },
    });
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

    console.error("Stripe webhook signature failed:", { requestId, message });

    return new NextResponse("Invalid webhook signature.", {
      status: 400,
      headers: { "X-Request-ID": requestId },
    });
  }

  if (await hasProcessedStripeEvent(event.id)) {
    console.log("Stripe webhook duplicate ignored:", {
      requestId,
      eventId: event.id,
      eventType: event.type,
    });

    return new NextResponse(null, {
      status: 200,
      headers: { "X-Request-ID": requestId },
    });
  }

  try {
    const canonicalSubscription = await getCanonicalSubscription(event);
    const result = await processStripeEvent(event, {
      canonicalSubscription,
    });

    console.log("Stripe webhook processed:", {
      requestId,
      eventId: event.id,
      eventType: event.type,
      outcome: result.outcome,
      userId: result.userId,
      subscriptionId: result.subscriptionId,
    });

    return new NextResponse(null, {
      status: 200,
      headers: { "X-Request-ID": requestId },
    });
  } catch (error) {
    console.error("Stripe webhook processing failed:", {
      requestId,
      eventId: event.id,
      eventType: event.type,
      error,
    });

    // A non-2xx response allows Stripe to retry transient processing failures.
    return new NextResponse("Webhook processing failed.", {
      status: 500,
      headers: { "X-Request-ID": requestId },
    });
  }
}
