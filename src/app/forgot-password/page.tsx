"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      setSent(true);
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="bg-neutral-50">
      <div className="mx-auto flex min-h-[calc(100vh-4rem-2.25rem)] max-w-6xl items-center justify-center px-4 py-10">
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
          <div className="pointer-events-none absolute -top-10 right-[-40px] h-32 w-32 rounded-full bg-[#fff3c4] blur-2xl" />
          <div className="relative space-y-5">
            {sent ? (
              <>
                <div className="space-y-1">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h1 className="text-lg font-semibold tracking-tight text-neutral-900">
                    Check your email
                  </h1>
                  <p className="text-sm text-neutral-600">
                    If an account exists with <span className="font-medium">{email}</span>, you'll receive a password reset link shortly.
                  </p>
                </div>

                <div className="space-y-3">
                  <Link
                    href="/sign-in"
                    className="inline-flex w-full items-center justify-center rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-800"
                  >
                    Back to sign in
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setSent(false);
                      setEmail("");
                    }}
                    className="inline-flex w-full items-center justify-center rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 shadow-sm transition hover:bg-neutral-50"
                  >
                    Try a different email
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
                    Password reset
                  </p>
                  <h1 className="text-lg font-semibold tracking-tight text-neutral-900">
                    Forgot your password?
                  </h1>
                  <p className="text-xs text-neutral-600">
                    Enter your email and we'll send you a link to reset your password.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                      {error}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label htmlFor="email" className="block text-xs font-medium text-neutral-700">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? "Sending..." : "Send reset link"}
                  </button>
                </form>

                <div className="text-center">
                  <Link href="/sign-in" className="text-xs text-neutral-500 hover:text-neutral-700">
                    ← Back to sign in
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
