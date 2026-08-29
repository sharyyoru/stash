"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create account");
        setLoading(false);
        return;
      }

      // Redirect to sign-in with success message
      router.push("/sign-in?registered=true");
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
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
                Get started
              </p>
              <h1 className="text-lg font-semibold tracking-tight text-neutral-900">
                Create your account
              </h1>
              <p className="text-xs text-neutral-600">
                Join Stash to track orders and manage your subscriptions.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label htmlFor="name" className="block text-xs font-medium text-neutral-700">
                  Name (optional)
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                />
              </div>

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

              <div className="space-y-1">
                <label htmlFor="password" className="block text-xs font-medium text-neutral-700">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                />
                <p className="text-[10px] text-neutral-400">
                  At least 8 characters with a letter and number
                </p>
              </div>

              <div className="space-y-1">
                <label htmlFor="confirmPassword" className="block text-xs font-medium text-neutral-700">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>

            <div className="text-center">
              <p className="text-xs text-neutral-500">
                Already have an account?{" "}
                <Link href="/sign-in" className="font-medium text-neutral-900 hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
