"use client";

import Link from "next/link";
import { useEffect } from "react";

type ErrorPageProps = {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-73px)] max-w-4xl items-center justify-center px-6 py-12">
      <div className="w-full rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm md:p-12">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-600">
          Application Error
        </p>

        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
          Something went wrong
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-600">
          The app ran into an unexpected issue. You can try again or return to
          the landing page.
        </p>

        {error.digest ? (
          <p className="mt-4 text-xs text-slate-400">
            Error reference: {error.digest}
          </p>
        ) : null}

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Try Again
          </button>

          <Link
            href="/"
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
          >
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
