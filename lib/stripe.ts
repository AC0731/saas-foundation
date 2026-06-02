"use server";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Stripe from "stripe";

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
    success_url: `${appUrl}/dashboard?success=true`,
    cancel_url: `${appUrl}/dashboard?canceled=true`,
  });

  if (!checkout.url) {
    throw new Error("Stripe checkout URL was not created.");
  }

  redirect(checkout.url);
}
