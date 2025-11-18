"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";

type SignInButtonProps = {
  className?: string;
  label?: string;
  isSignedIn?: boolean;
  avatarImage?: string | null;
  avatarInitial?: string | null;
};

export default function SignInButton({
  className = "",
  label = "Sign in",
  isSignedIn = false,
  avatarImage,
  avatarInitial,
}: SignInButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {    
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={
          className ||
          "hidden h-9 items-center rounded-full border border-neutral-200 bg-white px-4 text-xs font-medium text-neutral-800 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50 md:inline-flex"
        }
        onClick={() => {
          if (isSignedIn) {
            router.push("/profile");
          } else {
            setOpen(true);
          }
        }}
      >
        <span className="flex items-center gap-2">
          {isSignedIn && (avatarImage || avatarInitial) ? (
            <span className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-neutral-900 text-[10px] font-semibold text-white">
              {avatarImage ? (
                <img
                  src={avatarImage}
                  alt={label}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{avatarInitial}</span>
              )}
            </span>
          ) : null}
          <span>{label}</span>
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-lg ring-1 ring-neutral-200">
            <div className="pointer-events-none absolute -top-10 right-[-40px] h-32 w-32 rounded-full bg-[#fff3c4] blur-2xl" />
            <button
              type="button"
              className="absolute right-4 top-4 inline-flex h-7 w-7 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50"
              onClick={() => setOpen(false)}
              aria-label="Close sign in"
            >
              ×
            </button>

            <div className="relative space-y-5 pt-6">
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => signIn("google", { callbackUrl: "/" })}
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
                  Use your Google account to sign in. No spam, just order updates.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
