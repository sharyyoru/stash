"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function SetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState("");
  const [tokenValid, setTokenValid] = useState(false);
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      try {
        const res = await fetch(`/api/auth/reset-password?token=${token}`);
        const data = await res.json();

        if (data.valid) {
          setTokenValid(true);
          setEmail(data.email);
        } else {
          setError(data.error || "Invalid or expired link");
        }
      } catch (err) {
        setError("Failed to validate link");
      } finally {
        setValidating(false);
      }
    };

    validateToken();
  }, [token]);

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
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to set password");
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="bg-neutral-50">
        <div className="mx-auto flex min-h-[calc(100vh-4rem-2.25rem)] max-w-6xl items-center justify-center px-4 py-10">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-900"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenValid && !success) {
    return (
      <div className="bg-neutral-50">
        <div className="mx-auto flex min-h-[calc(100vh-4rem-2.25rem)] max-w-6xl items-center justify-center px-4 py-10">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <div className="pointer-events-none absolute -top-10 right-[-40px] h-32 w-32 rounded-full bg-[#fff3c4] blur-2xl" />
            <div className="relative space-y-5">
              <div className="space-y-1">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h1 className="text-lg font-semibold tracking-tight text-neutral-900">
                  Link expired
                </h1>
                <p className="text-sm text-neutral-600">
                  {error || "This password reset link has expired or is invalid."}
                </p>
              </div>

              <Link
                href="/forgot-password"
                className="inline-flex w-full items-center justify-center rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-800"
              >
                Request a new link
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-neutral-50">
        <div className="mx-auto flex min-h-[calc(100vh-4rem-2.25rem)] max-w-6xl items-center justify-center px-4 py-10">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <div className="pointer-events-none absolute -top-10 right-[-40px] h-32 w-32 rounded-full bg-[#fff3c4] blur-2xl" />
            <div className="relative space-y-5">
              <div className="space-y-1">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-lg font-semibold tracking-tight text-neutral-900">
                  Password set successfully
                </h1>
                <p className="text-sm text-neutral-600">
                  You can now sign in with your new password.
                </p>
              </div>

              <Link
                href="/sign-in"
                className="inline-flex w-full items-center justify-center rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-800"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-50">
      <div className="mx-auto flex min-h-[calc(100vh-4rem-2.25rem)] max-w-6xl items-center justify-center px-4 py-10">
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
          <div className="pointer-events-none absolute -top-10 right-[-40px] h-32 w-32 rounded-full bg-[#fff3c4] blur-2xl" />
          <div className="relative space-y-5">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
                Set password
              </p>
              <h1 className="text-lg font-semibold tracking-tight text-neutral-900">
                Create your password
              </h1>
              <p className="text-xs text-neutral-600">
                Setting password for <span className="font-medium">{email}</span>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label htmlFor="password" className="block text-xs font-medium text-neutral-700">
                  New password
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
                {loading ? "Setting password..." : "Set password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
