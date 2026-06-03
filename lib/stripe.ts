"use server";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  buildRateLimitKey,
  checkRateLimit,
  formatRateLimitMessage,
  RATE_LIMITS,
} from "@/lib/rate-limit";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Stripe from "stripe";

// Billing flows should fail fast when required Stripe configuration is missing.
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

function getAppUrl() {
  return process.env.NEXTAUTH_URL || "http://localhost:3000";
}

// Checkout sessions are created server-side so price IDs, customer IDs, and user ownership stay trusted.
export async function createCheckoutSession() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.trim().toLowerCase();

  if (!email) {
    throw new Error("Unauthorized");
  }

  const user = await db.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      stripeCustomerId: true,
      isPro: true,
    },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  if (user.isPro) {
    redirect("/dashboard");
  }

  const rateLimit = await checkRateLimit(
    buildRateLimitKey("stripe:checkout", user.id),
    RATE_LIMITS.checkout
  );

  if (!rateLimit.allowed) {
    throw new Error(
      formatRateLimitMessage("checkout", rateLimit.retryAfterSeconds)
    );
  }

  const appUrl = getAppUrl();

  const checkout = await getStripe().checkout.sessions.create({
    mode: "subscription",
    customer: user.stripeCustomerId || undefined,
    customer_email: user.stripeCustomerId ? undefined : email,
    client_reference_id: user.id,
    metadata: {
      userId: user.id,
    },
    subscription_data: {
      metadata: {
        userId: user.id,
      },
    },
    line_items: [
      {
        price: getRequiredEnv("STRIPE_PRICE_ID"),
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/dashboard?canceled=true`,
  });

  if (!checkout.url) {
    throw new Error("Stripe checkout URL was not created.");
  }

  redirect(checkout.url);
}

// Redirect-based sync is a fallback for local development and delayed webhook delivery.
export async function syncStripeCheckoutSession(sessionId: string, email: string) {
  const user = await db.user.findUnique({
    where: {
      email: email.trim().toLowerCase(),
    },
    select: {
      id: true,
    },
  });

  if (!user) {
    return;
  }

  const checkoutSession = await getStripe().checkout.sessions.retrieve(sessionId);

  const checkoutUserId =
    checkoutSession.metadata?.userId || checkoutSession.client_reference_id;

  if (checkoutUserId !== user.id) {
    return;
  }

  const subscriptionId =
    typeof checkoutSession.subscription === "string"
      ? checkoutSession.subscription
      : checkoutSession.subscription?.id;

  if (!subscriptionId) {
    return;
  }

  const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
  const subscriptionItem = subscription.items.data[0];
  const currentPeriodEnd = subscriptionItem?.current_period_end
    ? new Date(subscriptionItem.current_period_end * 1000)
    : null;

  const customerId =
    typeof checkoutSession.customer === "string"
      ? checkoutSession.customer
      : checkoutSession.customer?.id || null;

  await db.user.update({
    where: {
      id: user.id,
    },
    data: {
      isPro: subscription.status === "active" || subscription.status === "trialing",
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscriptionItem?.price.id || null,
      stripeCurrentPeriodEnd: currentPeriodEnd,
      stripeStatus: subscription.status,
      stripeCancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
}

// The customer portal is scoped to the signed-in user's Stripe customer record.
export async function createCustomerPortalSession() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.trim().toLowerCase();

  if (!email) {
    throw new Error("Unauthorized");
  }

  const user = await db.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
      stripeCustomerId: true,
    },
  });

  if (!user?.stripeCustomerId) {
    throw new Error("Stripe customer was not found for this user.");
  }

  const rateLimit = await checkRateLimit(
    buildRateLimitKey("stripe:portal", user.id),
    RATE_LIMITS.billingPortal
  );

  if (!rateLimit.allowed) {
    throw new Error(
      formatRateLimitMessage("billing portal", rateLimit.retryAfterSeconds)
    );
  }

  const appUrl = getAppUrl();

  const portalSession = await getStripe().billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${appUrl}/dashboard`,
  });

  redirect(portalSession.url);
}
