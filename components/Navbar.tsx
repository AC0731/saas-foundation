"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4 shadow-sm">
      <div className="flex items-center gap-8">
        <Link href="/" className="text-xl font-bold tracking-tight text-blue-600">
          SaaS Foundation
        </Link>

        {session && (
          <Link
            href="/dashboard"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-blue-600"
          >
            Dashboard
          </Link>
        )}
      </div>

      <div className="flex items-center gap-4">
        {session ? (
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-slate-500 md:block">
              {session.user?.email}
            </span>

            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-slate-800"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <Link
            href="/auth/signin"
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700"
          >
            Sign In / Create Account
          </Link>
        )}
      </div>
    </nav>
  );
}
