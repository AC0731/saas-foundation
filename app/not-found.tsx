import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-73px)] max-w-4xl items-center justify-center px-6 py-12">
      <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm md:p-12">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
          404
        </p>

        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
          Page not found
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-600">
          The page you are looking for does not exist or may have been moved.
          Return to the landing page or open your workspace dashboard.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Go to Home
          </Link>

          <Link
            href="/dashboard"
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
          >
            Open Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
