import DeleteButton from "@/components/DeleteButton";
import NoteForm from "@/components/NoteForm";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  createCheckoutSession,
  createCustomerPortalSession,
  syncStripeCheckoutSession,
} from "@/lib/stripe";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import {
  getBillingStatusLabel,
  getSubscriptionHeadline,
} from "@/lib/subscription";

const FREE_NOTE_LIMIT = 3;

type DashboardProps = {
  searchParams?: Promise<{
    success?: string;
    session_id?: string;
  }>;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default async function Dashboard({ searchParams }: DashboardProps) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.trim().toLowerCase();

  if (!email) {
    redirect("/auth/signin");
  }

  const params = await searchParams;

  if (params?.success === "true" && params.session_id) {
    await syncStripeCheckoutSession(params.session_id, email);
  }

  const user = await db.user.findUnique({
    where: {
      email,
    },
    select: {
      isPro: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      stripePriceId: true,
      stripeCurrentPeriodEnd: true,
      stripeStatus: true,
      stripeCancelAtPeriodEnd: true,
      notes: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!user) {
    redirect("/auth/signin");
  }

  const notes = user.notes;
  const isPro = user.isPro;
  const isCanceling = isPro && user.stripeCancelAtPeriodEnd;
  const noteLimitReached = !isPro && notes.length >= FREE_NOTE_LIMIT;

  const proAccessEndDate = user.stripeCurrentPeriodEnd
    ? formatDate(user.stripeCurrentPeriodEnd)
    : null;

  const subscriptionMessage = isPro
    ? isCanceling
      ? `Your Pro access is scheduled to cancel${
          proAccessEndDate ? ` on ${proAccessEndDate}` : " at the end of the billing period"
        }.`
      : `Your Pro access is active${
          proAccessEndDate ? ` until ${proAccessEndDate}` : ""
        }.`
    : `Free workspaces can save up to ${FREE_NOTE_LIMIT} notes. Upgrade to Pro for unlimited notes.`;

  const billingStatus = getBillingStatusLabel({
    isPro,
    isCanceling,
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 md:px-10">
      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-blue-600">
          Protected Workspace
        </p>

        <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              Workspace Dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Manage authenticated, database-backed workspace notes connected to your account.
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Signed in as{" "}
            <span className="font-semibold text-slate-900">{email}</span>
          </div>
        </div>
      </div>

      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">Subscription</p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">
              {getSubscriptionHeadline({ isPro, isCanceling })}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {subscriptionMessage}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {isPro
                  ? "Unlimited notes"
                  : `${notes.length}/${FREE_NOTE_LIMIT} free notes used`}
              </span>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                Stripe billing enabled
              </span>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                Protected dashboard
              </span>
            </div>
          </div>

          {isPro ? (
            <span
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                isCanceling
                  ? "bg-amber-100 text-amber-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {isCanceling ? "Canceling" : "Pro Active"}
            </span>
          ) : (
            <form action={createCheckoutSession}>
              <button
                type="submit"
                className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Upgrade to Pro
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">Billing</p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">
              {isPro ? "Subscription management" : "Plan comparison"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              {isPro
                ? isCanceling
                  ? "Your subscription is scheduled to cancel at the end of the current billing period. You can manage billing through Stripe."
                  : "Manage your subscription, payment method, invoices, and billing details through Stripe."
                : `Free workspaces are limited to ${FREE_NOTE_LIMIT} notes. Pro workspaces unlock unlimited note storage and subscription management.`}
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Current plan
                </p>
                <p className="mt-2 text-sm font-bold text-slate-950">
                  {isPro ? "Pro" : "Free"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Note access
                </p>
                <p className="mt-2 text-sm font-bold text-slate-950">
                  {isPro
                    ? "Unlimited notes"
                    : `${notes.length}/${FREE_NOTE_LIMIT} notes`}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Billing status
                </p>
                <p className="mt-2 text-sm font-bold text-slate-950">
                  {billingStatus}
                </p>
              </div>
            </div>
          </div>

          {isPro ? (
            <form action={createCustomerPortalSession}>
              <button
                type="submit"
                className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Manage Billing
              </button>
            </form>
          ) : (
            <form action={createCheckoutSession}>
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Upgrade to Pro
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
        <section>
          {noteLimitReached ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <p className="text-sm font-semibold text-amber-800">
                Free note limit reached
              </p>
              <h2 className="mt-2 text-xl font-bold text-amber-950">
                Upgrade to keep adding notes
              </h2>
              <p className="mt-2 text-sm leading-6 text-amber-800">
                You have used all {FREE_NOTE_LIMIT} free notes. Delete a note or upgrade to Pro for unlimited notes.
              </p>

              <form action={createCheckoutSession} className="mt-5">
                <button
                  type="submit"
                  className="w-full rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700"
                >
                  Upgrade to Pro
                </button>
              </form>
            </div>
          ) : (
            <NoteForm />
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Your Library
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {notes.length === 1
                  ? "1 saved workspace note"
                  : `${notes.length} saved workspace notes`}
              </p>
            </div>
          </div>

          {notes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <h3 className="text-base font-semibold text-slate-900">
                No notes saved yet
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Create your first note to test the authenticated database workflow.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <article
                  key={note.id}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-slate-300 hover:bg-white md:flex-row md:items-start md:justify-between"
                >
                  <div>
                    <h3 className="font-bold text-slate-950">{note.title}</h3>

                    {note.content ? (
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                        {note.content}
                      </p>
                    ) : (
                      <p className="mt-2 text-sm italic text-slate-400">
                        No additional content.
                      </p>
                    )}

                    <p className="mt-3 text-xs text-slate-400">
                      Created {formatDate(note.createdAt)}
                    </p>
                  </div>

                  <DeleteButton noteId={note.id} />
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
