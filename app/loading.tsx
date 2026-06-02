export default function Loading() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-73px)] max-w-6xl items-center justify-center px-6 py-12">
      <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="space-y-4">
          <div className="h-4 w-32 animate-pulse rounded-full bg-slate-200" />
          <div className="h-10 w-3/4 animate-pulse rounded-xl bg-slate-200" />
          <div className="h-4 w-full animate-pulse rounded-full bg-slate-100" />
          <div className="h-4 w-2/3 animate-pulse rounded-full bg-slate-100" />

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
