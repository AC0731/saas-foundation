"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type AuthMode = "signin" | "signup";

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const isSignUp = mode === "signup";

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setEmail("");
    setPassword("");
    setError("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!normalizedEmail || !cleanPassword) {
      setError("Please enter both an email and password.");
      return;
    }

    if (isSignUp && cleanPassword.length < 8) {
      setError("Use at least 8 characters for your password.");
      return;
    }

    startTransition(async () => {
      const result = await signIn("credentials", {
        email: normalizedEmail,
        password: cleanPassword,
        mode,
        redirect: false,
        callbackUrl: "/dashboard",
      });

      if (result?.error) {
        setError(
          isSignUp
            ? "This email may already exist. Try signing in instead."
            : "Invalid email or password. Create an account if this email is new."
        );
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-73px)] max-w-6xl items-center justify-center px-6 py-12">
      <div className="grid w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl md:grid-cols-[1fr_0.9fr]">
        <section className="bg-slate-950 p-8 text-white md:p-10">
          <p className="text-sm font-semibold text-blue-300">
            SaaS Foundation
          </p>

          <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
            {isSignUp
              ? "Create your workspace account."
              : "Sign in to your workspace."}
          </h1>

          <p className="mt-4 text-sm leading-6 text-slate-300">
            {isSignUp
              ? "Create a new account with an email and password. Passwords are hashed before storage."
              : "Use your existing email and password to access your protected dashboard."}
          </p>

          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="text-sm font-semibold text-white">
              Portfolio auth flow
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              <li>• Create Account creates a new user</li>
              <li>• Sign In requires the correct password</li>
              <li>• Passwords are hashed before storage</li>
              <li>• Dashboard access is protected</li>
            </ul>
          </div>
        </section>

        <section className="p-8 md:p-10">
          <div className="mb-6">
            <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  mode === "signin"
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Sign In
              </button>

              <button
                type="button"
                onClick={() => switchMode("signup")}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  mode === "signup"
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Create Account
              </button>
            </div>

            <h2 className="text-2xl font-bold text-slate-950">
              {isSignUp ? "Create account" : "Access dashboard"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {isSignUp
                ? "Use a new email and password to create your workspace."
                : "Enter your existing email and password to continue."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Email
              <input
                name="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="off"
                required
                disabled={isPending}
                className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Password
              <input
                name="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={isSignUp ? "Create a password" : "Enter your password"}
                autoComplete={isSignUp ? "new-password" : "current-password"}
                required
                disabled={isPending}
                className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
              {isSignUp ? (
                <span className="text-xs text-slate-500">
                  Use at least 8 characters. For a real production app, password reset and email verification would also be added.
                </span>
              ) : null}
            </label>

            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isPending
                ? "Checking..."
                : isSignUp
                  ? "Create Account"
                  : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Back to{" "}
            <Link href="/" className="font-semibold text-blue-600 hover:text-blue-700">
              landing page
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
