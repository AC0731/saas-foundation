import Link from "next/link";

const features = [
  {
    title: "Authentication-ready workspace",
    description:
      "Built with NextAuth and Prisma-backed user records so authenticated users can access a protected dashboard.",
  },
  {
    title: "Database-backed notes",
    description:
      "Uses PostgreSQL and Prisma to store user-owned workspace entries with server-side actions.",
  },
  {
    title: "SaaS architecture foundation",
    description:
      "Designed as a starter foundation for dashboards, billing flows, protected routes, and productized workflows.",
  },
];

const stack = ["Next.js", "React", "TypeScript", "Prisma", "PostgreSQL", "NextAuth", "Tailwind CSS"];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-[calc(100vh-73px)] w-full max-w-7xl flex-col px-6 py-16 md:px-10 lg:px-16">
        <div className="grid flex-1 items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-200">
              Full-stack SaaS starter built with Next.js
            </p>

            <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-white md:text-6xl">
              A production-minded SaaS foundation for authenticated workspaces.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              This project demonstrates a modern SaaS application foundation with authentication,
              protected dashboard routes, Prisma data modeling, PostgreSQL persistence, and a clean
              product interface ready for billing and subscription workflows.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/dashboard"
                className="rounded-xl bg-blue-500 px-6 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-400"
              >
                Open Dashboard
              </Link>

              <a
                href="https://github.com/AC0731/saas-foundation"
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-slate-700 px-6 py-3 text-center text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-900"
              >
                View GitHub Repo
              </a>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              {stack.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-300"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-blue-950/30">
            <div className="mb-5 flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <p className="text-sm text-slate-400">Workspace Overview</p>
                <h2 className="text-xl font-semibold text-white">SaaS Control Center</h2>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                Active
              </span>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-sm font-medium text-slate-300">Protected dashboard</p>
                <div className="mt-3 h-2 rounded-full bg-slate-800">
                  <div className="h-2 w-4/5 rounded-full bg-blue-500" />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-sm font-medium text-slate-300">Database persistence</p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div className="h-16 rounded-xl bg-slate-800" />
                  <div className="h-16 rounded-xl bg-slate-800" />
                  <div className="h-16 rounded-xl bg-blue-500/30" />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-sm font-medium text-slate-300">Billing-ready architecture</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Structured for Stripe checkout, webhook handling, and account-level product access.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6"
            >
              <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
