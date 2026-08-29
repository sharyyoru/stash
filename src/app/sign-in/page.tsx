"use client";

import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get("callbackUrl") || searchParams.get("callback") || "/";
  const error = searchParams.get("error");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState(error === "CredentialsSignin" ? "Invalid email or password" : "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setErrorMessage(result.error);
        setLoading(false);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setErrorMessage("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleSendPasswordReset = async () => {
    if (!email) {
      setErrorMessage("Please enter your email first");
      return;
    }
    
    setSendingReset(true);
    setErrorMessage("");
    
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      if (res.ok) {
        setResetSent(true);
      } else {
        const data = await res.json();
        setErrorMessage(data.error || "Failed to send reset email");
      }
    } catch (err) {
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <div className="bg-neutral-50">
      <div className="mx-auto flex min-h-[calc(100vh-4rem-2.25rem)] max-w-6xl items-center justify-center px-4 py-10">
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
          <div className="pointer-events-none absolute -top-10 right-[-40px] h-32 w-32 rounded-full bg-[#fff3c4] blur-2xl" />
          <div className="relative space-y-5">
            {/* Google Login Removed Warning */}
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <p className="text-xs font-medium text-amber-800">
                Google login has been removed
              </p>
              <p className="text-xs text-amber-700 mt-1">
                If you previously signed in with Google, enter your email below and click "Send me a password link" to set up your password.
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
                Welcome back
              </p>
              <h1 className="text-lg font-semibold tracking-tight text-neutral-900">
                Sign in to your stash
              </h1>
              <p className="text-xs text-neutral-600">
                Enter your email and password to continue.
              </p>
            </div>

            {resetSent ? (
              <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
                <svg className="mx-auto h-8 w-8 text-green-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm font-medium text-green-800">Check your email!</p>
                <p className="text-xs text-green-700 mt-1">
                  We sent a password setup link to <strong>{email}</strong>
                </p>
                <button
                  type="button"
                  onClick={() => setResetSent(false)}
                  className="mt-3 text-xs text-green-700 underline hover:text-green-800"
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {errorMessage && (
                    <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                      {errorMessage}
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

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label htmlFor="password" className="block text-xs font-medium text-neutral-700">
                        Password
                      </label>
                      <Link
                        href="/forgot-password"
                        className="text-xs text-neutral-500 hover:text-neutral-700"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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
                    {loading ? "Signing in..." : "Sign in"}
                  </button>
                </form>

                {/* Password reset button for existing Google users */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-neutral-200" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-2 text-neutral-500">or</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSendPasswordReset}
                  disabled={sendingReset || !email}
                  className="inline-flex w-full items-center justify-center rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 shadow-sm transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sendingReset ? "Sending..." : "Send me a password link"}
                </button>

                <div className="text-center">
                  <p className="text-xs text-neutral-500">
                    Don't have an account?{" "}
                    <Link href="/register" className="font-medium text-neutral-900 hover:underline">
                      Create one
                    </Link>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
