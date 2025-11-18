"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callback") || "/";
  const fromStash = callbackUrl === "/stash";
  return (
    <div className="bg-neutral-50">
      <div className="mx-auto flex min-h-[calc(100vh-4rem-2.25rem)] max-w-6xl items-center justify-center px-4 py-10">
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
          <div className="pointer-events-none absolute -top-10 right-[-40px] h-32 w-32 rounded-full bg-[#fff3c4] blur-2xl" />
          <div className="relative space-y-5">
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => signIn("google", { callbackUrl })}
                className="inline-flex w-full items-center justify-center rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-800"
              >
                Continue with Google
              </button>

              <p className="text-[11px] text-neutral-500">
                We’ll use your Google account to create your Stash profile. No password to remember.
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
                {fromStash
                  ? "Create or login with your Google account to checkout your stash."
                  : "Use your Google account to sign in. No spam, just order updates."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
