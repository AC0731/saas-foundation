"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200 shadow-sm">
      <div className="flex items-center gap-8">
        <Link href="/" className="text-xl font-bold text-blue-600 tracking-tight">
          SaaS Foundation
        </Link>
        {session && (
          <Link href="/dashboard" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
            Dashboard
          </Link>
        )}
      </div>

      <div className="flex items-center gap-4">
        {session ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 hidden md:block">
              {session.user?.email}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-sm font-semibold text-white bg-slate-900 px-4 py-2 rounded-lg hover:bg-slate-800 transition-all"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <button
            onClick={() => signIn()}
            className="text-sm font-semibold text-white bg-blue-600 px-5 py-2 rounded-lg hover:bg-blue-700 transition-all"
          >
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
}