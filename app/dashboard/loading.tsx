export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 md:px-10">
      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-4 w-40 animate-pulse rounded-full bg-slate-200" />
        <div className="mt-4 h-9 w-72 animate-pulse rounded-xl bg-slate-200" />
        <div className="mt-4 h-4 w-full max-w-xl animate-pulse rounded-full bg-slate-100" />
      </div>

      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-4 w-28 animate-pulse rounded-full bg-slate-200" />
        <div className="mt-4 h-7 w-56 animate-pulse rounded-xl bg-slate-200" />
        <div className="mt-4 h-4 w-full max-w-2xl animate-pulse rounded-full bg-slate-100" />

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
          <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
          <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
        <div className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm" />
        <div className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm" />
      </div>
    </div>
  );
}
