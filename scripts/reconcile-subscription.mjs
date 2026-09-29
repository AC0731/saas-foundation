#!/usr/bin/env node

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import Stripe from "stripe";

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parseArgs(argv) {
  const emailIndex = argv.indexOf("--email");
  const email = emailIndex >= 0 ? argv[emailIndex + 1] : null;

  if (!email) {
    throw new Error(
      "Usage: node scripts/reconcile-subscription.mjs --email user@example.com [--apply]"
    );
  }

  return {
    email: email.trim().toLowerCase(),
    apply: argv.includes("--apply"),
  };
}

function isEntitled(status) {
  return status === "active" || status === "trialing";
}

function periodEnd(subscription) {
  const value = subscription.items.data[0]?.current_period_end;
  return value ? new Date(value * 1000) : null;
}

function snapshotFromSubscription(subscription, customerId) {
  return {
    subscriptionId: subscription.id,
    subscriptionCreated: subscription.created,
    customerId,
    priceId: subscription.items.data[0]?.price.id || null,
    currentPeriodEnd: periodEnd(subscription),
    status: subscription.status,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    isPro: isEntitled(subscription.status),
  };
}

function storedSnapshot(user) {
  return {
    subscriptionId: user.stripeSubscriptionId,
    subscriptionCreated: user.stripeSubscriptionCreated,
    customerId: user.stripeCustomerId,
    priceId: user.stripePriceId,
    currentPeriodEnd: user.stripeCurrentPeriodEnd,
    status: user.stripeStatus,
    cancelAtPeriodEnd: user.stripeCancelAtPeriodEnd,
    isPro: user.isPro,
  };
}

function normalize(value) {
  return value instanceof Date ? value.toISOString() : value;
}

function diff(stored, authoritative) {
  const result = {};

  for (const key of Object.keys(stored)) {
    const left = normalize(stored[key]);
    const right = normalize(authoritative[key]);

    if (left !== right) {
      result[key] = { stored: left, authoritative: right };
    }
  }

  return result;
}

async function selectAuthoritativeSubscription(stripe, user) {
  if (user.stripeSubscriptionId) {
    try {
      return await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
    } catch (error) {
      console.warn("Stored subscription could not be retrieved; checking customer subscriptions.");
    }
  }

  if (!user.stripeCustomerId) {
    return null;
  }

  const subscriptions = await stripe.subscriptions.list({
    customer: user.stripeCustomerId,
    status: "all",
    limit: 20,
  });

  const ranked = [...subscriptions.data].sort((left, right) => {
    const leftEntitled = isEntitled(left.status) ? 1 : 0;
    const rightEntitled = isEntitled(right.status) ? 1 : 0;

    if (leftEntitled !== rightEntitled) {
      return rightEntitled - leftEntitled;
    }

    return right.created - left.created;
  });

  return ranked[0] || null;
}

async function main() {
  const { email, apply } = parseArgs(process.argv.slice(2));
  const adapter = new PrismaPg({
    connectionString: requiredEnv("DATABASE_URL"),
  });
  const db = new PrismaClient({ adapter });
  const stripe = new Stripe(requiredEnv("STRIPE_SECRET_KEY"));

  try {
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        isPro: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        stripeSubscriptionCreated: true,
        stripePriceId: true,
        stripeCurrentPeriodEnd: true,
        stripeStatus: true,
        stripeCancelAtPeriodEnd: true,
      },
    });

    if (!user) {
      throw new Error(`User not found: ${email}`);
    }

    const subscription = await selectAuthoritativeSubscription(stripe, user);
    const authoritative = subscription
      ? snapshotFromSubscription(
          subscription,
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id
        )
      : {
          subscriptionId: null,
          subscriptionCreated: null,
          customerId: user.stripeCustomerId,
          priceId: null,
          currentPeriodEnd: null,
          status: null,
          cancelAtPeriodEnd: false,
          isPro: false,
        };

    const stored = storedSnapshot(user);
    const differences = diff(stored, authoritative);

    console.log(
      JSON.stringify(
        {
          mode: apply ? "apply" : "dry-run",
          userId: user.id,
          email: user.email,
          drift: differences,
        },
        null,
        2
      )
    );

    if (Object.keys(differences).length === 0) {
      console.log("No subscription drift detected.");
      return;
    }

    if (!apply) {
      console.log("Dry run only. Re-run with --apply to persist the authoritative state.");
      process.exitCode = 2;
      return;
    }

    const reconciledAt = Math.floor(Date.now() / 1000);

    await db.user.update({
      where: { id: user.id },
      data: {
        isPro: authoritative.isPro,
        stripeCustomerId: authoritative.customerId,
        stripeSubscriptionId: authoritative.subscriptionId,
        stripeSubscriptionCreated: authoritative.subscriptionCreated,
        stripePriceId: authoritative.priceId,
        stripeCurrentPeriodEnd: authoritative.currentPeriodEnd,
        stripeStatus: authoritative.status,
        stripeCancelAtPeriodEnd: authoritative.cancelAtPeriodEnd,
        stripeLastEventCreated: reconciledAt,
        stripeLastEventId: `reconcile:${reconciledAt}`,
      },
    });

    console.log("Subscription state reconciled successfully.");
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
